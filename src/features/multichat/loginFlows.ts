import { supabase, publicCommand } from "./services";
import { googleLoginYoutube } from "./flags";

// Início dos fluxos de login, compartilhado pela página /login e pelo modal da navbar.
// O retorno do OAuth sempre cai em /login, que conclui a sessão e leva a /membro.
export const proofKey = "portal:tiktok:proof";
export const verifierKey = "portal:tiktok:verifier";
const hex = (bytes: Uint8Array) => Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");

export function clearAttempt() { sessionStorage.removeItem(proofKey); sessionStorage.removeItem(verifierKey); }

export async function startTwitchLogin() {
  if (!supabase) return;
  clearAttempt();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "twitch",
    options: { scopes: "user:read:email user:write:chat user:read:subscriptions user:read:follows user:read:emotes", redirectTo: window.location.origin + "/login" }
  });
  if (error) throw error;
}

// Por padrão só identidade (openid, e-mail e perfil): o YouTube é vinculado à parte, em Conexões, porque nem todo Google tem
// canal e o escopo de envio é sensível. Com googleLoginYoutube o escopo do YouTube vai junto e o vínculo é automático. `select_account` deixa escolher a conta quando há várias no navegador.
export async function startGoogleLogin() {
  if (!supabase) return;
  clearAttempt();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      scopes: "openid email profile" + (googleLoginYoutube ? " https://www.googleapis.com/auth/youtube.force-ssl" : ""),
      // Com o escopo do YouTube o Google só devolve o token de renovação com consentimento explícito e acesso offline.
      queryParams: googleLoginYoutube ? { prompt: "select_account consent", access_type: "offline" } : { prompt: "select_account" },
      redirectTo: window.location.origin + "/login",
    }
  });
  if (error) throw error;
}

export async function startTikTokLogin() {
  clearAttempt();
  const verifier = hex(crypto.getRandomValues(new Uint8Array(32)));
  sessionStorage.setItem(verifierKey, verifier);
  const challenge = hex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))));
  const { url } = await publicCommand<{ url: string }>("/oauth/tiktok/login", { challenge });
  window.location.assign(url);
}

// Página de origem do login (modal): o OAuth volta por /login, que leva o usuário de volta para ela.
// Só caminhos internos, com validade curta, para uma tentativa abandonada não afetar um login posterior.
const returnKey = "portal:login:return";
const returnTtl = 10 * 60 * 1000;
export function rememberReturnTo(path = window.location.pathname + window.location.search) {
  try { sessionStorage.setItem(returnKey, JSON.stringify({ path, at: Date.now() })); } catch { /* sem armazenamento: cai em /membro */ }
}
export function clearReturnTo() { try { sessionStorage.removeItem(returnKey); } catch { /* ignorado */ } }
export function takeReturnTo(fallback = "/membro"): string {
  try {
    const stored = JSON.parse(sessionStorage.getItem(returnKey) ?? "null") as { path?: unknown; at?: unknown } | null;
    clearReturnTo();
    const path = stored?.path;
    if (typeof path === "string" && typeof stored?.at === "number" && Date.now() - stored.at < returnTtl
      && path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/login")) return path;
  } catch { /* usa o padrão */ }
  return fallback;
}
