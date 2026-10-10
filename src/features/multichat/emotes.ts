import { z } from "zod";
import type { ChatMessage } from "./types";
export const emoteSchema = z.object({
  id: z.string(),
  code: z.string(),
  provider: z.enum(["twitch", "bttv"]),
  // "channel": emote do canal (sub, follower, bits, BTTV do canal); "global": globais. Ausente = desconhecido.
  source: z.enum(["channel", "global"]).optional(),
  url: z
    .string()
    .url()
    .refine((value) => {
      const u = new URL(value);
      return (
        u.protocol === "https:" &&
        ["static-cdn.jtvnw.net", "cdn.betterttv.net"].includes(u.hostname)
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
                provider: "twitch" as const,
                url: `https://static-cdn.jtvnw.net/emoticons/v2/${encodeURIComponent(f.emoteId)}/default/dark/2.0`,
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
