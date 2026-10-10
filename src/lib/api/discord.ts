import { adminFetch } from './auth'
export async function getDiscordInvite(): Promise<string | null> {
  const res = await adminFetch('/api/admin/discord')
  const data = (await res.json()) as { url: string | null }
  return data.url
}

export async function setDiscordInvite(url: string): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const res = await adminFetch('/api/admin/discord', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  const data = (await res.json()) as { url?: string; error?: string }
  if (!res.ok) return { ok: false, error: data.error ?? 'unknown_error' }
  return { ok: true, url: data.url! }
}
