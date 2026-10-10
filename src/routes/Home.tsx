import { Link } from 'react-router-dom'
import { Container } from '../components/ui/Container'
import { Eyebrow } from '../components/ui/Eyebrow'
import { Logo } from '../components/ui/Logo'
import { SectionHead } from '../components/ui/SectionHead'
import { Reveal } from '../components/ui/Reveal'
import { LinkButton, NavButton } from '../components/ui/Button'
import { HubLink } from '../components/shared/HubLink'
import { ScheduleTabs } from '../components/shared/ScheduleTabs'
import { PublicScheduleExportButton } from '../components/shared/PublicScheduleExportButton'
import { LiveBanner } from '../components/shared/LiveBanner'
import { LifetimeVisitsBanner } from '../components/shared/LifetimeVisitsBanner'
import { useParallax } from '../hooks/useParallax'

const HUB_TEASER = [
  {
    icon: '🚜',
    eyebrow: 'Farming Simulator 25',
    title: 'MODS DA FAZENDA',
    description: 'Central de mods da Fazenda Nova Aliança.',
    href: '/mods',
  },
  {
    icon: '🎮',
    eyebrow: 'Discord oficial',
    title: 'SERVIDOR DA COMUNIDADE',
    description: 'Regras, avisos e os espaços oficiais do canal.',
    href: '/discord',
  },
]

export function Home() {
  return (
    <>
      <Hero />
      <FazendaTeaser />
      <TransmissoesTeaser />
      <JogosBannerCta />
      <ComunidadeTeaser />
      <SobreTeaser />
      <ParceirosTeaser />
      {/* <Newsletter /> */}
    </>
  )
}

// Fiel ao .reference-hero do site atual: banner de proporção fixa no
// desktop (2365:665), retrato do Galindo ancorado à direita/embaixo,
// gradiente de contraste em duas camadas (.hero-fade, em global.css).
function Hero() {
  const parallaxRef = useParallax<HTMLImageElement>(0.15)

  return (
    <section id="inicio" className="relative isolate min-h-[560px] overflow-hidden bg-bg xl:aspect-[2365/665] xl:min-h-0">
      <img
        ref={parallaxRef}
        src="/assets/background.webp"
        alt=""
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="hero-fade absolute inset-0" />
      <img
        src="/assets/galindo.webp"
        alt="Galindo, criador do GalindoGamerBR"
        fetchPriority="high"
        className="pointer-events-none absolute bottom-0 left-[62%] hidden h-[96%] w-auto max-w-[44%] -translate-x-1/2 object-contain object-bottom drop-shadow-[0_25px_40px_rgba(0,0,0,0.65)] lg:block xl:max-w-[34%]"
      />
      <Container className="relative z-10 flex h-full flex-col justify-center gap-4 py-16 xl:py-0">
        <div className="grid w-fit grid-cols-[auto_auto] items-center gap-x-3.5 gap-y-0.5">
          <span className="col-span-2 text-xs font-bold uppercase tracking-widest text-gold">Boas vindas ao universo</span>
          <Logo alt="" className="row-span-2 h-16 w-16 sm:h-20 sm:w-20" />
          <h1 className="max-w-[600px] text-[clamp(32px,5.4vw,64px)] leading-[0.95]">
            GALINDO<span className="text-gold">GAMER</span>BR
          </h1>
          <p className="col-start-2 text-sm font-extrabold uppercase tracking-[0.1em] text-[#dfe6ec]">
            Simuladores <span className="text-gold">•</span> Games <span className="text-gold">•</span> Comunidade
          </p>
        </div>
        <p className="max-w-[480px] text-sm text-[#c3cdd6]">
          Lives, séries e muita diversão todos os dias. Junte-se à nossa comunidade e faça parte dessa jornada.
        </p>
        <div className="mt-2 flex max-w-[460px] flex-wrap gap-2">
          <LinkButton variant="purple" size="sm" href="https://www.twitch.tv/galindogamerbr" target="_blank" rel="noopener noreferrer">
            <img src="/assets/icons/twitch.svg" alt="" className="h-4 w-4" /> Twitch
          </LinkButton>
          <LinkButton variant="green" size="sm" href="https://kick.com/galindogamerbr" target="_blank" rel="noopener noreferrer">
            <img src="/assets/icons/kick.svg" alt="" className="h-4 w-4" /> Kick
          </LinkButton>
          <LinkButton variant="red" size="sm" href="https://www.youtube.com/@galindogamerbr" target="_blank" rel="noopener noreferrer">
            <img src="/assets/icons/youtube.svg" alt="" className="h-4 w-4" /> YouTube
          </LinkButton>
          <LinkButton variant="default" size="sm" href="https://www.tiktok.com/@galindogamerbr" target="_blank" rel="noopener noreferrer">
            <img src="/assets/icons/tiktok.svg" alt="" className="h-4 w-4" /> TikTok
          </LinkButton>
        </div>
        <LifetimeVisitsBanner />
      </Container>
      <div className="relative z-10 mx-auto h-72 w-full lg:hidden">
        <img src="/assets/galindo.webp" alt="Galindo, criador do GalindoGamerBR" className="absolute bottom-0 left-1/2 h-full max-w-none -translate-x-1/2 object-contain object-bottom" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-bg to-transparent" />
      </div>
    </section>
  )
}

