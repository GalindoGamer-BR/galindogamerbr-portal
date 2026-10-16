import { Container } from '../components/ui/Container'
import { SectionHead } from '../components/ui/SectionHead'
import { Eyebrow } from '../components/ui/Eyebrow'
import { Reveal } from '../components/ui/Reveal'
import { GameCard } from '../components/shared/GameCard'
import { GameHighlightCard } from '../components/shared/GameHighlightCard'
import { VideoEmbed } from '../components/shared/VideoEmbed'
import { LinkButton, NavButton } from '../components/ui/Button'
import { GAMES, FAZENDA_NOVA_ALIANCA, FURIA_REBORN, DICAS, ETS2, SNOWRUNNER, CONTRABAND_POLICE } from '../data/games'
import { useFlagshipVideos } from '../hooks/useFlagshipVideo'
import { useFuriaVideos } from '../hooks/useFuriaVideos'
import { useDicasVideos } from '../hooks/useDicasVideos'
import { useEts2Videos } from '../hooks/useEts2Videos'
import { useSnowrunnerVideos } from '../hooks/useSnowrunnerVideos'
import { useContrabandPoliceVideos } from '../hooks/useContrabandPoliceVideos'
import { useSeriesVideos } from '../hooks/useSeriesVideos'
import { rankGameCards } from '../lib/rankGameCards'
import { useLiveStatus } from '../hooks/useLiveStatus'

const OTHER_GAMES = GAMES.filter(
  (game) =>
    !game.flagship &&
    game.slug !== 'furia-reborn-rp' &&
    game.slug !== 'dicas' &&
    game.slug !== 'ets2' &&
    game.slug !== 'snowrunner' &&
    game.slug !== 'contraband-police',
)

