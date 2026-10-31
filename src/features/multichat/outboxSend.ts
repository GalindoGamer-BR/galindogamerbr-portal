import { z } from "zod";
import { RateLimited, supabase } from "./services";
import type { QueueItem } from "./sendQueue";
import { platforms, type SendResult } from "./types";

// Envio pela fila persistente (multichat.send_queue no Supabase). O navegador grava a mensagem direto no banco, que nao
// reinicia no deploy da VM, e o multichat-command a entrega em ordem. Nao ha repeticao no cliente: a chave primaria
// (usuario + id) garante que a mesma mensagem nunca entra duas vezes, e o resultado vem pela propria linha.
const POLL_MS = 800;
const TIMEOUT_MS = 180_000;
const DUPLICATE = "23505";
const RATE_LIMIT = "P0001";

const resultsSchema = z.array(
  z.object({ platform: z.enum(platforms), success: z.boolean(), error: z.string().optional(), skipped: z.boolean().optional() }),
);

type Row = { status: string; results: unknown };
/** O que o envio usa do cliente do Supabase (injetavel nos testes). */
export type OutboxClient = {
  insert: (row: Record<string, unknown>) => Promise<{ error: { code?: string } | null }>;
  read: (id: string) => Promise<{ data: Row | null; error: unknown }>;
};

function supabaseClient(): OutboxClient {
  if (!supabase) throw new Error("Multichat ainda não configurado.");
  const queue = () => supabase!.schema("multichat").from("send_queue");
  return {
    insert: async (row) => ({ error: (await queue().insert(row)).error }),
    read: async (id) => {
      const { data, error } = await queue().select("status,results").eq("id", id).maybeSingle();
      return { data: data as Row | null, error };
    },
  };
}

export async function sendViaOutbox(
  item: QueueItem,
  { client = supabaseClient(), pollMs = POLL_MS, timeoutMs = TIMEOUT_MS }: { client?: OutboxClient; pollMs?: number; timeoutMs?: number } = {},
): Promise<SendResult[]> {
  const { error } = await client.insert({
    id: item.id,
    message: item.text,
    platforms: item.platforms,
    kick_text: item.kickText ?? null,
    reply_to: item.replyTo ? { platform: item.replyTo.platform, platformMessageId: item.replyTo.platformMessageId, displayName: item.replyTo.displayName } : null,
  });
  // Duplicado = a mesma mensagem ja esta na fila: segue esperando o resultado dela, sem criar outra.
  if (error && error.code !== DUPLICATE) {
    if (error.code === RATE_LIMIT) throw new RateLimited(5);
    throw new Error("Não foi possível concluir a solicitação.");
  }

  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const { data } = await client.read(item.id);
    if (data?.status === "done") {
      const parsed = resultsSchema.safeParse(data.results);
      return parsed.success ? parsed.data : item.platforms.map((platform) => ({ platform, success: false, error: "send_failed" }));
    }
    if (data?.status === "interrupted") return item.platforms.map((platform) => ({ platform, success: false, error: "interrupted" }));
    if (Date.now() >= deadline) throw new Error("A mensagem segue na fila e será enviada assim que o servidor responder.");
    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }
}
