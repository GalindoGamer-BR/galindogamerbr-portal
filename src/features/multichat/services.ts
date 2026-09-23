import { createClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const commandUrl = import.meta.env.VITE_MULTICHAT_COMMAND_URL;
export const configured = !!(url && key && commandUrl);
export const supabase = configured ? createClient(url, key) : null;
export async function command<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!supabase || !commandUrl)
    throw new Error("Multichat ainda não configurado.");
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Entre na sua conta para continuar.");
  let response: Response;
  try {
    response = await fetch(`${commandUrl.replace(/\/$/, "")}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        ...options.headers,
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    throw new Error(
      "O serviço de envio não respondeu. Tente novamente em instantes.",
    );
  }
  if (!response.ok)
    throw new Error(
      response.status === 429
        ? "Muitas solicitações. Aguarde alguns segundos."
        : response.status === 401
          ? "Sua sessão expirou. Entre novamente."
          : "Não foi possível concluir a solicitação.",
    );
  return response.status === 204 ? (undefined as T) : response.json();
}
