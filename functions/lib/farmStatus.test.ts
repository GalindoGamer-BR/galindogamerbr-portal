import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchFarmStatus, parseFarmPanel, parseFarmPlayers } from './farmStatus'
import { onRequestGet } from '../api/farm-status'
import type { Env } from './env'

const xml = '<Server name="private-server" mapName="BR &amp; MS"><Slots capacity="10" numUsed="1"><Player isUsed="true" isAdmin="true" uptime="42">Galindo &amp; Amigos</Player><Player isUsed="false">Empty</Player></Slots></Server>'
const panel = '<div class="status-indicator online"></div><span class="monitorHead">13:30h</span>'
const env = {
  FS25_BISECT_API_KEY: 'private-api-key',
  FS25_BISECT_SERVER_UUID: 'server-id',
  FS25_BISECT_PANEL_BASE_URL: 'https://panel.example.test',
  FS25_BISECT_PANEL_USERNAME: 'admin',
  FS25_BISECT_PANEL_PASSWORD: 'private-password',
  FS25_XML_CODE: 'private-xml-code',
} as Env

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })
function upstream() {
  return vi.fn(async (input: string) => {
    if (input.includes('/resources')) return Response.json({ attributes: { current_state: 'running' } })
    return new Response(input.includes('/feed/') ? xml : panel)
  })
}

describe('status direto da fazenda', () => {
  it('lê jogadores ocupados, mapa e entidades XML sem expor nome do servidor', () => {
    expect(parseFarmPlayers(xml)).toEqual({
      mapName: 'BR & MS',
      players: { count: 1, max: 10, list: [{ name: 'Galindo & Amigos', isAdmin: true, uptime: 42 }] },
    })
  })
  it('aceita servidor vazio sem inventar jogadores', () => {
    expect(parseFarmPlayers('<Server><Slots capacity="10" numUsed="0"/></Server>').players.list).toEqual([])
  })
  it('rejeita XML inválido, incompleto ou com DTD', () => {
    for (const body of ['<Server>', '<Server/>', '<!DOCTYPE Server><Server/>']) {
      expect(() => parseFarmPlayers(body)).toThrow()
    }
  })
  it('distingue painel online, offline e página de login', () => {
    expect(parseFarmPanel(panel)).toEqual({ gameStatus: 'online', uptime: '13h 30min' })
    expect(parseFarmPanel("<div class='status-indicator offline'></div>")).toEqual({ gameStatus: 'offline', uptime: '' })
    expect(() => parseFarmPanel('<form>Login</form>')).toThrow()
  })
  it('consulta as três fontes a cada chamada e mantém segredos fora da resposta', async () => {
    const fetch = upstream()
    vi.stubGlobal('fetch', fetch)
    const context = { env } as Parameters<typeof onRequestGet>[0]
    for (let i = 0; i < 2; i++) {
      const response = await onRequestGet(context) as Response
      expect(response.headers.get('cache-control')).toBe('no-store')
      const body = await response.text()
      expect(JSON.parse(body).status.healthy).toBe(true)
      for (const secret of ['private-api-key', 'private-password', 'private-xml-code', 'private-server']) expect(body).not.toContain(secret)
    }
    expect(fetch).toHaveBeenCalledTimes(6)
    expect(fetch.mock.calls.every(([url]) => !url.includes('azurewebsites'))).toBe(true)
  })
  it('retorna indisponível se faltam credenciais ou uma fonte falha', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('', { status: 403 }))
    vi.stubGlobal('fetch', fetch)
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(await fetchFarmStatus({} as Env)).toBeNull()
    expect(fetch).not.toHaveBeenCalled()
    expect(await fetchFarmStatus(env)).toBeNull()
  })
  it('não registra URLs ou credenciais em falhas de rede', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('private-password')))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(await fetchFarmStatus(env)).toBeNull()
    expect(JSON.stringify(warn.mock.calls)).not.toContain('private-password')
  })
})
