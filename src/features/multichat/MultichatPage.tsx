import { BellIcon, CrownIcon, HelpIcon, HomeIcon, SettingsIcon, WindowIcon } from "../../components/ui/Icons";
import { MultichatUserMenu } from "./MultichatUserMenu";
import { useNavSession } from "../../components/layout/useNavSession";
import { chatFilterPlatforms, linkablePlatforms, youtubeLinking } from "./flags";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { useLiveStatus } from "../../hooks/useLiveStatus";
import { command, configured, supabase } from "./services";
import { SendQueue } from "./sendQueue";
import { applyDisplayName, type OutboxItem, type OwnNames } from "./outbox";
import { hideEchoes, parseSentLog, portalMessages, pruneSentLog, showsIn, type SentEntry } from "./sentLog";
import { useMemberName } from "./useMemberName";
import {
  appendMessages,
  labels,
  writablePlatforms,
  type Accounts,
  type ChatMessage,
  type Platform,
  type ReplyTarget,
  type SendResult,
  type WritablePlatform,
} from "./types";
import { useMultichat } from "./useMultichat";
import { ChatVirtualList } from "./ChatVirtualList";
import { useEmotes } from "./useEmotes";
import { useBadges } from "./useBadges";
import { useMyEmotes } from "./useMyEmotes";
import { rememberReturnTo, startTwitchLogin } from "./loginFlows";
import { LoginModal } from "../../components/layout/LoginModal";
import { useTwitchChannel } from "./useTwitchChannel";
import { useYoutubeChannel } from "./useYoutubeChannel";
import { useYoutubeLastLive } from "./useYoutubeLastLive";
import { RichText } from "./RichText";
import { EmotePicker, type PickerEmote } from "./EmotePicker";
import { emoteKey } from "./emotes";
import { PlatformIcon } from "./PlatformIcon";
import { MultichatDialog } from "./MultichatDialog";
import { BadgeSettings } from "./BadgeSettings";
import { useHiddenBadges } from "./useHiddenBadges";
import { playerEmbedUrl, playerOffline } from "./player";
import { OnlineMembers } from "./OnlineMembers";
import { applyMention, mentionHandle, mentionQuery, suggestMentions } from "./mentions";
import "./multichat.css";
const emptyAccounts: Accounts = {
  twitch: { connected: false },
  youtube: { connected: false },
  kick: { connected: false },
};
const statusLabels = {
  connecting: "Conectando",
  connected: "Conectado",
  reconnecting: "Reconectando",
  offline: "Offline",
  error: "Indisponível",
  disabled: "Não configurado",
};
const errors: Record<string, string> = {
  delivery_unknown: "Envio sem confirmação. Confira no TikTok antes de repetir.",
  chat_not_ready: "O chat TikTok ainda não está pronto; confirme a sessão nas configurações.",
  tiktok_unavailable: "O TikTok não respondeu à consulta da live.",
  rate_limit: "Limite atingido; aguarde.",
  account_not_linked: "Conecte sua conta.",
  reconnect_required: "Reconecte sua conta.",
  message_too_long: "Mensagem acima do limite da plataforma.",
  no_active_live: "Nenhuma transmissão ativa.",
  youtube_send_budget: "Limite diário de envios ao YouTube atingido; tente amanhã.",
  stream_not_configured: "Canal ainda não configurado.",
  message_rejected: "Mensagem recusada pela plataforma.",
};
// Mensagens que podem estar na fila de envio ao mesmo tempo (evita encher a fila sem querer).
const MAX_OUTBOX = 5;
// Depois de enviada, a mensagem provisória fica até a real chegar da plataforma, no máximo este tempo.
const SENT_VISIBLE_MS = 10_000;
const StarIcon = ({ filled }: { filled?: boolean }) => (
  <svg className="mc-btn-icon" viewBox="0 0 20 20" aria-hidden="true" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
    <path d="M10 2.2l2.4 5 5.4.7-4 3.8 1 5.4L10 14.5l-4.8 2.6 1-5.4-4-3.8 5.4-.7z" />
  </svg>
);
const HeartIcon = ({ filled }: { filled?: boolean }) => (
  <svg className="mc-btn-icon" viewBox="0 0 20 20" aria-hidden="true" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
    <path d="M10 17.3S2.8 13 2.8 7.8C2.8 5.5 4.5 3.9 6.5 3.9c1.4 0 2.8.8 3.5 2.1.7-1.3 2.1-2.1 3.5-2.1 2 0 3.7 1.6 3.7 3.9 0 5.2-7.2 9.5-7.2 9.5z" />
  </svg>
);
const GiftIcon = () => (
  <svg className="mc-btn-icon" viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
    <rect x="2.5" y="7" width="15" height="3.5" rx="1" /><path d="M3.5 10.5V17h13v-6.5M10 7v10M10 7C8 7 6.5 6 6.5 4.7 6.5 3.6 7.3 3 8.2 3 9.2 3 10 4.3 10 7zm0 0c2 0 3.5-1 3.5-2.3C13.5 3.6 12.7 3 11.8 3 10.8 3 10 4.3 10 7z" />
  </svg>
);

