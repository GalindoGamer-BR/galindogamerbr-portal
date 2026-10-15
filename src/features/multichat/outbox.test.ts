import { describe, expect, it } from "vitest";
import { applyDisplayName, dropEchoed, optimisticMessages, type OutboxItem } from "./outbox";
import type { ChatMessage } from "./types";

const NOW = Date.parse("2026-10-14T20:00:00Z");
const own = { twitch: "galindo_fan", kick: "galindofan" };

const outboxItem = (over: Partial<OutboxItem> = {}): OutboxItem => ({
  id: "u1", text: "oi pessoal", platforms: ["twitch", "kick"], status: "queued", createdAt: NOW, failed: [], ...over,
});

const real = (over: Partial<ChatMessage> & { platform: ChatMessage["platform"] }): ChatMessage => ({
  id: `${over.platform}:x`, platformMessageId: "x", user: { username: "galindo_fan", displayName: "galindo_fan" },
  message: "oi pessoal", timestamp: new Date(NOW + 1000).toISOString(), ...over,
});

describe("optimisticMessages", () => {
  it("cria uma mensagem provisória por plataforma de destino, com o nome de exibição do perfil", () => {
    const messages = optimisticMessages([outboxItem()], "Fã do Galindo", own).map((m) => m.message);

    expect(messages.map((m) => m.platform)).toEqual(["twitch", "kick"]);
    expect(messages[0].user.displayName).toBe("Fã do Galindo");
    expect(messages[0].metadata?.pending).toBe(true);
  });

  it("não mostra a provisória das plataformas em que o envio falhou e tira o 'pendente' depois de enviada", () => {
    const messages = optimisticMessages([outboxItem({ status: "sent", failed: ["kick"] })], "Fã", own).map((m) => m.message);

    expect(messages.map((m) => m.platform)).toEqual(["twitch"]);
    expect(messages[0].metadata?.pending).toBe(false);
  });

  it("sem nome de exibição carregado usa o nome da conta da plataforma", () => {
    const [first] = optimisticMessages([outboxItem()], "", own);

    expect(first.message.user.displayName).toBe("galindo_fan");
  });
});

describe("dropEchoed", () => {
  it("some com a provisória quando a mensagem real do próprio usuário chega", () => {
    const optimistic = optimisticMessages([outboxItem()], "Fã", own);

    const left = dropEchoed(optimistic, [real({ platform: "twitch" })], own);

    expect(left.map((m) => m.platform)).toEqual(["kick"]);
  });

  it("não confunde com a mesma frase escrita por outra pessoa", () => {
    const optimistic = optimisticMessages([outboxItem()], "Fã", own);
    const other = real({ platform: "twitch", user: { username: "outro", displayName: "outro" } });

    expect(dropEchoed(optimistic, [other], own)).toHaveLength(2);
  });

  it("ignora mensagens reais anteriores ao envio", () => {
    const optimistic = optimisticMessages([outboxItem()], "Fã", own);
    const old = real({ platform: "twitch", timestamp: new Date(NOW - 5 * 60_000).toISOString() });

    expect(dropEchoed(optimistic, [old], own)).toHaveLength(2);
  });

  it("cada mensagem real cobre uma provisória só: duas mensagens iguais seguidas aparecem uma vez cada", () => {
    const optimistic = optimisticMessages([outboxItem({ id: "a", platforms: ["twitch"] }), outboxItem({ id: "b", platforms: ["twitch"] })], "Fã", own);

    expect(dropEchoed(optimistic, [real({ platform: "twitch" })], own)).toHaveLength(1);
  });

  it("na Kick compara com o texto enviado (emotes viram [emote:id:nome])", () => {
    const item = outboxItem({ platforms: ["kick"], text: "olá Kappa", kickText: "olá [emote:1:Kappa]" });
    const echo = real({ platform: "kick", message: "olá [emote:1:Kappa]", user: { username: "galindofan", displayName: "galindofan" } });

    expect(dropEchoed(optimisticMessages([item], "Fã", own), [echo], own)).toHaveLength(0);
  });
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
