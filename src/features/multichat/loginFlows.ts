import { supabase, publicCommand } from "./services";

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
    options: { scopes: "user:read:email user:write:chat user:read:subscriptions user:read:follows", redirectTo: window.location.origin + "/login" }
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
