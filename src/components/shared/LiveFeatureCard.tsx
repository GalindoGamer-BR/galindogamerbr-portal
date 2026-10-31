import { LinkButton, NavButton } from '../ui/Button'
import { VideoEmbed } from './VideoEmbed'

type Video = { videoId: string; title: string; thumbnailUrl: string }

type LiveFeatureCardProps = {
  /** Live em andamento ou, offline, a última live do canal. */
  videoId: string
  videoTitle?: string | null
  /** false = o Galindo não está online: mesmo layout, com o aviso e o arquivo da última live. */
  isLive?: boolean
  gameTitle: string
  description: string
  /** Playlist completa do jogo. */
  href: string
  /** Vídeos recentes, do jogo e depois do resto do canal (a própria live é ignorada). A coluna lateral mostra quantos couberem. */
  videos: Video[]
  /** Mostra o botão "Jogue com o Galindo" (só para jogos que têm coop na comunidade). */
  showPlayTogether?: boolean
}

// Destaque do topo de /conteudos: o layout que era do carro-chefe (vídeo grande à esquerda, vídeos recentes ao lado). Ao vivo,
// mostra a transmissão; quando acaba, mantém o layout, avisa que o Galindo não está online e abre a última live.
export function LiveFeatureCard({ videoId, videoTitle, isLive = true, gameTitle, description, href, videos, showPlayTogether = false }: LiveFeatureCardProps) {
  const recent = videos.filter((video) => video.videoId !== videoId)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
      <div className={`group overflow-hidden rounded-xl border-2 border-gold bg-panel shadow-[0_20px_70px_-32px_rgba(217,177,79,0.55)] ${recent.length > 0 ? 'lg:col-span-5' : 'lg:col-span-7'}`}>
        <div className="relative aspect-video w-full overflow-hidden">
          <div className="h-full w-full">
            <VideoEmbed videoId={videoId} title={videoTitle || gameTitle} autoplay={isLive} />
          </div>
        </div>
        <div className="relative p-5 sm:p-7">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
          {isLive ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-red px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> Ao vivo agora
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">
              <span className="h-2 w-2 rounded-full bg-white/60" /> Offline
            </span>
          )}
          <h2 className="mt-3 text-2xl sm:text-3xl">{gameTitle}</h2>
          {videoTitle && <span className="mt-1 block text-xs font-semibold uppercase tracking-widest text-gold">{videoTitle}</span>}
          {!isLive && (
            <p className="mt-3 rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm font-semibold leading-relaxed text-white">
              O Galindo não está online agora, mas você pode conferir a última live.
            </p>
          )}
          <p className="mt-3 max-w-3xl leading-relaxed text-muted">{description}</p>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <LinkButton className="w-full" variant="red" href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noopener noreferrer">
              {isLive ? 'Assistir no YouTube' : 'Assistir à última live'}
            </LinkButton>
            <LinkButton className="w-full" variant="gold" href={href} target="_blank" rel="noopener noreferrer">
              Ver playlist completa
            </LinkButton>
            {showPlayTogether && (
              <NavButton className="w-full sm:col-span-2" variant="purple" to="/jogar">
                Jogue com o Galindo
              </NavButton>
            )}
          </div>
        </div>
      </div>

      {recent.length > 0 && (
        // A coluna não define a altura da linha: os cards ficam no tamanho natural dentro de uma área absoluta e o que não
        // couber na altura do card da live é cortado, então ela se enche de vídeos até o fim do espaço.
        <aside className="relative hidden overflow-hidden rounded-xl border border-line bg-panel/80 lg:col-span-2 lg:block">
          <div className="absolute inset-0 flex flex-col">
            <div className="shrink-0 border-b border-line px-4 py-4">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-gold">Continue acompanhando</span>
              <h3 className="mt-1 text-xl">VÍDEOS RECENTES</h3>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-3">
              {recent.map((video) => (
                <a
                  key={video.videoId}
                  href={`https://www.youtube.com/watch?v=${video.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/video flex shrink-0 items-center gap-3 overflow-hidden rounded-md border border-transparent bg-panel2 p-2.5 transition hover:border-gold/60 hover:bg-gold/5"
                >
                  <img src={video.thumbnailUrl} alt="" className="aspect-video w-28 shrink-0 rounded object-cover" />
                  <p className="line-clamp-2 min-w-0 flex-1 text-xs font-semibold leading-relaxed transition group-hover/video:text-gold">{video.title}</p>
                </a>
              ))}
            </div>
          </div>
        </aside>
      )}
    </div>
  )
}
