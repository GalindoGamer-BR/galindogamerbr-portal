// Mesclagem de contas pelo login: a pessoa pede o token na conta que fica, entra na outra conta (OAuth sai da página e
// volta em /login) e o token liga as duas. Fica só na aba (sessionStorage) e com validade curta, para uma tentativa
// abandonada não afetar um login posterior.
const claimKey = "portal:merge:claim";
const claimTtl = 15 * 60 * 1000;

export function rememberMergeClaim(token: string) {
  try { sessionStorage.setItem(claimKey, JSON.stringify({ token, at: Date.now() })); } catch { /* sem armazenamento: a mesclagem por login não funciona */ }
}

/** Devolve o token pendente (uma vez só) ou null se não há, se expirou ou se o armazenamento falhou. */
export function takeMergeClaim(): string | null {
  try {
    const raw = sessionStorage.getItem(claimKey);
    sessionStorage.removeItem(claimKey);
    const stored = JSON.parse(raw ?? "null") as { token?: unknown; at?: unknown } | null;
    if (typeof stored?.token === "string" && typeof stored.at === "number" && Date.now() - stored.at < claimTtl) return stored.token;
  } catch { /* sem token */ }
  return null;
}
