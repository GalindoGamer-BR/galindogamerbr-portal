import { z } from "zod";
export const platforms = ["twitch", "youtube", "kick", "tiktok"] as const;
export const writablePlatforms = ["twitch", "youtube", "kick"] as const;
export type Platform = (typeof platforms)[number];
export type WritablePlatform = (typeof writablePlatforms)[number];
export const labels: Record<Platform, string> = {
  twitch: "Twitch",
  youtube: "YouTube",
  kick: "Kick",
  tiktok: "TikTok",
};
export const messageSchema = z.object({
  id: z.string(),
  platform: z.enum(platforms),
  platformMessageId: z.string(),
  user: z.object({
    id: z.string().optional(),
    username: z.string(),
    displayName: z.string(),
    avatarUrl: z.string().optional(),
  }),
  message: z.string().max(10_000),
  timestamp: z.iso.datetime({ offset: true }),
  metadata: z
    .object({
      badges: z.array(z.string()).optional(),
      color: z.string().optional(),
      donation: z
        .object({ amount: z.number(), currency: z.string() })
        .optional(),
      gift: z
        .object({
          id: z.string(),
          name: z.string().optional(),
          quantity: z.number(),
        })
        .optional(),
    })
    .optional(),
});
export type ChatMessage = z.infer<typeof messageSchema>;
export const metricsSchema = z.object({
  platform: z.enum(platforms),
  viewers: z.number().optional(),
  followers: z.number().optional(),
  subscribers: z.number().optional(),
  messagesPerMinute: z.number(),
  activeChatUsers: z.number(),
  peakViewers: z.number().optional(),
  timestamp: z.string(),
});
export type PlatformMetrics = z.infer<typeof metricsSchema>;
export const statusSchema = z.object({
  platform: z.enum(platforms),
  status: z.enum([
    "connecting",
    "connected",
    "reconnecting",
    "offline",
    "error",
    "disabled",
  ]),
  error: z.string().optional(),
  timestamp: z.string(),
});
export type ProviderStatus = z.infer<typeof statusSchema>;
export type Accounts = Record<
  WritablePlatform,
  { connected: boolean; username?: string }
>;
export type SendResult = {
  platform: WritablePlatform;
  success: boolean;
  error?: string;
};
export function appendMessages(
  current: ChatMessage[],
  incoming: ChatMessage[],
  limit = 1000,
) {
  const seen = new Set(
    current.map(
      (message) => `${message.platform}:${message.platformMessageId}`,
    ),
  );
  const next = [...current];
  for (const message of incoming) {
    const key = `${message.platform}:${message.platformMessageId}`;
    if (!seen.has(key)) {
      seen.add(key);
      next.push(message);
    }
  }
  return next.slice(-limit);
}
