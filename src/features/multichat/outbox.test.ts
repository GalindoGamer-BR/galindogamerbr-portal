import { describe, expect, it } from "vitest";
import { applyDisplayName } from "./outbox";
import type { ChatMessage } from "./types";

const NOW = Date.parse("2026-10-14T20:00:00Z");
const own = { twitch: "galindo_fan", kick: "galindofan" };

const real = (over: Partial<ChatMessage> & { platform: ChatMessage["platform"] }): ChatMessage => ({
  id: `${over.platform}:x`, platformMessageId: "x", user: { username: "galindo_fan", displayName: "galindo_fan" },
  message: "oi pessoal", timestamp: new Date(NOW + 1000).toISOString(), ...over,
});

describe("applyDisplayName", () => {
  it("troca o nome só nas mensagens das contas do próprio usuário", () => {
    const mine = real({ platform: "twitch" });
    const other = real({ platform: "twitch", id: "t:2", user: { username: "outro", displayName: "Outro" } });

    const [a, b] = applyDisplayName([mine, other], own, "Fã do Galindo");

    expect(a.user.displayName).toBe("Fã do Galindo");
    expect(b).toBe(other);
  });

  it("sem nome escolhido devolve a mesma lista", () => {
    const list = [real({ platform: "twitch" })];

    expect(applyDisplayName(list, own, "")).toBe(list);
  });
});
