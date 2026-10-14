// Autenticação do painel admin: só Supabase Auth (código por e-mail ou Twitch). Não há cookie nem sessão própria:
// a API recebe o access token em Authorization: Bearer e confere o claim app_metadata.role === "admin" (definido por SQL).
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../features/multichat/services'

type OkResponse = { ok: true } | { ok: false }

const isAdmin = (session: Session | null) => session?.user.app_metadata?.role === 'admin'

// A role pode ter sido concedida depois do login: uma renovação traz o claim atualizado.
async function adminSession(): Promise<Session | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  if (!data.session) return null
  if (isAdmin(data.session)) return data.session
  const refreshed = await supabase.auth.refreshSession()
  return isAdmin(refreshed.data.session) ? refreshed.data.session : null
}

export async function requestCode(email: string): Promise<OkResponse> {
  if (!supabase) return { ok: false }
  // shouldCreateUser:false: só contas já existentes recebem código. O resultado é o mesmo para qualquer e-mail.
  await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: false } })
  return { ok: true }
}

export async function verifyCode(email: string, code: string): Promise<OkResponse> {
  if (!supabase) return { ok: false }
  const { data, error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' })
  if (error || !data.session) return { ok: false }
  if (await adminSession()) return { ok: true }
  await supabase.auth.signOut()
  return { ok: false }
}

export async function loginWithTwitch(): Promise<void> {
  if (!supabase) return
  await supabase.auth.signInWithOAuth({
    provider: 'twitch',
    options: { scopes: 'user:read:email', redirectTo: window.location.origin + '/admin/login' },
  })
}

export async function logout(): Promise<OkResponse> {
  await supabase?.auth.signOut()
  return { ok: true }
}

export async function me(): Promise<{ email: string } | null> {
  const session = await adminSession()
  const email = session?.user.email
  return email ? { email: email.toLowerCase() } : null
}

// fetch das rotas /api/admin/*: acrescenta o Bearer da sessão do Supabase.
export async function adminFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const session = await adminSession()
  const headers = new Headers(init.headers)
  if (session) headers.set('authorization', `Bearer ${session.access_token}`)
  return fetch(input, { ...init, headers })
}
