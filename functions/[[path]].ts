// Única Pages Function que resta: repassa as chamadas de backend ao K3s (via Cloudflare Tunnel -> Traefik),
// mantendo a mesma origem do portal (cookies SameSite=Lax) e as URLs públicas já cadastradas
// (callbacks OAuth, WebSub do YouTube, webhook do Instagram). Todo o resto é estático.
// _routes.json restringe a execução a estes prefixos; a allowlist abaixo repete a regra por segurança.
interface Env {
  API_ORIGIN: string
  ORIGIN_AUTH_SECRET: string
}

const ALLOWED = [/^\/api\//, /^\/oauth\//, /^\/webhooks\//, /^\/discord\/?$/]

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  if (!ALLOWED.some((rule) => rule.test(url.pathname)) || !env.API_ORIGIN) {
    return new Response('Not found', { status: 404 })
  }
  const headers = new Headers(request.headers)
  headers.set('x-origin-auth', env.ORIGIN_AUTH_SECRET ?? '')
  // CF-Connecting-IP seen here is the real visitor; the origin only trusts it when X-Origin-Auth is valid.
  headers.set('x-real-client-ip', request.headers.get('cf-connecting-ip') ?? '')
  headers.set('x-forwarded-host', url.host)
  headers.set('x-forwarded-proto', 'https')
  headers.delete('host')
  const response = await fetch(new URL(url.pathname + url.search, env.API_ORIGIN), {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    redirect: 'manual',
  })
  return new Response(response.body, response)
}
