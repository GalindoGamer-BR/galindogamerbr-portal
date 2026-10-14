import { getSeriesVideos, type SeriesVideo } from '../lib/api/series'
import { useLocalStorageCachedVideos } from './useLocalStorageCachedVideos'

// Os vídeos mais recentes de cada série de /conteudos, numa lista só (cada item traz o slug da série).
// Ver useLocalStorageCachedVideos pro comportamento de cache.
export function useSeriesVideos(): SeriesVideo[] {
  return useLocalStorageCachedVideos('ggb:series-videos', getSeriesVideos)
}
