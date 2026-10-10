import { useCallback, useEffect, useState } from "react";
import { command } from "./services";
import { PlatformIcon } from "./PlatformIcon";
import { TikTokConnection, type TikTokConnectionState } from "./TikTokConnection";
import { tiktokLinking, linkablePlatforms } from "./flags";
import { labels, type Accounts, type WritablePlatform } from "./types";

// Conta criada com a Twitch já nasce com o chat vinculado, de forma permanente (sem opção de desvincular).
export function MemberAccounts({ tiktokLogin }: { tiktokLogin?: string | null }) {
  const [chat, setChat] = useState<Accounts | null>(null);
  const [tiktok, setTikTok] = useState<TikTokConnectionState>({ connected: false, canSend: false });
  const [busy, setBusy] = useState<string | null>(null), [error, setError] = useState("");
  const load = useCallback(async () => {
    setChat(await command<Accounts>("/api/accounts"));
    if (tiktokLinking) setTikTok(await command<TikTokConnectionState>("/api/tiktok/connection"));
  }, []);
  const [notice, setNotice] = useState("");
  useEffect(() => { void load().catch(() => setError("Não foi possível carregar suas contas.")); }, [load]);
  // Retorno do OAuth (?linked=<plataforma> ou ?oauth_error=<código>): mostra o resultado e limpa a URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const platform = params.get("platform") ?? params.get("linked");
    const name = platform && platform in labels ? labels[platform as WritablePlatform] : "A conta";
    if (params.has("linked")) setNotice(`${name} conectada ao chat.`);
    else if (params.has("oauth_error")) setError(params.get("oauth_error") === "access_denied" ? "A autorização foi negada ou cancelada na plataforma." : "Não foi possível conectar a conta. Tente novamente.");
    else return;
    window.history.replaceState(null, "", window.location.pathname);
  }, []);
  async function link(platform: WritablePlatform) {
    setBusy(platform); setError("");
    try { const { url } = await command<{ url: string }>(`/oauth/${platform}/start?return=/conta`); window.location.assign(url); }
    catch (err) { setError((err as Error).message); setBusy(null); }
  }
  async function unlink(platform: WritablePlatform) {
    setBusy(platform); setError("");
    try { await command(`/api/accounts/${platform}`, { method: "DELETE" }); await load(); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(null); }
  }
  return <section className="member-card" aria-label="Contas">
    <h2>Contas</h2>
    <p className="member-hint">Contas conectadas para enviar mensagens ao chat.</p>
    <ul className="member-accounts">
      {linkablePlatforms.map(platform => {
        const account = chat?.[platform];
        const connected = !!account?.connected;
        const locked = !!account?.locked;
        return <li key={platform}>
          <PlatformIcon platform={platform} />
          <div className="member-account-info"><strong>{labels[platform]}</strong><small>{!chat ? "Carregando…" : connected ? account?.username || "Conectada" : "Não conectada"}</small></div>
          <div className="member-account-status">
            {chat && (connected
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
        <div className="member-account-status" />
      </li>}
    </ul>
    {tiktokLinking && <TikTokConnection signedIn state={tiktok} onChange={setTikTok} />}
    {notice && <p role="status" className="member-ok">{notice}</p>}
    {error && <p role="alert" className="member-error">{error}</p>}
  </section>;
}
