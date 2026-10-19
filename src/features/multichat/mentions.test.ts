import { describe, expect, it } from "vitest";
import { applyMention, mentionHandle, mentionQuery, mentionsAny, suggestMentions } from "./mentions";

describe("mentionHandle", () => {
  it("troca os espaços do meio por _ e tira os das pontas", () => {
    expect(mentionHandle("  Fã do Galindo ")).toBe("Fã_do_Galindo");
    expect(mentionHandle("Ana")).toBe("Ana");
  });
});

describe("mentionQuery", () => {
  it("acha o @trecho logo antes do cursor, no começo ou depois de espaço", () => {
    expect(mentionQuery("@an", 3)).toEqual({ start: 0, query: "an" });
    expect(mentionQuery("oi @Fã_d", 8)).toEqual({ start: 3, query: "Fã_d" });
    expect(mentionQuery("oi @", 4)).toEqual({ start: 3, query: "" });
  });
  it("só olha até o cursor e ignora e-mails, @ no meio de palavra e trechos já fechados", () => {
    expect(mentionQuery("oi @ana tudo bem", 7)).toEqual({ start: 3, query: "ana" });
    expect(mentionQuery("oi @ana tudo bem", 16)).toBeNull();
    expect(mentionQuery("fale com ana@dominio", 20)).toBeNull();
    expect(mentionQuery("oi @ana ", 8)).toBeNull();
    expect(mentionQuery("sem arroba", 10)).toBeNull();
  });
});

describe("suggestMentions", () => {
  const handles = ["Zeca", "ana", "Ana_Clara", "Bruno", "ana", "Anselmo"];
  it("filtra pelo começo sem diferenciar maiúsculas, sem repetir e em ordem alfabética", () => {
    expect(suggestMentions(handles, "an")).toEqual(["ana", "Ana_Clara", "Anselmo"]);
    expect(suggestMentions(handles, "")).toEqual(["ana", "Ana_Clara", "Anselmo", "Bruno", "Zeca"]);
    expect(suggestMentions(handles, "x")).toEqual([]);
  });
  it("respeita o limite", () => {
    expect(suggestMentions(handles, "", 2)).toEqual(["ana", "Ana_Clara"]);
  });
});

describe("applyMention", () => {
  it("troca o @trecho pelo nome completo com um espaço depois, reaproveitando o que já existe, e põe o cursor depois dele", () => {
    const query = mentionQuery("oi @an e mais", 6)!;
    expect(applyMention("oi @an e mais", 6, query, "Ana_Clara")).toEqual({ text: "oi @Ana_Clara e mais", caret: 14 });
    const end = mentionQuery("oi @an", 6)!;
    expect(applyMention("oi @an", 6, end, "Ana")).toEqual({ text: "oi @Ana ", caret: 8 });
  });
});

describe("mentionsAny", () => {
  it("reconhece a menção ao nome de exibição (com _) e ao usuário, sem diferenciar maiúsculas", () => {
    expect(mentionsAny("e aí @fã_do_galindo, tudo bem?", ["Fã do Galindo", "galindo_fan"])).toBe(true);
    expect(mentionsAny("valeu @GALINDO_FAN!", ["Fã do Galindo", "galindo_fan"])).toBe(true);
    expect(mentionsAny("@ana oi", ["ana"])).toBe(true);
  });
  it("exige a palavra inteira e o @ no início de uma palavra", () => {
    expect(mentionsAny("oi @analu", ["ana"])).toBe(false);
    expect(mentionsAny("ana@dominio.com", ["dominio"])).toBe(false);
    expect(mentionsAny("oi ana sem arroba", ["ana"])).toBe(false);
    expect(mentionsAny("oi @ana", [])).toBe(false);
    expect(mentionsAny("oi @ana", ["", "  "])).toBe(false);
  });
});