function FazendaTeaser() {
  return (
    <section className="py-16 sm:py-24">
      <Reveal>
        <Container>
          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
            <Link to="/boasvindas" className="group relative flex min-h-72 flex-col justify-between overflow-hidden rounded-xl border-2 border-gold bg-gradient-to-br from-gold/15 via-panel to-panel2 p-7 shadow-[0_20px_55px_-35px_rgba(217,177,79,0.7)] transition duration-300 hover:-translate-y-1 sm:p-8">
              <span className="absolute -right-5 -top-6 text-9xl opacity-[0.06] transition group-hover:scale-110">👋</span>
              <div className="relative">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-gold/40 bg-gold/10 text-2xl">👋</span>
                <Eyebrow className="mt-6">Comece por aqui</Eyebrow>
                <h2 className="mt-1 text-3xl text-gold">NOVO POR AQUI?</h2>
                <p className="mt-3 text-sm leading-relaxed text-white/75">O Galindo preparou uma mensagem para apresentar o canal e receber você na comunidade.</p>
              </div>
              <span className="relative mt-7 text-sm font-semibold uppercase text-gold transition group-hover:translate-x-1">Assistir à mensagem →</span>
            </Link>

            <Link to="/fazenda" className="group relative flex min-h-72 flex-col justify-between overflow-hidden rounded-xl border border-line bg-gradient-to-br from-panel to-panel2 p-7 transition duration-300 hover:-translate-y-1 hover:border-green/60 sm:p-8">
              <span className="absolute -right-5 -top-6 text-9xl opacity-[0.06] transition group-hover:scale-110">🚜</span>
              <div className="relative">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-green/40 bg-green/10 text-2xl">🚜</span>
                <Eyebrow className="mt-6">Fazenda Nova Aliança</Eyebrow>
                <h2 className="mt-1 text-3xl sm:text-4xl">VENHA PARA A LIDA COM A COMUNIDADE</h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">Conheça o servidor, confira os requisitos e prepare tudo para participar da fazenda.</p>
              </div>
              <span className="relative mt-7 text-sm font-semibold uppercase text-green transition group-hover:translate-x-1">Ver como participar →</span>
            </Link>
          </div>
        </Container>
      </Reveal>
    </section>
  )
}

function TransmissoesTeaser() {
  return (
    <section className="pb-16 sm:pb-24">
      <Reveal>
        <Container>
          <div className="grid lg:grid-cols-[minmax(0,1fr)_28rem] lg:gap-x-6 lg:gap-y-8">
            <div className="lg:col-start-1 lg:row-start-1 lg:self-end">
              <SectionHead eyebrow="Transmissões" title="AO VIVO E EM DESTAQUE" />
            </div>
            <div className="mt-8 lg:col-start-1 lg:row-start-2 lg:mt-0">
              <LiveBanner />
            </div>
            <div className="mt-6 lg:col-start-2 lg:row-start-1 lg:mt-0 lg:self-end">
              <SectionHead eyebrow="Agenda" title="PROGRAMAÇÃO DA SEMANA" />
            </div>
            <div className="mt-4 lg:col-start-2 lg:row-start-2 lg:mt-0">
              <ScheduleTabs />
              <div className="mt-4">
                <PublicScheduleExportButton />
              </div>
              <div className="mt-4 rounded-lg border border-gold/30 bg-gradient-to-br from-gold/10 via-panel to-panel p-4">
                <div className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-xs font-bold text-gold">!</span>
                  <div className="min-w-0">
                    <strong className="block text-xs uppercase tracking-[0.16em] text-gold">Importante</strong>
                    <p className="mt-1 text-xs leading-relaxed text-muted">Por causa do trabalho na cidade, o cronograma pode sofrer alterações.</p>
                    <p className="mt-2 border-l-2 border-gold pl-3 text-xs font-semibold leading-relaxed text-white">A programação oficial é atualizada todos os domingos aqui no site e no discord.</p>
                    <p className="mt-2 text-xs leading-relaxed text-muted">Consulte sempre a versão mais recente antes da próxima live.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Reveal>
    </section>
  )
}

