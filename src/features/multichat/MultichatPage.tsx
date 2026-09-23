import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { useLiveStatus } from "../../hooks/useLiveStatus";
import { command, configured, supabase } from "./services";
import {
  labels,
  platforms,
  writablePlatforms,
  type Accounts,
  type Platform,
  type SendResult,
  type WritablePlatform,
} from "./types";
import { useMultichat } from "./useMultichat";
import { ChatVirtualList } from "./ChatVirtualList";
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
  rate_limit: "Limite atingido; aguarde.",
  account_not_linked: "Conecte sua conta.",
  reconnect_required: "Reconecte sua conta.",
  message_too_long: "Mensagem acima do limite da plataforma.",
  no_active_live: "Nenhuma transmissão ativa.",
  stream_not_configured: "Canal ainda não configurado.",
  message_rejected: "Mensagem recusada pela plataforma.",
};
export default function MultichatPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accounts, setAccounts] = useState<Accounts>(emptyAccounts);
  const [filters, setFilters] = useState<Record<Platform, boolean>>({
    twitch: true,
    youtube: true,
    kick: true,
    tiktok: true,
  });
  const [targets, setTargets] = useState<Record<WritablePlatform, boolean>>({
    twitch: true,
    youtube: false,
    kick: false,
  });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [results, setResults] = useState<SendResult[]>([]);
  const [player, setPlayer] = useState<WritablePlatform | null>(null);
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
      .then(({ data }) => {
        if (active) setSession(data.session);
      })
      .catch(() => {
        if (active) setNotice("Não foi possível recuperar a sessão.");
      });
    const { data } = supabase.auth.onAuthStateChange((_event, value) => {
      if (active) setSession(value);
    });
    const params = new URLSearchParams(window.location.search);
    if (params.has("oauth_error"))
      setNotice("Não foi possível vincular a conta. Tente novamente.");
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
  const auth = async (event: FormEvent, signup = false) => {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setNotice("");
    try {
      const { error } = signup
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (signup)
        setNotice(
          "Cadastro enviado. Confira seu e-mail se a confirmação estiver habilitada.",
        );
      setPassword("");
    } catch {
      setNotice(
        "Não foi possível entrar ou cadastrar. Confira os dados e tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  };
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
  const send = async (event: FormEvent) => {
    event.preventDefault();
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
            platforms: writablePlatforms.filter(
              (p) => targets[p] && accounts[p].connected,
            ),
          }),
        },
      );
      setResults(data.results);
      setNotice("");
      if (data.results.every((r) => r.success)) setMessage("");
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setSending(false);
    }
  };
  const limit = targets.youtube && accounts.youtube.connected ? 200 : 500;
  const canSend =
    !!session &&
    message.trim().length > 0 &&
    Array.from(message.trim()).length <= limit &&
    writablePlatforms.some((p) => targets[p] && accounts[p].connected) &&
    !sending;
  const visible = chat.messages.filter((m) => filters[m.platform]);
  const playerUrl =
    player === "twitch"
      ? `https://player.twitch.tv/?channel=galindogamerbr&parent=${encodeURIComponent(window.location.hostname)}&autoplay=false`
      : player === "kick"
        ? "https://player.kick.com/galindogamerbr?autoplay=false"
        : liveStatus?.isLive && liveStatus.videoId
          ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(liveStatus.videoId)}?autoplay=0`
          : null;
  return (
    <div className="mc-page">
      <div className="mc-heading">
        <div>
          <span className="mc-eyebrow">GALINDOGAMERBR / AO VIVO</span>
          <h1>
            Uma live. <em>Todas as conversas.</em>
          </h1>
          <p>Escolha onde assistir. Participe com toda a comunidade.</p>
        </div>
        <span className="mc-connection" role="status">
          <i />
          {chat.connection}
        </span>
      </div>
      {!configured && (
        <div className="mc-notice">
          O multichat está sendo preparado. A conexão estará disponível em
          breve.
        </div>
      )}
      {chat.simulation && (
        <div className="mc-notice">
          Ambiente de testes · mensagens e contas simuladas
        </div>
      )}
      <div className="mc-grid">
        <section className="mc-main">
          <div className="mc-player">
            <div className="mc-section-head">
              <h2>Assista do seu jeito</h2>
              <div className="mc-tabs">
                {writablePlatforms.map((p) => (
                  <button
                    key={p}
                    className={player === p ? "active" : ""}
                    aria-pressed={player === p}
                    onClick={() => setPlayer(p)}
                  >
                    {labels[p]}
                  </button>
                ))}
                {player && (
                  <button
                    onClick={() => setPlayer(null)}
                    aria-label="Fechar player"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            <div className="mc-video">
              {!player ? (
                <div className="mc-player-empty">
                  <span>▷</span>
                  <strong>Sua transmissão, sua escolha</strong>
                  <p>Selecione uma plataforma acima para abrir o player.</p>
                </div>
              ) : !playerUrl ? (
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
              ) : (
                <iframe
                  key={player}
                  title={`Transmissão ${labels[player]}`}
                  src={playerUrl}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>
          </div>
          <div className="mc-metrics">
            {platforms.map((p) => (
              <div key={p}>
                <span className={`mc-platform mc-${p}`}>{labels[p]}</span>
                <strong>
                  {chat.metrics[p]?.viewers?.toLocaleString("pt-BR") ?? "—"}
                </strong>
                <small>
                  {chat.metrics[p]
                    ? `${chat.metrics[p]!.messagesPerMinute} msg/min · ${chat.metrics[p]!.activeChatUsers} no chat`
                    : "Aguardando métricas"}
                </small>
              </div>
            ))}
          </div>
          <section className="mc-panel mc-accounts">
            <div className="mc-section-head">
              <h2>Suas conexões</h2>
              <span>TikTok · somente leitura</span>
            </div>
            <p>Vincule suas contas para enviar mensagens em cada plataforma.</p>
            <div className="mc-account-list">
              {writablePlatforms.map((p) => (
                <div key={p}>
                  <span className={`mc-platform mc-${p}`}>{labels[p]}</span>
                  <small>
                    {accounts[p].connected
                      ? accounts[p].username
                      : "Não conectada"}
                  </small>
                  <button
                    disabled={!session || busy}
                    onClick={() =>
                      accounts[p].connected ? void unlink(p) : void link(p)
                    }
                  >
                    {accounts[p].connected ? "Desconectar" : "Conectar"}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </section>
        <section className="mc-chat mc-panel">
          <div className="mc-section-head">
            <h2>Chat da comunidade</h2>
            <span>{visible.length} mensagens</span>
          </div>
          <div className="mc-filters">
            {platforms.map((p) => (
              <label key={p} title={chat.providers[p]?.error}>
                <input
                  type="checkbox"
                  checked={filters[p]}
                  onChange={(event) =>
                    setFilters({ ...filters, [p]: event.target.checked })
                  }
                />
                <span className={`mc-platform mc-${p}`}>{labels[p]}</span>
                <small>
                  {chat.providers[p]
                    ? statusLabels[chat.providers[p]!.status]
                    : "Aguardando"}
                </small>
              </label>
            ))}
          </div>
          {chat.live === false && (
            <div className="mc-offline">Nenhuma transmissão ativa.</div>
          )}
          <ChatVirtualList messages={visible} />
          <form className="mc-composer" onSubmit={send}>
            <div className="mc-targets">
              <span>Enviar para</span>
              {writablePlatforms.map((p) => (
                <label key={p}>
                  <input
                    type="checkbox"
                    checked={targets[p]}
                    disabled={!accounts[p].connected}
                    onChange={(event) =>
                      setTargets({ ...targets, [p]: event.target.checked })
                    }
                  />
                  {labels[p]}
                </label>
              ))}
            </div>
            <label className="mc-sr" htmlFor="mc-message">
              Sua mensagem
            </label>
            <textarea
              id="mc-message"
              placeholder={
                session ? "Entre na conversa…" : "Entre para enviar mensagens"
              }
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              disabled={!session || sending}
              rows={2}
            />
            <div className="mc-composer-bottom">
              <small>
                {Array.from(message).length}/{limit}
              </small>
              <button className="mc-primary" disabled={!canSend}>
                {sending ? "Enviando…" : "Enviar mensagem ↗"}
              </button>
            </div>
            <div aria-live="polite">
              {results.map((r) => (
                <p
                  key={r.platform}
                  className={r.success ? "mc-success" : "mc-error"}
                >
                  {labels[r.platform]}:{" "}
                  {r.success
                    ? "Enviada"
                    : errors[r.error || ""] || "Não foi possível enviar."}
                </p>
              ))}
            </div>
          </form>
        </section>
      </div>
      {notice && (
        <div className="mc-notice" role="status">
          {notice}
        </div>
      )}
      {configured && (
        <section className="mc-panel mc-auth">
          {session ? (
            <>
              <p>
                Conectado como <strong>{session.user.email}</strong>
              </p>
              <button
                onClick={() => {
                  void supabase?.auth.signOut().then(({ error }) => {
                    if (error) setNotice("Não foi possível sair.");
                  });
                }}
              >
                Sair
              </button>
            </>
          ) : (
            <form onSubmit={auth}>
              <div>
                <h2>Entre na conversa</h2>
                <p>Uma conta para acompanhar e conectar suas plataformas.</p>
              </div>
              <label>
                E-mail
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              <label>
                Senha
                <input
                  type="password"
                  autoComplete="current-password"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>
              <button className="mc-primary" disabled={busy}>
                Entrar
              </button>
              <button
                type="button"
                disabled={busy || !email || password.length < 8}
                onClick={(event) => void auth(event, true)}
              >
                Criar conta
              </button>
            </form>
          )}
        </section>
      )}
    </div>
  );
}
