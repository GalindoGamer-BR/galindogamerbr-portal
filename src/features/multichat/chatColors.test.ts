import { describe, expect, it } from "vitest";
import { readableColor } from "./chatColors";

describe("readableColor", () => {
  it("mantém cores que já têm contraste", () => {
    expect(readableColor("#ff7f50")).toBe("#ff7f50");
    expect(readableColor("#ffffff")).toBe("#ffffff");
  });
  it("clareia cores escuras demais para o fundo do chat", () => {
    const result = readableColor("#0000ff")!;
    expect(result).not.toBe("#0000ff");
    expect(result).toMatch(/^#[0-9a-f]{6}$/);
    // continua azulado, só mais claro
    expect(parseInt(result.slice(5, 7), 16)).toBeGreaterThan(200);
    expect(parseInt(result.slice(1, 3), 16)).toBeGreaterThan(0);
  });
  it("ignora valores inválidos", () => {
    expect(readableColor(undefined)).toBeUndefined();
    expect(readableColor("red")).toBeUndefined();
    expect(readableColor("#fff")).toBeUndefined();
  });
});
