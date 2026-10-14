import { adminFetch } from './auth'
export type PublicScheduleBlock = { dayOfWeek: number; startTime: string; endTime: string; note: string | null }
export type PublicScheduleWeek = { cycleIndex: number; blocks: PublicScheduleBlock[] }
export type PublicSchedule = { label: string | null; cycleLength: number; weeks: PublicScheduleWeek[] }

export async function getPublicSchedule(): Promise<PublicSchedule> {
  const res = await fetch('/api/schedule')
  return res.json() as Promise<PublicSchedule>
}

export type ScheduleVersionSummary = { id: number; label: string; cycleLength: number; isPublished: boolean; createdAt: string }

export type ScheduleBlock = {
  id?: number
  cycleIndex: number
  dayOfWeek: number
  startTime: string
  endTime: string
  note: string | null
}

export type ScheduleVersionDetail = {
  id: number
  label: string
  cycleLength: number
  isPublished: boolean
  blocks: ScheduleBlock[]
}

async function adminJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await adminFetch(path, {
    headers: { 'content-type': 'application/json' },
    ...init,
  })
  if (!res.ok) throw new Error(`Falha em ${path}: ${res.status}`)
  return res.json() as Promise<T>
}

export function listVersions() {
  return adminJson<{ versions: ScheduleVersionSummary[] }>('/api/admin/schedule/versions')
}

export function getVersion(id: number) {
  return adminJson<ScheduleVersionDetail>(`/api/admin/schedule/versions/${id}`)
}

export function createVersion(label: string, cycleLength: number) {
  return adminJson<{ id: number }>('/api/admin/schedule/versions', {
    method: 'POST',
    body: JSON.stringify({ label, cycleLength }),
  })
}

export function updateVersion(versionId: number, params: { label?: string; cycleLength?: number }) {
  return adminJson<{ ok: true }>(`/api/admin/schedule/versions/${versionId}`, {
    method: 'PATCH',
    body: JSON.stringify(params),
  })
}

export function saveBlocks(versionId: number, blocks: ScheduleBlock[], portraitImageDataUrl?: string) {
  return adminJson<{ ok: true; count: number; discordPublished: boolean }>(`/api/admin/schedule/versions/${versionId}/blocks`, {
    method: 'PUT',
    body: JSON.stringify({ blocks, portraitImageDataUrl }),
  })
}

export function publishVersion(versionId: number) {
  return adminJson<{ ok: true }>(`/api/admin/schedule/versions/${versionId}/publish`, { method: 'POST' })
}
