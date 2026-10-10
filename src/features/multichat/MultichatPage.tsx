import { TikTokChatConnection } from "./TikTokChatConnection";
import { HelpIcon, HomeIcon, SettingsIcon } from "../../components/ui/Icons";
import { MultichatUserMenu } from "./MultichatUserMenu";
import { useNavSession } from "../../components/layout/useNavSession";
import { chatFilterPlatforms, linkablePlatforms, tiktokLinking, youtubeLinking } from "./flags";
import { type TikTokConnectionState } from "./TikTokConnection";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { useLiveStatus } from "../../hooks/useLiveStatus";
import { command, configured, supabase } from "./services";
import {
  labels,
  writablePlatforms,
  type Accounts,
  type Platform,
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
import { EmotePicker, type PickerEmote } from "./EmotePicker";
import { PlatformIcon } from "./PlatformIcon";
import { MultichatDialog } from "./MultichatDialog";
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
const SEND_COOLDOWN_MS = 5000;
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
// "Dar um sub" (presente) é um modal da própria página do canal na Twitch, sem URL nem API pública: abre o canal.
const twitchChannelUrl = "https://www.twitch.tv/galindogamerbr";
// Extensões de painel do canal. O popout da Twitch não pode ser embutido (X-Frame-Options: SAMEORIGIN): abre em janela.
// As extensões só funcionam dentro do twitch.tv (dependem do Twitch.ext), por isso o portal só abre o painel.
const twitchPanels = [
  {
    label: "SoundAlerts",
    description: "Toque sons e alertas na live.",
    action: "Abrir soundboard",
    url: "https://www.twitch.tv/popout/galindogamerbr/extensions/bttsqjy6dnv05acplp5vy0mflgrh3z/panel",
  },
  {
    label: "Stream Stickers",
    description: "Cole stickers na tela da live.",
    action: "Abrir stickers",
    url: "https://www.twitch.tv/popout/galindogamerbr/extensions/5tbyqce941455yffg7fzg36tp6or8p/panel",
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
const helpSeen = () => { try { return localStorage.getItem(helpSeenKey) === "1"; } catch { return true; } };

export default function MultichatPage() {
  const { member: navMember, logout: navLogout } = useNavSession();
  const [session, setSession] = useState<Session | null>(null);
  const [tiktok, setTikTok] = useState<TikTokConnectionState>({connected:false,canSend:false});
  useEffect(()=>{
    let active=true;
    setTikTok({connected:false,canSend:false});
    if(!session||!tiktokLinking)return;
    const refresh=()=>{void command<TikTokConnectionState>("/api/tiktok/live").then(s=>{if(active)setTikTok(s);}).catch(()=>{});};
    refresh();
    window.addEventListener("focus",refresh);
    return()=>{active=false;window.removeEventListener("focus",refresh);};
  },[session?.user.id]);
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
    return [
      ...myEmotes.emotes.map((e) => ({ ...e, mine: true })),
      ...emotes.emotes.filter((e) => !(e.provider === "twitch" && mine.has(e.id))),
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
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [results, setResults] = useState<SendResult[]>([]);
  // Intervalo minimo entre envios: o botao e o Enter ficam bloqueados e a contagem aparece na tela.
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [clock, setClock] = useState(Date.now());
  useEffect(() => {
    if (cooldownUntil <= Date.now()) return;
    setClock(Date.now());
    const timer = setInterval(() => {
      const now = Date.now();
      setClock(now);
      if (now >= cooldownUntil) clearInterval(timer);
    }, 250);
    return () => clearInterval(timer);
  }, [cooldownUntil]);
  const cooldown = Math.max(0, Math.ceil((cooldownUntil - clock) / 1000));
  const [player, setPlayer] = useState<WritablePlatform>("twitch");
  const chat = useMultichat(session);
  const liveStatus = useLiveStatus();
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
  const tikTokLinked = tiktok.connected && tiktok.canSend;
  const connectedPlatforms: Platform[] = [...linkablePlatforms.filter((p)=>accounts[p].connected), ...(tikTokLinked ? ["tiktok" as const] : [])];
  // Plataformas desligadas pelo usuário para o envio (lista de exclusão: contas recém-conectadas já entram ligadas).
  const [sendOff, setSendOff] = useState<Platform[]>(() => {
    try { const stored = JSON.parse(localStorage.getItem("mc:send-off") ?? "[]"); return Array.isArray(stored) ? stored.filter((p): p is Platform => typeof p === "string") : []; }
    catch { return []; }
  });
  const sendPlatforms = connectedPlatforms.filter((p) => !sendOff.includes(p));
  // Emote da Twitch só funciona na Twitch: a mensagem com um deles vai apenas para ela (outras plataformas mostrariam
  // o código como texto). Ignora os "emoticons" com símbolos (:) B)), que apareceriam em mensagens comuns.
  const twitchEmoteCodes = useMemo(
    () => new Set(pickerEmotes.filter((e) => e.provider === "twitch" && /^[A-Za-z0-9_]{3,}$/.test(e.code)).map((e) => e.code)),
    [pickerEmotes],
  );
  const hasTwitchEmote = message.split(/\s+/).some((word) => twitchEmoteCodes.has(word));
  const targetPlatforms = hasTwitchEmote ? sendPlatforms.filter((p) => p === "twitch") : sendPlatforms;
  const toggleSendPlatform = (platform: Platform) => {
    setSendOff((current) => {
      const next = current.includes(platform) ? current.filter((p) => p !== platform) : [...current, platform];
      try { localStorage.setItem("mc:send-off", JSON.stringify(next)); } catch { /* sem armazenamento: vale só nesta sessão */ }
      return next;
    });
  };
  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSend) return;
    const sent = message;
    setSending(true);
    setResults([]);
    setNotice("");
    try {
      const data = await command<{ results: SendResult[] }>(
        "/api/chat/messages",
        {
          method: "POST",
          body: JSON.stringify({
            message,
            id: crypto.randomUUID(),
            platforms: targetPlatforms,
          }),
        },
      );
      setResults(data.results);
      if(data.results.some(r=>r.platform==="tiktok" && r.error==="reconnect_required")) setTikTok({connected:false,canSend:false});
      setNotice("");
      // So limpa se a pessoa nao digitou nada novo enquanto o envio corria.
      if (data.results.every((r) => r.success)) setMessage((current) => (current === sent ? "" : current));
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setSending(false);
      setCooldownUntil(Date.now() + SEND_COOLDOWN_MS);
      requestAnimationFrame(() => composer.current?.focus());
    }
  };
  const limit = tikTokLinked ? 150 : youtubeLinking && accounts.youtube.connected ? 200 : 500;
  const canSend =
    !!session &&
    message.trim().length > 0 &&
    Array.from(message.trim()).length <= limit &&
    targetPlatforms.length > 0 &&
    !sending &&
    cooldown === 0 &&
    !busy;
  const visible = chat.messages.filter(
    (m) => filter === "all" || m.platform === filter,
  );
  const playerUrl =
    player === "twitch"
      ? `https://player.twitch.tv/?channel=galindogamerbr&parent=${encodeURIComponent(window.location.hostname)}&autoplay=false`
      : player === "kick"
        ? "https://player.kick.com/galindogamerbr?autoplay=false"
        : liveStatus?.isLive && liveStatus.videoId
          ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(liveStatus.videoId)}?autoplay=0`
          : null;
  const insertEmote = (code: string) => {
    const input = composer.current;
    if (!session || !input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const prefix = message.slice(0, start);
    const suffix = message.slice(end);
    const insert = (prefix && !/\s$/.test(prefix) ? " " : "") + code + " ";
    setMessage(prefix + insert + suffix);
    setPicker(false);
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(start + insert.length, start + insert.length);
    });
  };
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
            {playerUrl ? (
              <iframe
                key={player}
                title={`Transmissão ${labels[player]}`}
                src={playerUrl}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="mc-player-empty">
                <strong>Nenhuma transmissão ativa no YouTube</strong>
                <a
                  href="https://www.youtube.com/@galindogamerbr/live"
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir canal
                </a>
              </div>
            )}
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
                {player === "youtube" && liveStatus?.isLive
                  ? liveStatus.title
                  : player === "twitch" && twitchChannel?.title
                    ? twitchChannel.title
                    : "A live é uma só. A comunidade está em todo lugar."}
              </p>
              {player === "twitch" && twitchChannel?.game && <span className="mc-channel-game">{twitchChannel.game}</span>}
              <span className="mc-muted">
                Português ·{" "}
                {chat.metrics[player]?.viewers?.toLocaleString("pt-BR") ?? "—"}{" "}
                assistindo
              </span>
            </div>
            <div className="mc-support">
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
                href={twitchChannelUrl}
                onClick={(event) => openSubsWindow(event, twitchChannelUrl)}
                target="_blank"
                rel="noreferrer"
                title="Abre o canal na Twitch, onde fica o botão Dar um sub"
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
          {twitchChannel?.description && (
            <section className="mc-about mc-twitch-about">
              <h2>Sobre {twitchChannel.name}</h2>
              <p>{twitchChannel.description}</p>
            </section>
          )}
          <section className="mc-about">
            <h2>Juntos em todas as plataformas.</h2>
            <p>Escolha onde assistir e acompanhe a conversa em um só lugar.</p>
            <div className="mc-channel-links">
              <a
                href="https://www.twitch.tv/galindogamerbr"
                target="_blank"
                rel="noreferrer"
              >
                Twitch
              </a>
              <a
                href="https://www.youtube.com/@galindogamerbr/join"
                target="_blank"
                rel="noreferrer"
              >
                Seja membro no YouTube
              </a>
              <a
                href="https://kick.com/galindogamerbr"
                target="_blank"
                rel="noreferrer"
              >
                Apoiar na Kick
              </a>
            </div>
          </section>
          <section className="mc-about mc-interact">
            <h2>Interaja na Twitch.</h2>
            <p>Extensões do canal que abrem numa janela da Twitch.</p>
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
                  <strong>{panel.label}</strong>
                  <span>{panel.description}</span>
                  <em>{panel.action}</em>
                </a>
              ))}
            </div>
          </section>
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
          <ChatVirtualList messages={visible} catalog={emotes.catalog} badges={badges} />
          {notice && (
            <div className="mc-notice" role="status">
              {notice}
            </div>
          )}
          <form className="mc-composer" onSubmit={send}>
            {picker && (
              <EmotePicker
                emotes={pickerEmotes}
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
            <div className="mc-input-wrap">
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
                onChange={(e) => setMessage(e.target.value)}
                disabled={!session}
                rows={2}
                onKeyDown={(e) => {
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
                {cooldown > 0 && ` · Aguarde ${cooldown}s para enviar outra mensagem`}
              </span>
              {session ? (
                <button className="mc-primary" disabled={!canSend}>
                  {sending ? "Enviando…" : cooldown > 0 ? `Aguarde ${cooldown}s` : "Enviar"}
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
                const blockedByEmote = hasTwitchEmote && p !== "twitch";
                return (
                  <button
                    key={p}
                    type="button"
                    className={"mc-send-target" + (on ? " mc-send-target-on" : "")}
                    aria-pressed={on}
                    title={blockedByEmote ? `Emote da Twitch: esta mensagem não vai para ${labels[p]}.` : on ? `Enviando para ${labels[p]}. Clique para desligar.` : `Não enviar para ${labels[p]}. Clique para ligar.`}
                    aria-label={`Enviar para ${labels[p]}`}
                    onClick={() => toggleSendPlatform(p)}
                  >
                    <PlatformIcon platform={p} />
                  </button>
                );
              })}
              {!connectedPlatforms.length && <span className="mc-muted">nenhuma (use Conexões, no topo)</span>}
            </div>
            {hasTwitchEmote && (
              <p className="mc-muted" role="status">
                {sendPlatforms.includes("twitch")
                  ? "Emote da Twitch: esta mensagem vai só para a Twitch."
                  : "Emote da Twitch só pode ser enviado à Twitch. Ligue a Twitch em Contas conectadas."}
              </p>
            )}
            <div className="mc-send-results" aria-live="polite">
              {results.map((r) => (
                <span
                  key={r.platform}
                  className={r.success ? "mc-success" : "mc-error"}
                >
                  <PlatformIcon platform={r.platform} />
                  {r.success
                    ? "Enviada"
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
                  disabled={!session || busy || sending}
                  onClick={() =>
                    accounts[p].connected ? void unlink(p) : void link(p)
                  }
                >
                  {accounts[p].connected ? "Desvincular" : "Conectar"}
                </button>
              </div>
            ))}
            {tiktokLinking && <TikTokChatConnection key={session?.user.id ?? "guest"} signedIn={!!session} state={tiktok} onChange={setTikTok} />}
            {tiktokLinking && <section aria-labelledby="tiktok-chat-flow">
              <h3 id="tiktok-chat-flow">Como conectar o chat TikTok</h3>
              <p>O vínculo usado para entrar no portal é separado da sessão de envio ao chat.</p>
              <ol className="mc-help-list">
                <li><strong>Conecte o chat uma vez</strong><p>Na primeira conexão, você escaneará um QR code com o aplicativo TikTok e confirmará o login no celular.</p></li>
                <li><strong>Continue sem repetir o login</strong><p>Reutilizaremos sua sessão enquanto ela estiver válida. Se ela expirar ou for revogada, será necessário conectar novamente.</p></li>
                <li><strong>Escreva no multichat</strong><p>Com o chat conectado, suas mensagens também serão enviadas ao TikTok, em seu nome, sem confirmação a cada envio. Para parar, desconecte o chat nas configurações.</p></li>
              </ol>
            </section>}
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
                  {tiktokLinking ? ". No TikTok, conecte a sessão do chat nas configurações; o fluxo de conexão está explicado nas configurações" : ""}.
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
                  Abra o sorriso ao lado da mensagem para buscar emotes Twitch e
                  BTTV, incluindo animados.
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
