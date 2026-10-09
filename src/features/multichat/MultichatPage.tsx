import { TikTokChatConnection } from "./TikTokChatConnection";
import { chatFilterPlatforms, linkablePlatforms, tiktokLinking, youtubeLinking } from "./flags";
import { type TikTokConnectionState } from "./TikTokConnection";
import { useEffect, useRef, useState, type FormEvent } from "react";
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
import { EmotePicker } from "./EmotePicker";
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
export default function MultichatPage() {
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
  const [help, setHelp] = useState(false);
  const [picker, setPicker] = useState(false);
  const composer = useRef<HTMLTextAreaElement>(null);
  const emoteButton = useRef<HTMLButtonElement>(null);
  const emotes = useEmotes();
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
        if (active) setSession(data.session);
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
  useEffect(() => {
    setAccounts(emptyAccounts);
    if (session)
      void refreshAccounts().catch((error) => setNotice(error.message));
  }, [session]);
  const login = () => { window.location.assign("/login"); };
  const link = async (platform: WritablePlatform) => {
    setBusy(true);
    setNotice("Inicializando serviço de envio…");
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
  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSend) return;
    const sent = message;
    setSending(true);
    setResults([]);
    setNotice("Inicializando serviço de envio…");
    try {
      const data = await command<{ results: SendResult[] }>(
        "/api/chat/messages",
        {
          method: "POST",
          body: JSON.stringify({
            message,
            id: crypto.randomUUID(),
            platforms: connectedPlatforms,
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
    connectedPlatforms.length > 0 &&
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
            onClick={() => setHelp(true)}
            aria-label="Como funciona o Multichat"
          >
            ?
          </button>
          <button onClick={() => setSettings(true)}>
            ⚙ <span>Conexões</span>
          </button>
          {session ? (
            <button
              onClick={() => window.location.assign("/conta")}
            >
              Minha conta
            </button>
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
                  Abrir canal ↗
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
                  : "A live é uma só. A comunidade está em todo lugar."}
              </p>
              <span className="mc-muted">
                Português ·{" "}
                {chat.metrics[player]?.viewers?.toLocaleString("pt-BR") ?? "—"}{" "}
                assistindo
              </span>
            </div>
            <div className="mc-support">
              <a
                className="mc-sub"
                href="https://www.twitch.tv/subs/galindogamerbr"
                target="_blank"
                rel="noreferrer"
              >
                ☆ Inscrever-se
              </a>
              <a
                href="https://www.twitch.tv/subs/galindogamerbr"
                target="_blank"
                rel="noreferrer"
              >
                ♧ Dar um sub ↗
              </a>
            </div>
          </section>
          <section className="mc-about">
            <h2>Juntos em todas as plataformas.</h2>
            <p>Escolha onde assistir e acompanhe a conversa em um só lugar.</p>
            <div className="mc-channel-links">
              <a
                href="https://www.twitch.tv/galindogamerbr"
                target="_blank"
                rel="noreferrer"
              >
                Twitch ↗
              </a>
              <a
                href="https://www.youtube.com/@galindogamerbr/join"
                target="_blank"
                rel="noreferrer"
              >
                Seja membro no YouTube ↗
              </a>
              <a
                href="https://kick.com/galindogamerbr"
                target="_blank"
                rel="noreferrer"
              >
                Apoiar na Kick ↗
              </a>
            </div>
          </section>
          <footer className="mc-footer">
            <a href="/">Voltar ao portal</a>
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
            <button
              onClick={() => setSettings(true)}
              aria-label="Configurações de conexões"
            >
              ⚙
            </button>
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
          <ChatVirtualList messages={visible} catalog={emotes.catalog} />
          {notice && (
            <div className="mc-notice" role="status">
              {notice}
            </div>
          )}
          <form className="mc-composer" onSubmit={send}>
            {picker && (
              <EmotePicker
                emotes={emotes.emotes}
                state={emotes.state}
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
              {connectedPlatforms.map((p) => (
                <PlatformIcon key={p} platform={p} />
              ))}
              <button type="button" onClick={() => setSettings(true)}>
                {connectedPlatforms.length ? "Gerenciar" : "Conectar"}
              </button>
            </div>
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
          onClose={() => setHelp(false)}
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
            <button className="mc-primary" onClick={() => setHelp(false)}>
              Entendi
            </button>
          </div>
        </MultichatDialog>
      )}
    </div>
  );
}
