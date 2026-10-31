import { useEffect } from 'react'
import { Container } from '../components/ui/Container'
import { Eyebrow } from '../components/ui/Eyebrow'
import { Reveal } from '../components/ui/Reveal'
import { LinkButton } from '../components/ui/Button'
import { Tabs, type TabItem } from '../components/ui/Tabs'
import { FarmStatusCard } from '../components/shared/FarmStatusCard'
import { VipSteps } from '../components/shared/VipSteps'
import { farmStatusEnabled } from '../features/multichat/flags'
import { GAMES } from '../data/games'
import { PLAY_TOGETHER_OPEN, PLAY_TOGETHER_VIP, type PlayTogetherGame } from '../data/playTogether'

// Hashes antigos (#fazenda, #outros-jogos, #participar) continuam abrindo uma aba; a fazenda deixou de ser o foco.
const TABS: TabItem[] = [
  { id: 'como-entrar', label: 'Como entrar', hashAliases: ['participar'] },
  { id: 'servidores-abertos', label: 'Servidores abertos', hashAliases: ['outros-jogos'] },
  { id: 'coop-vip', label: 'Coop com VIP', hashAliases: ['fazenda', 'fazenda-nova-alianca', 'coop'] },
]

// Card genérico dos grids — hover sutil (zoom no ícone + borda dourada), mesma linguagem usada no resto do site
// (CommunityStatsGrid, HubLink) pra não destoar visualmente.
const INFO_CARD_CLASSNAME = 'group rounded-lg border border-line bg-bg/50 p-5 transition duration-300 hover:-translate-y-1 hover:border-gold/60 hover:shadow-[0_16px_40px_-28px_rgba(217,177,79,0.8)]'

type StepCardProps = { n: string; title: string; text: string; cta: string; href: string; external?: boolean }

// O card inteiro é o link: clicar em qualquer ponto dele faz a ação, e `cta` é só o rótulo visual da ação.
function StepCard({ n, title, text, cta, href, external }: StepCardProps) {
  const className = 'group flex w-full gap-4 rounded-xl border border-line bg-bg/50 p-5 text-left transition duration-300 hover:-translate-y-0.5 hover:border-gold/60 hover:bg-bg/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold sm:p-6'
  return (
    <a href={href} className={className} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-gold bg-gold/10 text-base font-bold text-gold">{n}</span>
      <span className="min-w-0">
        <span className="block font-display text-xl leading-tight tracking-wide">{title}</span>
        <span className="mt-1.5 block text-base leading-relaxed text-white/80">{text}</span>
        <span className="mt-3 block font-display text-base tracking-wide text-gold group-hover:underline">{cta}</span>
      </span>
    </a>
  )
}

function GameCards({ games }: { games: PlayTogetherGame[] }) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {games.map((item) => {
        const game = GAMES.find((entry) => entry.slug === item.slug)
        const title = item.title ?? game?.title ?? item.slug
        const image = item.image ?? game?.image
        return (
          <article key={item.slug} className={`${INFO_CARD_CLASSNAME} overflow-hidden !p-0`}>
            {image ? <img src={image} alt="" loading="lazy" className="aspect-video w-full object-cover" /> : null}
            <div className="p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base">{title}</h3>
                <span className="rounded-full border border-line px-2.5 py-0.5 text-xs font-semibold text-gold">{item.channel}</span>
                {item.access === 'vip' ? (
                  <span className="rounded-full border border-purple/50 bg-purple/15 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-white">Somente VIP</span>
                ) : null}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.text}</p>
            </div>
          </article>
        )
      })}
    </div>
  )
}

// Resumo do que a pessoa precisa para entrar, no lugar do card de status do servidor (desligado por flag).
function AccessSummary() {
  return (
    <div className="grid gap-3 rounded-xl border border-gold/40 bg-panel2 p-5 sm:p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-gold">O que você precisa</p>
      <div className="rounded-lg border border-line bg-bg/50 p-4">
        <h3 className="text-base">SERVIDOR ABERTO</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted">Wardogs, War Thunder, Hell Let Loose e ETS2: basta ser seguidor do canal.</p>
      </div>
      <div className="rounded-lg border border-purple/50 bg-purple/10 p-4">
        <h3 className="text-base">COOP RESTRITO</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted">Construction Simulator e SnowRunner: só para membros VIP.</p>
      </div>
    </div>
  )
}

