import type { ChatMessage, Platform } from "./types";
import type { QueueItem } from "./sendQueue";

export type OutboxItem = QueueItem & {
  status: "queued" | "sending" | "sent";
  createdAt: number;
  /** Plataformas em que o envio falhou: a mensagem provisória some delas assim que o resultado chega. */
  failed: Platform[];
};

export type OwnNames = Partial<Record<Platform, string>>;

const norm = (text: string) => text.trim().replace(/\s+/g, " ");
const same = (a: string | undefined, b: string | undefined) => !!a && !!b && a.toLowerCase() === b.toLowerCase();
// Tolerância ao relógio do navegador estar atrasado em relação ao da plataforma.
const CLOCK_SKEW_MS = 30_000;

export type OptimisticMessage = { message: ChatMessage; matchText: string };

/**
 * Mensagens provisórias das mensagens enviadas pelo usuário: aparecem no chat na hora, com o nome de exibição do perfil,
 * uma por plataforma de destino, até a mensagem real chegar das plataformas.
 */
export function optimisticMessages(outbox: OutboxItem[], displayName: string, own: OwnNames): OptimisticMessage[] {
  return outbox.flatMap((item) =>
    item.platforms
      .filter((platform) => !item.failed.includes(platform))
      .map((platform) => {
        const id = `local:${item.id}:${platform}`;
        return {
          matchText: norm(platform === "kick" && item.kickText ? item.kickText : item.text),
          message: {
            id,
            platform,
            platformMessageId: id,
            user: { username: own[platform] ?? displayName, displayName: displayName || own[platform] || "Você" },
            message: item.text,
            timestamp: new Date(item.createdAt).toISOString(),
            metadata: { pending: item.status !== "sent" },
          },
        };
      }),
  );
}

/**
 * Tira as mensagens provisórias que já chegaram das plataformas (mesma plataforma, mesmo texto, do próprio usuário,
 * enviadas depois da provisória). Cada mensagem real cobre só uma provisória, então duas mensagens iguais seguidas
 * continuam aparecendo uma vez cada.
 */
export function dropEchoed(optimistic: OptimisticMessage[], real: ChatMessage[], own: OwnNames): ChatMessage[] {
  const used = new Set<string>();
  return optimistic
    .filter(({ message, matchText }) => {
      const sentAt = Date.parse(message.timestamp);
      const echo = real.find(
        (candidate) =>
          candidate.platform === message.platform &&
          !used.has(candidate.id) &&
          Date.parse(candidate.timestamp) >= sentAt - CLOCK_SKEW_MS &&
          norm(candidate.message) === matchText &&
          (!own[message.platform] || same(candidate.user.username, own[message.platform]) || same(candidate.user.displayName, own[message.platform])),
      );
      if (echo) used.add(echo.id);
      return !echo;
    })
    .map(({ message }) => message);
}

/** Mostra o nome de exibição escolhido no portal nas mensagens que o próprio usuário enviou pelas contas vinculadas. */
export function applyDisplayName(messages: ChatMessage[], own: OwnNames, displayName: string): ChatMessage[] {
  if (!displayName) return messages;
  return messages.map((message) => {
    const username = own[message.platform];
    if (!username || (!same(message.user.username, username) && !same(message.user.displayName, username))) return message;
    return message.user.displayName === displayName ? message : { ...message, user: { ...message.user, displayName } };
  });
}
