import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel, Session } from "@supabase/supabase-js";
import { z } from "zod";
import { supabase, realtimePublicKey, publicGet } from "./services";
import { emptyOnline, onlineMembers, type OnlineMembers } from "./presence";
import {
  appendMessages,
  applyModeration,
  messageSchema,
  moderationSchema,
  parseHistory,
  metricsSchema,
  statusSchema,
  type ModerationEvent,
  type ChatMessage,
  type Platform,
  type PlatformMetrics,
  type ProviderStatus,
} from "./types";
// Ao abrir o chat mostra so as ultimas mensagens (de todas as plataformas), em ordem de horario.
const HISTORY_LIMIT = 15;
/** `presence`: o membro aparece na lista de online quando há `name` e `visible` (o visitante só observa). */
export function useMultichat(session: Session | null, presence?: { name: string; visible: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [metrics, setMetrics] = useState<
    Partial<Record<Platform, PlatformMetrics>>
  >({});
  const [providers, setProviders] = useState<
    Partial<Record<Platform, ProviderStatus>>
  >({});
  const [connection, setConnection] = useState("Conectando aos chats…");
  const [live, setLive] = useState<boolean | null>(null);
  const [simulation, setSimulation] = useState(false);
  const [online, setOnline] = useState<OnlineMembers>(emptyOnline);
  const [subscribed, setSubscribed] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  useEffect(() => {
    if (!supabase) {
      setMessages([]);
      setMetrics({});
      setProviders({});
      setLive(null);
      setSimulation(false);
      setConnection("Multichat ainda não configurado");
      return;
    }
    const client = supabase;
    let disposed = false;
    let subscribedAt = Date.now();
    let buffer: ChatMessage[] = [];
    // Eventos de moderação recentes: o evento pode chegar antes do lote que traz a mensagem atingida (o reader agrupa
    // mensagens a cada 50 ms), então ele também vale para o que chegar nos próximos minutos.
    let moderation: { event: ModerationEvent; seenAt: number }[] = [];
    let lastSnapshot = Date.now();
    setConnection("Conectando aos chats…");
    // Historico recente (o que o reader guardou): mostra o chat ja com conteudo ao abrir; o merge ordena por
    // horario e deduplica pelas mensagens ao vivo que chegarem.
    void publicGet<{ messages?: unknown }>(`/api/chat/recent?limit=${HISTORY_LIMIT}`)
      .then((body) => {
        if (disposed) return;
        const history = parseHistory(body.messages, HISTORY_LIMIT);
        if (history.length) setMessages((previous) => appendMessages(previous, history));
      })
      .catch(() => {});
    // Cada aba usa uma chave própria de presença: o id do usuário nunca vai para os outros navegadores.
    const channel = client.channel("live:galindogamerbr", {
      config: { private: true, presence: { key: crypto.randomUUID() } },
    });
    channelRef.current = channel;
    channel
      .on("presence", { event: "sync" }, () => {
        if (!disposed) setOnline(onlineMembers(channel.presenceState()));
      })
      .on("broadcast", { event: "chat_batch" }, ({ payload }) => {
        const parsed = z
          .object({ messages: z.array(messageSchema).max(100) })
          .safeParse(payload);
        if (parsed.success) {
          let incoming = parsed.data.messages.filter(m => Date.parse(m.timestamp) >= subscribedAt);
          for (const { event } of moderation) incoming = applyModeration(incoming, event);
          buffer = [...buffer, ...incoming].slice(-1000);
        }
      })
      .on("broadcast", { event: "live_event" }, ({ payload }) => {
        const parsed = moderationSchema.safeParse(payload);
        if (!parsed.success) return;
        const now = Date.now();
        moderation = [...moderation.filter((m) => now - m.seenAt < 120_000), { event: parsed.data, seenAt: now }].slice(-50);
        buffer = applyModeration(buffer, parsed.data);
        setMessages((previous) => applyModeration(previous, parsed.data));
      })
      .on("broadcast", { event: "metrics" }, ({ payload }) => {
        const parsed = z
          .object({ metrics: z.array(metricsSchema).max(4) })
          .safeParse(payload);
        if (parsed.success)
          setMetrics(
            Object.fromEntries(
              parsed.data.metrics.map((value) => [value.platform, value]),
            ),
          );
      })
      .on("broadcast", { event: "provider_status" }, ({ payload }) => {
        const parsed = statusSchema.safeParse(payload);
        if (parsed.success) {
          lastSnapshot = Date.now();
          setConnection("Conectado ao multichat");
          setProviders((previous) => ({
            ...previous,
            [parsed.data.platform]: parsed.data,
          }));
        }
      })
      .on("broadcast", { event: "live_status" }, ({ payload }) => {
        const parsed = z
          .object({ active: z.boolean(), simulation: z.boolean().optional() })
          .safeParse(payload);
        if (parsed.success) {
          lastSnapshot = Date.now();
          setLive(parsed.data.active);
          setSimulation(!!parsed.data.simulation);
        }
      });
    void client.realtime
      .setAuth(session?.access_token ?? realtimePublicKey)
      .then(() => {
        if (disposed) return;
        channel.subscribe((status) => {
          if (status === "SUBSCRIBED") subscribedAt = Date.now();
          if (!disposed) setSubscribed(status === "SUBSCRIBED");
          if (!disposed)
            setConnection(
              status === "SUBSCRIBED"
                ? "Conectado ao multichat"
                : "Reconectando aos chats…",
            );
        });
      })
      .catch(() => {
        if (!disposed) setConnection("Falha ao conectar ao chat. Tente recarregar.");
      });
    const flush = setInterval(() => {
      if (buffer.length) {
        const batch = buffer;
        buffer = [];
        setMessages((previous) => appendMessages(previous, batch));
      }
    }, 40);
    const stale = setInterval(() => {
      if (Date.now() - lastSnapshot > 35_000) {
        setProviders({});
        setMetrics({});
        setLive(null);
        setConnection("Aguardando o serviço de leitura…");
      }
    }, 5000);
    return () => {
      disposed = true;
      clearInterval(flush);
      clearInterval(stale);
      channelRef.current = null;
      setSubscribed(false);
      setOnline(emptyOnline);
      void client.removeChannel(channel);
    };
  }, [session?.access_token]);
  // Entrar e sair da lista de online sem reconectar o canal. Falha ao rastrear (ex.: sem a política de INSERT do
  // Presence no Realtime) não afeta o chat: a pessoa só não aparece na lista.
  const trackName = presence?.name;
  const trackVisible = !!presence?.visible;
  const loggedIn = !!session;
  useEffect(() => {
    const channel = channelRef.current;
    if (!channel || !subscribed) return;
    if (loggedIn && trackName && trackVisible) void channel.track({ name: trackName }).catch(() => undefined);
    else void channel.untrack().catch(() => undefined);
  }, [subscribed, loggedIn, trackName, trackVisible]);
  return { messages, metrics, providers, connection, live, simulation, online };
}