export function Conteudos() {
  const [flagship, ...recent] = useFlagshipVideos()
  // Mesmo polling de /api/live que o LiveBanner usa — evita um segundo
  // poller independente rodando em paralelo nesta rota.
  const live = useLiveStatus()
  const flagshipHref = flagship?.videoId ? `https://www.youtube.com/watch?v=${flagship.videoId}` : FAZENDA_NOVA_ALIANCA.href
  const furiaVideos = useFuriaVideos()
  const dicasVideos = useDicasVideos()
  const ets2Videos = useEts2Videos()
  const snowrunnerVideos = useSnowrunnerVideos()
  const contrabandPoliceVideos = useContrabandPoliceVideos()
  const seriesVideos = useSeriesVideos()

  // Enquanto um jogo não tem arte própria, o card usa a miniatura do vídeo mais recente dele.
  const latestVideoBySlug = new Map<string, string>()
  for (const video of [...seriesVideos].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))) {
    if (!latestVideoBySlug.has(video.slug)) latestVideoBySlug.set(video.slug, video.videoId)
  }

  const isLiveNow = live?.isLive && live.videoId === flagship?.videoId

  // Fúria Reborn, ETS2, SnowRunner — se o canal estiver ao vivo com um vídeo
  // que já apareceu na playlist recente de um desses jogos (mesma checagem
  // de pertencimento usada no carro-chefe, ver useFlagshipVideo.ts), esse
  // jogo sobe pra cima do carro-chefe, em destaque, com a live embutida em
  // vez da imagem estática (liveVideoId, ver GameHighlightCard.tsx) — sai da
  // lista normal de "Outros jogos" enquanto estiver promovido.
  const otherGameHighlights = [
    {
      slug: 'furia-reborn-rp',
      image: FURIA_REBORN.image,
      title: 'FÚRIA REBORN | GTA RP',
      badgeEmoji: '🎮',
      badgeLabel: 'Roleplay do canal',
      description: FURIA_REBORN.description,
      href: FURIA_REBORN.href,
      variant: 'purple' as const,
      videos: furiaVideos,
    },
    {
      slug: 'ets2',
      image: ETS2.image,
      title: 'EURO TRUCK SIMULATOR 2',
      badgeEmoji: '🚚',
      badgeLabel: 'Estradas do canal',
      description: ETS2.description,
      href: ETS2.href,
      variant: 'red' as const,
      videos: ets2Videos,
    },
    {
      slug: 'snowrunner',
      image: SNOWRUNNER.image,
      title: 'SNOWRUNNER',
      badgeEmoji: '🚛',
      badgeLabel: 'Simulação fora de estrada',
      description: SNOWRUNNER.description,
      href: SNOWRUNNER.href,
      variant: 'blue' as const,
      videos: snowrunnerVideos,
    },
    {
      slug: 'contraband-police',
      image: CONTRABAND_POLICE.image,
      title: 'CONTRABAND POLICE',
      badgeEmoji: '🛂',
      badgeLabel: 'Fiscalização de fronteira',
      description: CONTRABAND_POLICE.description,
      href: CONTRABAND_POLICE.href,
      variant: 'red' as const,
      videos: contrabandPoliceVideos,
    },
  ].map((game) => ({
    ...game,
    liveVideoId: live?.isLive && game.videos.some((video) => video.videoId === live.videoId) ? live.videoId : null,
  }))
  const liveHighlightIndex = otherGameHighlights.findIndex((game) => game.liveVideoId)

  const promotedLiveGame = liveHighlightIndex >= 0 ? otherGameHighlights[liveHighlightIndex] : null
  const remainingGameHighlights = otherGameHighlights.filter((_, index) => index !== liveHighlightIndex)

  // Todos os outros jogos (cards grandes e pequenos) seguem a atualização das playlists: o jogo com o vídeo mais recente
  // vem primeiro. Os primeiros ocupam os cards grandes, na quantidade que já existia; o resto vai para a grade.
  const SERIES_VARIANTS = ['purple', 'blue', 'red', 'green'] as const
  const ranked = rankGameCards(remainingGameHighlights, OTHER_GAMES, seriesVideos, remainingGameHighlights.length)
  const bigCards = ranked.big.map((card, index) => {
    if (card.highlight) return card.highlight
    const game = card.game!
    const videos = seriesVideos.filter((video) => video.slug === game.slug)
    return {
      slug: game.slug,
      image: game.image || (videos[0] ? `https://i.ytimg.com/vi/${videos[0].videoId}/hqdefault.jpg` : ''),
      title: game.title.toUpperCase(),
      badgeEmoji: '🎮',
      badgeLabel: game.tag,
      description: game.description,
      href: game.href,
      variant: SERIES_VARIANTS[index % SERIES_VARIANTS.length],
      videos,
      liveVideoId: null as string | null,
    }
  })
  const smallGames = ranked.small.map((card) => card.game ?? GAMES.find((game) => game.slug === card.slug)!)

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-line py-16 sm:py-24">
        <img src="/assets/background.webp" alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_35%,rgba(217,177,79,0.15),transparent_30%),linear-gradient(90deg,#050b11_8%,rgba(5,11,17,0.9)_52%,rgba(5,11,17,0.62))]" />
        <Container className="relative">
          <div className="max-w-4xl">
            <Eyebrow>O universo GalindoGamerBR</Eyebrow>
            <h1 className="mt-2 max-w-3xl text-4xl leading-none sm:text-6xl lg:text-7xl">
              CADA JOGO ABRE UMA NOVA HISTÓRIA
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#c3cdd6] sm:text-lg">
              Acompanhe a Fazenda Nova Aliança, descubra novas séries e encontre dicas para aproveitar cada jornada. Todo o canal reunido em um só lugar.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-xs font-bold uppercase tracking-[0.16em]">
              <a href="#fazenda-nova-alianca" className="rounded-full border border-gold/50 bg-gold/10 px-4 py-2.5 text-gold transition hover:bg-gold hover:text-bg">
                Fazenda Nova Aliança
              </a>
              <a href="#series-do-canal" className="rounded-full border border-white/20 bg-white/5 px-4 py-2.5 text-white transition hover:border-white/40 hover:bg-white/10">
                Explorar todas as séries
              </a>
            </div>
          </div>
        </Container>
      </section>

      {/* Se tiver ao vivo com Fúria/ETS2/SnowRunner, esse destaque assume o
          topo da página, acima até do carro-chefe — "o que tá rolando agora"
          importa mais que o vídeo mais recente da série fixa. */}
      {promotedLiveGame && (
        <section className="pb-8 sm:pb-12">
          <Reveal>
            <Container>
              <Eyebrow>Ao vivo agora</Eyebrow>
              <GameHighlightCard {...promotedLiveGame} />
            </Container>
          </Reveal>
        </section>
      )}

      {/* Carro-chefe do canal — destaque acima de tudo o resto. */}
      <section id="fazenda-nova-alianca" className="scroll-mt-24 py-12 sm:py-16">
        <Reveal>
          <Container>
            <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <Eyebrow>A série principal do canal</Eyebrow>
                <h2 className="mt-1 text-3xl sm:text-4xl">A FAZENDA QUE CRESCE COM A COMUNIDADE</h2>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-muted sm:text-right">
                Novos capítulos, decisões ao vivo e uma história construída junto de quem acompanha.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
              <div className="group overflow-hidden rounded-xl border-2 border-gold bg-panel shadow-[0_20px_70px_-32px_rgba(217,177,79,0.55)] lg:col-span-5">
                <div className="relative aspect-video w-full overflow-hidden">
                  <div className="h-full w-full transition duration-500 group-hover:scale-105">
                    {flagship?.videoId ? (
                      <VideoEmbed videoId={flagship.videoId} title={flagship.title} autoplay={isLiveNow} />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-panel2">
                        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="relative p-5 sm:p-7">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
                  <span className="inline-flex items-center gap-2 rounded-full bg-gold px-3 py-1 text-xs font-bold uppercase tracking-widest text-bg">
                    🚜 Carro-chefe do canal
                  </span>
                  {isLiveNow && (
                    <span className="ml-2 inline-flex items-center gap-2 rounded-full bg-red px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> Ao vivo agora
                    </span>
                  )}
                  <h2 className="mt-3 text-2xl sm:text-3xl">Farming Simulator 25 | Fazenda Nova Aliança</h2>
                  {flagship?.title && (
                    <span className="mt-1 block text-xs font-semibold uppercase tracking-widest text-gold">
                      {flagship.title}
                    </span>
                  )}
                  <p className="mt-3 max-w-3xl leading-relaxed text-muted">{FAZENDA_NOVA_ALIANCA.description}</p>
                  <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <LinkButton className="w-full" variant="red" href={flagshipHref} target="_blank" rel="noopener noreferrer">
                      Assistir no YouTube
                    </LinkButton>
                    <LinkButton
                      className="w-full"
                      variant="gold"
                      href="https://www.youtube.com/playlist?list=PLj6h86FobQUn2vIz-FSyMlL_ldV6_kzrN"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver playlist completa
                    </LinkButton>
                    <NavButton className="w-full" variant="blue" to="/mods">
                      Sincronize seus mods
                    </NavButton>
                    <NavButton className="w-full" variant="purple" to="/fazenda">
                      Participe da Fazenda
                    </NavButton>
                  </div>
                </div>
              </div>

              <aside className="hidden overflow-hidden rounded-xl border border-line bg-panel/80 lg:col-span-2 lg:flex lg:flex-col">
                <div className="border-b border-line px-4 py-4">
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-gold">Continue acompanhando</span>
                  <h3 className="mt-1 text-xl">CAPÍTULOS RECENTES</h3>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-3">
                {recent.map((video) => (
                  <a
                    key={video.videoId}
                    href={`https://www.youtube.com/watch?v=${video.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/video flex flex-1 items-center gap-3 overflow-hidden rounded-md border border-transparent bg-panel2 p-2.5 transition hover:border-gold/60 hover:bg-gold/5"
                  >
                    <img src={video.thumbnailUrl} alt="" className="aspect-video w-28 shrink-0 rounded object-cover" />
                    <p className="line-clamp-2 min-w-0 flex-1 text-xs font-semibold leading-relaxed transition group-hover/video:text-gold">{video.title}</p>
                  </a>
                ))}
                </div>
              </aside>
            </div>
          </Container>
        </Reveal>
      </section>

      {/* Dicas do Galindo — logo abaixo do carro-chefe, antes do "Descubra mais". */}
      <section className="pb-16 sm:pb-24">
        <Reveal>
          <Container>
            <div className="mb-6">
              <Eyebrow>Aprenda com o Galindo</Eyebrow>
              <h2 className="mt-1 text-3xl sm:text-4xl">SOLUÇÕES PARA JOGAR MELHOR</h2>
            </div>
            <GameHighlightCard
              image={DICAS.image}
              title="DICAS DO GALINDO"
              badgeEmoji="💡"
              badgeLabel="Tutoriais do canal"
              description={DICAS.description}
              href={DICAS.href}
              variant="green"
              videos={dicasVideos}
              imageFit="contain"
            />
          </Container>
        </Reveal>
      </section>

      <section id="series-do-canal" className="scroll-mt-24 border-t border-line/70 py-16 sm:py-24">
        <Reveal>
          <Container>
            <SectionHead eyebrow="Escolha sua próxima jornada" title="SÉRIES PARA TODOS OS ESTILOS" />
            <p className="mt-3 max-w-2xl leading-relaxed text-muted">
              Roleplay, estradas, terrenos extremos e novos desafios. Encontre a série que combina com você e comece pelo capítulo mais recente.
            </p>

            {/* Fúria Reborn, ETS2 e SnowRunner — destaques secundários, mesmo
                formato do teaser da Home (imagem+conteúdo 50/50, full width).
                O que estiver ao vivo agora não aparece aqui — está promovido
                acima do carro-chefe (ver promotedLiveGame). */}
            <div className="mt-8 flex flex-col gap-6">
              {bigCards.map((game) => (
                <GameHighlightCard key={game.slug} {...game} />
              ))}
            </div>

            <div className="mt-8 grid grid-cols-2 gap-6 lg:grid-cols-4">
              {smallGames.map((game) => {
                const latestVideoId = latestVideoBySlug.get(game.slug)
                return (
                  <GameCard
                    key={game.slug}
                    game={game}
                    fallbackImage={latestVideoId ? `https://i.ytimg.com/vi/${latestVideoId}/hqdefault.jpg` : undefined}
                  />
                )
              })}
            </div>
          </Container>
        </Reveal>
      </section>
    </>
  )
}
