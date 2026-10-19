import { afterEach, describe, expect, it, vi } from "vitest";
import { rememberMergeClaim, takeMergeClaim } from "./mergeFlow";

function stubStorage() {
  const data = new Map<string, string>();
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  });
}
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("token da mesclagem por login", () => {
  it("é entregue uma vez só", () => {
    stubStorage();
    rememberMergeClaim("abc".repeat(10));
    expect(takeMergeClaim()).toBe("abc".repeat(10));
    expect(takeMergeClaim()).toBeNull();
  });
  it("expira depois de 15 minutos", () => {
    stubStorage();
    vi.useFakeTimers();
    rememberMergeClaim("abc".repeat(10));
    vi.advanceTimersByTime(16 * 60 * 1000);
    expect(takeMergeClaim()).toBeNull();
  });
  it("sem armazenamento ou com lixo guardado não quebra", () => {
    vi.stubGlobal("sessionStorage", { getItem: () => { throw new Error("bloqueado"); }, setItem: () => { throw new Error("bloqueado"); }, removeItem: () => undefined });
    expect(() => rememberMergeClaim("x")).not.toThrow();
    expect(takeMergeClaim()).toBeNull();
    vi.stubGlobal("sessionStorage", { getItem: () => "não é json", setItem: () => undefined, removeItem: () => undefined });
    expect(takeMergeClaim()).toBeNull();
  });
});
