import { afterEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";

// Renderiza a página /live inteira no servidor. Pega erros que o typecheck não vê, como usar uma variável antes de
// declará-la (a página caía em "Não foi possível carregar a página").
describe("página /live", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("renderiza sem erro de execução", async () => {
    (globalThis as { React?: unknown }).React = React;
    vi.stubGlobal("window", {
      location: { search: "", hash: "", pathname: "/live", hostname: "localhost", origin: "http://localhost:5173" },
      addEventListener() {}, removeEventListener() {},
      matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    });
    vi.stubGlobal("localStorage", { getItem: () => null, setItem() {} });
    vi.stubGlobal("document", { addEventListener() {}, removeEventListener() {}, getElementById: () => null });
    const { default: MultichatPage } = await import("./MultichatPage");
    const html = renderToString(React.createElement(MemoryRouter, null, React.createElement(MultichatPage)));
    expect(html).toContain("mc-channel-copy");
  });
});
