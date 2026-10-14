import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container } from '../../components/ui/Container'
import { Eyebrow } from '../../components/ui/Eyebrow'
import { Button } from '../../components/ui/Button'
import { loginWithTwitch, me, requestCode, verifyCode } from '../../lib/api/auth'
import { useSession } from '../../hooks/useSession'

type Step = 'email' | 'code'

export function Login() {
  const navigate = useNavigate()
  const { refresh } = useSession()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Volta do Twitch (ou sessão já aberta na área de membro): se for admin, entra direto.
  useEffect(() => {
    let active = true
    void me().then((session) => {
      if (!active) return
      if (session) navigate('/admin')
    })
    return () => {
      active = false
    }
  }, [navigate])

  async function handleTwitch() {
    setSubmitting(true)
    setMessage(null)
    try {
      await loginWithTwitch()
    } catch {
      setMessage('Não foi possível iniciar o login com a Twitch.')
      setSubmitting(false)
    }
  }

  async function handleRequestCode(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setMessage(null)
    try {
      await requestCode(email)
      // Mesma mensagem para qualquer e-mail: não revela se a conta existe nem se é admin.
      setMessage('Se este email tiver acesso, enviamos um código de acesso.')
      setStep('code')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleVerifyCode(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setMessage(null)
    try {
      const result = await verifyCode(email, code)
      if (result.ok) {
        refresh()
        navigate('/admin')
      } else {
        setMessage('Código inválido, expirado ou sem permissão de admin.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="py-20 sm:py-28">
      <Container className="max-w-md">
        <Eyebrow>Acesso restrito</Eyebrow>
        <h1 className="text-4xl">ENTRAR</h1>

        {step === 'email' ? (
          <form onSubmit={handleRequestCode} className="mt-8 flex flex-col gap-4">
            <label className="flex flex-col gap-2 text-sm">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-md border border-line bg-panel px-4 py-3 text-white outline-none focus:border-gold"
                placeholder="seu@email.com"
              />
            </label>
            <Button type="submit" variant="gold" disabled={submitting}>
              {submitting ? 'Enviando...' : 'Enviar código'}
            </Button>
            <div className="flex items-center gap-3 text-xs text-muted">
              <span className="h-px flex-1 bg-line" /> ou <span className="h-px flex-1 bg-line" />
            </div>
            <Button type="button" variant="gold" disabled={submitting} onClick={() => void handleTwitch()}>
              Entrar com a Twitch
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="mt-8 flex flex-col gap-4">
            <label className="flex flex-col gap-2 text-sm">
              Código recebido por e-mail
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6,10}"
                maxLength={10}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\s/g, ''))}
                className="rounded-md border border-line bg-panel px-4 py-3 tracking-[0.3em] text-white outline-none focus:border-gold"
                placeholder="00000000"
              />
            </label>
            <Button type="submit" variant="gold" disabled={submitting}>
              {submitting ? 'Verificando...' : 'Confirmar'}
            </Button>
          </form>
        )}

        {message && <p className="mt-6 text-sm text-muted">{message}</p>}
      </Container>
    </section>
  )
}