// Página única de "como jogar com o Galindo": os jogos em que ele joga junto com a comunidade, separados pelo que a pessoa
// precisa para entrar. Servidor aberto (Wardogs, War Thunder, Hell Let Loose...) pede só seguir o canal; coop restrito pede
// VIP. Um único botão cheio (Discord, que é por onde tudo começa); o resto vive em abas, sem sair da página; o VIP é uma
// seção própria, fora das abas. Substitui a antiga /fazenda (que continua como alias em App.tsx).
export function Jogar() {
  // #vip aponta para a seção do VIP, que fica fora das abas. Vindo de outra página o Layout rola para o topo a cada
  // troca de rota, por isso a rolagem espera um instante.
  useEffect(() => {
    const scrollToBlock = (hash: string) => {
      if (hash === '#vip') window.setTimeout(() => document.getElementById('vip')?.scrollIntoView({ block: 'start' }), 60)
    }
    scrollToBlock(window.location.hash)
    const onHashChange = (event: HashChangeEvent) => scrollToBlock(`#${event.newURL.split('#')[1] ?? ''}`)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const renderPanel = (id: string) => {
    if (id === 'servidores-abertos') {
      return (
        <div>
          <p className="max-w-2xl text-muted">Jogos com servidor aberto: não precisa de VIP, basta seguir o canal. Cada jogo tem o seu canal no Discord: entre no servidor, escolha o canal e combine com a galera.</p>
          <GameCards games={PLAY_TOGETHER_OPEN} />
          <a
            href="/discord"
            target="_blank"
            rel="noopener noreferrer"
            className={`${INFO_CARD_CLASSNAME} mt-4 block overflow-hidden !border-gold/60 !p-0 sm:max-w-md`}
          >
            <img src="/assets/banners/sugestao-jogos.webp" alt="" loading="lazy" className="aspect-video w-full object-cover" />
            <div className="p-5">
              <h3 className="font-display text-base tracking-wide">FIQUE À VONTADE PARA SUGERIR NOVOS JOGOS</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/80">Quer jogar outra coisa com a gente? Conte no Discord.</p>
            </div>
          </a>
          <div className="mt-8">
            <LinkButton variant="gold" href="/discord" target="_blank" rel="noopener noreferrer">Entrar no Discord</LinkButton>
          </div>
        </div>
      )
    }

    if (id === 'coop-vip') {
      return (
        <div>
          <p className="max-w-2xl text-muted">Jogos cooperativos restritos: a entrada é só para membros VIP. Veja logo abaixo como virar VIP e pedir a liberação.</p>
          <GameCards games={PLAY_TOGETHER_VIP} />
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <LinkButton variant="gold" href="#vip">Como virar VIP</LinkButton>
            <LinkButton variant="blue" href="/discord" target="_blank" rel="noopener noreferrer">Entrar no Discord</LinkButton>
          </div>
        </div>
      )
    }

    return (
      <div>
        <div className="flex items-start gap-4 rounded-xl border-2 border-gold bg-gold/10 p-5 sm:items-center sm:p-6">
          <span className="text-4xl leading-none" aria-hidden="true">🔞</span>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gold">Requisito principal</p>
            <h2 className="mt-1 text-2xl sm:text-3xl">PARA JOGAR, VOCÊ PRECISA TER 18 ANOS OU MAIS</h2>
            <p className="mt-1.5 text-base text-white/80">Vale para os jogos em comunidade, sem exceção.</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <StepCard n="1" title="Entre no Discord" text="É por lá que tudo começa: avisos, regras e o canal de cada jogo." cta="Entrar no Discord" href="/discord" external />
          <StepCard n="2" title="Leia as regras" text="As regras ficam fixadas no Discord. Leia antes de entrar em qualquer partida." cta="Ir para o Discord" href="/discord" external />
          <StepCard n="3" title="Siga o canal" text="Para os jogos de servidor aberto, como Wardogs, War Thunder e Hell Let Loose, basta ser seguidor." cta="Ver servidores abertos" href="#servidores-abertos" />
          <StepCard n="4" title="Seja VIP para o coop" text="Os jogos cooperativos restritos, como Construction Simulator e SnowRunner, são para membros VIP." cta="Ir para o VIP" href="#vip" />
        </div>
      </div>
    )
  }

  return (
    <>
      <section className="relative isolate overflow-hidden py-16 sm:py-24">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_25%,rgba(217,177,79,0.16),transparent_36%),radial-gradient(circle_at_85%_70%,rgba(56,163,90,0.12),transparent_38%)]" />
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
            <Reveal>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <Eyebrow>Jogue com o Galindo</Eyebrow>
                  <span className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-gold">Jogos em comunidade</span>
                </div>
                <h1 className="mt-5 text-5xl leading-[0.92] sm:text-6xl">VENHA JOGAR COM A GENTE.</h1>
                <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
                  Servidores abertos para quem segue o canal e coop exclusivo para VIPs. Tudo começa no Discord.
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <LinkButton variant="gold" href="/discord" target="_blank" rel="noopener noreferrer">Entrar no Discord</LinkButton>
                  <a href="#vip" className="text-sm font-semibold text-gold hover:underline">Como virar VIP</a>
                </div>
              </div>
            </Reveal>
            <Reveal>
              <div className="relative">
                <div className="absolute -inset-5 -z-10 rounded-full bg-gold/10 blur-3xl" />
                {farmStatusEnabled ? <FarmStatusCard /> : <AccessSummary />}
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="border-t border-line py-12 sm:py-16">
        <Container>
          <div className="rounded-2xl border border-line bg-panel p-5 shadow-[0_24px_70px_-50px_rgba(0,0,0,0.9)] sm:p-8">
            <Tabs tabs={TABS} defaultId="como-entrar" idPrefix="jogar" ariaLabel="Como jogar com o Galindo" renderPanel={renderPanel} />
          </div>
        </Container>
      </section>

      <section id="vip" className="scroll-mt-24 py-12 sm:py-16">
        <Reveal>
          <Container>
            <VipSteps variant="full" />
          </Container>
        </Reveal>
      </section>
    </>
  )
}
