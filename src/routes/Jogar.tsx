import { useEffect, useId, useState } from 'react'
import { Container } from '../components/ui/Container'
import { Eyebrow } from '../components/ui/Eyebrow'
import { Reveal } from '../components/ui/Reveal'
import { LinkButton, NavButton } from '../components/ui/Button'
import { Tabs, type TabItem } from '../components/ui/Tabs'
import { FarmStatusCard } from '../components/shared/FarmStatusCard'
import { VipSteps } from '../components/shared/VipSteps'
import { Modal } from '../components/ui/Modal'
import { VideoEmbed } from '../components/shared/VideoEmbed'
import { getFarmVideos } from '../lib/api/farm'
import { useFlagshipVideos } from '../hooks/useFlagshipVideo'
import { FAZENDA_NOVA_ALIANCA, GAMES } from '../data/games'
import { PLAY_TOGETHER } from '../data/playTogether'

const FARM_RULES_VIDEO_ID = 'TcBrAo_A1Lc'

// Lista de mods do servidor dedicado, a mesma exibida no card de status que
// o bot Guaxinim Comunista posta no Discord — pública, sem auth.
const SERVER_MODS_LIST_URL = 'http://galindoverso.gamesservers.io:9017/mods.html'

const TABS: TabItem[] = [
  { id: 'como-entrar', label: 'Como entrar', hashAliases: ['participar'] },
  { id: 'fazenda', label: 'Fazenda', hashAliases: ['fazenda-nova-alianca', 'mods'] },
  { id: 'outros-jogos', label: 'Outros jogos' },
]

const CONTRIBUTE_ITEMS = [
  { icon: '🚜', title: 'Jogue e participe', text: 'Entre no servidor e ajude no plantio, na produção e na expansão da fazenda durante as lives.' },
  { icon: '💬', title: 'Dê ideias nas lives', text: 'Sugestões de compra, construção e próximos passos ajudam a escrever a história da fazenda.' },
  { icon: '🛠️', title: 'Ajude a manter tudo no ar', text: 'Ser VIP contribui direto com os custos do servidor dedicado e dos projetos do canal.' },
  { icon: '📢', title: 'Divulgue o canal', text: 'Compartilhe clipes e momentos marcantes da fazenda nas redes sociais.' },
  { icon: '🤝', title: 'Acolha quem chegou agora', text: 'Receba bem os novos membros e ajude a explicar como tudo funciona por aqui.' },
  { icon: '🐛', title: 'Reporte problemas', text: 'Viu um bug, mod quebrado ou algo estranho no servidor? Avise um administrador.' },
] as const

const INTERACT_ITEMS = [
  { icon: '🎮', title: 'Chat do jogo', text: 'Converse e combine tarefas com quem estiver online na fazenda.' },
  { icon: '💻', title: 'Discord', text: 'Canais de texto e voz da comunidade, disponíveis mesmo fora das lives.' },
  { icon: '📱', title: 'WhatsApp', text: 'Grupo geral pra acompanhar avisos e trocar ideia fora do Discord.' },
  { icon: '📺', title: 'Chat da live', text: 'Participe do chat durante as transmissões, muita decisão da fazenda sai dali.' },
] as const

const MODS_SUMMARY = [
  'Instale o Mod Sync: é gratuito e roda no Windows.',
  'Escolha a pasta de mods do jogo e sincronize; ele baixa e atualiza tudo sozinho.',
  'Entre no servidor com os mods em dia.',
] as const

// Card genérico dos grids — hover sutil (zoom no ícone + borda dourada), mesma linguagem usada no resto do site
// (CommunityStatsGrid, HubLink) pra não destoar visualmente.
const INFO_CARD_CLASSNAME = 'group rounded-lg border border-line bg-bg/50 p-5 transition duration-300 hover:-translate-y-1 hover:border-gold/60 hover:shadow-[0_16px_40px_-28px_rgba(217,177,79,0.8)]'

function InfoCard({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className={INFO_CARD_CLASSNAME}>
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-bg/50 text-xl transition duration-300 group-hover:scale-110 group-hover:border-gold/40">{icon}</span>
      <h3 className="mt-4 text-base">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
    </div>
  )
}

type StepCardProps = { n: string; title: string; text: string; cta: string } & ({ href: string; external?: boolean; onClick?: never } | { onClick: () => void; href?: never; external?: never })

