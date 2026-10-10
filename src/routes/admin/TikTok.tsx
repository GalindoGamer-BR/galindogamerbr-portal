import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Container } from '../../components/ui/Container'
import { AdminHeader } from '../../components/admin/AdminHeader'
import { Button } from '../../components/ui/Button'
import { useSession } from '../../hooks/useSession'
import { logout } from '../../lib/api/auth'
import { disconnectTiktok, getTiktokStatus, startTiktokAuthorize, type TiktokStatus } from '../../lib/api/tiktok'

// Conectar uma vez aqui autoriza o worker (workers/social-stats-cron) a
// buscar o número de seguidores via TikTok Login Kit (user.info.stats) —
// ele renova o token sozinho a cada rodada, não precisa logar de novo.
export function TikTok() {
  const { email, loading: sessionLoading, refresh } = useSession()
  const [status, setStatus] = useState<TiktokStatus | null>(null)
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
    if (!email) return
    getTiktokStatus().then(setStatus)
  }, [email])

  async function handleLogout() {
    await logout()
    refresh()
  }

  async function handleDisconnect() {
    if (!window.confirm('Desvincular a conta do TikTok? A sincronização de seguidores para de funcionar até reconectar.')) return
    setDisconnecting(true)
    await disconnectTiktok()
    setStatus(await getTiktokStatus())
    setDisconnecting(false)
  }

  if (sessionLoading) return null
  if (!email) return <Navigate to="/admin/login" replace />

  return (
    <section className="py-16 sm:py-24">
      <Container className="max-w-xl">
        <AdminHeader title="CONECTAR TIKTOK" email={email} onLogout={handleLogout} backTo="/admin" />

        <div className="mt-6 rounded-lg border border-line bg-panel p-6">
          {status === null ? (
            <p className="text-sm text-muted">Carregando…</p>
          ) : status.connected ? (
            <>
              <div className="flex items-center gap-3">
                {status.avatarUrl && (
                  <img src={status.avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                )}
                <p className="text-sm text-white">
                  ✅ Conectado{status.username ? <> como <span className="font-semibold">{status.username}</span></> : null}.
                </p>
              </div>
              <p className="mt-2 text-xs text-muted">Última renovação: {status.updatedAt}</p>
              <div className="mt-4 flex gap-3">
                <Button variant="gold" size="sm" onClick={() => void startTiktokAuthorize()}>
                  Reconectar
                </Button>
                <Button variant="red" size="sm" onClick={handleDisconnect} disabled={disconnecting}>
                  {disconnecting ? 'Desvinculando…' : 'Desvincular'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-white">Ainda não conectado.</p>
              <p className="mt-1 text-xs text-muted">
                Clique no botão abaixo, entre com a conta do TikTok do canal e autorize. Isso só precisa ser feito uma vez.
              </p>
              <Button variant="gold" size="sm" className="mt-4" onClick={() => void startTiktokAuthorize()}>
                Conectar TikTok
              </Button>
            </>
          )}
        </div>
      </Container>
    </section>
  )
}
