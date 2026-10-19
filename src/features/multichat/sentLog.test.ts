import { describe, expect, it } from "vitest";
import { hideEchoes, parseSentLog, portalMessages, pruneSentLog, showsIn, type SentEntry } from "./sentLog";
import type { ChatMessage } from "./types";

const NOW = Date.parse("2026-10-14T20:00:00Z");
const own = { twitch: "galindo_fan", youtube: "Galindo Fan", kick: "galindofan" };

const entry = (over: Partial<SentEntry> = {}): SentEntry => ({
  id: "u1", text: "oi pessoal", platforms: ["twitch", "youtube", "kick"], failed: [], createdAt: NOW, ...over,
});
const real = (over: Partial<ChatMessage> & { platform: ChatMessage["platform"] }): ChatMessage => ({
  id: `${over.platform}:x`, platformMessageId: "x", user: { username: own[over.platform as "twitch"] ?? "x", displayName: own[over.platform as "twitch"] ?? "x" },
  message: "oi pessoal", timestamp: new Date(NOW + 1000).toISOString(), ...over,
});
const echoes = () => [real({ platform: "twitch" }), real({ platform: "youtube" }), real({ platform: "kick" })];

describe("portalMessages", () => {
  it("uma linha só por envio, com o nome do perfil e todas as plataformas de destino", () => {
    const [message, ...rest] = portalMessages([entry()], "Fã do Galindo", own, new Set());

    expect(rest).toEqual([]);
    expect(message.user.displayName).toBe("Fã do Galindo");
    expect(message.metadata?.portal?.platforms).toEqual(["twitch", "youtube", "kick"]);
    expect(message.metadata?.pending).toBe(false);
  });

  it("fica pendente enquanto o envio não saiu e deixa de fora as plataformas que falharam", () => {
    const [message] = portalMessages([entry({ failed: ["youtube"] })], "Fã", own, new Set(["u1"]));

    expect(message.metadata?.pending).toBe(true);
    expect(message.metadata?.portal?.platforms).toEqual(["twitch", "kick"]);
  });

  it("sem nenhum destino que deu certo não mostra a linha, e sem nome carregado usa o da conta", () => {
    expect(portalMessages([entry({ failed: ["twitch", "youtube", "kick"] })], "Fã", own, new Set())).toEqual([]);
    expect(portalMessages([entry()], "", own, new Set())[0].user.displayName).toBe("galindo_fan");
  });

  it("carrega o reply para aparecer citando o pai", () => {
    const reply = { platformMessageId: "p1", displayName: "Bob", text: "oi a todos" };
    expect(portalMessages([entry({ replyTo: reply })], "Fã", own, new Set())[0].metadata?.replyTo).toEqual(reply);
    expect(portalMessages([entry()], "Fã", own, new Set())[0].metadata?.replyTo).toBeUndefined();
  });
});

