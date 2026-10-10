import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { command, supabase } from '../../features/multichat/services'

export type NavMember = { name: string; avatarUrl: string | null }

// Estado de login para a navbar: sessão, nome/foto do membro e logout.
export function useNavSession() {
  const navigate = useNavigate()
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
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') apply(Boolean(session))
    })
    return () => { active = false; data.subscription.unsubscribe() }
  }, [])

  async function logout() {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (!error) navigate('/', { replace: true })
  }

  return { signedIn, member, logout }
}
