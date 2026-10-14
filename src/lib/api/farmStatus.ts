export type FarmPlayer = { name: string; isAdmin: boolean; uptime: number }

export type FarmStatus = {
  hostStatus: string
  mapName: string
  gameStatus: string
  players: { count: number; max: number; list: FarmPlayer[] }
  uptime: string
  healthy: boolean
  updatedAt: string
}

export type FarmStatusResponse = { ok: boolean; status: FarmStatus | null }

export async function getFarmStatus(): Promise<FarmStatusResponse> {
  const res = await fetch('/api/farm-status', { cache: 'no-store' })
  return res.json() as Promise<FarmStatusResponse>
}
