import { describe, expect, it } from "vitest";
import { MAX_ONLINE_NAMES, onlineMembers } from "./presence";

describe("onlineMembers", () => {
  it("junta os nomes de todas as conexões, sem repetir (mesmo membro em duas abas) e em ordem alfabética", () => {
    const state = {
      k1: [{ name: "Zeca" }],
      k2: [{ name: "ana" }],
      k3: [{ name: "Ana" }, { name: "Bruno" }],
    };
    expect(onlineMembers(state)).toEqual({ count: 3, names: ["ana", "Bruno", "Zeca"] });
  });

  it("ignora entradas sem nome de texto, limpa caracteres de controle e corta nomes enormes", () => {
    const state = {
      a: [{ name: 7 }, {}, { name: "   " }, { name: "Be\u0000to\n" }],
      b: [{ name: "x".repeat(100) }],
    };
    const result = onlineMembers(state as never);
    expect(result.names).toEqual(["Beto", "x".repeat(40)]);
    expect(result.count).toBe(2);
  });

  it("tolera estado vazio ou malformado", () => {
    expect(onlineMembers({})).toEqual({ count: 0, names: [] });
    expect(onlineMembers(undefined as never)).toEqual({ count: 0, names: [] });
    expect(onlineMembers({ a: "nao e lista" } as never)).toEqual({ count: 0, names: [] });
  });

  it("limita a lista de nomes mas mantém o total", () => {
    const state = { a: Array.from({ length: 300 }, (_, i) => ({ name: `membro${String(i).padStart(3, "0")}` })) };
    const result = onlineMembers(state);
    expect(result.count).toBe(300);
    expect(result.names).toHaveLength(MAX_ONLINE_NAMES);
  });
});
