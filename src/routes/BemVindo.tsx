import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Container } from '../components/ui/Container'
import { Eyebrow } from '../components/ui/Eyebrow'
import { Logo } from '../components/ui/Logo'
import { Reveal } from '../components/ui/Reveal'
import { VideoEmbed } from '../components/shared/VideoEmbed'
import { getFarmVideos } from '../lib/api/farm'

const FALLBACK_WELCOME_VIDEO_ID = 'tfoJW_5GJ3A'

const LINK_CARDS = [
  {
    step: '01',
    to: '/fazenda',
    icon: '🚜',
    title: 'Fazenda Nova Aliança',
    text: 'Conheça o servidor, assista às regras e veja o que é necessário para participar da fazenda.',
    cta: 'Conhecer a fazenda',
  },
  {
    step: '02',
    to: '/comunidade',
    icon: '🤝',
    title: 'Comunidade',
    text: 'Encontre o Discord, WhatsApp, grupo VIP e todos os espaços oficiais da comunidade.',
    cta: 'Ver comunidade',
  },
  {
    step: '03',
    to: '/conteudos',
    icon: '🎮',
    title: 'Conteúdos do canal',
    text: 'Fazenda Nova Aliança, Fúria Reborn, ETS2, SnowRunner e muito mais.',
    cta: 'Conhecer os conteúdos',
  },
] as const

export function BemVindo() {
  const [welcomeVideoId, setWelcomeVideoId] = useState(FALLBACK_WELCOME_VIDEO_ID)

  useEffect(() => {
    getFarmVideos().then((videos) => setWelcomeVideoId(videos.welcomeVideoId)).catch(() => {})
  }, [])

  return (
    <>
      <section className="relative isolate overflow-hidden py-16 sm:py-24">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(217,177,79,0.14),transparent_38%),radial-gradient(circle_at_85%_60%,rgba(55,86,112,0.18),transparent_42%)]" />
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
            <Reveal>
              <div>
                <div className="flex items-center gap-4">
                  <Logo alt="" className="h-16 w-16 border-2 border-gold/60 shadow-[0_0_30px_-8px_rgba(217,177,79,0.6)]" />
                  <div>
                    <Eyebrow>Você chegou ao Galindoverso</Eyebrow>
                    <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
                      Simuladores • Games • Comunidade
                    </span>
                  </div>
                </div>

                <h1 className="mt-7 text-5xl leading-[0.95] sm:text-6xl">SEJA MUITO BEM-VINDO!</h1>
                <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
                  Aqui a gameplay vira resenha, as lives viram histórias e quem chega passa a fazer parte da
                  comunidade. Antes de explorar, o Galindo tem uma mensagem para você.
                </p>

                <div className="mt-7 flex flex-wrap gap-2">
                  {['Lives e séries', 'Fazenda 24/7', 'Comunidade ativa'].map((item) => (
                    <span key={item} className="rounded-full border border-line bg-panel/80 px-3 py-1.5 text-xs font-semibold text-white/80">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal>
              <div className="overflow-hidden rounded-xl border-2 border-gold bg-panel shadow-[0_0_65px_-20px_rgba(217,177,79,0.6)]">
                <div className="flex items-center gap-3 border-b border-gold/30 px-5 py-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold text-lg text-bg">▶</span>
                  <div>
                    <Eyebrow className="text-xs">Uma mensagem do Galindo</Eyebrow>
                    <h2 className="text-lg">COMECE POR AQUI</h2>
                  </div>
                </div>
                <VideoEmbed videoId={welcomeVideoId} title="Vídeo de boas vindas do GalindoGamerBR" />
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="pb-16 sm:pb-24">
        <Reveal>
          <Container>
            <div className="mb-8 max-w-2xl">
              <Eyebrow>Escolha seu caminho</Eyebrow>
              <h2 className="mt-1 text-3xl sm:text-4xl">POR ONDE VOCÊ QUER COMEÇAR?</h2>
              <p className="mt-2 text-muted">Tudo o que você precisa para conhecer, acompanhar e participar.</p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {LINK_CARDS.map((card) => (
                <Link
                  key={card.to}
                  to={card.to}
                  className="group relative flex min-h-64 flex-col justify-between overflow-hidden rounded-lg border border-line bg-gradient-to-br from-panel to-panel2 p-6 transition duration-300 hover:-translate-y-1 hover:border-gold hover:shadow-[0_18px_45px_-25px_rgba(217,177,79,0.65)]"
                >
                  <span className="absolute right-4 top-2 text-6xl font-black text-white/[0.035] transition group-hover:text-gold/[0.08]">
                    {card.step}
                  </span>
                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-line bg-bg/60 text-2xl transition duration-300 group-hover:scale-110 group-hover:border-gold/50">
                        {card.icon}
                      </span>
                      <span className="text-xs font-bold tracking-widest text-gold">{card.step}</span>
                    </div>
                    <h3 className="mt-6 text-xl">{card.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{card.text}</p>
                  </div>
                  <span className="relative mt-6 text-sm font-semibold text-gold transition group-hover:translate-x-1">{card.cta}</span>
                </Link>
              ))}
            </div>
          </Container>
        </Reveal>
      </section>
    </>
  )
}
