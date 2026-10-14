import { describe, expect, it } from "vitest";
import { parseRich } from "./parseRich";

describe("parseRich", () => {
  it("interpreta negrito", () => {
    expect(parseRich("oi **mundo** aí")).toEqual([
      { type: "text", text: "oi " },
      { type: "bold", text: "mundo" },
      { type: "text", text: " aí" },
    ]);
  });
  it("interpreta links com texto e links soltos", () => {
    expect(parseRich("🌐 [www.site.com.br](http://www.site.com.br) e https://meli.la/18A4jS5")).toEqual([
      { type: "text", text: "🌐 " },
      { type: "link", text: "www.site.com.br", href: "http://www.site.com.br" },
      { type: "text", text: " e " },
      { type: "link", text: "https://meli.la/18A4jS5", href: "https://meli.la/18A4jS5" },
    ]);
  });
  it("tira a pontuação final do link solto", () => {
    expect(parseRich("veja https://a.com/x.")).toEqual([
      { type: "text", text: "veja " },
      { type: "link", text: "https://a.com/x", href: "https://a.com/x" },
      { type: "text", text: "." },
    ]);
  });
  it("não cria links para esquemas perigosos e mantém texto comum", () => {
    expect(parseRich("[clique](javascript:alert(1)) normal")).toEqual([{ type: "text", text: "[clique](javascript:alert(1)) normal" }]);
  });
});
