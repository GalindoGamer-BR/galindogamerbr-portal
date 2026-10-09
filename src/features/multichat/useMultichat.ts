import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { z } from "zod";
import { supabase, realtimePublicKey, publicGet } from "./services";
import {
  appendMessages,
  messageSchema,
  parseHistory,
  metricsSchema,
  statusSchema,
  type ChatMessage,
  type Platform,
  type PlatformMetrics,
  type ProviderStatus,
} from "./types";
// Ao abrir o chat mostra so as ultimas mensagens (de todas as plataformas), em ordem de horario.
const HISTORY_LIMIT = 15;
export function useMultichat(session: Session | null) {
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
    const channel = client.channel("live:galindogamerbr", {
      config: { private: true },
    });
    channel
      .on("broadcast", { event: "chat_batch" }, ({ payload }) => {
        const parsed = z
          .object({ messages: z.array(messageSchema).max(100) })
          .safeParse(payload);
        if (parsed.success)
          buffer = [...buffer, ...parsed.data.messages.filter(m => Date.parse(m.timestamp) >= subscribedAt)].slice(-1000);
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
      void client.removeChannel(channel);
    };
  }, [session?.access_token]);
  return { messages, metrics, providers, connection, live, simulation };
}
