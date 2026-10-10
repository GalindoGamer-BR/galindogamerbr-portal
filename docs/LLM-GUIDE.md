# GalindoGamerBR — guia do sistema para agentes de LLM

> Documento de referência para qualquer agente (ou pessoa) que vá ler, alterar ou operar este conjunto de repositórios.
> Formato: fatos verificáveis, caminhos exatos, tabelas e invariantes. Onde algo **não foi validado**, está marcado como `[NÃO VALIDADO]`.
> Estado descrito: 2026-10-10. Os repositórios são independentes (cada um com seu `.git`) e ficam lado a lado em `F:\Projects\GalindoGamer-BR\`.

## 0. TL;DR
- Site de uma comunidade de games: **frontend estático** (Cloudflare Pages) + **backend em Node** (K3s na Oracle, ainda não implantado) + **Supabase** (Postgres/Auth/Realtime).
- Funcionalidade principal nova: **multichat** em `/live` — junta os chats de Twitch, YouTube, Kick e TikTok numa linha do tempo e permite enviar mensagens a várias plataformas.
- A página `/live` também traz **informações do canal** (título, categoria e descrição da Twitch; nome, inscritos e descrição do YouTube; a última live arquivada quando não há transmissão), **emotes** (Twitch, Kick, BTTV e FFZ, com bloqueio visível dos que o usuário não pode usar) e **badges** da Twitch. Ver seção 6.1.
- Vinculação de contas (entrar com TikTok, sessão de envio ao TikTok, vincular YouTube) está **desligada por feature flag** por padrão. A **leitura** do chat não depende dessas flags.
- O maior risco operacional é a **cota diária da YouTube Data API** (10.000 unidades/dia por projeto). Há um modelo de custo e proteções descritos na seção 7.
- Tudo roda localmente com `docker compose`. Os commits estão **locais, sem push**.

## 1. Mapa dos repositórios

| Pasta | Papel | Stack | Porta local | Branch atual | Testes |
|---|---|---|---|---|---|
| `galindogamerbr-portal` | Frontend + compose local + docs | React, Vite, react-router, zod, supabase-js | 5173 | `refactor/pages-frontend-only` | `vitest run` (dentro do container `portal`) |
| `auth-service` | Identidade, OAuth de contas, tokens, admin OTP | Node 22, Fastify, supabase-js | 3003 | `feat/linking-flags` | `npm test` (`tsx --test`) |
| `multichat-command` | Envio de mensagens, sessão TikTok, histórico `/api/chat/recent` | Node 22, Fastify | 3001 | `refactor/extract-auth-service` | `npm test` |
| `multichat-reader` | Leitura dos chats, normalização, Realtime, histórico em memória | Node 22, Fastify, ws, `@grpc/grpc-js` | 3002 | `chore/k8s-deploy` | `npm test` |
| `galindogamerbr-api` | API de conteúdo/estatísticas/webhooks/admin + jobs | Node 22, Hono, esbuild, vitest | 3004 | `feat/youtube-quota-guard` | `npm test` (`vitest run`) |
| `k8s-platform` | Base do K3s, scripts de VM/tunnel, healthz, workflow de infra | YAML + bash | — | `feat/vm-bootstrap-and-healthz` | `kubeconform`, `actionlint`, `shellcheck` |
| `fs25-monitoring-worker` | Monitor do servidor FS25 (30 s), estado no Postgres | Python | 3005 | `chore/gitignore` | `[NÃO TOCADO]` |
| `fs25-mods-sync` | Sincronização de mods (CronJob + API + PVC) | Python | 3006 | `chore/gitignore` | `[NÃO TOCADO]` |
| `tiktok-browser` (raiz) | Serviço Chromium do TikTok **para o K3s**: guarda as sessões no Postgres (`multichat.tiktok_browser_sessions`), tem `k8s/tiktok-browser.yaml` e imagem própria no GHCR | Node 22 | 3000 | `main` | `npm test` |

**Atenção:** existem duas cópias do serviço Chromium. O compose local constrói a antiga, `multichat-command/tiktok-browser/` (sessões em disco); o K3s usa a do repositório `tiktok-browser` (sessões no Postgres). Antes de ligar o TikTok em produção, alinhe o compose à versão da raiz. Cada repositório tem um `AGENTS.md` com comandos e invariantes específicos. Este guia cobre o que atravessa repositórios.

## 2. Arquitetura

```
Navegador ──► Cloudflare Pages (estático + functions/[[path]].ts = proxy)
                         │  /api, /oauth, /webhooks, /discord  (X-Origin-Auth)
                         ▼
        Cloudflare Tunnel (cloudflared, pod) ──► Traefik (K3s) ──► Services
