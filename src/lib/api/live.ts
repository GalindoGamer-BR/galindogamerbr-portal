export type PlatformLiveStatus = { isLive: boolean; viewerCount: number | null; stale: boolean }

export type LiveStatus = {
  isLive: boolean
  videoId: string | null
  title: string | null
  thumbnailUrl: string | null
  viewerCount: number | null
  /** Estado de cada plataforma (o /api/live novo); ausente em respostas antigas guardadas no navegador. */
  platforms?: Partial<Record<'youtube' | 'twitch' | 'kick' | 'tiktok', PlatformLiveStatus>>
}

export async function getLiveStatus(): Promise<LiveStatus> {
  const res = await fetch('/api/live')
  return res.json() as Promise<LiveStatus>
}