// Chamada de largura cheia pra /jogos, logo abaixo do vídeo — antes do
// destaque específico da Fazenda Nova Aliança (JogosTeaser).
function JogosBannerCta() {
  return (
    <section className="pb-16 sm:pb-24">
      <Reveal>
        <Container>
          <Link to="/conteudos" className="group relative block overflow-hidden rounded-lg border border-line">
            <img src="/assets/banners/jogos-banner-mobile.webp" alt="" loading="lazy" className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-105 sm:hidden" />
            <img
              src="/assets/banners/jogos-banner.webp"
              alt=""
              loading="lazy"
              className="hidden aspect-[21/9] w-full object-cover transition duration-500 group-hover:scale-105 sm:block"
            />
            <div className="absolute inset-0 hidden bg-gradient-to-t from-bg via-bg/40 to-transparent sm:block" />
            <div className="relative flex flex-col items-start gap-2 bg-panel p-6 sm:absolute sm:inset-0 sm:justify-end sm:bg-transparent sm:p-10">
              <Eyebrow className="text-sm sm:text-lg">Todos os conteúdos do canal</Eyebrow>
              <h2 className="text-2xl sm:text-5xl">CONHEÇA OS CONTEÚDOS DO CANAL</h2>
              <span className="text-sm font-semibold uppercase tracking-wide text-gold sm:text-base">Ver todos →</span>
            </div>
          </Link>
        </Container>
      </Reveal>
    </section>
  )
}

function ComunidadeTeaser() {
  return (
    <section className="border-y border-line bg-panel/35 py-16 sm:py-20">
      <Reveal>
        <Container>
          <SectionHead eyebrow="Central da comunidade" title="TODOS OS CAMINHOS PARA CHEGAR JUNTO" />
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {HUB_TEASER.map((link) => (
              <HubLink key={link.title} {...link} />
            ))}
          </div>
          <div className="mt-6 flex flex-col justify-between gap-5 rounded-xl border border-gold/35 bg-gradient-to-r from-gold/10 via-panel to-panel p-6 sm:flex-row sm:items-center sm:p-8">
            <div>
              <Eyebrow>Mais perto do canal</Eyebrow>
              <h3 className="mt-1 text-2xl sm:text-3xl">CONVERSE, PARTICIPE E ACOMPANHE CADA NOVIDADE.</h3>
              <p className="mt-2 max-w-2xl text-sm text-muted">Todos os grupos, redes e caminhos oficiais estão reunidos em uma única página.</p>
            </div>
            <NavButton to="/comunidade" variant="gold" className="shrink-0">Explorar a comunidade</NavButton>
          </div>
        </Container>
      </Reveal>
    </section>
  )
}

// about-galindo.webp já vem com a metade direita escura, de propósito
// (mesmo espírito do Hero acima) — antes o texto ficava numa coluna
// separada ao lado da imagem, deixando esse espaço reservado vazio.
// Sobrepõe o texto ali a partir do lg; abaixo disso (sem espaço pra
// sobrepor sem cobrir o rosto) a imagem só mostra um recorte focado no
// Galindo, com o texto embaixo em fluxo normal.
function SobreTeaser() {
  return (
    <section className="pb-16 sm:pb-24">
      <Reveal>
        <Container>
          <div className="relative isolate overflow-hidden rounded-lg border border-line lg:min-h-[420px] xl:aspect-[2172/724] xl:min-h-0">
            <img
              src="/assets/about-galindo.webp"
              alt="GalindoGamerBR"
              loading="lazy"
              className="hidden lg:absolute lg:inset-0 lg:block lg:h-full lg:w-full lg:object-cover lg:object-left"
            />
            <div className="absolute inset-0 hidden bg-gradient-to-r from-transparent via-bg/40 to-bg/90 lg:block" />
            <div className="p-6 sm:p-8 lg:absolute lg:inset-y-0 lg:right-0 lg:z-10 lg:flex lg:w-full lg:max-w-lg lg:flex-col lg:justify-center lg:p-10">
              <div className="mb-6 flex items-center gap-4 lg:hidden">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-gold/50 bg-panel2">
                  <img src="/assets/galindo.webp" alt="GalindoGamerBR" loading="lazy" className="h-28 w-full object-cover object-top" />
                </div>
                <div>
                  <Eyebrow>Sobre o Galindo</Eyebrow>
                  <span className="mt-1 block text-xs font-semibold uppercase tracking-widest text-white/50">Conheça quem está por trás do canal</span>
                </div>
              </div>
              <Eyebrow className="hidden lg:block">Sobre o Galindo</Eyebrow>
              <h2 className="text-3xl sm:text-4xl">POR TRÁS DA LIVE, EXISTE UMA HISTÓRIA.</h2>
              <p className="mt-3 text-muted">
                Sou apaixonado por simuladores e jogos desde sempre. Criei o GalindoGamerBR para compartilhar minha
                paixão, criar conteúdo de qualidade e construir uma comunidade incrível!
              </p>
              <p className="mt-3 text-muted">Aqui você encontra gameplay de verdade, diversão e aprendizado em cada interação!</p>
              <NavButton to="/sobre" variant="default" className="mt-6 self-start">
                Conheça minha história →
              </NavButton>
            </div>
          </div>
        </Container>
      </Reveal>
    </section>
  )
}

