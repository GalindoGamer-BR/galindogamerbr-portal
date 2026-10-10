// Wrappers do cliente para /api/auth/*. Nunca envolvem segredos — o
// Worker é a única camada que fala com Resend/D1/hash de código.

import { supabase } from '../../features/multichat/services'

type OkResponse = { ok: true } | { ok: false }

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  return res.json() as Promise<T>
}

export function requestCode(email: string) {
  return postJson<OkResponse>('/api/auth/request-code', { email })
}

export function verifyCode(email: string, code: string) {
  return postJson<OkResponse>('/api/auth/verify-code', { email, code })
}

export function logout() {
  return postJson<OkResponse>('/api/auth/logout', {})
}

// Quem já entrou na área de membro (sessão Supabase) abre o admin sem novo login: o token é trocado por um cookie
// de admin, desde que carregue role=admin e o e-mail continue em ADMIN_EMAILS. Se o token foi emitido antes da role
// existir, uma renovação da sessão traz o claim atualizado.
async function exchangeMemberSession(): Promise<boolean> {
  if (!supabase) return false
  const attempt = async (token: string) =>
    (await fetch('/api/auth/session', { method: 'POST', credentials: 'include', headers: { authorization: `Bearer ${token}` } })).ok
  try {
    const { data } = await supabase.auth.getSession()
    if (!data.session) return false
    if (await attempt(data.session.access_token)) return true
    const refreshed = await supabase.auth.refreshSession()
    return refreshed.data.session ? await attempt(refreshed.data.session.access_token) : false
  } catch {
    return false
  }
}

export async function me(): Promise<{ email: string } | null> {
  let res = await fetch('/api/auth/me', { credentials: 'include' })
  if (!res.ok && (await exchangeMemberSession())) res = await fetch('/api/auth/me', { credentials: 'include' })
  if (!res.ok) return null
  return res.json() as Promise<{ email: string }>
}
