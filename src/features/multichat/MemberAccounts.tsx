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
  return <section className="member-card" aria-label="Contas">
    <h2>Contas</h2>
    <p className="member-hint">Como você entra no portal e quais contas podem enviar mensagens ao chat.</p>
    <ul className="member-accounts">
      {user?.email && loginProviders.has("email") && <li>
        <strong>E-mail</strong><span>{user.email}</span><em className="member-tag">Login</em>
      </li>}
      {linkablePlatforms.map(platform => {
        const account = chat?.[platform];
        const isLogin = loginProviders.has(platform);
        const locked = !!account?.locked;
        return <li key={platform}>
          <PlatformIcon platform={platform} /><strong>{labels[platform]}</strong>
          <span>{!chat ? "Carregando…" : account?.connected ? account.username || "Conectada ao chat" : "Não conectada ao chat"}</span>
          {isLogin && <em className="member-tag">Login</em>}
          {chat && (account?.connected
            ? locked
              ? <em className="member-tag member-tag-fixed">Chat vinculado à conta</em>
              : <button disabled={!!busy} onClick={() => void unlink(platform)}>{busy === platform ? "Aguarde…" : "Desvincular"}</button>
            : <button disabled={!!busy} onClick={() => void link(platform)}>{busy === platform ? "Aguarde…" : "Conectar ao chat"}</button>)}
        </li>;
      })}
      {tiktokLogin && !tiktokLinking && <li><PlatformIcon platform="tiktok" /><strong>TikTok</strong><span>{tiktokLogin}</span><em className="member-tag">Login</em></li>}
    </ul>
    {tiktokLinking && <TikTokConnection signedIn state={tiktok} onChange={setTikTok} />}
    {error && <p role="alert" className="member-error">{error}</p>}
  </section>;
}
