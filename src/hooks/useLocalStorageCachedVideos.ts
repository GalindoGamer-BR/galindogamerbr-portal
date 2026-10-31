import { useEffect, useRef, useState } from 'react'

type VideoLike = { videoId: string }

function readCache<T>(cacheKey: string): T[] {
  try {
    const raw = localStorage.getItem(cacheKey)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

function sameVideoIds(a: VideoLike[], b: VideoLike[]): boolean {
  return a.length === b.length && a.every((video, index) => video.videoId === b[index]?.videoId)
}

// Padrão comum aos hooks de vídeo de playlist (Fúria, Dicas, ETS2,
// SnowRunner...): hidrata o estado inicial do localStorage (evita
// flash de loading em visitas repetidas), busca uma vez ao montar, e só
// atualiza estado/persiste quando a lista vier de fato diferente da que já
// estava em cache (comparando por videoId) — se vier igual, não dispara
// re-render nem crossfade nenhum; se vier vazia (fetch falhou), mantém o
// que já estava.
export function useLocalStorageCachedVideos<T extends VideoLike>(cacheKey: string, fetcher: () => Promise<T[]>): T[] {
  const [videos, setVideos] = useState<T[]>(() => readCache<T>(cacheKey))
  const videosRef = useRef(videos)
  videosRef.current = videos

  useEffect(() => {
    let active = true

    fetcher().then((fetched) => {
      if (!active || fetched.length === 0 || sameVideoIds(videosRef.current, fetched)) return
      setVideos(fetched)
      try {
        localStorage.setItem(cacheKey, JSON.stringify(fetched))
      } catch {
        // localStorage indisponível (modo privado, storage cheio etc.) — só não persiste
      }
    })

    return () => {
      active = false
    }
  }, [cacheKey, fetcher])

  return videos
}
