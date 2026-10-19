import { describe, expect, it } from "vitest";
import { noticeText } from "./notices";
import type { ChatMessage } from "./types";

const notice = (event: NonNullable<NonNullable<ChatMessage["metadata"]>["event"]>, name = "Fã"): ChatMessage => ({
  id: "twitch:n", platform: "twitch", platformMessageId: "n", user: { username: "fa", displayName: name },
  message: "", timestamp: "2026-10-16T12:00:00.000Z", metadata: { event },
});

describe("noticeText", () => {
  it("descreve sub, resub e presentes em português, com o nível", () => {
    expect(noticeText(notice({ type: "sub", tier: "1000" }))).toBe("Fã se inscreveu no Nível 1.");
    expect(noticeText(notice({ type: "sub", tier: "Prime" }))).toBe("Fã se inscreveu com o Prime.");
    expect(noticeText(notice({ type: "resub", tier: "2000", months: 6 }))).toBe("Fã renovou a inscrição no Nível 2 (6 meses).");
    expect(noticeText(notice({ type: "resub", months: 1 }))).toBe("Fã renovou a inscrição (1 mês).");
    expect(noticeText(notice({ type: "subgift", recipient: "Sortudo", tier: "3000" }))).toBe("Fã presenteou Sortudo com uma inscrição no Nível 3.");
    expect(noticeText(notice({ type: "submysterygift", count: 5 }))).toBe("Fã presenteou a comunidade com 5 inscrições.");
    expect(noticeText(notice({ type: "submysterygift", count: 1 }))).toBe("Fã presenteou a comunidade com 1 inscrição.");
  });
  it("descreve raid e anúncio, e tolera dados que faltam", () => {
    expect(noticeText(notice({ type: "raid", viewers: 42 }))).toBe("Fã chegou em raid com 42 espectadores.");
    expect(noticeText(notice({ type: "raid", viewers: 1 }))).toBe("Fã chegou em raid com 1 espectador.");
    expect(noticeText(notice({ type: "raid" }))).toBe("Fã chegou em raid com vários espectadores.");
    expect(noticeText(notice({ type: "subgift" }))).toBe("Fã presenteou alguém com uma inscrição.");
    expect(noticeText(notice({ type: "announcement" }))).toBe("Anúncio de Fã");
  });
  it("devolve null para mensagem comum", () => {
    expect(noticeText({ ...notice({ type: "sub" }), metadata: {} })).toBeNull();
  });
});