function ParceirosTeaser() {
  return (
    <section className="pb-16 sm:pb-24">
      <Reveal>
        <Container>
          <div className="relative isolate overflow-hidden rounded-xl border border-gold/60 bg-panel shadow-[0_20px_70px_-35px_rgba(217,177,79,0.55)]">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_82%_50%,rgba(217,177,79,0.18),transparent_28%),linear-gradient(120deg,transparent_45%,rgba(217,177,79,0.05))]" />
            <div className="grid items-center gap-8 p-7 sm:p-10 lg:grid-cols-[1.35fr_0.65fr] lg:p-12">
              <div>
                <Eyebrow>Parceiros e marcas</Eyebrow>
                <h2 className="mt-1 max-w-3xl text-3xl sm:text-4xl">SUA MARCA PODE FAZER PARTE DESTA HISTÓRIA.</h2>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
                  Conectamos marcas ao público por meio de lives, vídeos e experiências que combinam com o universo
                  GalindoGamerBR. Cada ação nasce com contexto, proximidade e propósito.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {['Conteúdo com contexto', 'Presença nas lives', 'Comunidade engajada'].map((item) => (
                    <span key={item} className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold">
                      {item}
                    </span>
                  ))}
                </div>

                <NavButton to="/parceiros" variant="gold" className="mt-7">
                  Criar uma parceria →
                </NavButton>
              </div>

              <div className="hidden justify-end lg:flex">
                <div className="relative flex h-52 w-52 items-center justify-center rounded-full border border-gold/30 bg-bg/50 shadow-[0_0_70px_-18px_rgba(217,177,79,0.75)] sm:h-60 sm:w-60">
                  <div className="absolute inset-3 rounded-full border border-gold/15" />
                  <Logo alt="" className="relative h-36 w-36 sm:h-44 sm:w-44" />
                  <span className="absolute -bottom-3 rounded-full border border-gold/40 bg-panel px-4 py-2 text-xs font-bold uppercase tracking-widest text-gold">
                    Vamos crescer juntos
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Reveal>
    </section>
  )
}

// TODO: definir e implementar a newsletter; depois reativar os imports de
// `useState`/`FormEvent`, o componente abaixo e sua chamada em Home().
/*
function Newsletter() {
  const [status, setStatus] = useState<'idle' | 'soon'>('idle')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    // Ainda sem backend de e-mail marketing conectado — só confirma o
    // interesse por enquanto (ver plano: possível integração com Resend).
    setStatus('soon')
  }

  return (
    <section className="pb-16 sm:pb-24">
      <Reveal>
        <Container>
          <div className="flex flex-col items-start gap-6 rounded-lg border border-line bg-panel p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <Eyebrow>Fique por dentro</Eyebrow>
              <h2 className="text-2xl">NOVIDADES E LIVES</h2>
              <p className="mt-2 text-muted">Receba avisos, novidades e conteúdos da comunidade.</p>
            </div>
            {status === 'idle' ? (
              <form onSubmit={handleSubmit} className="flex w-full gap-2 sm:w-auto">
                <input
                  type="email"
                  required
                  placeholder="Seu melhor email"
                  aria-label="Seu melhor email"
                  className="w-full rounded-md border border-line bg-panel2 px-4 py-3 text-sm text-white outline-none focus:border-gold sm:w-64"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-md bg-gold px-5 py-3 text-sm font-semibold uppercase tracking-wide text-bg transition hover:brightness-110"
                >
                  Quero receber
                </button>
              </form>
            ) : (
              <p className="text-sm text-muted">Cadastro em breve. Esta área ainda está sendo conectada.</p>
            )}
          </div>
        </Container>
      </Reveal>
    </section>
  )
}
*/
// está no histórico do git (ver commit antes desta remoção).
