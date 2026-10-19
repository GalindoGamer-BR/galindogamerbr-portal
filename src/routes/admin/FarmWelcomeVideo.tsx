import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { AdminHeader } from '../../components/admin/AdminHeader'
import { Button } from '../../components/ui/Button'
import { Container } from '../../components/ui/Container'
import { useSession } from '../../hooks/useSession'
import { getAdminFarmVideos, setFarmVideos } from '../../lib/api/farm'
import { logout } from '../../lib/api/auth'

export function FarmWelcomeVideo() {
  const { email, loading: sessionLoading, refresh } = useSession()
  const [welcomeInput, setWelcomeInput] = useState('')
  const [rulesInput, setRulesInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<'welcome' | 'rules' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<'welcome' | 'rules' | null>(null)

  useEffect(() => {
    if (!email) return
    getAdminFarmVideos()
      .then((videos) => {
        setWelcomeInput(`https://www.youtube.com/watch?v=${videos.welcomeVideoId}`)
        setRulesInput(`https://www.youtube.com/watch?v=${videos.rulesVideoId}`)
      })
      .catch(() => setError('Não foi possível carregar os vídeos atuais.'))
      .finally(() => setLoading(false))
  }, [email])

  async function handleLogout() {
    await logout()
    refresh()
  }

  async function handleSave(target: 'welcome' | 'rules') {
    setSaving(target)
    setError(null)
    setSaved(null)
    const result = await setFarmVideos(welcomeInput, rulesInput)
    setSaving(null)

    if (!result.ok) {
      setError('Informe uma URL válida do YouTube ou o ID do vídeo.')
      return
    }

    setWelcomeInput(`https://www.youtube.com/watch?v=${result.videos.welcomeVideoId}`)
    setRulesInput(`https://www.youtube.com/watch?v=${result.videos.rulesVideoId}`)
    setSaved(target)
  }

  if (sessionLoading) return null
  if (!email) return <Navigate to="/login" replace />

  return (
    <section className="py-16 sm:py-24">
      <Container className="max-w-xl">
        <AdminHeader title="CONFIGURAÇÃO DE VÍDEOS" email={email} onLogout={handleLogout} backTo="/admin" />

        <div className="mt-6 space-y-4">
          <div className="rounded-lg border border-gold/35 bg-panel p-6">
            <span className="text-xs font-bold uppercase tracking-widest text-gold">Página Boas vindas</span>
            <label className="mt-2 block text-xl font-semibold text-white" htmlFor="farm-welcome-video">
              Vídeo de boas vindas
            </label>
            <p className="mt-1 text-xs leading-relaxed text-muted">Mensagem apresentada a quem está conhecendo o canal e a comunidade.</p>
            <input
              id="farm-welcome-video"
              type="text"
              value={welcomeInput}
              onChange={(event) => setWelcomeInput(event.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="mt-4 w-full rounded-lg border border-line bg-panel2 px-4 py-2 text-sm text-white outline-none focus:border-gold"
              disabled={loading}
            />
            <Button
              className="mt-4"
              variant="gold"
              size="sm"
              onClick={() => handleSave('welcome')}
              disabled={loading || saving !== null || !welcomeInput.trim() || !rulesInput.trim()}
            >
              {saving === 'welcome' ? 'Salvando…' : 'Salvar vídeo de boas vindas'}
            </Button>
            {saved === 'welcome' && <p className="mt-3 text-xs text-gold">Vídeo de boas vindas atualizado.</p>}
          </div>

          <div className="rounded-lg border border-green/35 bg-panel p-6">
            <span className="text-xs font-bold uppercase tracking-widest text-green">Página Fazenda</span>
            <label className="mt-2 block text-xl font-semibold text-white" htmlFor="farm-rules-video">
              Vídeo das regras da Fazenda
            </label>
            <p className="mt-1 text-xs leading-relaxed text-muted">Orientações exibidas no card de requisitos para entrar na Fazenda Nova Aliança.</p>
            <input
              id="farm-rules-video"
              type="text"
              value={rulesInput}
              onChange={(event) => setRulesInput(event.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="mt-4 w-full rounded-lg border border-line bg-panel2 px-4 py-2 text-sm text-white outline-none focus:border-green"
              disabled={loading}
            />
            <Button
              className="mt-4"
              variant="green"
              size="sm"
              onClick={() => handleSave('rules')}
              disabled={loading || saving !== null || !welcomeInput.trim() || !rulesInput.trim()}
            >
              {saving === 'rules' ? 'Salvando…' : 'Salvar vídeo das regras'}
            </Button>
            {saved === 'rules' && <p className="mt-3 text-xs text-green">Vídeo das regras atualizado.</p>}
          </div>

          <p className="px-1 text-xs text-muted">Os campos aceitam link normal, youtu.be, embed, Shorts ou o ID de 11 caracteres.</p>
          {error && <p className="mt-3 text-xs text-red">{error}</p>}
        </div>
      </Container>
    </section>
  )
}
