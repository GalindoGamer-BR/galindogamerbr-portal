import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { command, supabase } from '../../features/multichat/services'

export type NavMember = { name: string; avatarUrl: string | null; isAdmin?: boolean }

// Estado de login para a navbar: sessão, nome/foto do membro e logout.
export function useNavSession() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [signedIn, setSignedIn] = useState(false)
  const [member, setMember] = useState<NavMember | null>(null)

  useEffect(() => {
    if (!supabase) return
    let active = true
    const apply = (hasSession: boolean) => {
      if (!active) return
      setSignedIn(hasSession)
      if (!hasSession) { setMember(null); return }
      // Perfil (nome/foto editados no portal); sem ele o menu mostra só a inicial.
      void command<NavMember>('/api/member').then((profile) => { if (active) setMember(profile) }).catch(() => {})
    }
    void supabase.auth.getSession().then(({ data }) => apply(Boolean(data.session)))
    // A área do membro avisa quando nome ou foto mudam, para a navbar atualizar sem recarregar.
    const refresh = () => { if (active) void command<NavMember>('/api/member').then((profile) => { if (active) setMember(profile) }).catch(() => {}) }
    window.addEventListener('portal:profile-updated', refresh)
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') apply(Boolean(session))
    })
    return () => { active = false; window.removeEventListener('portal:profile-updated', refresh); data.subscription.unsubscribe() }
  }, [])

  async function logout() {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    // Fica na mesma página; só sai de áreas que exigem login (admin e área do membro).
    if (!error && /^\/(admin|membro|conta)(\/|$)/.test(pathname)) navigate('/', { replace: true })
  }

  return { signedIn, member, logout }
}
