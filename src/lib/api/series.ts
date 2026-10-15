export type SeriesVideo = {
  slug: string
  videoId: string
  title: string
  thumbnailUrl: string
  publishedAt: string
}

// Vídeos mais recentes das séries listadas em /conteudos (todas as playlists numa só chamada).
export async function getSeriesVideos(): Promise<SeriesVideo[]> {
  const res = await fetch('/api/series')
  const data = (await res.json()) as { videos: SeriesVideo[] }
  return data.videos
}