// A página de inscrição da Twitch não pode ser embutida (X-Frame-Options: SAMEORIGIN), então abre numa janela
// centralizada sobre o portal; se o navegador bloquear, o link abre em nova aba normalmente.
const twitchSubsUrl = "https://www.twitch.tv/subs/galindogamerbr";
// Na Twitch, "Dar um sub" (presente) segue o mesmo caminho do "Inscrever-se": a página de inscrição (twitchSubsUrl).
const twitchChannelUrl = "https://www.twitch.tv/galindogamerbr";
// YouTube: o "sub_confirmation" abre direto o diálogo de inscrição; "join" é a página de membros do canal.
const youtubeSubscribeUrl = "https://www.youtube.com/@galindogamerbr?sub_confirmation=1";
const youtubeJoinUrl = "https://www.youtube.com/@galindogamerbr/join";
const kickChannelUrl = "https://kick.com/galindogamerbr";
// Extensões de painel do canal. O popout da Twitch não pode ser embutido (X-Frame-Options: SAMEORIGIN): abre em janela.
// As extensões só funcionam dentro do twitch.tv (dependem do Twitch.ext), por isso o portal só abre o painel.
const twitchPanels = [
  {
    label: "Stream Stickers",
    logo: "/assets/icons/streamstickers.webp",
    description: "Cole stickers na tela da live e apareça junto com a galera.",
    action: "Abrir stickers",
    url: "https://www.twitch.tv/popout/galindogamerbr/extensions/5tbyqce941455yffg7fzg36tp6or8p/panel",
  },
  {
    label: "SoundAlerts",
    logo: "/assets/icons/soundalerts.svg",
    description: "Toque sons e alertas na live, direto do soundboard do canal.",
    action: "Abrir soundboard",
    url: "https://www.twitch.tv/popout/galindogamerbr/extensions/bttsqjy6dnv05acplp5vy0mflgrh3z/panel",
  },
];
function openSubsWindow(event: MouseEvent<HTMLAnchorElement>, url = twitchSubsUrl, size = { width: 520, height: 760 }) {
  const { width, height } = size;
  const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2));
  const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2));
  const popup = window.open(url, "twitch-subs", `popup=yes,width=${width},height=${height},left=${left},top=${top}`);
  if (popup) { event.preventDefault(); popup.focus(); }
}

const helpSeenKey = "mc:help-seen";
const presenceHiddenKey = "mc:presence-hidden";
const sentLogKey = "mc:sent-log";
const helpSeen = () => { try { return localStorage.getItem(helpSeenKey) === "1"; } catch { return true; } };