```

Roteamento por prefixo mais longo (idêntico no gateway local `docker/traefik/dynamic.yml` e em `k8s-platform/base/platform.yaml`):

| Caminho | Serviço |
|---|---|
| `/oauth/*`, `/api/account*`, `/api/accounts*`, `/api/member`, `/api/tiktok/connection` | `auth-service` |
| `/api/chat/*`, `/api/tiktok/*` (exceto `/connection`), `/api/member/activity` | `multichat-command` |
| `/webhooks/kick` | `multichat-reader` |
| `/healthz` | `healthz` (nginx, só no K3s) |
| `/api/*`, `/webhooks/*`, `/discord` (restante) | `portal-api` (`galindogamerbr-api`) |
| `/api/multichat-emotes`, `/api/multichat-badges`, `/api/twitch-channel`, `/api/youtube-channel`, `/api/youtube-last-live` (dentro do `/api/*` acima) | `portal-api`; públicas e com cache de borda |
| `/api/accounts/twitch/{subscription,emotes,adopt}` (dentro de `/api/accounts*`) | `auth-service`; usam o token Twitch do próprio membro |
| host `mods.<domínio>` | `mods-files` / `fs25-mods-sync` |

`/internal/*` **não tem rota pública**: só existe entre pods.

### Dados
Um Postgres (Supabase) com **um schema por serviço**: `auth_service`, `multichat`, `portal`, `fs25`. O frontend usa Supabase Auth (GoTrue) para sessão e Supabase Realtime para o chat.

### Comunicação interna e segredos compartilhados
| Segredo | Quem usa | Observação |
|---|---|---|
| `TOKEN_ENCRYPTION_KEY` | `auth-service`, `command` | **Deve ser igual**; mudar invalida tokens guardados. AES-256-GCM, contexto `userId:plataforma`. |
| `INTERNAL_SERVICE_TOKEN` | `auth-service`, `command`, `tiktok-browser` | Bearer das rotas `/internal/*` do auth-service e do `tiktok-browser`. |
| `INTERNAL_WAKE_SECRET` | `reader`, `command` | Bearer das rotas `/internal/*` do reader. |
| `SUPABASE_JWT_*` | `auth-service`, `command`, `portal-api` | Validação **local** do JWT. |
| `ORIGIN_AUTH_SECRET` | `portal-api`, Pages | Prova que o proxy do Pages originou a requisição. |

## 3. Desenvolvimento local

```sh
cd galindogamerbr-portal
node scripts/multichat-env.mjs                                  # cria .env.docker com segredos locais (preserva o existente)
docker compose --env-file .env.docker up --build -d --wait --remove-orphans
```
**Sempre** passe `--env-file .env.docker`; sem isso o compose falha com `POSTGRES_PASSWORD ... missing`.

| Serviço | URL local |
|---|---|
| Portal (Vite dev) | `http://127.0.0.1:5173` (`/live`, `/login`, `/membro`, `/conta`, `/fazenda`...) |
| Gateway (Traefik) | `http://127.0.0.1:8088` (espelha o roteamento de produção) |
| Supabase | `http://127.0.0.1:54321` |
| auth-service / command / reader / portal-api | `:3003` / `:3001` / `:3002` / `:3004` |

Perfis opcionais do compose:
| Perfil | Sobe | Exige |
|---|---|---|
| `fs25` | `fs25-monitor`, `fs25-mods-sync`, `mods-files` | credenciais do Bisect |
| `simulation` | `mock-platform` | — |
| `jobs` | `social-stats` (uso: `docker compose --env-file .env.docker --profile jobs run --rm social-stats`) | tokens de Instagram/TikTok |
| `tiktok-link` | `tiktok-browser` (Chromium) | `TIKTOK_LINKING_ENABLED=true` |

Rodar os testes:
- Serviços Node: `cd <repo> && npm test && npm run typecheck` (o reader exige `npm ci` na máquina; os demais já têm `node_modules`).
- Portal (sem `node_modules` no host): `docker compose --env-file .env.docker exec -T portal sh -c 'npx tsc -b; npx vitest run; npx oxlint'`.

Armadilhas conhecidas:
- **Vite no Docker Desktop (Windows)** não recebia eventos de arquivo e servia módulos antigos. Corrigido com `VITE_USE_POLLING=true` no compose. Se o frontend parecer desatualizado, confirme com `curl http://127.0.0.1:5173/src/<arquivo>` e recrie o `portal`.
- No Git Bash, comandos `docker exec -w /caminho` precisam de `MSYS_NO_PATHCONV=1`.
- `.env.docker`, `.dev.vars` e `*.env` são ignorados pelo git e contêm credenciais reais. **Nunca** os leia para a conversa nem os commite; confira variáveis só por presença.
- **Supabase local x hospedado.** Sem variáveis `HOSTED_SUPABASE_*` no `.env.docker` (o padrão atual) login, sessão e Realtime são do GoTrue/Realtime **locais**. Com elas, só **login e Realtime** vão ao Supabase hospedado: os dados do portal (agenda, estatísticas, tokens) continuam no **Postgres do compose** (`DATABASE_URL` fixo no `compose.yaml`).
- **Dados do D1 no banco local:** `galindogamerbr-api/scripts/import-d1-to-compose.ps1` (simulação) e `-Apply` (exige `npx wrangler login`) copiam o D1 para o Postgres do compose, não para a produção. A agenda publicada fica em cache no KV (`portal.kv_cache`, chave `schedule:published-json`): após importar, apague essa chave.
- **O `migrate.sh` reaplica todas as migrations a cada subida.** Migration que recria tabela já movida de schema volta a duplicá-la (foi o caso de `public.tiktok_sessions`, removida). Mantenha as migrations idempotentes.
- O teste `src/features/multichat/MultichatPage.render.test.ts` renderiza a página `/live` inteira e pega erros de execução que o `tsc` não vê (ex.: variável usada antes de declarar, que derrubava a página com "Não foi possível carregar a página").

## 4. Feature flags

| Flag | Onde | Padrão | Efeito quando desligada |
|---|---|---|---|
| `TIKTOK_LINKING_ENABLED` | `auth-service`, `command` | `false` | `/oauth/tiktok/*`, `/api/tiktok/*`, `/internal/tiktok/*` → **404** `tiktok_linking_disabled`; `GET /api/tiktok/live` → `{state:"disabled"}`; envio ao TikTok → `tiktok_disabled`; `/api/member/activity` não é registrada |
| `VITE_TIKTOK_LINKING_ENABLED` | build do portal | ausente = off | some "Entrar com TikTok", a sessão por QR e a ajuda do TikTok |
| `YOUTUBE_LINKING_ENABLED` | `auth-service`, `command` | `false` | `/oauth/youtube/*` e `/api/accounts/youtube` → 404 `youtube_linking_disabled`; `/api/accounts` devolve `youtube:{connected:false}` (contas salvas são mantidas); envio → `youtube_disabled` sem chamar o auth-service |
| `VITE_YOUTUBE_LINKING_ENABLED` | build do portal | ausente = off | `linkablePlatforms` e `chatFilterPlatforms` omitem o YouTube; o **player** e a **leitura** não mudam |
| `TIKTOK_SEND_ENABLED` | `command` | `false` | envio ao TikTok desligado mesmo com a vinculação ligada |

Como ligar: **local** — `TIKTOK_LINKING_ENABLED=true` / `YOUTUBE_LINKING_ENABLED=true` no `.env.docker` (o compose repassa para os 3 pontos), `--profile tiktok-link` para o Chromium, recriar `auth-service command portal`. **K3s** — editar `multichat-command/k8s/command.yaml` e `auth-service/k8s/auth-service.yaml`, escalar `deploy/tiktok-browser --replicas=1`, e definir as variáveis de repositório `TIKTOK_LINKING_ENABLED`/`YOUTUBE_LINKING_ENABLED` (o build do Pages as lê).

## 5. Login e contas
- **Login do membro**: `/login` → botão **Entrar com Twitch** (`supabase.auth.signInWithOAuth`, escopos `user:read:email user:write:chat user:read:subscriptions user:read:follows user:read:emotes`, `redirectTo` = `/login`). Depois: se o usuário não tem e-mail confirmado (ou é `@tiktok.identity.invalid`), mostra `MemberEmail`; senão vai a `/membro`. Com a flag do TikTok ligada há também `POST /oauth/tiktok/login` → `/login#tiktok_login=<id>` → `POST /oauth/tiktok/exchange`.
- **Gate de e-mail**: sem e-mail confirmado, o `command` responde 403 `email_verification_required`.
- **Login em modal** (`components/layout/LoginModal.tsx`, renderizado no `body`): aberto pela navbar e pelos botões "Entrar" do `/live`. O OAuth continua voltando por `/login` (que conclui a sessão); a página de origem é guardada em `sessionStorage` (`portal:login:return`, TTL de 10 min, só caminhos internos, nunca `/login`) e `takeReturnTo()` leva o usuário de volta a ela; sem origem, vai a `/membro`.
- **Logout** pela navbar ou pelo menu do `/live` fica na mesma página, exceto em `/admin`, `/membro` e `/conta` (vai para `/`). O hook `useNavSession` expõe sessão, nome e foto; o evento `portal:profile-updated` atualiza a navbar depois de editar o perfil.
- **Área do membro** (`/membro`): foto com menu (Enviar/Remover foto, recorte com zoom), menu **Ações** (Mudar nome de exibição, Excluir conta com confirmação `EXCLUIR`), dropdown "Contas conectadas" (aberto sozinho ao voltar do OAuth de vínculo, que agora retorna a `/membro`). `/conta` ainda existe (a Política de Privacidade aponta para ela); a exclusão é o mesmo componente (`AccountSettings`).
- **Vincular contas para enviar** é outro passo: `GET /oauth/<plataforma>/start` no `auth-service`, que guarda o token **criptografado**; o `command` o obtém por `POST /internal/tokens`. Hoje só Twitch e Kick aparecem.
- **Admin**: login só pelo Supabase Auth (código por e-mail ou Twitch, na tela `/admin/login`). Não há cookie, allowlist nem rotas de auth próprias: o portal envia `Authorization: Bearer <access token>` e as rotas `/api/admin/*` da `galindogamerbr-api` exigem JWT com `app_metadata.role = "admin"`, concedido por SQL (`update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}' where id = ...`). Para revogar, remova a role.

## 6. Multichat: fluxo de dados

**Leitura** (`multichat-reader`):
1. `manager.ts` mantém uma conexão por plataforma (Twitch IRC anônimo ou WebSocket, YouTube, Kick via webhook `/webhooks/kick`, TikTok) com reconexão por backoff.
2. `normalize.ts` converte para o formato único `ChatMessage` (`platform`, `platformMessageId`, `user`, `message`, `timestamp`, `metadata`). `domain.ts` define o schema.
3. `pipeline.ts`: descarta mensagens **anteriores à conexão** (`timestamp < connectedAt`), deduplica por `plataforma:id` (TTL 5 min) e mantém uma **janela em memória das últimas 200** (ordenada por timestamp, sem repetição). Histórico entregue pela plataforma (hoje: YouTube) entra por `seedHistory()` **sem ser retransmitido**.
   - O reader **não** filtra a Twitch por estado de live (antes só aceitava mensagens com a transmissão ligada). A Kick chega por webhook e seus emotes `[emote:<id>:<nome>]` viram `fragments` com `emoteProvider:"kick"` (`normalize.ts: kickContent`).
4. `InboundBuffer` publica em lote no canal Realtime privado **`live:galindogamerbr`** (eventos `chat_batch`, `metrics`, `provider_status`, `live_status`).

**Frontend** (`src/features/multichat/`): `useMultichat.ts` assina o canal, aceita só mensagens com `timestamp >= subscribedAt`, valida com `messageSchema` (zod) e junta com `appendMessages()` (ordena por timestamp, deduplica, limite 1000). Ao abrir, busca o histórico (`HISTORY_LIMIT = 15`) em `GET /api/chat/recent` e o mescla. `ChatVirtualList.tsx` mostra `HH:mm` e virtualiza.

**Histórico**: `GET /api/chat/recent?limit=N` (público, cache 5 s, N ≤ 200) → `command` → `GET reader:/internal/recent`. Se o reader cair, devolve `{messages: []}`. Twitch, Kick e TikTok **não** entregam histórico: só aparecem mensagens recebidas depois que o reader subiu. A janela é só memória (some ao reiniciar).

**Envio**: frontend `POST /api/chat/messages` (JWT) → `command` → `writer(platform).sendMessage(contexto do auth-service, texto)`. Limites: Twitch/Kick 500 caracteres, YouTube 200, TikTok 150; 10 envios/5 s por usuário; no frontend há intervalo de **5 s** entre envios e o textarea só é desabilitado para visitantes.

### 6.1 Interface do `/live` (`src/features/multichat/`)
- **Cabeçalho do canal, por plataforma selecionada.** *Twitch*: título e categoria (`GET /api/twitch-channel`, cache 60 s, reconsulta a cada 2 min), card "Sobre", seguir/sub/"Dar um sub" (a Twitch não tem API para seguir nem presentear: abre o canal em janela) e aviso de "sem anúncios" para subs. *YouTube*: título da live (`/api/live`) ou "Última live: …", inscritos (`GET /api/youtube-channel`), botões **Inscrever-se** (`?sub_confirmation=1`) e **Seja membro** (`/join`). *Kick*: Seguir e Inscrever-se abrem o canal. O card "Interaja na Twitch" (SoundAlerts e Stream Stickers) só aparece com a Twitch selecionada: as extensões só rodam dentro do `twitch.tv` (`X-Frame-Options`), então abrem em janela.
- **Player do YouTube sem live:** mostra a **última live encerrada** (`GET /api/youtube-last-live`: procura, nos 15 uploads mais recentes, o primeiro com `liveStreamingDetails.actualEndTime`).
- **Descrições de canal** passam por `RichText`/`parseRich`: só `**negrito**`, `[texto](https://…)` e links soltos viram elementos, e só `http(s)` vira âncora (sem HTML injetado).
- **Mensagens:** badges da Twitch (`GET /api/multichat-badges`, chave `set_id/versão` igual à tag `badges` do IRC); cor do nome clareada até o contraste mínimo de 4,5:1 (`chatColors.ts`); emotes desenhados por `fragments` (Twitch e Kick, `emoteProvider`) ou pelo catálogo, por código (BTTV e FFZ).
- **Envio por plataforma:** as logos de "Contas conectadas" ligam e desligam cada plataforma (`localStorage` `mc:send-off`, lista de exclusão). Regras de emote (em `MultichatPage.tsx`): código de emote **Twitch, BTTV ou FFZ** → mensagem **só para a Twitch** (BTTV e FFZ são extensões do navegador para a Twitch); emote **Kick** → **só para a Kick**, e o texto da Kick segue em `overrides.kick` com `[emote:<id>:<nome>]` (o `command` o usa no lugar de `message`); os dois tipos na mesma mensagem bloqueiam o envio; smileys com símbolos (`:)`) não contam. Emotes da Kick só aparecem com a Kick conectada e o envio ligado.
- **Seletor de emotes** (`EmotePicker.tsx`, estilo Kick): busca, chips por plataforma, abas de ícone e lista única com seções (usados com frequência no topo, emotes do Galindo, meus emotes, globais; cada um dividido por plataforma). Catálogo `GET /api/multichat-emotes` → `{emotes:[{id,code,provider:"twitch|kick|bttv|ffz",url,source:"channel|global",kind?,tier?,subOnly?}],partial}`; `kind` (`sub|follower|bits`) e `tier` só existem nos emotes de canal da Twitch. Os que o usuário **não pode usar ficam visíveis, com cadeado** e o motivo (liberados primeiro): com `GET /api/accounts/twitch/emotes` (escopo `user:read:emotes`) vale a lista real da Twitch; sem ela, deduz pelo tier de sub e por seguir o canal; deslogado, todos bloqueados. "Meus emotes" são os de outros canais, agrupados pelo canal dono (nome/foto via `helix/users`) ou, sem dono, pelo tipo da coleção (Prime, Hype Train, Recompensas, Tempo limitado, 2FA). Recentes em `localStorage` `mc:recent-emotes` (30). O seletor continua aberto até clicar fora ou Esc.
- **Primeira visita:** o modal "Como funciona" abre sozinho para visitante deslogado se `localStorage` `mc:help-seen` não existir.

## 7. YouTube: cota e leitura

Cota padrão: **10.000 unidades/dia por projeto do Google** (compartilhada por reader, portal-api, command e job de estatísticas). Reset: **meia-noite do horário do Pacífico** (07:00 UTC no horário de verão, 08:00 UTC no de inverno; 04:00 em Brasília agora). O `403 quotaExceeded` **não** informa quando volta (sem `Retry-After`).

| Chamada | Custo | Onde |
|---|---|---|
| `liveChatMessages.list` | 5 | reader (polling / reserva) |
| `liveChatMessages.streamList` (gRPC) | 5 **por conexão**; o Google fecha cada conexão após ~10 s | reader (padrão) |
| `liveChatMessages.insert` | 20 | command (envio) |
| `videos.list`, `playlistItems.list`, `channels.list` | 1 | portal-api, job, command |
| `search.list` | 100 | **evitado** |

Medições (2026-10-09): `pollingIntervalMillis` ≈ 4,97 s; consultar de novo antes disso dá `403 rateLimitExceeded`; `streamList` aceita **chave de API** (header `x-goog-api-key`), janela média 10,3 s, ~1.340 unidades/hora em chat ocupado.

Leitura no reader (`providers.ts: connectYouTube`):
- `YOUTUBE_TRANSPORT=stream` (padrão): janelas de `streamList` com pausa adaptativa (`YOUTUBE_STREAM_GAP_MIN_MS=4000` após atividade, cresce ×1,5 até `..._MAX_MS=35000`), retomando pelo `next_page_token`. **Fallback automático** para `list` se o stream falhar (quarentena de 5 min). `poll`: só `list`, intervalo adaptativo `YOUTUBE_POLL_MIN_MS=10000` … `YOUTUBE_POLL_MAX_MS=45000`.
- `YOUTUBE_DAILY_UNITS=7000` é o teto do reader; ao esgotar (ou ao receber `quotaExceeded`) o reader **espera o reset** (`nextQuotaReset()`), sem reconectar.
- `YOUTUBE_BOOST_MESSAGES=10`: se as outras plataformas somarem esse número de mensagens em 20 s, o YouTube é consultado antes (heurística; `0` desliga).
- `liveChatId` e espectadores vêm do `GET /api/live` do portal-api (um único `videos.list` cacheado), não de chamadas próprias.

Proteções em cada serviço:
- **portal-api**: toda chamada passa por `youtubeFetch` (`src/lib/youtubeQuota.ts`); após `quotaExceeded` não chama o Google até o reset (devolve 403 sintético). Consulta única de `liveStreamingDetails` com memo de 60 s; descoberta de live a cada 5 min; playlists com cache de 30 min.
- **command**: `YOUTUBE_SEND_DAILY_UNITS=2000` (20 por mensagem); `quotaExceeded` bloqueia envios até o reset (`youtube_send_budget`).

Projeção por hora (modelo, não medição direta): chat ocupado ~1.880/h (poll) ou ~1.420/h (stream); chat quieto ~475/h; sem live ~39/h. Antes dos cortes: ~3.975/h com chat ocupado (esgota em ~2 h).

**Custos das rotas novas do portal-api (todas atrás de `withEdgeCache`):** `/api/youtube-channel` 1 unidade (cache 1 h); `/api/youtube-last-live` 2 unidades (`playlistItems` + `videos.list`, cache 30 min). Os emotes, badges e o canal da Twitch usam o token de aplicativo da Twitch (sem cota do YouTube).

## 8. Variáveis de ambiente por serviço (resumo; o schema zod em `src/config.ts` é a fonte da verdade)

| Serviço | Principais |
|---|---|
| `auth-service` | `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SUPABASE_JWT_SECRET`, `TOKEN_ENCRYPTION_KEY`, `INTERNAL_SERVICE_TOKEN`, `FRONTEND_URL`, `TWITCH_*`, `GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI`, `KICK_*`, `TIKTOK_CLIENT_KEY/SECRET/REDIRECT_URI`, `TIKTOK_LINKING_ENABLED`, `YOUTUBE_LINKING_ENABLED` |
| `command` | as de Supabase/JWT, `AUTH_SERVICE_URL`, `READER_URL`, `INTERNAL_WAKE_SECRET`, `INTERNAL_SERVICE_TOKEN`, `TOKEN_ENCRYPTION_KEY`, `LIVE_STATUS_URL`, `YOUTUBE_LIVE_CHAT_ID`, `TIKTOK_BROWSER_URL`, `TIKTOK_SEND_ENABLED`, `TIKTOK_LINKING_ENABLED`, `YOUTUBE_LINKING_ENABLED`, `YOUTUBE_SEND_DAILY_UNITS` |
| `reader` | `SUPABASE_*`, `INTERNAL_WAKE_SECRET`, `AUTO_START`, `TWITCH_*`, `YOUTUBE_API_KEY`, `YOUTUBE_LIVE_STATUS_URL`, `YOUTUBE_TRANSPORT`, `YOUTUBE_POLL_*`, `YOUTUBE_STREAM_GAP_*`, `YOUTUBE_DAILY_UNITS`, `YOUTUBE_BOOST_MESSAGES`, `KICK_*`, `TIKTOK_USERNAME` |
| `portal-api` | `DATABASE_URL`, `DATABASE_SCHEMA`, `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID`, `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET` (emotes, badges e dados do canal), `FS25_BISECT_*`, `FS25_XML_CODE`, `RESEND_API_KEY`, `ORIGIN_AUTH_SECRET`, `DISCORD_*` |
| `social-stats` (job) | `DATABASE_URL`, `YOUTUBE_API_KEY`, `INSTAGRAM_ACCESS_TOKEN`, `TIKTOK_CLIENT_KEY/SECRET` |

**Apenas uma** chave de API do YouTube deve ser usada (`YOUTUBE_API_KEY`). Somar cota com chaves de projetos diferentes viola a política de uso da API (verificar o texto vigente).

## 9. K3s, deploy e infraestrutura (`k8s-platform` e `k8s/` de cada repositório)
- `k8s-platform/base/`: `platform.yaml` (namespace `multichat`, `cloudflared`, Ingress), `healthz.yaml` (`GET /healthz` com a versão de cada serviço), `deployer.yaml` (RBAC do runner, só o namespace).
- `k8s-platform/scripts/`: `cloudflare-tunnel.sh` (cria tunnel/hostnames/DNS pela API; grava `tunnel.env` com modo 600), `bootstrap-vm.sh` (k3s + base + runner), `record-version.sh` / `wait-version.sh`.
- Deploy de cada serviço: `kubectl set image` + `rollout status` + `platform-record-version <serviço> <sha>` num runner self-hosted (`[self-hosted, k3s]`); `infra-check.yml` verifica de fora (runner do GitHub) se o `/healthz` responde.
- A VM e a rede são criadas **à mão no console da Oracle**; o Terraform é **exportado depois** (Resource Discovery) e guardado em `k8s-platform/terraform/` (roteiro: `terraform/README.md`). Não rode `terraform apply` se o plano propuser recriar a instância (apaga os volumes do k3s).
- `[NÃO VALIDADO]` Nada foi aplicado em um cluster real: `bootstrap-vm.sh`, `cloudflare-tunnel.sh` (testado só contra uma API simulada), os manifests em runtime e o gRPC a partir da VM da Oracle.

## 10. Convenções e invariantes (não quebre)
1. **Flags de vinculação nascem desligadas.** Novas integrações de conta devem seguir o padrão: rotas 404 com código `*_linking_disabled`, formato de resposta estável, UI escondida por `VITE_*`.
2. **Nunca imprima, logue ou versione chaves.** Erros de rede não podem conter a URL (ela carrega `key=`); o `request()` do reader expõe só `status` e `reason`.
3. **Toda chamada à YouTube Data API passa pela proteção do seu serviço** (`youtubeFetch`, `spend()` + `youtube()` no reader, `jsonRequest` + `youtubeSendBudget` no command). Não adicione chamadas diretas.
4. **Mensagens de chat são sempre normalizadas** (`ChatMessage`) antes de sair do reader, e o frontend as valida com `messageSchema`.
5. **O reader descarta mensagens anteriores à conexão** exceto via `seedHistory`. Não remova essa regra: ela evita reenviar histórico ao reconectar.
6. **`/internal/*` nunca ganha rota pública** (nem no Traefik local nem no Ingress).
7. **Contas já vinculadas não são apagadas ao desligar uma flag.**
8. **Textos de interface em português**; comentários seguem o idioma do arquivo ao redor. Identificadores em inglês.
9. **Commits**: um por repositório/assunto, mensagem em inglês no estilo `feat:`/`fix:`/`chore:`, terminando com as linhas de atribuição pedidas pelo ambiente. **Nomes de branch nunca contêm "codex".** Não faça push sem pedido explícito.
10. **Node ≥ 22.12**, ES modules (`"type": "module"`), imports relativos com extensão `.js` nos serviços TypeScript.
11. **Regras de emote por plataforma** (seção 6.1): Twitch, BTTV e FFZ só vão para a Twitch; Kick só para a Kick. Não envie o código de um emote a plataformas que não o desenham.
12. **Os emotes da Kick vêm de um snapshot** (`galindogamerbr-api/src/data/kick-emotes.json`, gerado por `scripts/update-kick-emotes.ps1` no PowerShell). Não há endpoint oficial e o WAF da Kick bloqueia o `fetch` do Node (inclusive em Docker); não troque por consulta em tempo de execução. Rode o script quando o canal criar ou remover emotes.
13. **Cache do catálogo no navegador:** `/api/multichat-emotes` sai com `public, max-age=3600`. Ao mudar o formato da resposta, aumente o `?v=N` em `useEmotes.ts`, ou os navegadores mantêm a versão antiga por 1 h.
14. **`user:read:emotes`** é necessário para `chat/emotes/user`. Membros que entraram antes dele recebem `needs_reauth` e o seletor oferece "Liberar meus emotes" (novo login com a Twitch). Só ids numéricos de dono entram na busca de nomes (`owner_id: "twitch"` derrubava o lote inteiro).
15. **Realtime privado:** o canal `live:galindogamerbr` exige a política `multichat_receive` em `realtime.messages`. Local: `docker/realtime.sql`. **Supabase hospedado:** aplicar com `k8s-platform/scripts/supabase-realtime-policy.ps1` ou o SQL de `create policy` equivalente (a tabela pertence a outro papel: nada de `ALTER TABLE`/`GRANT`). Sem ela o reader publica, mas o navegador recebe `Unauthorized` e o chat só aparece ao recarregar.
16. **Ordem dos hooks em `MultichatPage.tsx`:** um hook que usa `player`/`liveStatus` precisa vir depois da declaração deles; o `tsc` não pega e a página cai em execução (o teste de render pega).
17. **Migrations idempotentes e sem recriar tabelas movidas** (o `migrate.sh` reaplica todas a cada subida).

## 11. Pendências e riscos conhecidos
| Item | Situação |
|---|---|
| Cota do YouTube estourada em 2026-10-09 | Volta às 07:00 UTC; o reader retoma sozinho |
| Tokens do Instagram e do TikTok | Vêm do D1 (`instagram_token`, `tiktok_token`) e agora estão no banco local e no de produção; o `INSTAGRAM_ACCESS_TOKEN` do `.env.docker` só serve de partida |
| Token do TikTok do admin (atualizado em 2026-09-10) | Renovação falha localmente; provável reconexão em `/admin/tiktok` `[causa não confirmada]` |
| Métrica do Kick | Coleta devolve "sem dado" `[causa não investigada]` |
| `crypto.ts` decifra AES-GCM sem `authTagLength` | Achado do SAST em `auth-service`, `multichat-command` e `tiktok-browser`; correção de 1 linha pendente |
| Ações do GitHub com tag mutável (67 usos) | Fixar por SHA pendente |
| Importação do D1 | Simulação conferida contra o D1 real (13 tabelas); importado para o Postgres local (`import-d1-to-compose.ps1 -Apply`). Para a produção, confirmar com `select * from portal.site_visits_lifetime` |
| Rotação de credenciais | Ver seção 12 |
| Branches não enviadas | Todos os commits estão só locais |
| Política do Realtime no Supabase hospedado | **Pendente**: sem ela o chat não chega ao vivo em produção (invariante 15) |
| Virada do manifest dos mods | O app embute `https://fs25-mods-sync.azurewebsites.net/api/manifest` e a Function está parada. Plano e verificador em `fs25-mods-sync/README.md` ("Virada do Azure para o Oracle"); exige publicar versão nova do app com `FS25_MANIFEST_URL` apontando para `mods.<domínio>` |
| Estatísticas de visitas | `CF_*` (Cloudflare Analytics) não estão definidas localmente: o total vem do que foi importado do D1 e só cresce com o job configurado |
| Emotes da Kick | Snapshot manual (invariante 12) |
| Risco da VM Oracle | A Oracle pode recuperar instâncias Always Free ociosas (CPU, rede e memória baixas por ~7 dias); verifique as métricas ou converta para pay-as-you-go |

## 12. Segredos a rotacionar (nomes, nunca valores)
- Agora: `PREVIEW_BRIDGE_KEY`/`ORIGIN_AUTH_SECRET` do Pages Preview (apareceu em log de conversa); sessão do TikTok capturada em `multichat-command/experimental/tiktok-direct/output/` (apague a pasta e encerre as sessões da conta).
- Na migração (estão em texto puro em disco): `FS25_BISECT_PANEL_*`, `FS25_XML_CODE`, `FS25_MONITOR_FUNCTION_CODE`, `TWITCH_CLIENT_SECRET`, `KICK_CLIENT_SECRET`, `TIKTOK_CLIENT_SECRET`, `RESEND_API_KEY`, `SMTP_PASS`, `CLOUDFLARE_ANALYTICS_API_TOKEN`, `DISCORD_SCHEDULE_WEBHOOK_URL`, `INSTAGRAM_ACCESS_TOKEN`, `YOUTUBE_PUBSUB_SECRET`; restringir `YOUTUBE_API_KEY` (YouTube Data API v3, por IP).
- Geradas pelo script local (`POSTGRES_PASSWORD`, `JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY`, `TOKEN_ENCRYPTION_KEY`…): descartáveis; **não reutilizar em produção**.

## 13. Verificação rápida (smoke)
```sh
curl -s http://127.0.0.1:8088/api/live | head -c 300                       # status da live (inclui viewerCount e liveChatId)
curl -s "http://127.0.0.1:8088/api/chat/recent?limit=15"                    # histórico (pode vir vazio)
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:5173/live         # frontend
curl -s -X POST http://127.0.0.1:3003/oauth/tiktok/login                    # 404 tiktok_linking_disabled (flag off)
curl -s http://127.0.0.1:3002/ready                                         # reader
```
Testes: `auth-service` 28, `command` 28, `reader` 38, `portal-api` 65, `fs25-mods-sync` 17, `portal` 19 (todos passando em 2026-10-10).

## 14. Glossário
- **liveChatId**: id do chat ao vivo de um vídeo do YouTube (`liveStreamingDetails.activeLiveChatId`). Tem formato derivável (protobuf em base64 de canal + vídeo), mas isso **não é documentado** e só é usado em uma sonda de teste.
- **Janela (stream)**: uma conexão `streamList` de ~10 s; a "pausa" é o intervalo entre janelas.
- **Boost**: pedido de consulta antecipada ao YouTube quando outras plataformas esquentam.
- **Quarentena do stream**: 5 min em polling após falha do stream.
- **Flag de vinculação**: ver seção 4.
- **Pages proxy**: `functions/[[path]].ts`, única Pages Function que encaminha para o backend.
