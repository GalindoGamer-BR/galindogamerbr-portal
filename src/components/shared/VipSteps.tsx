import { Eyebrow } from '../ui/Eyebrow'
import { LinkButton } from '../ui/Button'

// Critério de entrada: um dos dois qualifica (não os dois ao mesmo tempo).
const ELIGIBILITY = [
  { title: 'YouTube', text: 'Membro Ouro ou acima.', icon: 'youtube' },
  { title: 'TikTok', text: 'Super Fan.', icon: 'tiktok' },
]

// Passos de verdade, sequenciais, depois de já se qualificar por um dos critérios acima.
const STEPS = [
  { n: '01', title: 'Discord', text: 'Entrar e acessar as regras.' },
  { n: '02', title: 'Regras', text: 'Assistir ao vídeo e ler tudo.' },
  { n: '03', title: 'Solicitação', text: 'Estar de acordo e solicitar entrada.' },
  { n: '04', title: 'Liberação', text: 'Conferência dos requisitos pelo administrador.' },
] as const

type VipStepsProps = {
  variant?: 'full' | 'compact'
}

// Fonte única do fluxo VIP — usado completo na aba VIP de /jogar e resumido no
// teaser da Home, pra nunca dessincronizar as regras entre os lugares.
export function VipSteps({ variant = 'full' }: VipStepsProps) {
  return (
    <div className="relative isolate overflow-hidden rounded-xl border border-gold/40 bg-panel p-6 shadow-[0_20px_65px_-40px_rgba(217,177,79,0.65)] sm:p-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_0%,rgba(217,177,79,0.14),transparent_35%),radial-gradient(circle_at_92%_100%,rgba(74,103,255,0.12),transparent_32%)]" />

      <div className={variant === 'compact' ? 'grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]' : ''}>
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-gold/40 bg-gold/10 text-2xl">🌟</span>
            <div>
              <Eyebrow>Área VIP</Eyebrow>
              <span className="text-xs font-semibold uppercase tracking-widest text-white/40">Apoie e participe</span>
            </div>
          </div>

          <h2 className="mt-5 text-3xl sm:text-4xl">MAIS PERTO DO CANAL. MAIS PERTO DA COMUNIDADE.</h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
            O grupo VIP reúne quem fortalece o canal e ajuda a manter vivos o servidor, os projetos e toda a resenha
            que construímos juntos.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {['Grupo exclusivo', 'Acesso à Fazenda', 'Contato com a comunidade'].map((benefit) => (
              <span key={benefit} className="rounded-full border border-line bg-bg/40 px-3 py-1.5 text-xs font-semibold text-white/75">
                {benefit}
              </span>
            ))}
          </div>
        </div>

        {variant === 'compact' && (
          <div className="rounded-lg border border-gold/40 bg-bg/45 p-5 sm:p-6">
            <span className="text-xs font-semibold uppercase tracking-widest text-gold">Como entrar</span>
            <h3 className="mt-1 text-2xl">JÁ APOIA O CANAL?</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Membros Ouro do YouTube e Super Fans do TikTok podem solicitar acesso ao grupo VIP.
            </p>

            <div className="mt-5 grid gap-3">
              <LinkButton variant="blue" href="/discord" target="_blank" rel="noopener noreferrer" className="w-full">
                Entrar no Discord
              </LinkButton>
              <LinkButton
                variant="gold"
                href="https://chat.whatsapp.com/JpsiqErWdAx3pHqvVSbp7R"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                Solicitar entrada VIP
              </LinkButton>
            </div>
            <p className="mt-4 text-xs text-white/45">A equipe confere os requisitos antes de liberar o acesso.</p>
          </div>
        )}
      </div>

      {variant === 'full' && (
        <>
          <div className="mt-6">
            <span className="text-xs font-semibold uppercase tracking-widest text-gold">Critério de entrada (um dos dois)</span>
            <div className="mt-2 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
              {ELIGIBILITY.map((item, index) => (
                <div key={item.title} className="flex flex-1 items-center gap-2 sm:contents">
                  <div className="flex flex-1 items-center gap-3 rounded-md border border-line bg-panel2 p-4">
                    <img src={`/assets/icons/${item.icon}.svg`} alt="" className="h-6 w-6 shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold uppercase tracking-wide">{item.title}</h4>
                      <p className="mt-1 text-xs text-muted">{item.text}</p>
                    </div>
                  </div>
                  {index === 0 && (
                    <span className="shrink-0 self-center rounded-full border border-gold/40 px-2 py-1 text-xs font-bold text-gold">
                      OU
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {STEPS.map((step) => (
              <div key={step.n} className="rounded-md border border-line bg-panel2 p-4">
                <span className="text-sm font-bold text-gold">{step.n}</span>
                <h4 className="mt-1 text-sm font-semibold uppercase tracking-wide">{step.title}</h4>
                <p className="mt-1 text-xs text-muted">{step.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <LinkButton variant="blue" href="/discord" target="_blank" rel="noopener noreferrer">
              Entrar no Discord
            </LinkButton>
            <LinkButton
              variant="gold"
              href="https://chat.whatsapp.com/JpsiqErWdAx3pHqvVSbp7R"
              target="_blank"
              rel="noopener noreferrer"
            >
              Solicitar entrada VIP
            </LinkButton>
          </div>
          <p className="mt-4 text-xs text-muted">A equipe confere os requisitos antes de liberar o acesso.</p>
        </>
      )}
    </div>
  )
}
