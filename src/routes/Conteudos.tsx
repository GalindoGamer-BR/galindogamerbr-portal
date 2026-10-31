import { Container } from '../components/ui/Container'
import { SectionHead } from '../components/ui/SectionHead'
import { Eyebrow } from '../components/ui/Eyebrow'
import { Reveal } from '../components/ui/Reveal'
import { GameCard } from '../components/shared/GameCard'
import { GameHighlightCard } from '../components/shared/GameHighlightCard'
import { LiveFeatureCard } from '../components/shared/LiveFeatureCard'
import { GAMES, FURIA_REBORN, DICAS, ETS2, SNOWRUNNER, CONTRABAND_POLICE } from '../data/games'
import { useFuriaVideos } from '../hooks/useFuriaVideos'
import { useDicasVideos } from '../hooks/useDicasVideos'
import { useEts2Videos } from '../hooks/useEts2Videos'
import { useSnowrunnerVideos } from '../hooks/useSnowrunnerVideos'
import { useContrabandPoliceVideos } from '../hooks/useContrabandPoliceVideos'
import { useSeriesVideos } from '../hooks/useSeriesVideos'
import { rankGameCards } from '../lib/rankGameCards'
import { matchLiveGameSlug } from '../lib/matchLiveGame'
import { PLAY_TOGETHER } from '../data/playTogether'
import { useYoutubeLastLive } from '../features/multichat/useYoutubeLastLive'
import { useLiveStatus } from '../hooks/useLiveStatus'

const OTHER_GAMES = GAMES.filter(
  (game) =>
    game.slug !== 'furia-reborn-rp' &&
    game.slug !== 'dicas' &&
    game.slug !== 'ets2' &&
    game.slug !== 'snowrunner' &&
    game.slug !== 'contraband-police',
)

export function Conteudos() {
  // Mesmo polling de /api/live que o LiveBanner usa — evita um segundo
  // poller independente rodando em paralelo nesta rota.
  const live = useLiveStatus()
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

  // Destaques grandes (com endpoint próprio de vídeos). Os demais jogos entram pela lista de séries.
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
  ]

  // Card principal (LiveFeatureCard) no topo da página: ao vivo, mostra a live; quando acaba (status já carregado e offline),
  // mantém o mesmo layout com o aviso e a última live do canal. O jogo vem da playlist que já tem o vídeo; se a live ainda
  // não entrou na playlist, vem do título; sem jogo reconhecido, o card mostra só o vídeo. O jogo promovido sai da lista
  // normal só enquanto estiver ao vivo.
  const isLive = Boolean(live?.isLive)
  const lastLive = useYoutubeLastLive(live !== null && !live.isLive)
  const liveVideoId = isLive ? (live?.videoId ?? null) : (lastLive?.videoId ?? null)
  const liveVideoTitle = isLive ? live?.title : lastLive?.title
  const liveSlug =
    (liveVideoId
      ? (otherGameHighlights.find((game) => game.videos.some((video) => video.videoId === liveVideoId))?.slug ??
        seriesVideos.find((video) => video.videoId === liveVideoId)?.slug)
      : undefined) ?? matchLiveGameSlug(liveVideoTitle)
  const liveHighlight = otherGameHighlights.find((game) => game.slug === liveSlug)
  const gameVideos = liveHighlight?.videos ?? seriesVideos.filter((video) => video.slug === liveSlug)
  const channelVideos = [...seriesVideos].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  const liveGame = GAMES.find((game) => game.slug === liveSlug)
  const promotedLive = liveVideoId
    ? {
        videoId: liveVideoId,
        videoTitle: liveVideoTitle || null,
        isLive,
        gameTitle: liveHighlight?.title ?? liveGame?.title.toUpperCase() ?? (isLive ? 'GALINDOGAMERBR AO VIVO' : 'ÚLTIMA LIVE DO CANAL'),
        description: liveHighlight?.description ?? liveGame?.description ?? (isLive ? 'O canal está no ar agora. Entre na live e participe do chat.' : 'Reveja a última transmissão do GalindoGamerBR.'),
        href: liveHighlight?.href ?? liveGame?.href ?? 'https://www.youtube.com/@galindogamerbr/videos',
        // Vídeos do jogo primeiro e, para encher a coluna lateral, os mais recentes do resto do canal.
        videos: [...gameVideos, ...channelVideos.filter((video) => !gameVideos.some((own) => own.videoId === video.videoId))].slice(0, 12),
        // "Jogue com o Galindo" só para jogo que a comunidade joga em coop (ver data/playTogether.ts).
        showPlayTogether: PLAY_TOGETHER.some((game) => game.slug === liveSlug),
      }
    : null
  const promotedSlug = promotedLive && isLive ? liveSlug : undefined

  const remainingGameHighlights = otherGameHighlights.filter((game) => game.slug !== promotedSlug)
  const remainingGames = OTHER_GAMES.filter((game) => game.slug !== promotedSlug)

  // Todos os outros jogos (cards grandes e pequenos) seguem a atualização das playlists: o jogo com o vídeo mais recente
  // vem primeiro. Os primeiros ocupam os cards grandes, na quantidade que já existia; o resto vai para a grade.
  const SERIES_VARIANTS = ['purple', 'blue', 'red', 'green'] as const
  const ranked = rankGameCards(remainingGameHighlights, remainingGames, seriesVideos, remainingGameHighlights.length)
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
              Descubra as séries do canal, acompanhe os capítulos mais recentes e encontre dicas para aproveitar cada jornada. Todo o canal reunido em um só lugar.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-xs font-bold uppercase tracking-[0.16em]">
              <a href="#series-do-canal" className="rounded-full border border-gold/50 bg-gold/10 px-4 py-2.5 text-gold transition hover:bg-gold hover:text-bg">
                Explorar todas as séries
              </a>
              <a href="#dicas" className="rounded-full border border-green/60 bg-green/10 px-4 py-2.5 text-white transition hover:bg-green">
                💡 Dicas do Galindo
              </a>
            </div>
          </div>
        </Container>
      </section>

      {/* Card principal no topo (ao vivo ou última live), com o layout de vídeo grande + vídeos recentes. */}
      {promotedLive && (
        <section className="py-12 sm:py-16">
          <Reveal>
            <Container>
              <div className="mb-6">
                <Eyebrow>{isLive ? 'Ao vivo agora' : 'Última live'}</Eyebrow>
              </div>
              <LiveFeatureCard {...promotedLive} />
            </Container>
          </Reveal>
        </section>
      )}

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
                no topo (ver promotedLiveGame). */}
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

      {/* Dicas do Galindo — no fim da página; o link do topo rola até aqui. */}
      <section id="dicas" className="scroll-mt-24 border-t border-line/70 py-16 sm:py-24">
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
    </>
  )
}