export default function MultichatPage() {
  const { member: navMember, logout: navLogout } = useNavSession();
  const [session, setSession] = useState<Session | null>(null);
  const [accounts, setAccounts] = useState<Accounts>(emptyAccounts);
  const [filter, setFilter] = useState<Platform | "all">("all");
  const [theater, setTheater] = useState(false);
  const [settings, setSettings] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const closeLogin = useCallback(() => setLoginOpen(false), []);
  const [help, setHelp] = useState(false);
  const closeHelp = useCallback(() => {
    setHelp(false);
    try { localStorage.setItem(helpSeenKey, "1"); } catch { /* sem armazenamento: aparece de novo na próxima visita */ }
  }, []);
  const [picker, setPicker] = useState(false);
  const composer = useRef<HTMLTextAreaElement>(null);
  const emoteButton = useRef<HTMLButtonElement>(null);
  const emotes = useEmotes();
  const badges = useBadges();
  const twitchChannel = useTwitchChannel();
  const myEmotes = useMyEmotes(!!session);
  // Seus emotes (inscrições etc.) primeiro, marcados; o restante do catálogo sem repetir os ids.
  const pickerEmotes = useMemo<PickerEmote[]>(() => {
    const mine = new Set(myEmotes.emotes.map((e) => e.id));
    // O catálogo sabe quais são do canal; a lista do usuário não, então herda a origem pelo id.
    const sources = new Map(emotes.emotes.filter((e) => e.provider === "twitch").map((e) => [e.id, e.source]));
    const channelFirst = [...emotes.emotes].sort((a, b) => Number(b.source === "channel") - Number(a.source === "channel"));
    return [
      ...myEmotes.emotes.map((e) => ({ ...e, source: sources.get(e.id), mine: true })),
      ...channelFirst.filter((e) => !(e.provider === "twitch" && mine.has(e.id))),
    ];
  }, [myEmotes.emotes, emotes.emotes]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setTheater(false);
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, []);
  const [message, setMessage] = useState("");
  // Mensagem a que o próximo envio responde (reply nativo na Twitch e na Kick; nas outras plataformas vai como "@nome").
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  const startReply = useCallback((target: ChatMessage) => {
    setReplyTo({ platform: target.platform, platformMessageId: target.platformMessageId, displayName: target.user.displayName, text: target.message.slice(0, 200) });
    requestAnimationFrame(() => composer.current?.focus());
  }, []);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [results, setResults] = useState<SendResult[]>([]);
  // Fila de envio: a mensagem aparece no chat na hora e os envios saem um de cada vez, na ordem digitada. O campo
  // nunca fica bloqueado esperando a resposta do servidor.
  const [outbox, setOutbox] = useState<OutboxItem[]>([]);
  // Envios feitos pelo portal (uma linha por envio, sem as cópias que as plataformas devolvem); guardado por alguns minutos.
  const [sentLog, setSentLog] = useState<SentEntry[]>(() => {
    try { return parseSentLog(localStorage.getItem(sentLogKey), Date.now()); } catch { return []; }
  });
  useEffect(() => {
    try { localStorage.setItem(sentLogKey, JSON.stringify(sentLog)); } catch { /* sem armazenamento: vale só nesta sessão */ }
  }, [sentLog]);
  const [queue] = useState(
    () =>
      new SendQueue({
        send: async (item) => {
          const data = await command<{ results: SendResult[] }>("/api/chat/messages", {
            method: "POST",
            body: JSON.stringify({
              message: item.text,
              id: item.id,
              platforms: item.platforms,
              ...(item.kickText ? { overrides: { kick: item.kickText } } : {}),
              ...(item.replyTo ? { replyTo: { platform: item.replyTo.platform, platformMessageId: item.replyTo.platformMessageId, displayName: item.replyTo.displayName } } : {}),
            }),
          });
          return data.results;
        },
        onStart: (item) => {
          setResults([]);
          setNotice("");
          setOutbox((current) => current.map((o) => (o.id === item.id ? { ...o, status: "sending" } : o)));
        },
        onFinish: (item, outcome) => {
          if ("error" in outcome) {
            setOutbox((current) => current.filter((o) => o.id !== item.id));
            setSentLog((current) => current.filter((entry) => entry.id !== item.id));
            setNotice(outcome.error.message);
            setMessage((current) => (current === "" ? item.text : current));
            return;
          }
          const { results: sentResults } = outcome;
          setResults(sentResults);
          const failed = sentResults.filter((r) => !r.success).map((r) => r.platform);
          setOutbox((current) => current.map((o) => (o.id === item.id ? { ...o, status: "sent", failed } : o)));
          setSentLog((current) => current.map((entry) => (entry.id === item.id ? { ...entry, failed } : entry)));
          setTimeout(() => setOutbox((current) => current.filter((o) => o.id !== item.id)), SENT_VISIBLE_MS);
          // Nada foi entregue: devolve o texto ao campo (se ele estiver vazio) para a pessoa tentar de novo.
          if (failed.length >= item.platforms.length) setMessage((current) => (current === "" ? item.text : current));
        },
      }),
  );
  const [player, setPlayer] = useState<WritablePlatform>("twitch");
  const hiddenBadges = useHiddenBadges();
  // Quem está logado aparece na lista de online, a menos que escolha se esconder (fica salvo só neste navegador).
  const [presenceVisible, setPresenceVisible] = useState(() => {
    try { return localStorage.getItem(presenceHiddenKey) !== "1"; } catch { return true; }
  });
  const changePresenceVisible = (visible: boolean) => {
    setPresenceVisible(visible);
    try { localStorage.setItem(presenceHiddenKey, visible ? "0" : "1"); } catch { /* sem armazenamento: vale só nesta sessão */ }
  };
  const memberName = useMemberName(session);
  const chat = useMultichat(session, { name: memberName, visible: presenceVisible });
  const ownNames = useMemo<OwnNames>(
    () => ({ twitch: accounts.twitch.username, youtube: accounts.youtube.username, kick: accounts.kick.username }),
    [accounts.twitch.username, accounts.youtube.username, accounts.kick.username],
  );
  // Menções: nomes pelos quais o próprio usuário é citado (para o destaque) e sugestões de "@" entre os membros online.
  const mentionNames = useMemo(
    () => [memberName, ownNames.twitch, ownNames.youtube, ownNames.kick].filter((name): name is string => !!name),
    [memberName, ownNames],
  );
  const [caret, setCaret] = useState(0);
  const [mentionPick, setMentionPick] = useState(0);
  const [mentionClosedFor, setMentionClosedFor] = useState<string | null>(null);
  const mention = session ? mentionQuery(message, caret) : null;
  const mentionOptions = useMemo(() => {
    if (!mention) return [];
    const mine = mentionHandle(memberName).toLowerCase();
    return suggestMentions(chat.online.names.map(mentionHandle).filter((handle) => handle.toLowerCase() !== mine), mention.query);
  }, [mention?.query, chat.online.names, memberName]);
  const mentionOpen = !!mention && mentionOptions.length > 0 && mentionClosedFor !== message;
  const chooseMention = (handle: string) => {
    if (!mention) return;
    const next = applyMention(message, caret, mention, handle);
    setMessage(next.text);
    setCaret(next.caret);
    setMentionPick(0);
    requestAnimationFrame(() => {
      composer.current?.focus();
      composer.current?.setSelectionRange(next.caret, next.caret);
    });
  };
  // No site as mensagens do próprio usuário usam o nome de exibição escolhido no portal; as que ele acabou de enviar
  // aparecem na hora (provisórias) até a mensagem real chegar das plataformas.
  const pendingSends = useMemo(() => new Set(outbox.filter((o) => o.status !== "sent").map((o) => o.id)), [outbox]);
  const chatMessages = useMemo(() => {
    const real = hideEchoes(applyDisplayName(chat.messages, ownNames, memberName), sentLog, ownNames);
    const mine = portalMessages(sentLog, memberName, ownNames, pendingSends);
    return mine.length ? appendMessages(real, mine) : real;
  }, [chat.messages, sentLog, pendingSends, ownNames, memberName]);
  const liveStatus = useLiveStatus();
  const offline = playerOffline(player, liveStatus);
  // Sem live no YouTube, o player mostra o arquivo da última live encerrada.
  const youtubeLastLive = useYoutubeLastLive(player === "youtube" && !liveStatus?.isLive);
  const youtubeChannel = useYoutubeChannel(player === "youtube");
  const refreshAccounts = async () => {
    const data = await command<Accounts>("/api/accounts");
    setAccounts(data);
  };
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) throw error;
        if (!active) return;
        setSession(data.session);
        // Visitante deslogado que ainda não viu a explicação: abre o "Como funciona" uma vez.
        if (!data.session && !helpSeen()) setHelp(true);
      })
      .catch(() => {
        if (active) setNotice("Não foi possível recuperar a sessão.");
      });
    const { data } = supabase.auth.onAuthStateChange((_event, value) => {
      if (active) setSession(value);
    });
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    if (params.has("error") || hashParams.has("error"))
      setNotice("O login não foi concluído. Tente novamente.");
    if (params.has("oauth_error")) {
      const oauthErrors: Record<string, string> = {
        access_denied: "A autorização foi negada ou cancelada na plataforma.",
        redirect_uri_mismatch: "O endereço de retorno do servidor não confere com o cadastrado no provedor.",
        provider_api_disabled: "A API da plataforma não está habilitada no projeto do servidor.",
        provider_misconfigured: "As credenciais do servidor para esta plataforma estão incorretas.",
        invalid_grant: "A autorização expirou. Tente conectar novamente.",
        youtube_channel_required: "Esta conta Google não tem um canal do YouTube.",
        account_not_found: "Não foi possível identificar a conta na plataforma.",
      };
      setNotice(oauthErrors[params.get("oauth_error") || ""] || "Não foi possível vincular a conta. Tente novamente.");
    }
    if (params.has("linked"))
      setNotice(
        params.has("simulation")
          ? "Conta de teste vinculada."
          : "Conta vinculada com sucesso.",
      );
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);
  // Inscrição na Twitch (mesma informação que a Twitch mostra). Só consulta com a conta Twitch conectada ao chat.
  const [subscription, setSubscription] = useState<{ status: string; tier?: string; gift?: boolean; following?: boolean | null } | null>(null);
  const twitchConnected = accounts.twitch.connected;
  useEffect(() => {
    setSubscription(null);
    if (!session || !twitchConnected) return;
    let active = true;
    void command<{ status: string; tier?: string; gift?: boolean; following?: boolean | null }>("/api/accounts/twitch/subscription")
      .then(value => { if (active) setSubscription(value); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [session, twitchConnected]);
  useEffect(() => {
    setAccounts(emptyAccounts);
    if (session)
      void refreshAccounts().catch((error) => setNotice(error.message));
  }, [session]);
  const login = () => setLoginOpen(true);
  const link = async (platform: WritablePlatform) => {
    setBusy(true);
    setNotice("Abrindo a autorização…");
    try {
      const data = await command<{ url: string }>(`/oauth/${platform}/start`);
      window.location.assign(data.url);
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const unlink = async (platform: WritablePlatform) => {
    setBusy(true);
    try {
      await command(`/api/accounts/${platform}`, { method: "DELETE" });
      await refreshAccounts();
      setNotice("Conta desvinculada.");
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setBusy(false);
    }
  };
  // Sem envio ao TikTok por enquanto: so as contas vinculadas (Twitch, YouTube, Kick) recebem mensagens.
  const connectedPlatforms: Platform[] = linkablePlatforms.filter((p)=>accounts[p].connected);
  // Plataformas desligadas pelo usuário para o envio (lista de exclusão: contas recém-conectadas já entram ligadas).
  const [sendOff, setSendOff] = useState<Platform[]>(() => {
    try { const stored = JSON.parse(localStorage.getItem("mc:send-off") ?? "[]"); return Array.isArray(stored) ? stored.filter((p): p is Platform => typeof p === "string") : []; }
    catch { return []; }
  });
  const sendPlatforms = connectedPlatforms.filter((p) => !sendOff.includes(p));
  // Emote da Twitch, do BTTV, do FFZ e do 7TV só funciona na Twitch (BTTV, FFZ e 7TV são extensões do navegador para a Twitch; Kick e
  // YouTube mostrariam só o código): a mensagem com um deles vai apenas para a Twitch. Ignora os "emoticons" com símbolos
  // (:) B)), que apareceriam em mensagens comuns.
  const twitchEmoteCodes = useMemo(
    () => new Set(pickerEmotes.filter((e) => (e.provider === "twitch" || e.provider === "bttv" || e.provider === "ffz" || e.provider === "7tv") && /^[A-Za-z0-9_]{3,}$/.test(e.code)).map((e) => e.code)),
    [pickerEmotes],
  );
  const hasTwitchEmote = message.split(/\s+/).some((word) => twitchEmoteCodes.has(word));
  // Emotes da Kick só aparecem (e só valem) com a Kick conectada e o envio para ela ligado.
  const kickSendActive = sendPlatforms.includes("kick");
  const kickEmoteByCode = useMemo(
    () => new Map(emotes.emotes.filter((e) => e.provider === "kick" && /^[A-Za-z0-9_]{3,}$/.test(e.code) && !twitchEmoteCodes.has(e.code)).map((e) => [e.code, e])),
    [emotes.emotes, twitchEmoteCodes],
  );
  const hasKickEmote = kickSendActive && message.split(/\s+/).some((word) => kickEmoteByCode.has(word));
  // Emotes do canal que o usuário ainda não pode usar ficam visíveis, mas bloqueados, com o motivo. Com a lista real da
  // Twitch (escopo user:read:emotes) vale ela; sem ela, deduz pelo tier de sub e por seguir o canal.
  const mineIds = useMemo(() => new Set(myEmotes.emotes.map((e) => e.id)), [myEmotes.emotes]);
  const subscribedTier = subscription?.status === "subscribed" ? Math.max(1, Math.round(Number(subscription.tier ?? "1000") / 1000)) : 0;
  const shownEmotes = useMemo(() => {
    const lockReason = (e: PickerEmote): string | undefined => {
      if (e.mine || e.provider !== "twitch" || e.source !== "channel" || !e.kind) return undefined;
      const reason = e.kind === "sub" ? `Só para inscritos (Tier ${e.tier ?? 1})` : e.kind === "follower" ? "Só para seguidores do canal" : "Desbloqueado com bits no canal";
      if (myEmotes.status === "ok") return mineIds.has(e.id) ? undefined : reason;
      if (!session) return reason;
      if (e.kind === "sub") return subscribedTier >= (e.tier ?? 1) ? undefined : reason;
      if (e.kind === "follower") return subscription?.following ? undefined : reason;
      return reason;
    };
    const visible = kickSendActive ? pickerEmotes : pickerEmotes.filter((e) => e.provider !== "kick");
    const withLocks = visible.map((e) => ({ ...e, locked: lockReason(e) }));
    // Liberados primeiro; os bloqueados ao fim, na mesma ordem.
    return [...withLocks.filter((e) => !e.locked), ...withLocks.filter((e) => e.locked)];
  }, [kickSendActive, pickerEmotes, myEmotes.status, mineIds, session, subscribedTier, subscription?.following]);
  // Cada plataforma só renderiza os próprios emotes: com emote da Twitch a mensagem vai só para ela, com emote da Kick só
  // para a Kick; os dois na mesma mensagem não cabem em nenhuma plataforma.
  const targetPlatforms = hasTwitchEmote && hasKickEmote ? [] : hasTwitchEmote ? sendPlatforms.filter((p) => p === "twitch") : hasKickEmote ? sendPlatforms.filter((p) => p === "kick") : sendPlatforms;
  // Na Kick o emote é escrito como [emote:<id>:<nome>].
  const kickText = hasKickEmote
    ? message.split(/(\s+)/).map((word) => { const emote = kickEmoteByCode.get(word); return emote ? `[emote:${emote.id}:${word}]` : word; }).join("")
    : undefined;
  // Últimos emotes usados (chaves provider:id), guardados no navegador.
  const [recentEmotes, setRecentEmotes] = useState<string[]>(() => {
    try { const stored = JSON.parse(localStorage.getItem("mc:recent-emotes") ?? "[]"); return Array.isArray(stored) ? stored.filter((k): k is string => typeof k === "string").slice(0, 30) : []; }
    catch { return []; }
  });
  const rememberEmote = (emote: PickerEmote) => {
    setRecentEmotes((current) => {
      const next = [emoteKey(emote), ...current.filter((k) => k !== emoteKey(emote))].slice(0, 30);
      try { localStorage.setItem("mc:recent-emotes", JSON.stringify(next)); } catch { /* vale só nesta sessão */ }
      return next;
    });
  };
  const toggleSendPlatform = (platform: Platform) => {
    setSendOff((current) => {
      const next = current.includes(platform) ? current.filter((p) => p !== platform) : [...current, platform];
      try { localStorage.setItem("mc:send-off", JSON.stringify(next)); } catch { /* sem armazenamento: vale só nesta sessão */ }
      return next;
    });
  };
  const send = (event: FormEvent) => {
    event.preventDefault();
    if (!canSend) return;
    const item = { id: crypto.randomUUID(), text: message, platforms: targetPlatforms, ...(kickText ? { kickText } : {}), ...(replyTo ? { replyTo } : {}) };
    const now = Date.now();
    setOutbox((current) => [...current, { ...item, status: "queued", createdAt: now, failed: [] }]);
    setSentLog((current) => pruneSentLog([...current, {
      id: item.id, text: item.text, platforms: item.platforms, failed: [], createdAt: now,
      ...(kickText ? { kickText } : {}),
      ...(replyTo ? { replyTo: { platformMessageId: replyTo.platformMessageId, displayName: replyTo.displayName, text: replyTo.text } } : {}),
    }], now));
    setMessage("");
    setReplyTo(null);
    setNotice("");
    queue.enqueue(item);
    requestAnimationFrame(() => composer.current?.focus());
  };
  const limit = youtubeLinking && accounts.youtube.connected ? 200 : 500;
  const canSend =
    !!session &&
    message.trim().length > 0 &&
    Array.from(message.trim()).length <= limit &&
    targetPlatforms.length > 0 &&
    outbox.length < MAX_OUTBOX &&
    !busy;
  const visible = chatMessages.filter((m) => showsIn(m, filter));
  const youtubeVideoId = liveStatus?.isLive && liveStatus.videoId ? liveStatus.videoId : null;
  const playerUrl = playerEmbedUrl(player, window.location.hostname, youtubeVideoId);
  const insertEmote = (emote: PickerEmote) => {
    const code = emote.code;
    const input = composer.current;
    if (!session || !input) return;
    rememberEmote(emote);
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const prefix = message.slice(0, start);
    const suffix = message.slice(end);
    const insert = (prefix && !/\s$/.test(prefix) ? " " : "") + code + " ";
    setMessage(prefix + insert + suffix);
    // O seletor continua aberto (fecha ao clicar fora ou com Esc); o cursor avança sem tirar o foco do seletor.
    requestAnimationFrame(() => {
      input.setSelectionRange(start + insert.length, start + insert.length);
    });
  };
  useEffect(() => {
    if (!picker) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (document.getElementById("mc-emote-picker")?.contains(target) || emoteButton.current?.contains(target)) return;
      setPicker(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [picker]);
  return (
    <div className={`mc-page ${theater ? "mc-theater" : ""}`}>
      <header className="mc-topbar">
        <a className="mc-brand" href="/" aria-label="Voltar ao portal GalindoGamerBR">
          <img src="/assets/logos/galindogamerbr.webp" alt="" />
          <span>
            GALINDO<span className="mc-brand-gold">GAMERBR</span>
            <small>MULTICHAT</small>
          </span>
        </a>
        <nav className="mc-player-tabs" aria-label="Plataforma do player">
          {writablePlatforms.map((p) => (
            <button
              key={p}
              aria-pressed={player === p}
              onClick={() => setPlayer(p)}
            >
              <PlatformIcon platform={p} />
              {labels[p]}
            </button>
          ))}
        </nav>
        <div className="mc-top-actions">
          <button
            className="mc-icon-btn mc-icon-only"
            onClick={() => setHelp(true)}
            aria-label="Como funciona o Multichat"
            title="Como funciona o Multichat"
          >
            <HelpIcon />
          </button>
          <button className="mc-icon-btn" onClick={() => setSettings(true)} title="Contas conectadas ao chat">
            <SettingsIcon /> <span>Conexões</span>
          </button>
          {session ? (
            <MultichatUserMenu member={navMember} onLogout={() => void navLogout()} />
          ) : (
            <button
              className="mc-twitch-login"
              disabled={busy || !configured}
              onClick={() => login()}
            >
              Entrar
            </button>
          )}
        </div>
      </header>
      <div className="mc-workspace">
        <main className="mc-stage">
          <div className="mc-stage-toolbar">
            <span>
              <span className="mc-dot" />{" "}
              {chat.simulation
                ? "Ambiente de testes · chat simulado"
                : "GalindoGamerBR · Multichat"}
            </span>
            <button
              aria-pressed={theater}
              onClick={() => setTheater(!theater)}
              title="Modo teatro (Esc para sair)"
            >
              {theater ? "⊡ Sair do teatro" : "▣ Modo teatro"}
            </button>
          </div>
          <div className="mc-video">
            <iframe
              key={player}
              title={`Transmissão ${labels[player]}`}
              src={playerUrl}
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              // O YouTube recusa o player embutido sem a origem da página (erro de configuração do player).
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
          <section className="mc-channel-info">
            <img
              className="mc-channel-avatar"
              src="/assets/logos/galindogamerbr.webp"
              alt=""
            />
            <div className="mc-channel-copy">
              <h1>
                GalindoGamerBR{" "}
                <span className="mc-platform-label">{labels[player]}</span>
              </h1>
              <p>
                {player === "youtube"
                  ? liveStatus?.isLive
                    ? liveStatus.title
                    : youtubeLastLive
                      ? `Última live: ${youtubeLastLive.title}`
                      : "Nenhuma live no YouTube no momento."
                  : player === "twitch" && twitchChannel?.title
                    ? twitchChannel.title
                    : "A live é uma só. A comunidade está em todo lugar."}
              </p>
              {player === "twitch" && twitchChannel?.game && <span className="mc-channel-game">{twitchChannel.game}</span>}
              <span className="mc-muted">
                {offline || (player === "youtube" && !liveStatus?.isLive)
                  ? `Offline${player === "youtube" && youtubeLastLive?.endedAt ? ` · terminou em ${new Date(youtubeLastLive.endedAt).toLocaleDateString("pt-BR")}` : ""}`
                  : <>Português · {chat.metrics[player]?.viewers?.toLocaleString("pt-BR") ?? "—"} assistindo</>}
                {player === "youtube" && youtubeChannel?.subscribers != null && <> · {youtubeChannel.subscribers.toLocaleString("pt-BR")} inscritos</>}
              </span>
            </div>
            {player === "youtube" && (
              <div className="mc-support">
                <a className="mc-btn mc-btn-youtube" href={youtubeSubscribeUrl} target="_blank" rel="noreferrer" title="Inscrever-se no canal do YouTube">
                  <BellIcon /> Inscrever-se
                </a>
                <a className="mc-btn mc-btn-primary" href={youtubeJoinUrl} target="_blank" rel="noreferrer" title="Virar membro do canal no YouTube">
                  <CrownIcon /> Seja membro
                </a>
              </div>
            )}
            {player === "kick" && (
              <div className="mc-support">
                <a className="mc-btn mc-btn-secondary" href={kickChannelUrl} target="_blank" rel="noreferrer" title="Abre o canal na Kick, onde fica o botão Seguir">
                  <HeartIcon /> Seguir
                </a>
                <a className="mc-btn mc-btn-kick" href={kickChannelUrl} target="_blank" rel="noreferrer" title="Abre o canal na Kick, onde fica o botão Inscrever-se">
                  <StarIcon /> Inscrever-se
                </a>
              </div>
            )}
            <div className="mc-support" hidden={player !== "twitch"}>
              {subscription?.following ? (
                <span className="mc-btn mc-btn-icon-only mc-btn-secondary" title="Você segue este canal na Twitch" role="img" aria-label="Você segue este canal na Twitch">
                  <HeartIcon filled />
                </span>
              ) : (
                <a
                  className="mc-btn mc-btn-icon-only mc-btn-secondary"
                  href={twitchChannelUrl}
                  onClick={(event) => openSubsWindow(event, twitchChannelUrl)}
                  target="_blank"
                  rel="noreferrer"
                  title="Seguir na Twitch (abre o canal)"
                  aria-label="Seguir na Twitch"
                >
                  <HeartIcon />
                </a>
              )}
              {subscription?.status === "subscribed" ? (
                <a
                  className="mc-btn mc-btn-icon-only mc-btn-secondary"
                  href={twitchSubsUrl}
                  onClick={openSubsWindow}
                  target="_blank"
                  rel="noreferrer"
                  title={`Você é inscrito neste canal na Twitch (Tier ${Number(subscription.tier ?? "1000") / 1000}${subscription.gift ? ", presente" : ""}). Clique para atualizar.`}
                  aria-label="Você é inscrito. Atualizar sub."
                >
                  <StarIcon filled />
                </a>
              ) : (
                <a className="mc-btn mc-btn-primary" href={twitchSubsUrl} onClick={openSubsWindow} target="_blank" rel="noreferrer">
                  <StarIcon /> Inscrever-se
                </a>
              )}
              <a
                className={"mc-btn " + (subscription?.status === "subscribed" ? "mc-btn-primary" : "mc-btn-secondary")}
                href={twitchSubsUrl}
                onClick={openSubsWindow}
                target="_blank"
                rel="noreferrer"
                title="Abre a página de inscrição da Twitch para dar um sub"
              >
                <GiftIcon /> Dar um sub
              </a>
            </div>
          </section>
          {player === "twitch" && subscription?.status === "subscribed" && (
            <p className="mc-sub-notice">
              Você é sub: sem anúncios na Twitch. Se ainda aparecerem aqui, o navegador está bloqueando a sua sessão da Twitch no player.{" "}
              <a href={twitchChannelUrl} onClick={(event) => openSubsWindow(event, twitchChannelUrl)} target="_blank" rel="noreferrer">
                Assistir direto na Twitch
              </a>
            </p>
          )}
          {player === "twitch" && twitchChannel?.description && (
            <section className="mc-about mc-twitch-about">
              <h2>Sobre {twitchChannel.name}</h2>
              <p><RichText text={twitchChannel.description} /></p>
            </section>
          )}
          {player === "youtube" && youtubeChannel?.description && (
            <section className="mc-about mc-twitch-about">
              <h2>Sobre {youtubeChannel.name}</h2>
              <p><RichText text={youtubeChannel.description} /></p>
              {youtubeChannel.videos != null && <p className="mc-muted">{youtubeChannel.videos.toLocaleString("pt-BR")} vídeos no canal</p>}
            </section>
          )}
          {player === "twitch" && (
          <section className="mc-about mc-interact">
            <div className="mc-interact-head">
              <h2>Interaja na Twitch.</h2>
              <p>Extensões do canal que abrem numa janela da Twitch.</p>
            </div>
            <div className="mc-interact-grid">
              {twitchPanels.map((panel) => (
                <a
                  key={panel.url}
                  className="mc-interact-card"
                  href={panel.url}
                  onClick={(event) => openSubsWindow(event, panel.url, { width: 420, height: 720 })}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="mc-interact-icon" aria-hidden="true"><img src={panel.logo} alt="" /></span>
                  <strong>{panel.label} <span className="mc-interact-tag">Extensão</span></strong>
                  <span>{panel.description}</span>
                  <em><WindowIcon />{panel.action}</em>
                </a>
              ))}
            </div>
          </section>
          )}
          <footer className="mc-footer">
            <a href="/"><HomeIcon /> Voltar ao portal</a>
            <a href="/privacidade">Privacidade</a>
            <a href="/termos">Termos de uso</a>
          </footer>
        </main>
        <aside className="mc-chat" aria-label="Chat da comunidade">
          <div className="mc-chat-heading">
            <div>
              <h2>Chat da comunidade</h2>
              <span className="mc-muted">{chat.connection}</span>
            </div>
          </div>
          <nav className="mc-chat-tabs" aria-label="Filtrar mensagens">
            {(["all", ...chatFilterPlatforms] as const).map((p) => (
              <button
                key={p}
                aria-pressed={filter === p}
                onClick={() => setFilter(p)}
                title={p === "all" ? "Todas as plataformas" : labels[p]}
              >
                {p === "all" ? (
                  "Todos"
                ) : (
                  <>
                    <PlatformIcon platform={p} />
                    <span>{labels[p]}</span>
                  </>
                )}
              </button>
            ))}
          </nav>
          {filter !== "all" && (
            <div className="mc-provider-status">
              {labels[filter]} ·{" "}
              {chat.providers[filter]
                ? (chat.providers[filter]!.error === "tiktok_access_blocked" ? "TikTok recusou a conexão" : statusLabels[chat.providers[filter]!.status])
                : "Aguardando"}
            </div>
          )}
          {!configured && (
            <div className="mc-notice">O Multichat está sendo preparado.</div>
          )}
          <OnlineMembers online={chat.online} canToggle={!!session} visible={presenceVisible} onToggle={changePresenceVisible} />
          <ChatVirtualList messages={visible} catalog={emotes.catalog} badges={badges} hiddenBadges={hiddenBadges.hidden} onReply={session ? startReply : undefined} mentionNames={mentionNames} />
          {notice && (
            <div className="mc-notice" role="status">
              {notice}
            </div>
          )}
          <form className="mc-composer" onSubmit={send}>
            {picker && (
              <EmotePicker
                emotes={shownEmotes}
                recent={recentEmotes}
                owners={myEmotes.owners}
                state={emotes.state}
                notice={myEmotes.status === "needs_reauth" ? {
                  text: "Para usar seus emotes de inscrito, entre de novo com a Twitch e autorize o acesso aos emotes.",
                  action: "Liberar meus emotes",
                  onAction: () => { rememberReturnTo(); void startTwitchLogin().catch((error) => setNotice(error.message)); },
                } : undefined}
                onClose={() => {
                  setPicker(false);
                  emoteButton.current?.focus();
                }}
                onSelect={insertEmote}
              />
            )}
            {replyTo && (
              <div className="mc-reply-chip" role="status">
                <span>
                  Respondendo a <strong>{replyTo.displayName}</strong>
                  {replyTo.text ? `: ${replyTo.text}` : ""}
                </span>
                <button
                  type="button"
                  aria-label="Cancelar resposta"
                  onClick={() => {
                    setReplyTo(null);
                    composer.current?.focus();
                  }}
                >
                  ×
                </button>
              </div>
            )}
            <div className="mc-input-wrap">
              {mentionOpen && (
                <ul className="mc-mention-list" role="listbox" aria-label="Membros online">
                  {mentionOptions.map((handle, index) => (
                    <li key={handle} role="option" aria-selected={index === mentionPick}>
                      <button
                        type="button"
                        tabIndex={-1}
                        className={index === mentionPick ? "mc-mention-active" : undefined}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          chooseMention(handle);
                        }}
                      >
                        @{handle}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <textarea
                ref={composer}
                id="mc-message"
                aria-label="Sua mensagem"
                placeholder={
                  session
                    ? "Envie uma mensagem…"
                    : "Entre com a Twitch para conversar"
                }
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setCaret(e.target.selectionStart);
                  setMentionPick(0);
                }}
                onSelect={(e) => setCaret(e.currentTarget.selectionStart)}
                disabled={!session}
                rows={2}
                onKeyDown={(e) => {
                  if (mentionOpen && !e.nativeEvent.isComposing) {
                    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                      e.preventDefault();
                      setMentionPick((current) => (current + (e.key === "ArrowDown" ? 1 : mentionOptions.length - 1)) % mentionOptions.length);
                      return;
                    }
                    if (e.key === "Enter" || e.key === "Tab") {
                      e.preventDefault();
                      chooseMention(mentionOptions[Math.min(mentionPick, mentionOptions.length - 1)]);
                      return;
                    }
                    if (e.key === "Escape") {
                      e.preventDefault();
                      setMentionClosedFor(message);
                      return;
                    }
                  }
                  if (e.key === "Escape" && replyTo) {
                    e.preventDefault();
                    setReplyTo(null);
                    return;
                  }
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    !e.nativeEvent.isComposing
                  ) {
                    e.preventDefault();
                    if (canSend) e.currentTarget.form?.requestSubmit();
                  }
                }}
              />
              <button
                ref={emoteButton}
                type="button"
                className="mc-emote-trigger"
                aria-label="Abrir emotes"
                aria-expanded={picker}
                aria-controls="mc-emote-picker"
                onClick={() => setPicker(!picker)}
              >
                ☺
              </button>
            </div>
            <div className="mc-composer-bottom">
              <span className="mc-muted">
                {Array.from(message).length}/{limit}
                {outbox.some((o) => o.status !== "sent") && ` · Enviando${outbox.filter((o) => o.status === "queued").length ? ` (${outbox.filter((o) => o.status === "queued").length} na fila)` : ""}…`}
                {outbox.length >= MAX_OUTBOX && " · Aguarde o envio das mensagens anteriores"}
              </span>
              {session ? (
                <button className="mc-primary" disabled={!canSend}>
                  Enviar
                </button>
              ) : (
                <button
                  type="button"
                  className="mc-twitch-login"
                  disabled={busy || !configured}
                  onClick={() => login()}
                >
                  Entrar
                </button>
              )}
            </div>
            <div className="mc-connected">
              <span>Contas conectadas</span>
              {connectedPlatforms.map((p) => {
                const on = targetPlatforms.includes(p);
                const blockedByEmote = (hasTwitchEmote || hasKickEmote) && sendPlatforms.includes(p) && !on;
                return (
                  <button
                    key={p}
                    type="button"
                    className={"mc-send-target" + (on ? " mc-send-target-on" : "")}
                    aria-pressed={on}
                    title={blockedByEmote ? `Por causa dos emotes, esta mensagem não vai para ${labels[p]}.` : on ? `Enviando para ${labels[p]}. Clique para desligar.` : `Não enviar para ${labels[p]}. Clique para ligar.`}
                    aria-label={`Enviar para ${labels[p]}`}
                    onClick={() => toggleSendPlatform(p)}
                  >
                    <PlatformIcon platform={p} />
                  </button>
                );
              })}
              {!connectedPlatforms.length && <span className="mc-muted">nenhuma (use Conexões, no topo)</span>}
            </div>
            {(hasTwitchEmote || hasKickEmote) && (
              <p className="mc-muted" role="status">
                {hasTwitchEmote && hasKickEmote
                  ? "Emotes da Twitch e da Kick não cabem na mesma mensagem. Envie separadamente."
                  : hasTwitchEmote
                    ? sendPlatforms.includes("twitch")
                      ? "Emote da Twitch, BTTV, FFZ ou 7TV: esta mensagem vai só para a Twitch."
                      : "Emotes da Twitch, BTTV, FFZ e 7TV só podem ser enviados à Twitch. Ligue a Twitch em Contas conectadas."
                    : "Emote da Kick: esta mensagem vai só para a Kick."}
              </p>
            )}
            <div className="mc-send-results" aria-live="polite">
              {results.map((r) => (
                <span
                  key={r.platform}
                  className={r.success ? "mc-success" : r.skipped ? "mc-skipped" : "mc-error"}
                >
                  <PlatformIcon platform={r.platform} />
                  {r.success
                    ? "Enviada"
                    : r.skipped
                      ? r.error === "no_active_live" ? "Não enviada: sem transmissão ao vivo" : "Não enviada"
                      : errors[r.error || ""] || "Falha no envio"}
                </span>
              ))}
            </div>
          </form>
        </aside>
      </div>
      {loginOpen && <LoginModal onClose={closeLogin} />}
      {settings && (
        <MultichatDialog
          title="Suas conexões"
          onClose={() => setSettings(false)}
        >
          <div className="mc-dialog-body">
            <p>
              Uma mensagem para todas as contas conectadas para envio. Para parar de enviar
              a uma plataforma, desvincule sua conta.
            </p>
            {notice && <p role="alert" className="mc-notice">{notice}</p>}
            {linkablePlatforms.map((p) => (
              <div className="mc-account-row" key={p}>
                <PlatformIcon platform={p} />
                <div>
                  <strong>{labels[p]}</strong>
                  <small>
                    {accounts[p].connected
                      ? accounts[p].username || "Conectada"
                      : "Não conectada"}
                  </small>
                </div>
                <button
                  disabled={!session || busy}
                  onClick={() =>
                    accounts[p].connected ? void unlink(p) : void link(p)
                  }
                >
                  {accounts[p].connected ? "Desvincular" : "Conectar"}
                </button>
              </div>
            ))}
            <BadgeSettings platforms={connectedPlatforms} hidden={hiddenBadges.hidden} onToggle={hiddenBadges.toggle} />
            {!session && (
              <button
                className="mc-twitch-login"
                disabled={busy || !configured}
                onClick={() => login()}
              >
                Entrar
              </button>
            )}
          </div>
        </MultichatDialog>
      )}
      {help && (
        <MultichatDialog
          title="Uma mensagem. Várias plataformas."
          onClose={closeHelp}
        >
          <div className="mc-dialog-body">
            <ol className="mc-help-list">
              <li>
                <strong>Conecte suas contas</strong>
                <p>
                  Entre no portal e abra Conexões para vincular{" "}
                  {linkablePlatforms.map((p) => labels[p]).join(", ").replace(/, ([^,]*)$/, " e $1")}
                  .
                </p>
              </li>
              <li>
                <strong>Entre na conversa</strong>
                <p>
                  Seu envio vai para todas as contas conectadas. As abas filtram
                  somente o que você lê.
                </p>
              </li>
              <li>
                <strong>Use seus emotes</strong>
                <p>
                  Abra o sorriso ao lado da mensagem para buscar emotes Twitch,
                  BTTV e 7TV, incluindo animados.
                </p>
              </li>
              <li>
                <strong>Assista do seu jeito</strong>
                <p>
                  Escolha a plataforma no topo e ative o modo teatro para
                  ampliar o player. Escape sai do teatro.
                </p>
              </li>
            </ol>
            <button className="mc-primary" onClick={closeHelp}>
              Entendi
            </button>
          </div>
        </MultichatDialog>
      )}
    </div>
  );
}
