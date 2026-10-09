import { describe, it, expect } from "vitest";
import { appendMessages, messageSchema, parseHistory, type ChatMessage } from "./types";
const message = (
  id: string,
  platform: ChatMessage["platform"] = "twitch",
): ChatMessage => ({
  id: `${platform}:${id}`,
  platform,
  platformMessageId: id,
  user: { username: "test", displayName: "Test" },
  message: "Olá",
  timestamp: new Date().toISOString(),
});
describe("multichat buffer", () => {
  it("deduplicates within batches while preserving different platforms", () => {
    expect(
      appendMessages(
        [message("1")],
        [message("1"), message("2"), message("2"), message("1", "kick")],
      ),
    ).toHaveLength(3);
  });
  it("keeps only the newest 1000 messages", () => {
    const result = appendMessages(
      [],
      Array.from({ length: 1100 }, (_, i) => message(String(i))),
    );
    expect(result).toHaveLength(1000);
    expect(result[0].platformMessageId).toBe("100");
  });
  it("orders messages by timestamp, keeping arrival order on ties", () => {
    const at = (id: string, time: string, platform: ChatMessage["platform"] = "twitch") => ({
      ...message(id, platform),
      timestamp: `2026-10-09T12:00:${time}Z`,
    });
    const result = appendMessages(
      [at("b", "20")],
      [at("c", "30"), at("a", "10"), at("d", "20", "kick")],
    );
    expect(result.map((m) => m.platformMessageId)).toEqual(["a", "b", "d", "c"]);
  });
  it("rejects native provider DTOs and invalid timestamps", () => {
    expect(messageSchema.safeParse({ content: "native payload" }).success).toBe(
      false,
    );
    expect(
      messageSchema.safeParse({ ...message("1"), timestamp: "wrong" }).success,
    ).toBe(false);
  });
  it("keeps only the newest N history messages, in chronological order", () => {
    const at = (id: string, sec: number) => ({ ...message(id), timestamp: new Date(Date.UTC(2026, 9, 9, 12, 0, sec)).toISOString() });
    // 30 mensagens fora de ordem: ficam as 15 mais recentes, ordenadas
    const payload = Array.from({ length: 30 }, (_, i) => at("m" + i, (i * 7) % 30));
    const history = parseHistory(payload, 15);
    expect(history).toHaveLength(15);
    const times = history.map((m) => Date.parse(m.timestamp));
    expect(times).toEqual([...times].sort((a, b) => a - b));
    expect(Date.parse(history[0].timestamp)).toBe(Date.UTC(2026, 9, 9, 12, 0, 15));
    expect(Date.parse(history.at(-1)!.timestamp)).toBe(Date.UTC(2026, 9, 9, 12, 0, 29));
  });
  it("parses history from the API, ignoring invalid entries, and merges it in time order with live messages", () => {
    const at = (id: string, iso: string) => ({ ...message(id), timestamp: iso });
    const history = parseHistory([at("2", "2026-10-09T12:00:20Z"), { lixo: true }, at("1", "2026-10-09T12:00:10Z")]);
    expect(history).toHaveLength(2);
    expect(parseHistory("nao e lista")).toEqual([]);
    const merged = appendMessages([at("live", "2026-10-09T12:00:15Z")], history);
    expect(merged.map((m) => m.platformMessageId)).toEqual(["1", "live", "2"]);
  });
});
