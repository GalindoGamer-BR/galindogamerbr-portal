import { Link } from 'react-router-dom'

type HubLinkProps = {
  icon: string
  eyebrow: string
  title: string
  description: string
  href: string
}

const CARD_CLASSNAME = 'group relative flex min-h-64 flex-col overflow-hidden rounded-lg border border-line bg-gradient-to-br from-panel to-panel2 p-6 transition duration-300 hover:-translate-y-1 hover:border-gold/60 hover:shadow-[0_18px_45px_-25px_rgba(217,177,79,0.65)]'

function HubLinkContent({ icon, eyebrow, title, description }: Omit<HubLinkProps, 'href'>) {
  return (
    <>
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-line bg-bg/50 text-2xl transition duration-300 group-hover:scale-110 group-hover:border-gold/50">{icon}</span>
      <span className="mt-5 text-xs font-semibold uppercase tracking-widest text-gold">{eyebrow}</span>
      <h3 className="mt-1 text-lg">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{description}</p>
      <span className="mt-6 text-sm font-semibold text-white/70 transition group-hover:translate-x-1 group-hover:text-gold">Acessar</span>
    </>
  )
}

// href começando com "/" é rota interna (ex: Mod Sync em /mods) — navega
// via react-router, sem nova aba nem recarregar a página. Qualquer outro
// href é link externo de verdade (WhatsApp, Discord, etc.), abre em aba nova.
export function HubLink({ icon, eyebrow, title, description, href }: HubLinkProps) {
  if (href.startsWith('/')) {
    return (
      <Link to={href} className={CARD_CLASSNAME}>
        <HubLinkContent icon={icon} eyebrow={eyebrow} title={title} description={description} />
      </Link>
    )
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={CARD_CLASSNAME}>
      <HubLinkContent icon={icon} eyebrow={eyebrow} title={title} description={description} />
    </a>
  )
}
