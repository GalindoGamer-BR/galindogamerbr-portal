import type { Env } from '../lib/env'
import { fetchFarmStatus } from '../lib/farmStatus'
import { json } from '../lib/http'

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const status = await fetchFarmStatus(context.env)
  return json({ ok: status !== null, status }, { headers: { 'Cache-Control': 'no-store' } })
}
