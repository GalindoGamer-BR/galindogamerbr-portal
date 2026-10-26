import { useCommunityStats } from '../../hooks/useCommunityStats'
import { formatNumber } from '../../lib/formatNumber'

// Badge dentro do próprio Hero, logo abaixo dos botões de rede — total de
// visitas desde o início do site (ver
// workers/social-stats-cron/src/siteVisitsLifetime.ts e
// functions/api/community-stats.ts, resolveLifetimeVisits). Sem dado ainda
// (primeira visita antes do worker rodar, ou falha) — não mostra nada, nunca
// um "0" ou um traço genérico no lugar de um marco de verdade.
export function LifetimeVisitsBanner({ compact = false }: { compact?: boolean }) {
  const stats = useCommunityStats()
  const visits = stats?.siteVisits.lifetimeVisits

  if (!visits) return null

  // Versão sem caixa própria, para ficar dentro do painel do Hero junto da barra de redes.
  if (compact) {
    return (
      <p className="inline-flex items-center gap-2.5 text-sm text-[#dfe6ec]">
        <span className="text-lg">🏆</span>
        <span>
          <span className="font-bold text-gold">{formatNumber(visits)}</span> pessoas já passaram por aqui
        </span>
      </p>
    )
  }

  return (
    <div className="mt-2 inline-flex w-fit items-center gap-3 rounded-lg border border-gold/40 bg-panel px-6 py-3 shadow-[0_0_30px_-12px_rgba(217,177,79,0.4)]">
      <span className="text-2xl">🏆</span>
      <p className="text-sm text-[#dfe6ec]">
        <span className="text-lg font-bold text-gold">{formatNumber(visits)}</span> pessoas já passaram por aqui
      </p>
    </div>
  )
}
