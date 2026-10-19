import type { ChatMessage } from "./types";

const tierText = (tier?: string) =>
  tier === "Prime" ? " com o Prime" : tier === "1000" ? " no Nível 1" : tier === "2000" ? " no Nível 2" : tier === "3000" ? " no Nível 3" : "";
const plural = (n: number | undefined, one: string, many: string, unknown: string) => (n === undefined ? unknown : `${n} ${n === 1 ? one : many}`);

/** Texto em português de um aviso do canal (sub, resub, gift, raid, announcement); `null` se a mensagem não é um aviso. */
export function noticeText(message: ChatMessage): string | null {
  const event = message.metadata?.event;
  if (!event) return null;
  const name = message.user.displayName;
  switch (event.type) {
    case "sub":
      return `${name} se inscreveu${tierText(event.tier)}.`;
    case "resub":
      return `${name} renovou a inscrição${tierText(event.tier)}${event.months ? ` (${plural(event.months, "mês", "meses", "")})` : ""}.`;
    case "subgift":
      return `${name} presenteou ${event.recipient ?? "alguém"} com uma inscrição${tierText(event.tier)}.`;
    case "submysterygift":
      return `${name} presenteou a comunidade com ${plural(event.count, "inscrição", "inscrições", "várias inscrições")}${tierText(event.tier)}.`;
    case "raid":
      return `${name} chegou em raid com ${plural(event.viewers, "espectador", "espectadores", "vários espectadores")}.`;
    case "announcement":
      return `Anúncio de ${name}`;
  }
}
