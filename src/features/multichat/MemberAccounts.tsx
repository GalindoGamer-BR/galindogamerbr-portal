import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { command, supabase } from "./services";
import { PlatformIcon } from "./PlatformIcon";
import { TikTokConnection, type TikTokConnectionState } from "./TikTokConnection";
import { tiktokLinking, linkablePlatforms } from "./flags";
import { labels, type Accounts, type WritablePlatform } from "./types";

// Uma lista só: cada plataforma mostra se é forma de entrar ("Login") e se está autorizada para enviar mensagens ao chat.
// Conta criada com a Twitch já nasce com o chat vinculado, de forma permanente (sem opção de desvincular).
export function MemberAccounts({ tiktokLogin }: { tiktokLogin?: string | null }) {
  const [user, setUser] = useState<User | null>(null);
  const [chat, setChat] = useState<Accounts | null>(null);
  const [tiktok, setTikTok] = useState<TikTokConnectionState>({ connected: false, canSend: false });
  const [busy, setBusy] = useState<string | null>(null), [error, setError] = useState("");
  const load = useCallback(async () => {
    const [{ data }, accounts] = await Promise.all([supabase!.auth.getUser(), command<Accounts>("/api/accounts")]);
    setUser(data.user); setChat(accounts);
    if (tiktokLinking) setTikTok(await command<TikTokConnectionState>("/api/tiktok/connection"));
  }, []);
  useEffect(() => { void load().catch(() => setError("Não foi possível carregar suas contas.")); }, [load]);
  async function link(platform: WritablePlatform) {
    setBusy(platform); setError("");
    try { const { url } = await command<{ url: string }>(`/oauth/${platform}/start`); window.location.assign(url); }
    catch (err) { setError((err as Error).message); setBusy(null); }
  }
  async function unlink(platform: WritablePlatform) {
    setBusy(platform); setError("");
    try { await command(`/api/accounts/${platform}`, { method: "DELETE" }); await load(); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(null); }
  }
  const loginProviders = new Set((user?.identities ?? []).map(identity => identity.provider));
  const [editing, setEditing] = useState(false);
  return <section className="member-card" aria-label="Contas">
    <div className="member-card-head">
      <div><h2>Contas</h2><p className="member-hint">Como você entra no portal e quais contas enviam mensagens ao chat.</p></div>
      <button className="member-edit-toggle" aria-pressed={editing} onClick={() => setEditing(value => !value)}>{editing ? "Concluir" : "Editar"}</button>
    </div>
    <ul className="member-accounts">
      {user?.email && loginProviders.has("email") && <li>
        <span className="member-account-icon" aria-hidden="true">@</span>
        <div className="member-account-info"><strong>E-mail</strong><small>{user.email}</small></div>
        <div className="member-account-status"><em className="member-tag">Login</em></div>
      </li>}
      {linkablePlatforms.map(platform => {
        const account = chat?.[platform];
        const connected = !!account?.connected;
        const locked = !!account?.locked;
        return <li key={platform}>
          <PlatformIcon platform={platform} />
          <div className="member-account-info"><strong>{labels[platform]}</strong><small>{!chat ? "Carregando…" : connected ? account?.username || "Conectada" : "Não conectada ao chat"}</small></div>
          <div className="member-account-status">
            {loginProviders.has(platform) && <em className="member-tag">Login</em>}
            {chat && <em className={"member-tag " + (connected ? "member-tag-on" : "member-tag-off")}>{connected ? "Chat conectado" : "Chat desconectado"}</em>}
            {editing && chat && (connected
              ? locked
                ? <em className="member-tag member-tag-fixed">Vinculada à conta</em>
                : <button disabled={!!busy} onClick={() => void unlink(platform)}>{busy === platform ? "Aguarde…" : "Desvincular"}</button>
              : <button disabled={!!busy} onClick={() => void link(platform)}>{busy === platform ? "Aguarde…" : "Conectar"}</button>)}
          </div>
        </li>;
      })}
      {tiktokLogin && !tiktokLinking && <li>
        <PlatformIcon platform="tiktok" />
        <div className="member-account-info"><strong>TikTok</strong><small>{tiktokLogin}</small></div>
        <div className="member-account-status"><em className="member-tag">Login</em></div>
      </li>}
    </ul>
    {tiktokLinking && <TikTokConnection signedIn state={tiktok} onChange={setTikTok} />}
    {error && <p role="alert" className="member-error">{error}</p>}
  </section>;
}
