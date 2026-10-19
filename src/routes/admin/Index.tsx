import { Link, Navigate } from 'react-router-dom'
import { Container } from '../../components/ui/Container'
import { AdminHeader } from '../../components/admin/AdminHeader'
import { useSession } from '../../hooks/useSession'
import { logout } from '../../lib/api/auth'

// Instagram escondido do painel por enquanto — a rota /admin/instagram
// continua funcionando, só não aparece linkada aqui.
const SECTIONS = [
  {
    label: 'Programação',
    description: 'Editor da grade de horários da semana.',
    to: '/admin/programacao',
    icon: '/assets/icons/schedule.svg',
  },
  {
    label: 'TikTok',
    description: 'Conectar a conta pra sincronizar seguidores.',
    to: '/admin/tiktok',
    icon: '/assets/icons/tiktok.svg',
  },
  {
    label: 'Discord',
    description: 'Trocar o link do convite usado em /discord.',
    to: '/admin/discord',
    icon: '/assets/icons/discord.svg',
  },
  {
    label: 'Configuração de vídeos',
    description: 'Configurar os vídeos de boas vindas e das regras da Fazenda.',
    to: '/admin/fazenda/video',
    icon: '/assets/icons/youtube.svg',
  },
]

export function AdminIndex() {
  const { email, loading, refresh } = useSession()

  async function handleLogout() {
    await logout()
    refresh()
  }

  if (loading) return null
  if (!email) return <Navigate to="/login" replace />

  return (
    <section className="py-16 sm:py-24">
      <Container>
        <AdminHeader title="PAINEL" email={email} onLogout={handleLogout} />

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {SECTIONS.map((section) => (
            <Link
              key={section.to}
              to={section.to}
              className="rounded-lg border border-line bg-panel p-6 transition-colors hover:border-gold/60"
            >
              <div className="flex items-center gap-3">
                <img src={section.icon} alt="" className="h-8 w-8 shrink-0 object-contain" />
                <span className="block text-base font-bold uppercase tracking-wide">{section.label}</span>
              </div>
              <span className="mt-2 block text-xs text-muted">{section.description}</span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  )
}
