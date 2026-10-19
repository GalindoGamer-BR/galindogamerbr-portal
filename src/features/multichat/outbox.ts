import type { ChatMessage, Platform } from "./types";
import type { QueueItem } from "./sendQueue";

export type OutboxItem = QueueItem & {
  status: "queued" | "sending" | "sent";
  createdAt: number;
  /** Plataformas em que o envio falhou ou foi pulado (o registro de envios do portal usa isso para a linha do portal). */
  failed: Platform[];
};

export type OwnNames = Partial<Record<Platform, string>>;

const same = (a: string | undefined, b: string | undefined) => !!a && !!b && a.toLowerCase() === b.toLowerCase();

/** Mostra o nome de exibição escolhido no portal nas mensagens que o próprio usuário enviou pelas contas vinculadas. */
export function applyDisplayName(messages: ChatMessage[], own: OwnNames, displayName: string): ChatMessage[] {
  if (!displayName) return messages;
  return messages.map((message) => {
    const username = own[message.platform];
    if (!username || (!same(message.user.username, username) && !same(message.user.displayName, username))) return message;
    return message.user.displayName === displayName ? message : { ...message, user: { ...message.user, displayName } };
  });
}
