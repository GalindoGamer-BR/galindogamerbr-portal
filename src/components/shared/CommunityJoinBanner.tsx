import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Container } from '../ui/Container'
import { NavButton } from '../ui/Button'

const benefits = [
  {
    label: 'Sua comunidade', number: '01', icon: 'community', available: true,
    title: 'MAIS PERTO DO GALINDO.',
    description: 'Crie seu perfil, conecte sua conta TikTok e faça parte da comunidade do canal.',
    detail: 'Seu espaço no portal, com acesso à sua conta e controle do seu cadastro.',
  },
  {
    label: 'Seu voto', number: '02', icon: 'vote', available: false,
    title: 'AJUDE A ESCOLHER O PRÓXIMO CONTEÚDO.',
    description: 'Votações exclusivas para membros cadastrados: participe das escolhas de novos conteúdos do canal.',
    detail: 'Estamos preparando as votações. Cadastre-se para ter sua conta pronta.',
  },
  {
    label: 'Novidades', number: '03', icon: 'news', available: false,
    title: 'FIQUE POR DENTRO DO CANAL.',
    description: 'Um feed para acompanhar novidades, avisos e os próximos conteúdos do Galindo.',
    detail: 'O feed de notícias está chegando ao portal da comunidade.',
  },
] as const

function BenefitIcon({ kind }: { kind: string }) {
  return <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-20 w-20 sm:h-28 sm:w-28">
    {kind === 'vote' ? <><path d="M23 38 15 47v20h50V47l-8-9M15 47h50M30 55h20"/><path d="m29 12 27 11-12 29-27-11z"/><path d="m29 29 4 8 12-8"/></> :
      kind === 'news' ? <><rect x="15" y="13" width="50" height="54" rx="5"/><path d="M24 25h32M42 37h14M42 45h14M24 56h32"/><rect x="24" y="35" width="10" height="12" rx="1"/></> :
      <><circle cx="40" cy="26" r="10"/><path d="M23 62v-6a17 17 0 0 1 34 0v6M17 24a8 8 0 0 0 0 16M63 24a8 8 0 0 1 0 16M11 59v-7a11 11 0 0 1 10-11M69 59v-7a11 11 0 0 0-10-11"/><path d="M33 61h14"/></>}
  </svg>
}

export function CommunityJoinBanner() {
  const [active, setActive] = useState(0)
  const benefit = benefits[active]
  return <section aria-labelledby="community-join-title" className="pt-8 sm:pt-12">
    <Container>
      <div className="relative isolate overflow-hidden rounded-2xl border border-gold/30 bg-[#111315] shadow-xl">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative grid gap-6 p-6 sm:p-9 lg:grid-cols-[1fr_220px] lg:gap-12">
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-gold">A comunidade também é sua</p>
            <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Explore os benefícios do cadastro">
              {benefits.map((item, i) => <button key={item.label} type="button" aria-pressed={active === i} aria-controls="community-benefit" onClick={() => setActive(i)}
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold ${active === i ? 'border-gold bg-gold text-bg' : 'border-white/15 text-white/70 hover:border-gold/60 hover:text-white'}`}>
                {item.label}
              </button>)}
            </div>
            <div id="community-benefit" aria-live="polite" aria-atomic="true" className="min-h-[200px] sm:min-h-[180px]">
              <span className={`mb-3 inline-flex rounded border px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${benefit.available ? 'border-green/30 bg-green/10 text-green' : 'border-gold/25 bg-gold/10 text-gold'}`}>{benefit.available ? 'Já disponível' : 'Em breve'}</span>
              <h2 id="community-join-title" className="max-w-2xl text-2xl leading-tight sm:text-3xl">{benefit.title}</h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">{benefit.description}</p>
              <p className="mt-2 max-w-xl text-xs leading-relaxed text-muted">{benefit.detail}</p>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <NavButton to="/login" variant="gold">Quero fazer parte <span aria-hidden="true">→</span></NavButton>
              <Link to="/conta" className="text-sm text-white/70 underline underline-offset-4 transition hover:text-gold">Já tenho uma conta</Link>
            </div>
          </div>
          <div aria-hidden="true" className="hidden flex-col items-center justify-center gap-6 rounded-xl border border-white/5 bg-white/[0.02] text-gold lg:flex">
            <span className="text-[10px] uppercase tracking-[0.25em] text-white/40">GalindoGamerBR</span>
            <BenefitIcon kind={benefit.icon} />
            <span className="text-5xl font-extrabold text-gold/20">{benefit.number}<span className="text-lg text-white/20"> / 03</span></span>
          </div>
        </div>
      </div>
    </Container>
  </section>
}
