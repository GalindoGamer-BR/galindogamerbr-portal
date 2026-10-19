import type { ChatMessage, Platform, ReplyTarget } from "./types";
import type { OwnNames } from "./outbox";

// Registro dos envios feitos pelo portal. Uma mensagem enviada daqui vai para várias plataformas e cada uma devolve a sua cópia, mas
// para quem usa o portal ela é uma mensagem só: o chat mostra uma linha do portal (com os ícones das plataformas de destino) e
// esconde as cópias de volta. O registro fica no navegador por alguns minutos para isso também valer depois de recarregar a página.
export type SentEntry = {
  id: string;
  text: string;
  /** Texto enviado à Kick quando há emotes ([emote:id:nome]). */
  kickText?: string;
  platforms: Platform[];
  /** Plataformas em que o envio falhou ou foi pulado: ficam fora da linha do portal e não escondem nada. */
  failed: Platform[];
  createdAt: number;
  replyTo?: Pick<ReplyTarget, "platformMessageId" | "displayName" | "text">;
};

const LOG_TTL_MS = 15 * 60_000;
const LOG_MAX = 30;
// A cópia de volta pode demorar (o YouTube chega por leitura periódica) e o relógio do navegador pode estar atrasado.
const ECHO_WINDOW_MS = 2 * 60_000;
const CLOCK_SKEW_MS = 30_000;
const PLATFORMS: readonly string[] = ["twitch", "youtube", "kick", "tiktok"];

const norm = (text: string) => text.trim().replace(/\s+/g, " ");
const same = (a: string | undefined, b: string | undefined) => !!a && !!b && a.toLowerCase() === b.toLowerCase();
const withoutMention = (text: string, name: string | undefined) =>
  name && text.toLowerCase().startsWith(`@${name.toLowerCase()} `) ? text.slice(name.length + 2) : text;

export function pruneSentLog(log: SentEntry[], now: number): SentEntry[] {
  return log.filter((entry) => now - entry.createdAt < LOG_TTL_MS).slice(-LOG_MAX);
}

/** Lê o registro guardado no navegador, descartando o que não tem o formato esperado ou já expirou. */
export function parseSentLog(raw: string | null, now: number): SentEntry[] {
  try {
    const value: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(value)) return [];
    const entries = value.flatMap((item): SentEntry[] => {
      const entry = item as Partial<SentEntry> | null;
      const platformList = (list: unknown) => Array.isArray(list) && list.every((p) => typeof p === "string" && PLATFORMS.includes(p));
      if (!entry || typeof entry.id !== "string" || typeof entry.text !== "string" || typeof entry.createdAt !== "number" || !platformList(entry.platforms) || !platformList(entry.failed)) return [];
      return [entry as SentEntry];
    });
    return pruneSentLog(entries, now);
  } catch {
    return [];
  }
}

/**
 * Tira da lista as cópias de volta das mensagens enviadas pelo portal: mesma plataforma, mesmo texto, do próprio usuário e chegadas
 * depois do envio. Cada cópia cobre só um envio, então duas mensagens iguais seguidas continuam aparecendo uma vez cada. Devolve a
 * mesma lista se nada foi escondido.
 */
export function hideEchoes(real: ChatMessage[], log: SentEntry[], own: OwnNames): ChatMessage[] {
  const hidden = new Set<string>();
  for (const entry of log) {
    // Num reply o texto pode chegar com o "@nome" do pai na frente (o command o põe nas plataformas sem reply nativo).
    const parent = entry.replyTo?.displayName;
    for (const platform of entry.platforms) {
      if (entry.failed.includes(platform)) continue;
      const expected = [norm(entry.text), ...(platform === "kick" && entry.kickText ? [norm(entry.kickText)] : [])].map((text) => withoutMention(text, parent));
      const echo = real
        .filter(
          (candidate) =>
            candidate.platform === platform &&
            !hidden.has(candidate.id) &&
            !candidate.metadata?.event &&
            Date.parse(candidate.timestamp) >= entry.createdAt - CLOCK_SKEW_MS &&
            Date.parse(candidate.timestamp) <= entry.createdAt + ECHO_WINDOW_MS &&
            expected.includes(withoutMention(norm(candidate.message), parent)) &&
            (!own[platform] || same(candidate.user.username, own[platform]) || same(candidate.user.displayName, own[platform])),
        )
        .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp))[0];
      if (echo) hidden.add(echo.id);
    }
  }
  return hidden.size ? real.filter((message) => !hidden.has(message.id)) : real;
}

/**
 * A linha do portal de cada envio: uma só, com o nome de exibição do perfil e `metadata.portal.platforms` com os destinos que
 * deram certo. `pending` (ainda saindo) vem de fora porque o estado do envio mora na fila.
 */
export function portalMessages(log: SentEntry[], displayName: string, own: OwnNames, pending: ReadonlySet<string>): ChatMessage[] {
  return log.flatMap((entry): ChatMessage[] => {
    const platforms = entry.platforms.filter((platform) => !entry.failed.includes(platform));
    const first = platforms[0];
    if (!first) return [];
    const id = `portal:${entry.id}`;
    return [
      {
        id,
        platform: first,
        platformMessageId: id,
        user: { username: own[first] ?? displayName, displayName: displayName || own[first] || "Você" },
        message: entry.text,
        timestamp: new Date(entry.createdAt).toISOString(),
        metadata: {
          pending: pending.has(entry.id),
          portal: { platforms },
          ...(entry.replyTo ? { replyTo: { platformMessageId: entry.replyTo.platformMessageId, displayName: entry.replyTo.displayName, text: entry.replyTo.text } } : {}),
        },
      },
    ];
  });
}

/** A linha do portal aparece na aba da plataforma em que a mensagem foi enviada, e em "Todos". */
export function showsIn(message: ChatMessage, filter: Platform | "all"): boolean {
  return filter === "all" || message.platform === filter || !!message.metadata?.portal?.platforms.includes(filter);
}
