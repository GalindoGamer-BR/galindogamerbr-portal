import MemberEmail from "./MemberEmail";
import type { User } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { configured, supabase, publicCommand } from "./services";
import { PlatformIcon } from "./PlatformIcon";
import { tiktokLinking } from "./flags";
import "./account.css";

const proofKey = "portal:tiktok:proof";
const verifierKey = "portal:tiktok:verifier";
const hex = (bytes: Uint8Array) => Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
function clearAttempt() { sessionStorage.removeItem(proofKey); sessionStorage.removeItem(verifierKey); }
async function waitForAuth<T>(request: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([request, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("O login demorou para responder. Tente novamente.")), 15000);
    })]);
  } finally { clearTimeout(timer); }
}
export default function PortalLogin() {
  const navigate = useNavigate();
  const route = useLocation();
  const started = useRef(false);
  const [requiresEmail, setRequiresEmail] = useState(false);
  const [busy, setBusy] = useState(false);
  function continueWith(user: User) {
    if (!user.email || !user.email_confirmed_at || user.app_metadata?.email_is_internal === true || user.email.endsWith("@tiktok.identity.invalid")) setRequiresEmail(true);
    else navigate("/membro", { replace: true });
  }
  const [error, setError] = useState("");
  useEffect(() => {
    const restore = () => setBusy(false);
    window.addEventListener("pageshow", restore);
    return () => window.removeEventListener("pageshow", restore);
  }, []);
  useEffect(() => {
    if (started.current || !supabase) return;
    started.current = true;
    const query = new URLSearchParams(location.search);
    if (query.has("oauth_error")) {
      const messages: Record<string, string> = {
        account_already_linked: "Esta conta TikTok já está vinculada a outro perfil.",
        access_denied: "A autorização do TikTok foi cancelada. Autorize o acesso para continuar.",
        non_sandbox_target: "Esta conta precisa ser adicionada aos usuários de teste do aplicativo TikTok.",
        invalid_client: "O TikTok recusou as credenciais do aplicativo. Confira a Client Key e o Secret do mesmo app/sandbox no servidor.",
        invalid_grant: "O código de autorização expirou ou já foi usado. Inicie uma nova entrada pelo TikTok.",
        invalid_scope: "O aplicativo precisa da permissão user.info.basic no TikTok.",
        scope_not_authorized: "O TikTok não autorizou o acesso ao perfil básico.",
        rate_limit_exceeded: "O TikTok limitou as tentativas. Aguarde antes de tentar novamente.",
        tiktok_token_failed: "Não foi possível trocar a autorização com o TikTok. Tente novamente em instantes.",
        tiktok_token_response_failed: "O TikTok não retornou os dados necessários para concluir a autorização.",
        tiktok_profile_failed: "Não foi possível consultar seu perfil no TikTok.",
        tiktok_profile_response_failed: "O TikTok não retornou um perfil válido para este aplicativo.",
        tiktok_account_store_failed: "Seu login foi autorizado, mas não foi possível salvar o vínculo. Tente novamente."
      };
      const failure = query.get("oauth_error") || "";
      setError(messages[failure] || "O TikTok não concluiu a autorização. Inicie uma nova tentativa.");
      clearAttempt();
      history.replaceState(null, "", "/login");
    }
    const hash = new URLSearchParams(location.hash.slice(1));
    const id = hash.get("tiktok_login");
    if (id) { sessionStorage.setItem(proofKey, id); history.replaceState(null, "", "/login"); }
    const proof = sessionStorage.getItem(proofKey), verifier = sessionStorage.getItem(verifierKey);
    void (async () => {
      setBusy(true);
      try {
        if (proof && !verifier) throw new Error("A tentativa de login não foi encontrada neste navegador. Inicie o login novamente nesta aba.");
        if (proof && verifier) {
          const result = await publicCommand<{ session?: { access_token: string; refresh_token: string } }>("/oauth/tiktok/exchange", { id: proof, verifier });
          if (result.session) {
            const { data, error } = await waitForAuth(supabase!.auth.setSession(result.session));
            if (error) throw error;
            clearAttempt();
            if (!data.user) throw new Error("Não foi possível recuperar sua conta.");
            continueWith(data.user);
          } else { throw new Error("Não foi possível abrir sua conta. Entre com o TikTok novamente."); }
        } else {
          const { data, error } = await waitForAuth(supabase!.auth.getSession());
          if (error) throw error;
          if (data.session) continueWith(data.session.user);
        }
      } catch (err) { setError((err as Error).message); }
      finally { setBusy(false); }
    })();
  }, [navigate]);
  async function loginTwitch() {
    if (!supabase) return;
    setBusy(true); setError(""); clearAttempt();
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "twitch",
        options: { scopes: "user:read:email", redirectTo: window.location.origin + "/login" }
      });
      if (error) throw error;
    } catch (err) { setError((err as Error).message); setBusy(false); }
  }
  async function login() {
    setBusy(true); setError("");
    try {
      clearAttempt();
      const verifier = hex(crypto.getRandomValues(new Uint8Array(32)));
      sessionStorage.setItem(verifierKey, verifier);
      const challenge = hex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))));
      const { url } = await publicCommand<{ url: string }>("/oauth/tiktok/login", { challenge });
      window.location.assign(url);
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  return <main className="portal-account"><section className="portal-account-card">
    <span className="portal-account-eyebrow">Comunidade GalindoGamerBR</span>
    {requiresEmail ? <MemberEmail onComplete={() => navigate("/membro", { replace: true })} /> : <>
    <h1>Entre na comunidade</h1>
    {route.state?.accountDeleted === true && <p role="status">Conta excluída com sucesso.</p>}
    <p>{tiktokLinking ? "Use sua conta Twitch ou TikTok para criar ou acessar seu perfil na comunidade." : "Use sua conta Twitch para criar ou acessar seu perfil na comunidade."}</p>
    <button className="portal-twitch-login" disabled={busy || !configured} onClick={() => void loginTwitch()}><PlatformIcon platform="twitch" />Entrar com Twitch</button>
    {tiktokLinking && <button className="portal-tiktok-login" disabled={busy || !configured} onClick={() => void login()}><PlatformIcon platform="tiktok" />{busy ? "Aguarde…" : "Entrar com TikTok"}</button>}
    {error && <p role="alert" className="portal-account-error">{error}</p>}
    </>}
    <p className="portal-account-legal">Consulte os <Link to="/termos">Termos de Uso</Link> e a <Link to="/privacidade">Política de Privacidade</Link>.</p>
    <Link to="/" className="portal-account-back">← Voltar ao início</Link>
  </section></main>;
}
