import { useLiveStatus } from '../../hooks/useLiveStatus'
import { LinkButton } from '../ui/Button'
import { Eyebrow } from '../ui/Eyebrow'
import { VideoEmbed } from './VideoEmbed'

// Estado da live domina a home quando ao vivo (Fase 2) — offline (ou ainda
// carregando), mostra o último vídeo enviado (a mesma API já devolve
// videoId/title/thumbnailUrl mesmo com isLive: false, ver
// functions/api/live.ts) na mesma casca de card o tempo todo, com um
// skeleton no lugar do player/título até chegar dado de verdade.
export function LiveBanner() {
  const status = useLiveStatus()

  if (status?.isLive && status.videoId) {
    return (
      <div className="flex h-full flex-col overflow-hidden rounded-lg border border-line bg-panel">
        <VideoEmbed videoId={status.videoId} title={status.title ?? 'GalindoGamerBR'} autoplay />
        <div className="flex flex-1 flex-col justify-between gap-3 p-6 sm:flex-row sm:items-center sm:p-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-red px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> Ao vivo agora
              {status.viewerCount !== null && (
                <span className="font-normal normal-case tracking-normal opacity-90">
                  · {status.viewerCount.toLocaleString('pt-BR')} assistindo
                </span>
              )}
            </span>
            <h3 className="mt-2 text-xl">{status.title}</h3>
          </div>
          <LinkButton
            variant="red"
            href={`https://www.youtube.com/watch?v=${status.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0"
          >
            Ver no YouTube
          </LinkButton>
        </div>
      </div>
    )
  }

  // Falha total (raro): status já resolveu e não tem vídeo nenhum pra
  // mostrar. Único caso com uma casca de card diferente da final.
  if (status !== null && !status.videoId) {
    return (
      <div className="flex h-full flex-col justify-center gap-3 rounded-lg border border-line bg-panel p-6 sm:p-8">
        <Eyebrow>Onde acompanhar</Eyebrow>
        <h3 className="text-2xl">Não está ao vivo agora</h3>
        <div>
          <LinkButton variant="red" href="https://www.youtube.com/@galindogamerbr" target="_blank" rel="noopener noreferrer">
            Ver no YouTube
          </LinkButton>
        </div>
      </div>
    )
  }

  // Carregando (status === null) ou offline com último vídeo (status.videoId).
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-line bg-panel">
      {status?.videoId ? (
        <VideoEmbed videoId={status.videoId} title={status.title ?? 'GalindoGamerBR'} autoplay={false} />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center bg-panel2">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-line border-t-gold" />
        </div>
      )}
      <div className="flex flex-1 flex-col justify-between gap-3 p-6 sm:flex-row sm:items-center sm:p-8">
        <div className="min-w-0">
          {status ? (
            <>
              <Eyebrow>Último vídeo</Eyebrow>
              <h3 className="mt-2 text-xl">{status.title}</h3>
            </>
          ) : (
            // Ainda carregando — "Onde acompanhar" não faz sentido aqui, só
            // faz sentido no fallback de falha total (ver bloco acima).
            <>
              <div className="h-3 w-24 animate-pulse rounded bg-panel2" />
              <div className="mt-3 h-5 w-2/3 animate-pulse rounded bg-panel2" />
            </>
          )}
        </div>
        {status && (
          <LinkButton
            variant="red"
            href={`https://www.youtube.com/watch?v=${status.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0"
          >
            Ver no YouTube
          </LinkButton>
        )}
      </div>
    </div>
  )
}
