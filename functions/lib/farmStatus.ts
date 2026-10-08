import { XMLParser } from 'fast-xml-parser'
import { z } from 'zod'
import type { Env } from './env'
import { fetchWithTimeout } from './http'
import { logWarn } from './log'

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

const playerSchema = z.object({
  '@_isUsed': z.string().optional(),
  '@_isAdmin': z.string().optional(),
  '@_uptime': z.coerce.number().int().nonnegative().catch(0),
  '#text': z.string().optional(),
})
const serverSchema = z.object({
  '@_mapName': z.string().default(''),
  Slots: z.object({
    '@_capacity': z.coerce.number().int().nonnegative(),
    '@_numUsed': z.coerce.number().int().nonnegative(),
    Player: z.array(playerSchema).default([]),
  }),
})

export function parseFarmPlayers(xml: string): Pick<FarmStatus, 'mapName' | 'players'> {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('invalid_farm_xml')
  const parsed = new XMLParser({
    ignoreAttributes: false,
    parseTagValue: false,
    isArray: (name) => name === 'Player',
  }).parse(xml, true) as Record<string, unknown>
  const root = Object.values(parsed).find((value) =>
    typeof value === 'object' && value !== null && 'Slots' in value,
  )
  const server = serverSchema.parse(root)
  return {
    mapName: server['@_mapName'],
    players: {
      count: server.Slots['@_numUsed'],
      max: server.Slots['@_capacity'],
      list: server.Slots.Player.filter((player) => player['@_isUsed'] === 'true').map((player) => ({
        name: player['#text']?.trim() || 'Unknown',
        isAdmin: player['@_isAdmin'] === 'true',
        uptime: player['@_uptime'],
      })),
    },
  }
}

function hasClass(tag: string, name: string): boolean {
  const value = /\bclass\s*=\s*["']([^"']*)["']/i.exec(tag)?.[1]
  return value?.split(/\s+/).includes(name) ?? false
}

export function parseFarmPanel(html: string): Pick<FarmStatus, 'gameStatus' | 'uptime'> {
  const indicator = [...html.matchAll(/<div\b[^>]*>/gi)].find(([tag]) => hasClass(tag, 'status-indicator'))
  if (!indicator) throw new Error('farm_panel_status_missing')
  const online = hasClass(indicator[0], 'online')
  const span = [...html.matchAll(/<span\b[^>]*>[\s\S]*?<\/span>/gi)]
    .find(([tag]) => hasClass(tag.slice(0, tag.indexOf('>') + 1), 'monitorHead'))
  const raw = span?.[0].replace(/<[^>]*>/g, '').trim() ?? ''
  const time = /^(\d+)\s*:\s*(\d+)h?$/.exec(raw)
  return {
    gameStatus: online ? 'online' : 'offline',
    uptime: online ? (time ? `${Number(time[1])}h ${Number(time[2])}min` : raw) : '',
  }
}

export async function fetchFarmStatus(env: Env): Promise<FarmStatus | null> {
  if (!env.FS25_BISECT_API_KEY || !env.FS25_BISECT_SERVER_UUID || !env.FS25_BISECT_PANEL_BASE_URL ||
      !env.FS25_BISECT_PANEL_USERNAME || !env.FS25_BISECT_PANEL_PASSWORD || !env.FS25_XML_CODE) {
    logWarn('farmStatus', 'configuração do servidor ausente')
    return null
  }
  try {
    const base = env.FS25_BISECT_PANEL_BASE_URL.replace(/\/$/, '')
    const panelUrl = new URL(base + '/index.html')
    panelUrl.search = new URLSearchParams({
      login: 'true', username: env.FS25_BISECT_PANEL_USERNAME, password: env.FS25_BISECT_PANEL_PASSWORD,
    }).toString()
    const xmlUrl = new URL(base + '/feed/dedicated-server-stats.xml')
    xmlUrl.searchParams.set('code', env.FS25_XML_CODE)
    const options: RequestInit = { headers: { 'Cache-Control': 'no-cache' }, redirect: 'error' }
    const responses = await Promise.all([
      fetchWithTimeout(
        `https://games.bisecthosting.com/api/client/servers/${encodeURIComponent(env.FS25_BISECT_SERVER_UUID)}/resources`,
        { ...options, headers: { ...options.headers, Authorization: `Bearer ${env.FS25_BISECT_API_KEY}`, Accept: 'application/json' } },
      ),
      fetchWithTimeout(panelUrl.href, options),
      fetchWithTimeout(xmlUrl.href, options),
    ])
    if (responses.some((response) => !response.ok)) {
      logWarn('farmStatus', 'consulta direta retornou erro', { statuses: responses.map((response) => response.status) })
      return null
    }
    const [host, html, xml] = await Promise.all([
      responses[0].json(), responses[1].text(), responses[2].text(),
    ])
    const hostStatus = z.object({ attributes: z.object({ current_state: z.string().min(1) }) }).parse(host).attributes.current_state
    const panel = parseFarmPanel(html)
    return {
      hostStatus,
      ...parseFarmPlayers(xml),
      ...panel,
      healthy: hostStatus === 'running' && panel.gameStatus === 'online',
      updatedAt: new Date().toISOString(),
    }
  } catch {
    // URLs de consulta contêm credenciais; não registrar objetos de erro do fetch.
    logWarn('farmStatus', 'consulta direta do servidor falhou')
    return null
  }
}
