import { Link } from 'react-router-dom'
import { Container } from '../components/ui/Container'
import { Eyebrow } from '../components/ui/Eyebrow'
import { Logo } from '../components/ui/Logo'
import { SectionHead } from '../components/ui/SectionHead'
import { Reveal } from '../components/ui/Reveal'
import { NavButton } from '../components/ui/Button'
import { HubLink } from '../components/shared/HubLink'
import { ScheduleTabs } from '../components/shared/ScheduleTabs'
import { PublicScheduleExportButton } from '../components/shared/PublicScheduleExportButton'
import { LiveBanner } from '../components/shared/LiveBanner'
import { LifetimeVisitsBanner } from '../components/shared/LifetimeVisitsBanner'

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

// Banner de imagem única (public/assets/hero-banner.webp, 1983x793) com o
// brasão ao centro. A barra de redes fica sobre a imagem no desktop e vira
// uma faixa logo abaixo no mobile. O h1 é só para leitores de tela/SEO: o
// nome da marca já está desenhado na imagem.
// Cores de marca dos selos, como na referência (TikTok preto, YouTube
// vermelho, Kick verde com o K escuro, Twitch roxo).
const HERO_LINKS = [
  { label: 'TikTok', href: 'https://www.tiktok.com/@galindogamerbr', icon: '/assets/icons/tiktok.svg', badge: 'bg-black', glyph: '' },
  { label: 'YouTube', href: 'https://www.youtube.com/@galindogamerbr', icon: '/assets/icons/youtube.svg', badge: 'bg-[#ff0000]', glyph: '' },
  { label: 'Kick', href: 'https://kick.com/galindogamerbr', icon: '/assets/icons/kick.svg', badge: 'bg-[#53fc18]', glyph: 'brightness-0' },
  { label: 'Twitch', href: 'https://www.twitch.tv/galindogamerbr', icon: '/assets/icons/twitch.svg', badge: 'bg-[#9146ff]', glyph: '' },
]

// Linha única com divisórias finas entre as redes. No desktop vai sobre a
// imagem; no mobile vira uma grade 2x2 abaixo dela.
function HeroSocialBar() {
  return (
    <nav aria-label="Redes do GalindoGamerBR" className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:justify-center sm:gap-0">
      {HERO_LINKS.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2.5 text-xs font-extrabold uppercase tracking-wide text-white transition hover:text-gold sm:px-5 sm:text-sm sm:[&:not(:first-child)]:border-l sm:[&:not(:first-child)]:border-white/30 md:px-7 md:text-base [text-shadow:0_1px_3px_rgba(0,0,0,1),0_0_10px_rgba(0,0,0,0.9)]"
        >
          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md sm:h-7 sm:w-7 ${link.badge}`}>
            <img src={link.icon} alt="" className={`h-4 w-4 sm:h-[18px] sm:w-[18px] ${link.glyph}`} />
          </span>
          {link.label}
        </a>
      ))}
    </nav>
  )
}

// Painel único com as redes e o contador de visitas, no mesmo estilo.
function HeroPanel() {
  return (
    <div className="mx-auto w-full max-w-fit rounded-lg border border-gold/40 bg-black/60 px-5 py-3 shadow-[0_0_30px_-12px_rgba(217,177,79,0.4)] backdrop-blur-sm sm:px-3">
      <HeroSocialBar />
      <div className="mt-3 flex justify-center border-t border-gold/25 pt-3 empty:hidden">
        <LifetimeVisitsBanner compact />
      </div>
    </div>
  )
}

function Hero() {
  return (
    <section id="inicio" className="relative isolate overflow-hidden bg-bg">
      <div className="relative h-[340px] sm:h-auto sm:aspect-[1983/793]">
        <img
          src="/assets/hero-banner.webp"
          alt="Galindo Streaming Community: brasão do GalindoGamerBR em um cenário épico"
          fetchPriority="high"
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/30 to-black/55" />
        <img
          src="/assets/galindo.webp"
          alt="Galindo, criador do GalindoGamerBR"
          className="pointer-events-none absolute bottom-0 left-[83%] hidden h-[90%] w-auto -translate-x-1/2 object-contain object-bottom drop-shadow-[0_20px_35px_rgba(0,0,0,0.7)] md:block"
        />
        <div className="absolute inset-x-0 top-[74%] hidden justify-center sm:flex">
          <HeroPanel />
        </div>
      </div>
      <h1 className="sr-only">GalindoGamerBR: simuladores, games e comunidade</h1>
      <div className="px-4 py-4 sm:hidden">
        <HeroPanel />
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
              <span className="relative mt-7 text-sm font-semibold uppercase text-gold transition group-hover:translate-x-1">Assistir à mensagem</span>
            </Link>

            <Link to="/jogar" className="group relative flex min-h-72 flex-col justify-between overflow-hidden rounded-xl border border-line bg-gradient-to-br from-panel to-panel2 p-7 transition duration-300 hover:-translate-y-1 hover:border-green/60 sm:p-8">
              <span className="absolute -right-5 -top-6 text-9xl opacity-[0.06] transition group-hover:scale-110">🚜</span>
              <div className="relative">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-green/40 bg-green/10 text-2xl">🚜</span>
                <Eyebrow className="mt-6">Jogue com o Galindo</Eyebrow>
                <h2 className="mt-1 text-3xl sm:text-4xl">VENHA JOGAR COM A GENTE</h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">A Fazenda Nova Aliança e outros jogos em comunidade: confira os requisitos e prepare tudo para entrar.</p>
              </div>
              <span className="relative mt-7 text-sm font-semibold uppercase text-green transition group-hover:translate-x-1">Ver como jogar</span>
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
              <span className="text-sm font-semibold uppercase tracking-wide text-gold sm:text-base">Ver todos</span>
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
                Conheça minha história
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
                  Criar uma parceria
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
