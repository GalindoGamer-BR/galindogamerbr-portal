import { adminFetch } from './auth'
export type FarmVideos = { welcomeVideoId: string; rulesVideoId: string }
type FarmVideosResponse = Partial<FarmVideos> & { error?: string }

export async function getFarmVideos(): Promise<FarmVideos> {
  const res = await fetch('/api/farm/welcome-video')
  const data = (await res.json()) as FarmVideosResponse
  if (!res.ok || !data.welcomeVideoId || !data.rulesVideoId) throw new Error(data.error ?? 'fetch_failed')
  return { welcomeVideoId: data.welcomeVideoId, rulesVideoId: data.rulesVideoId }
}

export async function getAdminFarmVideos(): Promise<FarmVideos> {
  const res = await adminFetch('/api/admin/farm/welcome-video')
  const data = (await res.json()) as FarmVideosResponse
  if (!res.ok || !data.welcomeVideoId || !data.rulesVideoId) throw new Error(data.error ?? 'fetch_failed')
  return { welcomeVideoId: data.welcomeVideoId, rulesVideoId: data.rulesVideoId }
}

export async function setFarmVideos(
  welcomeVideo: string,
  rulesVideo: string,
): Promise<{ ok: true; videos: FarmVideos } | { ok: false; error: string }> {
  const res = await adminFetch('/api/admin/farm/welcome-video', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ welcomeVideo, rulesVideo }),
  })
  const data = (await res.json()) as FarmVideosResponse
  if (!res.ok || !data.welcomeVideoId || !data.rulesVideoId) return { ok: false, error: data.error ?? 'save_failed' }
  return { ok: true, videos: { welcomeVideoId: data.welcomeVideoId, rulesVideoId: data.rulesVideoId } }
}
