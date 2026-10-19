import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Container } from '../../components/ui/Container'
import { AdminHeader } from '../../components/admin/AdminHeader'
import { Button } from '../../components/ui/Button'
import { useSession } from '../../hooks/useSession'
import { logout } from '../../lib/api/auth'
import { getDiscordInvite, setDiscordInvite } from '../../lib/api/discord'

// Editar aqui muda o destino de /discord (functions/discord.ts) e, com isso,
// todo botão "Entrar no Discord" do site que usa esse link em vez do convite
// cru — não precisa de deploy quando o convite expira/é revogado.
export function Discord() {
  const { email, loading: sessionLoading, refresh } = useSession()
  const [url, setUrl] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!email) return
    getDiscordInvite().then((current) => {
      setUrl(current)
      setInput(current ?? '')
    })
  }, [email])

  async function handleLogout() {
    await logout()
    refresh()
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)
    const result = await setDiscordInvite(input.trim())
    setSaving(false)
    if (!result.ok) {
      setError(result.error === 'invalid_url' ? 'Link inválido. Use um endereço discord.com ou discord.gg.' : 'Falha ao salvar.')
      return
    }
    setUrl(result.url)
    setSaved(true)
  }

  if (sessionLoading) return null
  if (!email) return <Navigate to="/login" replace />

  return (
    <section className="py-16 sm:py-24">
      <Container className="max-w-xl">
        <AdminHeader title="CONVITE DO DISCORD" email={email} onLogout={handleLogout} backTo="/admin" />

        <div className="mt-6 rounded-lg border border-line bg-panel p-6">
          {url === null ? (
            <p className="text-sm text-muted">Carregando…</p>
          ) : (
            <>
              <label className="block text-xs font-semibold uppercase tracking-wide text-muted" htmlFor="discord-url">
                Link do convite
              </label>
              <input
                id="discord-url"
                type="url"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  setSaved(false)
                }}
                placeholder="https://discord.com/invite/..."
                className="mt-2 w-full rounded-lg border border-line bg-panel2 px-4 py-2 text-sm text-white outline-none focus:border-gold"
              />
              {error && <p className="mt-2 text-xs text-red">{error}</p>}
              <div className="mt-4 flex items-center gap-3">
                <Button variant="gold" size="sm" onClick={handleSave} disabled={saving || !input.trim()}>
                  {saving ? 'Salvando…' : 'Salvar'}
                </Button>
                {saved && <span className="text-xs text-muted">Salvo ✓</span>}
              </div>
              <p className="mt-4 text-xs text-muted">
                Todo link "Entrar no Discord" do site aponta pra{' '}
                <code className="rounded bg-panel2 px-1 py-0.5">galindogamerbr.com.br/discord</code>, que redireciona pra esse
                link. Troca aqui sempre que o convite atual expirar ou for revogado.
              </p>
            </>
          )}
        </div>
      </Container>
    </section>
  )
}
