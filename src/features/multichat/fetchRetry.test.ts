import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchRetryingGet } from "./services";

const reply = (status: number) => new Response("{}", { status });

describe("fetchRetryingGet", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("repete um GET que recebeu 5xx e devolve a segunda resposta", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(reply(500)).mockResolvedValueOnce(reply(200));
    vi.stubGlobal("fetch", fetchMock);
    expect((await fetchRetryingGet("/api/accounts", {}, 0)).status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it("repete um GET que falhou na rede, uma vez só", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("network"));
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchRetryingGet("/api/accounts", { method: "GET" }, 0)).rejects.toThrow("network");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it("não repete 4xx nem sucesso", async () => {
    const fetchMock = vi.fn().mockResolvedValue(reply(403));
    vi.stubGlobal("fetch", fetchMock);
    expect((await fetchRetryingGet("/api/accounts", {}, 0)).status).toBe(403);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("nunca repete envio (POST, PUT, DELETE)", async () => {
    for (const method of ["POST", "PUT", "DELETE"]) {
      const fetchMock = vi.fn().mockResolvedValue(reply(503));
      vi.stubGlobal("fetch", fetchMock);
      expect((await fetchRetryingGet("/api/chat/messages", { method }, 0)).status).toBe(503);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    }
  });
});
