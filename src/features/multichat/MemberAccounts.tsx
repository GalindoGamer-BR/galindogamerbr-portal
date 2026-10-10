import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { command, supabase } from "./services";
import { PlatformIcon } from "./PlatformIcon";
import { TikTokConnection, type TikTokConnectionState } from "./TikTokConnection";
import { tiktokLinking, linkablePlatforms } from "./flags";
import { labels, type Accounts, type WritablePlatform } from "./types";

const loginLabels: Record<string, string> = { email: "E-mail", twitch: "Twitch", google: "Google", kick: "Kick" };
const detail = (provider: string, data: Record<string, unknown> | undefined, email?: string) => {
  const text = (value: unknown) => (typeof value === "string" && value ? value : null);
  return provider === "email" ? email ?? "" : text(data?.preferred_username) ?? text(data?.name) ?? text(data?.full_name) ?? text(data?.email) ?? "";
};

// "Contas vinculadas" = como a pessoa entra no portal (identidades do Supabase).
// "Contas conectadas para o chat" = contas de plataforma autorizadas para enviar mensagens (tokens guardados pelo auth-service).
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
  const identities = user?.identities ?? [];
  return <>
    <section className="member-card" aria-label="Contas vinculadas">
      <h2>Contas vinculadas</h2>
      <p className="member-hint">Formas de entrar no portal com este perfil.</p>
      <ul className="member-accounts">
        {identities.map(identity => <li key={identity.identity_id ?? identity.provider}>
          <strong>{loginLabels[identity.provider] ?? identity.provider}</strong>
          <span>{detail(identity.provider, identity.identity_data as Record<string, unknown> | undefined, user?.email ?? undefined)}</span>
        </li>)}
        {tiktokLogin && <li><strong>TikTok</strong><span>{tiktokLogin}</span></li>}
        {user && !identities.length && !tiktokLogin && <li><span>Nenhuma conta vinculada.</span></li>}
      </ul>
    </section>
    <section className="member-card" aria-label="Contas conectadas para o chat">
      <h2>Contas conectadas para o chat</h2>
      <p className="member-hint">Autorize uma plataforma para enviar mensagens ao chat pelo portal. Isso é separado do login.</p>
      <ul className="member-accounts">
        {linkablePlatforms.map(platform => {
          const account = chat?.[platform];
          return <li key={platform}>
            <PlatformIcon platform={platform} /><strong>{labels[platform]}</strong>
            <span>{!chat ? "Carregando…" : account?.connected ? account.username || "Conectada" : "Não conectada"}</span>
            {chat && (account?.connected
              ? <button disabled={!!busy} onClick={() => void unlink(platform)}>{busy === platform ? "Aguarde…" : "Desvincular"}</button>
              : <button disabled={!!busy} onClick={() => void link(platform)}>{busy === platform ? "Aguarde…" : "Conectar"}</button>)}
          </li>;
        })}
      </ul>
      {tiktokLinking && <TikTokConnection signedIn state={tiktok} onChange={setTikTok} />}
      {error && <p role="alert" className="member-error">{error}</p>}
    </section>
  </>;
}
