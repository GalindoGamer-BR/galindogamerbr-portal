import { createClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const realtimePublicKey = key;
const commandUrl = import.meta.env.VITE_MULTICHAT_COMMAND_URL;
export const configured = !!(url && key && commandUrl);
export const supabase = configured
  ? createClient(url, key, { auth: { flowType: "pkce" } })
  : null;
export class PortalSessionRequired extends Error {}
/** 429 do servidor: `retryAfterSeconds` vem do Retry-After (5 s se ausente). */
export class RateLimited extends Error {
  retryAfterSeconds: number;
  constructor(retryAfterSeconds: number) {
    super("Muitas solicitações. Aguarde alguns segundos.");
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

// Entrar com a Twitch (conta nova ou já vinculada) conecta o chat sem nova autorização: o Supabase entrega o token da
// Twitch só na sessão recém-aberta pelo OAuth, e o auth-service o valida (cliente, usuário e escopo) antes de guardar
// criptografado. Falhas aqui não afetam o login.
if (supabase) {
  const adopted = new Set<string>();
  supabase.auth.onAuthStateChange((event, session) => {
    const token = session?.provider_token;
    if (event !== "SIGNED_IN" || !token || !session.user.identities?.some(identity => identity.provider === "twitch") || adopted.has(token)) return;
    adopted.add(token);
    const body = JSON.stringify({ accessToken: token, ...(session.provider_refresh_token ? { refreshToken: session.provider_refresh_token } : {}) });
    // Fora do callback: chamar métodos do Supabase de dentro dele pode travar a fila de eventos de autenticação.
    setTimeout(() => void command("/api/accounts/twitch/adopt", { method: "POST", body }).catch(() => undefined), 0);
  });
}
async function portalSession() {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      supabase!.auth.getSession(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Não foi possível recuperar sua sessão. Recarregue a página para tentar novamente.")), 15000);
      })
    ]);
    if (result.error) throw result.error;
    if (!result.data.session) throw new PortalSessionRequired("Entre na sua conta para continuar.");
    return result.data.session;
  } finally { clearTimeout(timer); }
}
export async function command<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!supabase || !commandUrl)
    throw new Error("Multichat ainda não configurado.");
  const session = await portalSession();
  let response: Response;
  try {
    response = await fetch(`${commandUrl.replace(/\/$/, "")}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        ...options.headers,
        Authorization: `Bearer ${session.access_token}`,
        ...(options.body != null && !new Headers(options.headers).has("Content-Type") ? { "Content-Type": "application/json" } : {}),
      },
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new Error(
      "O serviço do portal não respondeu. Tente novamente em instantes.",
    );
  }
  if (!response.ok) {
    if (response.status === 401) throw new PortalSessionRequired("Sua sessão expirou. Entre novamente.");
    const details = await response.json().catch(() => null);
    if (details?.error === "email_verification_required") {
      if (window.location.pathname !== "/login") window.location.assign("/login");
      throw new PortalSessionRequired("Confirme seu e-mail para continuar.");
    }
    const emailErrors: Record<string, string> = {
      email_send_failed: "Não foi possível enviar o código. Tente novamente em instantes.",
      email_code_invalid: "Código inválido ou expirado. Confira o código ou solicite outro.",
      email_attempt_expired: "A confirmação expirou. Solicite um novo código.",
      email_already_verified: "Seu e-mail já está confirmado. Entre novamente.",
      account_merge_conflict: "As contas possuem vínculos diferentes da mesma plataforma. Nenhum vínculo foi sobrescrito; a união não foi concluída.",
      account_merge_failed: "Não foi possível unir os cadastros. Solicite um novo código e tente novamente.",
      account_merge_changed: "Seu cadastro mudou durante a confirmação. Solicite um novo código.",
      try_again_later: "Aguarde a solicitação atual terminar e tente novamente."
    };
    if (emailErrors[details?.error]) throw new Error(emailErrors[details.error]);
    if (details?.error === "tiktok_revoke_failed")
      throw new Error("Não foi possível confirmar a revogação no TikTok. Sua conta no portal não foi excluída. Tente novamente.");
    if (details?.error === "last_login_method")
      throw new Error("Esta é sua única conta de acesso. Para remover o cadastro, use Excluir conta.");
    if (details?.error === "account_already_linked")
      throw new Error("Esta conta TikTok já está vinculada a outro perfil, ou seu perfil já tem outro TikTok vinculado.");
    if (details?.error === "invalid_login_attempt")
      throw new Error("A tentativa expirou. Entre com o TikTok novamente.");
    if (details?.error === "tiktok_worker_unavailable")
      throw new Error("Não foi possível preparar o navegador TikTok. Tente conectar novamente.");
    if (details?.error === "worker_capacity")
      throw new Error("As sessões TikTok disponíveis estão em uso. Tente novamente após uma desconexão.");
    if (details?.error === "session_journal_full")
      throw new Error("Limite de tentativas desta sessão atingido. Desvincule e conecte novamente.");
    if (details?.error === "tiktok_https_callback_required")
      throw new Error("O login TikTok precisa de um callback HTTPS configurado no servidor.");
    if (details?.error === "revoke_failed")
      throw new Error("Não foi possível revogar o acesso na plataforma agora. A conta continua conectada; tente novamente em instantes.");
    if (details?.error === "login_account_locked")
      throw new Error("Esta conta faz parte do seu login e não pode ser desvinculada.");
    if (details?.error === "invalid_image")
      throw new Error("Envie uma imagem PNG, JPEG ou WebP de até 2 MB.");
    if (details?.error === "invalid_request")
      throw new Error("Confira os dados: o nome deve ter de 2 a 24 caracteres, sem símbolos especiais.");
    if (details?.error === "provider_not_configured")
      throw new Error("Esta plataforma ainda precisa das credenciais de conexão no servidor.");
    if (response.status === 429) throw new RateLimited(Number(response.headers.get("Retry-After")) || 5);
    throw new Error(
      response.status === 401
        ? "Sua sessão expirou. Entre novamente."
        : "Não foi possível concluir a solicitação.",
    );
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

/** GET publico no command (sem login): usado pelo historico do chat, que qualquer visitante pode ver. */
export async function publicGet<T>(path: string): Promise<T> {
  if (!commandUrl) throw new Error("Multichat ainda não configurado.");
  const response = await fetch(commandUrl.replace(/\/$/, "") + path, { signal: AbortSignal.timeout(8_000) });
  if (!response.ok) throw new Error("history_unavailable");
  return response.json();
}
export async function publicCommand<T>(path: string, body: unknown): Promise<T> {
  if (!commandUrl) throw new Error("Login ainda não configurado.");
  const response = await fetch(commandUrl.replace(/\/$/, "") + path, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body), signal: AbortSignal.timeout(15_000)
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error === "invalid_login_attempt"
    ? "A tentativa expirou. Entre com o TikTok novamente."
    : result.error === "email_verification_required" ? "Confirme o e-mail do seu cadastro antes de entrar."
    : "Não foi possível concluir o login. Tente novamente.");
  return result;
}
