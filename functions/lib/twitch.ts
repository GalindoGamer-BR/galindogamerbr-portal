import type { Env } from './env'
import { TWITCH_LOGIN } from './socialConstants'
import { fetchWithTimeout } from './http'
import { logWarn, logError } from './log'

// App Access Token (client_credentials) — sem OAuth de usuário, sem
// moderador, sem broadcaster autorizando nada. helix/streams é dado
// público (o mesmo "N assistindo" que qualquer um vê no site da Twitch),
// só exige credencial de aplicativo pra chamar a API oficial.
export async function getAppAccessToken(env: Env): Promise<string | null> {
  const res = await fetchWithTimeout('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.TWITCH_CLIENT_ID,
      client_secret: env.TWITCH_CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  })
  if (!res.ok) return null
  const data = (await res.json()) as { access_token?: string }
  return data.access_token ?? null
}

export type TwitchLiveStatus = { isLive: boolean; viewerCount: number | null }

export async function fetchTwitchLiveStatus(env: Env): Promise<TwitchLiveStatus | null> {
  try {
    const accessToken = await getAppAccessToken(env)
    if (!accessToken) {
      logWarn('twitch', 'Falha ao obter access token')
      return null
    }

    const res = await fetchWithTimeout(`https://api.twitch.tv/helix/streams?user_login=${TWITCH_LOGIN}`, {
      headers: { authorization: `Bearer ${accessToken}`, 'client-id': env.TWITCH_CLIENT_ID },
    })
    if (!res.ok) {
      logWarn('twitch', 'helix/streams retornou erro', { status: res.status })
      return null
    }

    const data = (await res.json()) as { data?: [{ viewer_count?: number }] }
    const stream = data.data?.[0]
    return { isLive: !!stream, viewerCount: stream?.viewer_count ?? null }
  } catch (err) {
    logError('twitch', 'fetchTwitchLiveStatus falhou', { err })
    return null
  }
}
