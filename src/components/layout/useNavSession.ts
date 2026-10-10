import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../features/multichat/services'

// Estado de login para a navbar: só indica se há sessão e oferece o logout.
export function useNavSession() {
  const navigate = useNavigate()
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    if (!supabase) return
    let active = true
    void supabase.auth.getSession().then(({ data }) => { if (active) setSignedIn(Boolean(data.session)) })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => { if (active) setSignedIn(Boolean(session)) })
    return () => { active = false; data.subscription.unsubscribe() }
  }, [])

  async function logout() {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (!error) navigate('/', { replace: true })
  }

  return { signedIn, logout }
}
