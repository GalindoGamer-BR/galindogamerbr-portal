import { useEffect, useRef, useState } from 'react'
import { preload } from 'react-dom'
import { LinkButton } from '../ui/Button'
import { VideoEmbed } from './VideoEmbed'

type Video = { videoId: string; title: string; thumbnailUrl: string }

function hqThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
}

function videoIdsKey(videos: Video[]): string {
  return videos.map((video) => video.videoId).join(',')
}

// Cores por card — mesma paleta de marca usada nos <Button>, só que também
// precisamos da borda/selo/sombra combinando. Classes escritas por extenso
// (não montadas por template string) porque o Tailwind só gera no build o
// que encontra como texto literal no código-fonte.
const COLORS = {
  purple: {
    border: 'border-purple',
    badge: 'bg-purple text-white',
    shadow: 'shadow-[0_0_60px_-15px_rgba(100,71,232,0.35)]',
    hover: 'hover:border-purple',
  },
  blue: {
    border: 'border-blue',
    badge: 'bg-blue text-white',
    shadow: 'shadow-[0_0_60px_-15px_rgba(86,104,245,0.35)]',
    hover: 'hover:border-blue',
  },
  red: {
    border: 'border-red',
    badge: 'bg-red text-white',
    shadow: 'shadow-[0_0_60px_-15px_rgba(237,29,42,0.35)]',
    hover: 'hover:border-red',
  },
  green: {
    border: 'border-green',
    badge: 'bg-green text-white',
    shadow: 'shadow-[0_0_60px_-15px_rgba(22,163,74,0.35)]',
    hover: 'hover:border-green',
  },
} as const

type GameHighlightCardProps = {
  image: string
  title: string
  badgeEmoji: string
  badgeLabel: string
  description: string
  href: string
  variant: keyof typeof COLORS
  videos: Video[]
  // 'contain' pra artes com bastante espaço vazio ao redor da logo (ex:
  // Dicas do Galindo) — object-cover cortava a arte de forma perceptível.
  imageFit?: 'cover' | 'contain'
  // Quando o canal está ao vivo com um vídeo desse jogo (ver Conteudos.tsx),
  // troca a imagem estática pelo embed ao vivo, autoplay, com selo "Ao vivo
  // agora" — mesmo tratamento dos demais destaques.
  liveVideoId?: string | null
}

// Segundo/terceiro destaque de um jogo — mesmo formato do
// teaser da Home (imagem+conteúdo 50/50, full width) usado pra Fúria Reborn
// e SnowRunner, com os últimos vídeos da playlist do jogo como cards menores.
export function GameHighlightCard({
  image,
  title,
  badgeEmoji,
  badgeLabel,
  description,
  href,
  variant,
  videos,
  imageFit = 'cover',
  liveVideoId = null,
}: GameHighlightCardProps) {
  const colors = COLORS[variant]
  const fitClass = imageFit === 'contain' ? 'object-contain bg-bg' : 'object-cover'

  // videos (prop) só muda de conteúdo de verdade quando o hook por trás
  // (useLocalStorageCachedVideos) decide que a lista é diferente da exibida
  // — nunca por causa de um polling que devolveu os mesmos vídeos. Ainda
  // assim, guardamos displayedVideos à parte pra poder disparar o preload
  // das novas thumbnails antes de trocar a UI (mesma ideia do LiveBanner) e
  // pra ter uma key estável pro crossfade (só anima quando o conjunto de
  // videoIds muda, nunca por causa de um novo array com o mesmo conteúdo).
  const [displayedVideos, setDisplayedVideos] = useState(videos)
  const displayedVideosRef = useRef(displayedVideos)
  displayedVideosRef.current = displayedVideos

  useEffect(() => {
    if (videoIdsKey(videos) === videoIdsKey(displayedVideosRef.current)) return
    for (const video of videos) preload(hqThumbnailUrl(video.videoId), { as: 'image' })
    setDisplayedVideos(videos)
  }, [videos])

  return (
    <div className={`group grid grid-cols-1 overflow-hidden rounded-lg border-2 ${colors.border} ${colors.shadow} lg:grid-cols-2`}>
      {liveVideoId ? (
        <VideoEmbed
          videoId={liveVideoId}
          title={title}
          autoplay
          className="w-full transition duration-500 group-hover:scale-105 lg:aspect-auto lg:h-full"
        />
      ) : (
        <img
          src={image}
          alt={title}
          width={1672}
          height={941}
          loading="lazy"
          className={`aspect-video w-full transition duration-500 group-hover:scale-105 ${fitClass} lg:aspect-auto lg:h-full`}
        />
      )}
      <div className="flex flex-col items-start justify-center gap-3 bg-panel p-6 sm:p-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest ${colors.badge}`}>
            {badgeEmoji} {badgeLabel}
          </span>
          {liveVideoId && (
            <span className="inline-flex items-center gap-2 rounded-full bg-red px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> Ao vivo agora
            </span>
          )}
        </div>
        <h2 className="text-2xl sm:text-3xl">{title}</h2>
        <p className="max-w-xl text-justify text-muted">{description}</p>
        <div className="mt-2 flex flex-wrap gap-3">
          <LinkButton variant={variant} href={href} target="_blank" rel="noopener noreferrer">
            Ver playlist completa
          </LinkButton>
        </div>

        {displayedVideos.length > 0 && (
          <div className="mt-2 w-full">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">Últimos vídeos da playlist</p>
            {/* key troca só quando o conjunto de videoIds muda de verdade — o
                React remonta o bloco inteiro, disparando o crossfade de uma
                vez (ver .crossfade-in em src/styles/global.css). Nunca troca
                thumbnail por thumbnail. */}
            <div key={videoIdsKey(displayedVideos)} className="crossfade-in flex flex-col gap-3 sm:flex-row">
              {displayedVideos.map((video) => (
                <a
                  key={video.videoId}
                  href={`https://www.youtube.com/watch?v=${video.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex flex-1 items-center gap-3 overflow-hidden rounded-md border border-line bg-panel2 p-2 transition ${colors.hover}`}
                >
                  {/* hqdefault (480×360) em vez de maxresdefault (1280×720, o que vem em
                      video.thumbnailUrl) — esses thumbnails renderizam em w-20 (80px), não
                      faz sentido baixar a versão em resolução máxima aqui. */}
                  <img
                    src={hqThumbnailUrl(video.videoId)}
                    alt=""
                    width={480}
                    height={360}
                    loading="lazy"
                    className="aspect-video w-20 shrink-0 rounded object-cover"
                  />
                  <p className="line-clamp-2 text-xs font-semibold">{video.title}</p>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
