import { describe, expect, it } from "vitest";
import { SendQueue, type QueueItem } from "./sendQueue";
import { RateLimited, TransientError } from "./services";
import type { SendResult } from "./types";

const item = (id: string): QueueItem => ({ id, text: `msg ${id}`, platforms: ["twitch"] });
const ok: SendResult[] = [{ platform: "twitch", success: true }];
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

function setup(send: (item: QueueItem) => Promise<SendResult[]>) {
  const log: string[] = [];
  const sleeps: number[] = [];
  const queue = new SendQueue({
    send,
    onStart: (i) => log.push(`start ${i.id}`),
    onFinish: (i, outcome) => log.push(`${"error" in outcome ? "error" : "done"} ${i.id}`),
    sleep: async (ms) => { sleeps.push(ms); },
  });
  return { queue, log, sleeps };
}

describe("SendQueue", () => {
  it("envia um de cada vez, na ordem em que entraram, sem esperar o envio anterior para aceitar o próximo", async () => {
    const gates: Array<() => void> = [];
    const { queue, log } = setup(() => new Promise<SendResult[]>((resolve) => gates.push(() => resolve(ok))));

    queue.enqueue(item("1"));
    queue.enqueue(item("2"));
    queue.enqueue(item("3"));
    await settle();
    expect(queue.size).toBe(3);
    expect(log).toEqual(["start 1"]);

    gates[0]();
    await settle();
    expect(log).toEqual(["start 1", "done 1", "start 2"]);

    gates[1]();
    await settle();
    gates[2]();
    await settle();
    expect(log).toEqual(["start 1", "done 1", "start 2", "done 2", "start 3", "done 3"]);
    expect(queue.size).toBe(0);
  });

  it("uma falha não trava a fila: segue para a próxima mensagem", async () => {
    const { queue, log } = setup(async (i) => {
      if (i.id === "1") throw new Error("falhou");
      return ok;
    });

    queue.enqueue(item("1"));
    queue.enqueue(item("2"));
    await settle();
    await settle();

    expect(log).toEqual(["start 1", "error 1", "start 2", "done 2"]);
  });

  it("espera o Retry-After e tenta de novo quando o servidor responde 429", async () => {
    let calls = 0;
    const { queue, log, sleeps } = setup(async () => {
      if (++calls === 1) throw new RateLimited(3);
      return ok;
    });

    queue.enqueue(item("1"));
    await settle();

    expect(calls).toBe(2);
    expect(sleeps).toEqual([3000]);
    expect(log).toEqual(["start 1", "done 1"]);
  });

  it("desiste depois de 3 tentativas seguidas com 429", async () => {
    let calls = 0;
    const { queue, log } = setup(async () => {
      calls++;
      throw new RateLimited(1);
    });

    queue.enqueue(item("1"));
    await settle();

    expect(calls).toBe(3);
    expect(log).toEqual(["start 1", "error 1"]);
  });

  it("falha passageira (rede/5xx) é repetida com espera crescente e a mensagem acaba enviada", async () => {
    let calls = 0;
    const { queue, log, sleeps } = setup(async () => {
      if (++calls <= 3) throw new TransientError("fora do ar");
      return ok;
    });

    queue.enqueue(item("1"));
    await settle();
    await settle();

    expect(calls).toBe(4);
    expect(sleeps).toEqual([1000, 2000, 4000]);
    expect(log).toEqual(["start 1", "done 1"]);
  });

  it("desiste depois de ~45 s de falhas passageiras e segue para a próxima", async () => {
    let calls = 0;
    const { queue, log, sleeps } = setup(async (i) => {
      if (i.id === "1") { calls++; throw new TransientError("fora do ar"); }
      return ok;
    });

    queue.enqueue(item("1"));
    queue.enqueue(item("2"));
    await settle();
    await settle();

    expect(calls).toBe(7);
    expect(sleeps).toEqual([1000, 2000, 4000, 8000, 15000, 15000]);
    expect(log).toEqual(["start 1", "error 1", "start 2", "done 2"]);
  });

  it("erro comum (4xx, validação) não é repetido", async () => {
    let calls = 0;
    const { queue, log } = setup(async () => { calls++; throw new Error("Sua sessão expirou."); });
    queue.enqueue(item("1"));
    await settle();
    expect(calls).toBe(1);
    expect(log).toEqual(["start 1", "error 1"]);
  });
});
