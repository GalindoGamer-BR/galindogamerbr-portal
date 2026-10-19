import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { configured } from '../../features/multichat/services'
import { PlatformIcon } from '../../features/multichat/PlatformIcon'
import { googleLogin, tiktokLinking } from '../../features/multichat/flags'
import EmailLogin from '../../features/multichat/EmailLogin'
import { GoogleIcon } from '../../features/multichat/GoogleIcon'
import { rememberReturnTo, startGoogleLogin, startTikTokLogin, startTwitchLogin } from '../../features/multichat/loginFlows'
import '../../features/multichat/account.css'

type LoginModalProps = { onClose: () => void }

// Login em modal: inicia o OAuth; o retorno cai em /login, que conclui a sessão e leva a /membro.
export function LoginModal({ onClose }: LoginModalProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKeyDown)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.querySelector<HTMLElement>('button')?.focus()
    return () => { document.removeEventListener('keydown', onKeyDown); document.body.style.overflow = previous }
  }, [onClose])

  async function run(start: () => Promise<void>) {
    setBusy(true); setError('')
    rememberReturnTo()
    try { await start() } catch (err) { setError((err as Error).message); setBusy(false) }
  }

  // Portal no body: fora de qualquer página com estilos globais de botão (ex.: .mc-page do multichat).
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onPointerDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="login-modal-title" className="portal-account-card relative" style={{ display: 'grid', gap: 18, background: '#18181b', border: '1px solid #303037', borderRadius: 12 }}>
        <button type="button" onClick={onClose} aria-label="Fechar" className="absolute right-3 top-3 !min-h-0 !w-9 !border-0 !bg-transparent !p-0 text-xl text-white/70 hover:text-white">✕</button>
        <span className="portal-account-eyebrow">Comunidade GalindoGamerBR</span>
        <h1 id="login-modal-title">Entre na comunidade</h1>
        <p>{`Use sua conta ${['Twitch', googleLogin && 'Google', tiktokLinking && 'TikTok'].filter(Boolean).join(', ').replace(/, ([^,]*)$/, ' ou $1')} para criar ou acessar seu perfil na comunidade.`}</p>
        <button className="portal-twitch-login" disabled={busy || !configured} onClick={() => void run(startTwitchLogin)}><PlatformIcon platform="twitch" />Entrar com Twitch</button>
        {googleLogin && <button className="portal-google-login" disabled={busy || !configured} onClick={() => void run(startGoogleLogin)}><GoogleIcon />Entrar com Google</button>}
        {tiktokLinking && <button className="portal-tiktok-login" disabled={busy || !configured} onClick={() => void run(startTikTokLogin)}><PlatformIcon platform="tiktok" />{busy ? 'Aguarde…' : 'Entrar com TikTok'}</button>}
        <p>ou entre com seu e-mail</p>
        <EmailLogin onBusy={setBusy} onSignedIn={onClose} />
        {error && <p role="alert" className="portal-account-error">{error}</p>}
        <p className="portal-account-legal">Consulte os <Link to="/termos" onClick={onClose}>Termos de Uso</Link> e a <Link to="/privacidade" onClick={onClose}>Política de Privacidade</Link>.</p>
      </div>
    </div>,
    document.body,
  )
}
