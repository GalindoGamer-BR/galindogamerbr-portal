export type Env = {
  DB: D1Database
  // Cache de leitura pública compartilhado entre todos os visitantes (live
  // status, viewer count, stats de redes sociais, programação publicada) —
  // D1 continua sendo a fonte de verdade; isso é só a camada quente.
  PUBLIC_CACHE: KVNamespace
  RESEND_API_KEY: string
  SESSION_SECRET: string
  OTP_PEPPER: string
  SESSION_COOKIE_NAME: string
  OTP_EXPIRY_MINUTES: string
  ENVIRONMENT: string
  // Automação de live (ver functions/lib/youtube.ts) — detecção de live e
  // últimos uploads seguem keyless (scraping/feed público), mas o número de
  // espectadores simultâneos usa a YouTube Data API v3 (mais confiável que
  // parsear a página do vídeo).
  YOUTUBE_CHANNEL_ID: string
  YOUTUBE_API_KEY: string
  // Assina/valida as notificações do WebSub (PubSubHubbub) do YouTube (ver
  // functions/api/webhooks/youtube.ts) — mesmo valor configurado como secret
  // do worker (workers/social-stats-cron), que é quem pede a inscrição.
  YOUTUBE_PUBSUB_SECRET: string
  // Visitas do site: Cloudflare Web Analytics (RUM) via GraphQL Analytics
  // API, dataset rumPageloadEventsAdaptiveGroups — é account-scoped, não
  // zone-scoped (ver functions/lib/cfAnalytics.ts). Nome distinto de
  // CLOUDFLARE_API_TOKEN (usado no deploy) de propósito — são tokens
  // diferentes, com escopos diferentes (esse é só leitura de Account
  // Analytics; o de deploy tem permissão de editar Pages/D1/Workers).
  CLOUDFLARE_ANALYTICS_API_TOKEN: string
  CLOUDFLARE_ACCOUNT_ID: string
  // Verify token do produto Webhooks (ver functions/api/webhooks/instagram.ts)
  // — string arbitrária definida por nós, que a Meta ecoa de volta no
  // handshake de verificação. Não usamos webhooks de verdade ainda (não
  // processamos nenhum evento), só implementa o handshake pra passar na
  // validação do painel da Meta.
  INSTAGRAM_WEBHOOK_VERIFY_TOKEN: string
  // App Secret do app da Meta (Configurações do app > Básico) — assina o
  // corpo de cada notificação de evento (header x-hub-signature-256).
  // Opcional por enquanto: ainda não processamos evento nenhum (ver
  // functions/api/webhooks/instagram.ts), então sem esse secret configurado
  // o endpoint mantém o comportamento atual (só confirma recebimento).
  // Assim que alguma lógica real for plugada ali, configurar via
  // `wrangler secret put INSTAGRAM_APP_SECRET` deixa a verificação
  // obrigatória.
  INSTAGRAM_APP_SECRET?: string
  // Espectadores ao vivo da Twitch (ver functions/lib/twitch.ts) — só
  // credencial de app (client_credentials), dado público, sem OAuth de
  // usuário/moderador (isso só seria necessário pra follower count, que
  // não usamos aqui — ver workers/social-stats-cron/src/twitch.ts).
  TWITCH_CLIENT_ID: string
  TWITCH_CLIENT_SECRET: string
  // Status ao vivo/espectadores do Kick (ver functions/lib/kick.ts) — API
  // oficial (docs.kick.com), mesmo espírito da Twitch: só credencial de app
  // (client_credentials), dado público. followers_count não existe nessa
  // API oficial, então seguidores continua vindo do endpoint interno em
  // workers/social-stats-cron/src/scrape.ts.
  KICK_CLIENT_ID: string
  KICK_CLIENT_SECRET: string
  // OAuth do TikTok (Login Kit, ver functions/api/admin/tiktok/*.ts) —
  // conectado uma vez pelo admin, o worker renova o token sozinho depois.
  TIKTOK_CLIENT_KEY: string
  TIKTOK_CLIENT_SECRET: string
  // Credenciais do servidor FS25, disponíveis somente no Worker.
  FS25_BISECT_API_KEY: string
  FS25_BISECT_SERVER_UUID: string
  FS25_BISECT_PANEL_BASE_URL: string
  FS25_BISECT_PANEL_USERNAME: string
  FS25_BISECT_PANEL_PASSWORD: string
  FS25_XML_CODE: string
  // Webhook exclusivo do canal de programações. Mantido como secret no
  // Cloudflare; permite publicar e remover apenas mensagens desse webhook.
  DISCORD_SCHEDULE_WEBHOOK_URL?: string
}
