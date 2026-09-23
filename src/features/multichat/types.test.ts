import { describe, it, expect } from "vitest";
import { appendMessages, messageSchema, type ChatMessage } from "./types";
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
  it("rejects native provider DTOs and invalid timestamps", () => {
    expect(messageSchema.safeParse({ content: "native payload" }).success).toBe(
      false,
    );
    expect(
      messageSchema.safeParse({ ...message("1"), timestamp: "wrong" }).success,
    ).toBe(false);
  });
});
