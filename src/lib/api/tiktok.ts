import { adminFetch } from './auth'

export type TiktokStatus = { connected: boolean; username: string | null; avatarUrl: string | null; updatedAt: string | null }

export async function getTiktokStatus(): Promise<TiktokStatus> {
  const res = await adminFetch('/api/admin/tiktok/status')
  return res.json() as Promise<TiktokStatus>
}

export async function disconnectTiktok(): Promise<void> {
  await adminFetch('/api/admin/tiktok/disconnect', { method: 'POST' })
}

// Um link simples não leva o Bearer: pede a URL do TikTok com a sessão e navega para ela.
export async function startTiktokAuthorize(): Promise<void> {
  const res = await adminFetch('/api/admin/tiktok/authorize', { headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error(`Falha ao iniciar a conexão: ${res.status}`)
  const { url } = (await res.json()) as { url: string }
  window.location.assign(url)
}
