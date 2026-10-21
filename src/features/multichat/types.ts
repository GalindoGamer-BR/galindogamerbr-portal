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
      fragments: z
        .array(z.object({ text: z.string(), emoteId: z.string().optional(), emoteProvider: z.enum(["twitch", "kick"]).optional() }))
        .max(1000)
        .optional(),
      badges: z.array(z.string()).optional(),
      color: z.string().optional(),
      // Mensagem provisória do próprio usuário, ainda não confirmada pela plataforma (só existe no navegador).
      pending: z.boolean().optional(),
      // Mensagem do chat da live vertical (Shorts) do YouTube, quando há duas lives ao mesmo tempo.
      short: z.boolean().optional(),
      // Enviada pelo portal: uma linha só, com as plataformas de destino (as cópias de volta ficam escondidas; só existe no navegador).
      portal: z.object({ platforms: z.array(z.enum(platforms)) }).optional(),
      // Apagada ou punida pela moderação (marcada no navegador a partir do evento `live_event`).
      removed: z.enum(["delete", "ban", "timeout", "clear"]).optional(),
      // Resposta a outra mensagem da mesma plataforma (hoje só a Twitch): id do pai, nome e trecho para exibir.
      replyTo: z
        .object({
          platformMessageId: z.string().min(1),
          displayName: z.string().max(100).optional(),
          text: z.string().max(500).optional(),
        })
        .optional(),
      // Cheer da Twitch: bits da mensagem.
      bits: z.number().int().positive().optional(),
      // Aviso do canal (sub, resub, gift, raid, announcement); `message` é o texto do usuário e pode ser vazio.
      event: z
        .object({
          type: z.enum(["sub", "resub", "subgift", "submysterygift", "raid", "announcement"]),
          tier: z.string().max(10).optional(),
          months: z.number().int().nonnegative().optional(),
          count: z.number().int().nonnegative().optional(),
          recipient: z.string().max(100).optional(),
          viewers: z.number().int().nonnegative().optional(),
          systemMessage: z.string().max(500).optional(),
        })
        .optional(),
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
/** Mensagem a que o usuário está respondendo (vai ao `command` como `replyTo`). */
export type ReplyTarget = { platform: Platform; platformMessageId: string; displayName: string; text?: string };
// Evento de moderação publicado pelo reader em `live_event` (hoje só a Twitch: CLEARMSG e CLEARCHAT).
export const moderationSchema = z.object({
  type: z.literal("moderation"),
  platform: z.enum(platforms),
  action: z.enum(["delete", "ban", "timeout", "clear"]),
  targetMessageId: z.string().optional(),
  targetUserId: z.string().optional(),
  login: z.string().optional(),
  duration: z.number().int().nonnegative().optional(),
  timestamp: z.string(),
});
export type ModerationEvent = z.infer<typeof moderationSchema>;
/**
 * Marca como removidas as mensagens atingidas pelo evento. `delete` casa pelo id da mensagem; ban, timeout e clear atingem só
 * mensagens enviadas até o horário do evento (as seguintes são legítimas), nunca avisos do canal nem as provisórias.
 * Devolve a mesma lista se nada mudou.
 */
export function applyModeration(messages: ChatMessage[], event: ModerationEvent): ChatMessage[] {
  const at = Date.parse(event.timestamp);
  const hit = (m: ChatMessage) => {
    if (m.platform !== event.platform || m.metadata?.removed || m.metadata?.pending) return false;
    if (event.action === "delete") return !!event.targetMessageId && m.platformMessageId === event.targetMessageId;
    if (m.metadata?.event || (Number.isFinite(at) && Date.parse(m.timestamp) > at)) return false;
    return event.action === "clear" || (!!event.targetUserId && m.user.id === event.targetUserId);
  };
  let changed = false;
  const next = messages.map((m) => {
    if (!hit(m)) return m;
    changed = true;
    return { ...m, metadata: { ...m.metadata, removed: event.action } };
  });
  return changed ? next : messages;
}
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
  { connected: boolean; username?: string; locked?: boolean }
>;
export type SendResult = {
  platform: Platform;
  success: boolean;
  error?: string;
  /** Sem destino (ex.: plataforma sem live, TikTok sem envio): nao e falha da mensagem nem das outras plataformas. */
  skipped?: boolean;
};
/**
 * Valida o historico vindo da API (ignora o que nao tem o formato esperado) e devolve as `limit` mais recentes
 * em ordem cronologica pelo horario da plataforma.
 */
export function parseHistory(payload: unknown, limit = 200): ChatMessage[] {
  if (!Array.isArray(payload)) return [];
  const messages: ChatMessage[] = [];
  for (const value of payload) {
    const parsed = messageSchema.safeParse(value);
    if (parsed.success) messages.push(parsed.data);
  }
  messages.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  return messages.slice(-limit);
}
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
  let added = false;
  for (const message of incoming) {
    const key = `${message.platform}:${message.platformMessageId}`;
    if (!seen.has(key)) {
      seen.add(key);
      next.push(message);
      added = true;
    }
  }
  // Ordem cronologica pelo horario da plataforma; o sort e estavel, entao empates mantem a ordem de chegada.
  if (added) next.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  return next.slice(-limit);
}