describe("hideEchoes", () => {
  it("esconde a cópia que cada plataforma devolve da mensagem enviada pelo portal", () => {
    expect(hideEchoes(echoes(), [entry()], own)).toEqual([]);
  });

  it("devolve a mesma lista quando nada foi enviado pelo portal", () => {
    const list = echoes();
    expect(hideEchoes(list, [], own)).toBe(list);
  });

  it("não esconde a mesma frase escrita por outra pessoa nem o que foi escrito antes do envio", () => {
    const other = real({ platform: "twitch", id: "t:o", user: { username: "outro", displayName: "outro" } });
    const old = real({ platform: "youtube", id: "y:old", timestamp: new Date(NOW - 5 * 60_000).toISOString() });

    expect(hideEchoes([other, old], [entry()], own)).toHaveLength(2);
  });

  it("não esconde cópia que chega depois da janela de dois minutos", () => {
    const late = real({ platform: "youtube", timestamp: new Date(NOW + 3 * 60_000).toISOString() });
    expect(hideEchoes([late], [entry()], own)).toHaveLength(1);
  });

  it("cada cópia cobre um envio só: duas mensagens iguais seguidas aparecem uma vez cada", () => {
    const log = [entry({ id: "a", platforms: ["twitch"] }), entry({ id: "b", platforms: ["twitch"], createdAt: NOW + 500 })];
    const copies = [real({ platform: "twitch", id: "t:1" }), real({ platform: "twitch", id: "t:2", timestamp: new Date(NOW + 2000).toISOString() }), real({ platform: "twitch", id: "t:3", timestamp: new Date(NOW + 3000).toISOString() })];

    expect(hideEchoes(copies, log, own).map((m) => m.id)).toEqual(["t:3"]);
  });

  it("plataforma em que o envio falhou não esconde nada", () => {
    const left = hideEchoes(echoes(), [entry({ failed: ["kick"] })], own);
    expect(left.map((m) => m.platform)).toEqual(["kick"]);
  });

  it("na Kick reconhece tanto o texto simples quanto o com [emote:id:nome]", () => {
    const item = entry({ platforms: ["kick"], text: "olá Kappa", kickText: "olá [emote:1:Kappa]" });
    expect(hideEchoes([real({ platform: "kick", message: "olá Kappa" })], [item], own)).toEqual([]);
    expect(hideEchoes([real({ platform: "kick", message: "olá [emote:1:Kappa]" })], [item], own)).toEqual([]);
  });

  it("reconhece a cópia com o @nome do pai na frente (plataformas sem reply nativo e reply da Twitch)", () => {
    const item = entry({ platforms: ["twitch", "kick"], replyTo: { platformMessageId: "p1", displayName: "Bob" } });
    const copies = [real({ platform: "twitch", message: "@Bob oi pessoal" }), real({ platform: "kick", message: "@bob oi pessoal" })];

    expect(hideEchoes(copies, [item], own)).toEqual([]);
  });

  it("sem reply, um texto com @nome na frente não é a cópia", () => {
    expect(hideEchoes([real({ platform: "twitch", message: "@Bob oi pessoal" })], [entry({ platforms: ["twitch"] })], own)).toHaveLength(1);
  });

  it("avisos do canal nunca são tratados como cópia", () => {
    const notice = real({ platform: "twitch", metadata: { event: { type: "announcement" } } });
    expect(hideEchoes([notice], [entry({ platforms: ["twitch"] })], own)).toHaveLength(1);
  });
});

describe("showsIn", () => {
  it("a linha do portal aparece em Todos e na aba de cada plataforma de destino, mas não nas outras", () => {
    const [message] = portalMessages([entry({ platforms: ["twitch", "kick"] })], "Fã", own, new Set());

    expect(showsIn(message, "all")).toBe(true);
    expect(showsIn(message, "twitch")).toBe(true);
    expect(showsIn(message, "kick")).toBe(true);
    expect(showsIn(message, "youtube")).toBe(false);
  });

  it("mensagem comum só aparece na aba da própria plataforma", () => {
    expect(showsIn(real({ platform: "kick" }), "kick")).toBe(true);
    expect(showsIn(real({ platform: "kick" }), "twitch")).toBe(false);
  });
});

describe("registro guardado no navegador", () => {
  it("descarta o que expirou, o que não tem o formato esperado e limita o tamanho", () => {
    const fresh = entry({ id: "novo", createdAt: NOW - 60_000 });
    const expired = entry({ id: "velho", createdAt: NOW - 20 * 60_000 });

    expect(pruneSentLog([expired, fresh], NOW).map((e) => e.id)).toEqual(["novo"]);
    expect(parseSentLog(JSON.stringify([expired, fresh, { id: 1 }, "x", { ...fresh, id: "z", platforms: ["orkut"] }]), NOW).map((e) => e.id)).toEqual(["novo"]);
    expect(parseSentLog("não é json", NOW)).toEqual([]);
    expect(parseSentLog(null, NOW)).toEqual([]);
    const many = Array.from({ length: 40 }, (_, index) => entry({ id: `m${index}`, createdAt: NOW - index }));
    expect(pruneSentLog(many, NOW)).toHaveLength(30);
  });
});
