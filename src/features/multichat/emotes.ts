import { z } from "zod";
import type { ChatMessage } from "./types";
export const emoteSchema = z.object({
  id: z.string(),
  code: z.string(),
  provider: z.enum(["twitch", "bttv", "kick", "ffz"]),
  // "channel": emote do canal (sub, follower, bits, BTTV do canal); "global": globais. Ausente = desconhecido.
  source: z.enum(["channel", "global"]).optional(),
  subOnly: z.boolean().optional(),
  // Emotes do canal na Twitch: o que desbloqueia e o tier mínimo de sub.
  kind: z.enum(["sub", "follower", "bits"]).optional(),
  tier: z.number().int().min(1).max(3).optional(),
  url: z
    .string()
    .url()
    .refine((value) => {
      const u = new URL(value);
      return (
        u.protocol === "https:" &&
        ["static-cdn.jtvnw.net", "cdn.betterttv.net", "files.kick.com", "cdn.frankerfacez.com"].includes(u.hostname)
      );
    }),
});
export type Emote = z.infer<typeof emoteSchema>;
export type MessagePart = { text: string; emote?: Emote };
export function messageParts(
  message: ChatMessage,
  catalog: Map<string, Emote>,
): MessagePart[] {
  const fragments = message.metadata?.fragments;
  if (
    fragments?.length &&
    fragments.map((f) => f.text).join("") === message.message
  ) {
    return fragments.flatMap((f) =>
      f.emoteId
        ? [
            {
              text: f.text,
              emote: {
                id: f.emoteId,
                code: f.text,
                provider: f.emoteProvider === "kick" ? ("kick" as const) : ("twitch" as const),
                url: f.emoteProvider === "kick"
                  ? `https://files.kick.com/emotes/${encodeURIComponent(f.emoteId)}/fullsize`
                  : `https://static-cdn.jtvnw.net/emoticons/v2/${encodeURIComponent(f.emoteId)}/default/dark/2.0`,
              },
            },
          ]
        : tokenize(f.text, catalog),
    );
  }
  return tokenize(message.message, catalog);
}
function tokenize(text: string, catalog: Map<string, Emote>): MessagePart[] {
  return text
    .split(/(\s+)/u)
    .filter(Boolean)
    .map((text) => ({ text, emote: catalog.get(text) }));
}

// Chave estável de um emote (plataforma + id), usada nos recentes e para evitar repetição.
export const emoteKey = (e: Pick<Emote, "provider" | "id">) => `${e.provider}:${e.id}`;