// O card inteiro é o link (ou o botão): clicar em qualquer ponto dele faz a ação, e `cta` é só o rótulo visual da ação.
function StepCard({ n, title, text, cta, href, external, onClick }: StepCardProps) {
  const className = 'group flex w-full gap-4 rounded-xl border border-line bg-bg/50 p-5 text-left transition duration-300 hover:-translate-y-0.5 hover:border-gold/60 hover:bg-bg/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold sm:p-6'
  const body = (
    <>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-gold bg-gold/10 text-base font-bold text-gold">{n}</span>
      <span className="min-w-0">
        <span className="block font-display text-xl leading-tight tracking-wide">{title}</span>
        <span className="mt-1.5 block text-base leading-relaxed text-white/80">{text}</span>
        <span className="mt-3 block font-display text-base tracking-wide text-gold group-hover:underline">{cta}</span>
      </span>
    </>
  )
  if (href) {
    return (
      <a href={href} className={className} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {body}
      </a>
    )
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {body}
    </button>
  )
}

// Página única de "como jogar com o Galindo": a Fazenda Nova Aliança (servidor de Farming Simulator 25) e os outros
// jogos em que ele joga junto com a comunidade. Um único botão cheio (Discord, que é por onde tudo começa); o resto vive
// em abas, sem sair da página; o VIP é uma seção própria, fora das abas. Substitui a antiga /fazenda (que continua como alias em App.tsx).
export function Jogar() {
  const rulesVideoTitleId = useId()
  const [rulesVideoOpen, setRulesVideoOpen] = useState(false)
  const [rulesVideoId, setRulesVideoId] = useState(FARM_RULES_VIDEO_ID)
  // Último episódio da série da fazenda (mesma fonte do carro-chefe de /conteudos), usado como imagem do cartão da aba.
  const [latestEpisode] = useFlagshipVideos()

  // #vip e #mods apontam para blocos da página (a seção do VIP e o bloco de mods dentro da aba Fazenda). Vindo de outra
  // página o Layout rola para o topo a cada troca de rota, e o bloco de mods só existe depois de a aba Fazenda abrir:
  // por isso a rolagem espera um instante.
  useEffect(() => {
    const scrollToBlock = (hash: string) => {
      const id = hash === '#vip' ? 'vip' : hash === '#mods' ? 'mods' : null
      if (id) window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }), 60)
    }
    scrollToBlock(window.location.hash)
    const onHashChange = (event: HashChangeEvent) => scrollToBlock(`#${event.newURL.split('#')[1] ?? ''}`)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    getFarmVideos().then((videos) => setRulesVideoId(videos.rulesVideoId)).catch(() => {})
  }, [])

  const renderPanel = (id: string) => {
    if (id === 'fazenda') {
      return (
        <div>
          <div className="grid items-center gap-6 overflow-hidden rounded-xl border border-gold/50 bg-panel2 bg-[radial-gradient(circle_at_0%_0%,rgba(217,177,79,0.22),transparent_50%),radial-gradient(circle_at_100%_100%,rgba(56,163,90,0.2),transparent_50%)] p-6 sm:p-8 md:grid-cols-[1.1fr_0.9fr]">
            <div>
              <Eyebrow>Farming Simulator 25</Eyebrow>
              <h2 className="mt-1 text-2xl sm:text-3xl">FAZENDA NOVA ALIANÇA</h2>
              <p className="mt-3 text-base leading-relaxed text-white/85">{FAZENDA_NOVA_ALIANCA.description}</p>
              <div className="mt-5 flex flex-wrap items-center gap-4">
                <LinkButton variant="green" href={FAZENDA_NOVA_ALIANCA.href} target="_blank" rel="noopener noreferrer">Ver a série no YouTube</LinkButton>
                <a href="#como-entrar" className="text-sm font-semibold text-gold hover:underline">Como entrar no servidor</a>
              </div>
            </div>
            {latestEpisode?.videoId ? (
              <a
                href={`https://www.youtube.com/watch?v=${latestEpisode.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block aspect-video overflow-hidden rounded-xl border border-gold/40 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)]"
              >
                <img src={latestEpisode.thumbnailUrl} alt={latestEpisode.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-4 text-sm font-semibold text-white">Assistir ao último episódio</span>
              </a>
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-xl border border-gold/30 bg-bg/40">
                <img src="/assets/logos/trator.webp" alt="" className="h-24 w-24 object-contain opacity-80" />
              </div>
            )}
          </div>

          <div id="mods" className="mt-6 scroll-mt-24 rounded-xl border border-line bg-bg/50 p-6 sm:p-8">
            <h3 className="text-2xl">MODS DA FAZENDA</h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">O servidor usa uma coleção própria de mods. Com o aplicativo oficial você não precisa baixar nada na mão.</p>
            <ol className="mt-5 grid gap-3 sm:grid-cols-3">
              {MODS_SUMMARY.map((item, index) => (
                <li key={item} className="rounded-lg border border-line bg-bg/40 p-4 text-sm leading-relaxed text-muted">
                  <span className="mb-2 block text-xs font-bold tracking-widest text-gold">0{index + 1}</span>
                  {item}
                </li>
              ))}
            </ol>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <NavButton variant="green" to="/mods">Baixar o Mod Sync</NavButton>
              <a href={SERVER_MODS_LIST_URL} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-gold hover:underline">
                Ver a lista de mods do servidor
              </a>
            </div>
          </div>

          <div className="mt-10 max-w-2xl">
            <Eyebrow>Uma fazenda feita em conjunto</Eyebrow>
            <h2 className="mt-1 text-2xl sm:text-3xl">TODO MUNDO AJUDA A FAZER A HISTÓRIA ACONTECER</h2>
            <p className="mt-2 text-muted">Participe do seu jeito: no servidor, nas lives ou fortalecendo a comunidade.</p>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CONTRIBUTE_ITEMS.map((item) => (
              <InfoCard key={item.title} {...item} />
            ))}
          </div>

          <div className="mt-12 max-w-2xl">
            <Eyebrow>A resenha continua</Eyebrow>
            <h2 className="mt-1 text-2xl sm:text-3xl">A FAZENDA VAI ALÉM DO JOGO</h2>
            <p className="mt-2 text-muted">Converse, combine tarefas e acompanhe as decisões em todos os espaços da comunidade.</p>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {INTERACT_ITEMS.map((item) => (
              <InfoCard key={item.title} {...item} />
            ))}
          </div>

        </div>
      )
    }

    if (id === 'outros-jogos') {
      return (
        <div>
          <p className="max-w-2xl text-muted">Além da fazenda, o Galindo joga com a comunidade em outros jogos. Cada jogo tem o seu canal no Discord: entre no servidor, escolha o canal e combine com a galera.</p>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PLAY_TOGETHER.map((item) => {
              const game = GAMES.find((entry) => entry.slug === item.slug)
              if (!game) return null
              return (
                <article key={item.slug} className={`${INFO_CARD_CLASSNAME} overflow-hidden !p-0`}>
                  {game.image ? <img src={game.image} alt="" loading="lazy" className="aspect-video w-full object-cover" /> : null}
                  <div className="p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base">{game.title}</h3>
                      <span className="rounded-full border border-line px-2.5 py-0.5 text-xs font-semibold text-gold">{item.channel}</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{item.text}</p>
                  </div>
                </article>
              )
            })}
          </div>
          <div className="mt-8">
            <LinkButton variant="gold" href="/discord" target="_blank" rel="noopener noreferrer">Entrar no Discord</LinkButton>
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
            <p className="mt-1.5 text-base text-white/80">Vale para o servidor da fazenda, sem exceção.</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <StepCard n="1" title="Entre no Discord" text="É por lá que tudo começa: avisos, regras e o canal de cada jogo." cta="Entrar no Discord" href="/discord" external />
          <StepCard n="2" title="Assista e leia as regras" text="Veja o vídeo das regras e leia as que ficam fixadas no Discord." cta="Assistir ao vídeo" onClick={() => setRulesVideoOpen(true)} />
          <StepCard n="3" title="Seja VIP" text="O acesso à fazenda é para membros VIP. Veja como virar VIP mais abaixo." cta="Ir para o VIP" href="#vip" />
          <StepCard n="4" title="Prepare os mods" text="Sincronize os mods do servidor antes de entrar, com um clique." cta="Ver os mods" href="#mods" />
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
                  <span className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-gold">Servidor da comunidade</span>
                </div>
                <h1 className="mt-5 text-5xl leading-[0.92] sm:text-6xl">VENHA JOGAR COM A GENTE.</h1>
                <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
                  A Fazenda Nova Aliança, no Farming Simulator 25, e outros jogos em comunidade. Tudo começa no Discord.
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <LinkButton variant="gold" href="/discord" target="_blank" rel="noopener noreferrer">Entrar no Discord</LinkButton>
                  <button type="button" onClick={() => setRulesVideoOpen(true)} className="text-sm font-semibold text-gold hover:underline">
                    Ver as regras em vídeo
                  </button>
                </div>
              </div>
            </Reveal>
            <Reveal>
              <div className="relative">
                <div className="absolute -inset-5 -z-10 rounded-full bg-gold/10 blur-3xl" />
                <FarmStatusCard />
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

      <Modal
        open={rulesVideoOpen}
        onClose={() => setRulesVideoOpen(false)}
        titleId={rulesVideoTitleId}
        className="max-w-4xl overflow-hidden p-0"
      >
        <div className="flex items-center justify-between gap-4 p-4 sm:px-6">
          <h2 id={rulesVideoTitleId} className="text-lg sm:text-xl">
            REGRAS DA FAZENDA
          </h2>
          <button
            type="button"
            onClick={() => setRulesVideoOpen(false)}
            className="text-sm font-semibold uppercase text-muted transition hover:text-white"
          >
            Fechar
          </button>
        </div>
        <VideoEmbed videoId={rulesVideoId} title="Regras da Fazenda Nova Aliança do GalindoGamerBR" />
      </Modal>
    </>
  )
}
