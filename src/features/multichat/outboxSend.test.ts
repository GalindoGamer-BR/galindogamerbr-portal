import { describe, expect, it } from "vitest";
import { sendViaOutbox, type OutboxClient } from "./outboxSend";
import { RateLimited } from "./services";
import type { QueueItem } from "./sendQueue";

const item: QueueItem = { id: "11111111-1111-4111-8111-111111111111", text: "oi", platforms: ["twitch", "kick"], kickText: "oi kick" };
const opts = { pollMs: 1, timeoutMs: 50 };

function client(reads: Array<{ status: string; results?: unknown } | null>, insertError: { code?: string } | null = null) {
  const inserted: Record<string, unknown>[] = [];
  let i = 0;
  const c: OutboxClient = {
    insert: async (row) => { inserted.push(row); return { error: insertError }; },
    read: async () => ({ data: (reads[Math.min(i++, reads.length - 1)] as { status: string; results: unknown } | null), error: null }),
  };
  return { c, inserted };
}

describe("sendViaOutbox", () => {
  it("grava a mensagem na fila com o id e espera o resultado da propria linha", async () => {
    const { c, inserted } = client([{ status: "queued" }, { status: "sending" }, { status: "done", results: [{ platform: "twitch", success: true }, { platform: "kick", success: false, error: "send_failed" }] }]);
    const results = await sendViaOutbox(item, { client: c, ...opts, timeoutMs: 1000 });
    expect(inserted).toEqual([{ id: item.id, message: "oi", platforms: ["twitch", "kick"], kick_text: "oi kick", reply_to: null }]);
    expect(results).toEqual([{ platform: "twitch", success: true }, { platform: "kick", success: false, error: "send_failed" }]);
  });

  it("id duplicado (23505) nao cria outra mensagem: segue esperando a mesma linha", async () => {
    const { c } = client([{ status: "done", results: [{ platform: "twitch", success: true }] }], { code: "23505" });
    expect(await sendViaOutbox(item, { client: c, ...opts })).toEqual([{ platform: "twitch", success: true }]);
  });

  it("linha interrompida (command caiu no meio) volta como falha, sem reenviar", async () => {
    const { c, inserted } = client([{ status: "interrupted" }]);
    const results = await sendViaOutbox(item, { client: c, ...opts });
    expect(results.every((r) => !r.success && r.error === "interrupted")).toBe(true);
    expect(inserted).toHaveLength(1);
  });

  it("limite de envios do banco vira RateLimited; outro erro vira mensagem comum", async () => {
    await expect(sendViaOutbox(item, { client: client([null], { code: "P0001" }).c, ...opts })).rejects.toBeInstanceOf(RateLimited);
    await expect(sendViaOutbox(item, { client: client([null], { code: "42501" }).c, ...opts })).rejects.toThrow("Não foi possível concluir a solicitação.");
  });

  it("enquanto o servidor esta em deploy a linha espera na fila e sai depois (nao ha segundo insert)", async () => {
    const { c, inserted } = client([{ status: "queued" }, { status: "queued" }, { status: "queued" }, { status: "done", results: [{ platform: "twitch", success: true }] }]);
    await sendViaOutbox(item, { client: c, pollMs: 1, timeoutMs: 1000 });
    expect(inserted).toHaveLength(1);
  });

  it("passa o replyTo so com os tres campos aceitos pelo banco", async () => {
    const { c, inserted } = client([{ status: "done", results: [] }]);
    await sendViaOutbox({ ...item, replyTo: { platform: "twitch", platformMessageId: "abc", displayName: "Fulano", text: "ignorado" } }, { client: c, ...opts });
    expect(inserted[0].reply_to).toEqual({ platform: "twitch", platformMessageId: "abc", displayName: "Fulano" });
  });
});
