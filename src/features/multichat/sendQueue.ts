import { RateLimited, TransientError } from "./services";
import type { Platform, ReplyTarget, SendResult } from "./types";

export type QueueItem = { id: string; text: string; platforms: Platform[]; kickText?: string; replyTo?: ReplyTarget };

type Deps = {
  send: (item: QueueItem) => Promise<SendResult[]>;
  onStart: (item: QueueItem) => void;
  onFinish: (item: QueueItem, outcome: { results: SendResult[] } | { error: Error }) => void;
  sleep?: (ms: number) => Promise<void>;
};

const MAX_ATTEMPTS = 3;
const MAX_RETRY_WAIT_MS = 15_000;
// Falhas passageiras (rede, 5xx, deploy, túnel fora): espera crescente, ~45 s no total, mesmo `id` a cada tentativa (o servidor
// deduplica por usuário + id + plataforma, então repetir não duplica a mensagem). A mensagem segue como "Enviando…".
const TRANSIENT_BACKOFF_MS = [1_000, 2_000, 4_000, 8_000, 15_000, 15_000];
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Fila de envios do chat: aceita itens a qualquer momento e os despacha um de cada vez, na ordem em que entraram (sem pausa entre eles), para
 * que as mensagens cheguem às plataformas na ordem em que foram digitadas. Um 429 espera o Retry-After e tenta de novo; falha passageira (rede/5xx) é repetida com espera crescente.
 */
export class SendQueue {
  private items: QueueItem[] = [];
  private running = false;
  private deps: Deps;
  constructor(deps: Deps) {
    this.deps = deps;
  }

  /** Itens ainda não concluídos (o que está em envio mais os que aguardam). */
  get size() {
    return this.items.length;
  }

  enqueue(item: QueueItem) {
    this.items.push(item);
    void this.run();
  }

  private async attempt(item: QueueItem): Promise<SendResult[]> {
    const sleep = this.deps.sleep ?? wait;
    let rateLimited = 0;
    let transient = 0;
    for (;;) {
      try {
        return await this.deps.send(item);
      } catch (error) {
        if (error instanceof RateLimited && ++rateLimited < MAX_ATTEMPTS) {
          await sleep(Math.min(error.retryAfterSeconds * 1000, MAX_RETRY_WAIT_MS));
        } else if (error instanceof TransientError && transient < TRANSIENT_BACKOFF_MS.length) {
          await sleep(TRANSIENT_BACKOFF_MS[transient++]);
        } else {
          throw error;
        }
      }
    }
  }

  private async run() {
    if (this.running) return;
    this.running = true;
    try {
      while (this.items.length) {
        const item = this.items[0];
        this.deps.onStart(item);
        try {
          this.deps.onFinish(item, { results: await this.attempt(item) });
        } catch (error) {
          this.deps.onFinish(item, { error: error instanceof Error ? error : new Error("Não foi possível enviar.") });
        }
        this.items.shift();
      }
    } finally {
      this.running = false;
    }
  }
}
