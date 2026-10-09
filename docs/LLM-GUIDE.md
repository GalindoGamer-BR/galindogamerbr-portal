# GalindoGamerBR — guia do sistema para agentes de LLM

> Documento de referência para qualquer agente (ou pessoa) que vá ler, alterar ou operar este conjunto de repositórios.
> Formato: fatos verificáveis, caminhos exatos, tabelas e invariantes. Onde algo **não foi validado**, está marcado como `[NÃO VALIDADO]`.
> Estado descrito: 2026-10-09. Os repositórios são independentes (cada um com seu `.git`) e ficam lado a lado em `F:\Projects\GalindoGamer-BR\`.

## 0. TL;DR
- Site de uma comunidade de games: **frontend estático** (Cloudflare Pages) + **backend em Node** (K3s na Oracle, ainda não implantado) + **Supabase** (Postgres/Auth/Realtime).
- Funcionalidade principal nova: **multichat** em `/live` — junta os chats de Twitch, YouTube, Kick e TikTok numa linha do tempo e permite enviar mensagens a várias plataformas.
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
| `tiktok-browser` (raiz) | **Cópia duplicada e não usada** do serviço Chromium | — | — | — | o serviço em uso é `multichat-command/tiktok-browser/` |

Cada repositório tem um `AGENTS.md` com comandos e invariantes específicos. Este guia cobre o que atravessa repositórios.

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
| `/oauth/*`, `/api/auth/*`, `/api/account*`, `/api/accounts*`, `/api/member`, `/api/tiktok/connection` | `auth-service` |
| `/api/chat/*`, `/api/tiktok/*` (exceto `/connection`), `/api/member/activity` | `multichat-command` |
| `/webhooks/kick` | `multichat-reader` |
| `/healthz` | `healthz` (nginx, só no K3s) |
| `/api/*`, `/webhooks/*`, `/discord` (restante) | `portal-api` (`galindogamerbr-api`) |
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
- **Login do membro**: `/login` → botão **Entrar com Twitch** (`supabase.auth.signInWithOAuth`, escopo `user:read:email`, `redirectTo` = `/login`). Depois: se o usuário não tem e-mail confirmado (ou é `@tiktok.identity.invalid`), mostra `MemberEmail`; senão vai a `/membro`. Com a flag do TikTok ligada há também `POST /oauth/tiktok/login` → `/login#tiktok_login=<id>` → `POST /oauth/tiktok/exchange`.
- **Gate de e-mail**: sem e-mail confirmado, o `command` responde 403 `email_verification_required`.
- **Vincular contas para enviar** é outro passo: `GET /oauth/<plataforma>/start` no `auth-service`, que guarda o token **criptografado**; o `command` o obtém por `POST /internal/tokens`. Hoje só Twitch e Kick aparecem.
- **Admin**: OTP por e-mail (Supabase Auth), restrito a `ADMIN_EMAILS`; rotas `/api/admin/*` exigem JWT com `app_metadata.role = "admin"`.

## 6. Multichat: fluxo de dados

**Leitura** (`multichat-reader`):
1. `manager.ts` mantém uma conexão por plataforma (Twitch IRC anônimo ou WebSocket, YouTube, Kick via webhook `/webhooks/kick`, TikTok) com reconexão por backoff.
2. `normalize.ts` converte para o formato único `ChatMessage` (`platform`, `platformMessageId`, `user`, `message`, `timestamp`, `metadata`). `domain.ts` define o schema.
3. `pipeline.ts`: descarta mensagens **anteriores à conexão** (`timestamp < connectedAt`), deduplica por `plataforma:id` (TTL 5 min) e mantém uma **janela em memória das últimas 200** (ordenada por timestamp, sem repetição). Histórico entregue pela plataforma (hoje: YouTube) entra por `seedHistory()` **sem ser retransmitido**.
4. `InboundBuffer` publica em lote no canal Realtime privado **`live:galindogamerbr`** (eventos `chat_batch`, `metrics`, `provider_status`, `live_status`).

**Frontend** (`src/features/multichat/`): `useMultichat.ts` assina o canal, aceita só mensagens com `timestamp >= subscribedAt`, valida com `messageSchema` (zod) e junta com `appendMessages()` (ordena por timestamp, deduplica, limite 1000). Ao abrir, busca o histórico (`HISTORY_LIMIT = 15`) em `GET /api/chat/recent` e o mescla. `ChatVirtualList.tsx` mostra `HH:mm` e virtualiza.

**Histórico**: `GET /api/chat/recent?limit=N` (público, cache 5 s, N ≤ 200) → `command` → `GET reader:/internal/recent`. Se o reader cair, devolve `{messages: []}`. Twitch, Kick e TikTok **não** entregam histórico: só aparecem mensagens recebidas depois que o reader subiu. A janela é só memória (some ao reiniciar).

**Envio**: frontend `POST /api/chat/messages` (JWT) → `command` → `writer(platform).sendMessage(contexto do auth-service, texto)`. Limites: Twitch/Kick 500 caracteres, YouTube 200, TikTok 150; 10 envios/5 s por usuário; no frontend há intervalo de **5 s** entre envios e o textarea só é desabilitado para visitantes.

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

## 8. Variáveis de ambiente por serviço (resumo; o schema zod em `src/config.ts` é a fonte da verdade)

| Serviço | Principais |
|---|---|
| `auth-service` | `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SUPABASE_JWT_SECRET`, `TOKEN_ENCRYPTION_KEY`, `INTERNAL_SERVICE_TOKEN`, `FRONTEND_URL`, `ADMIN_EMAILS`, `RESEND_API_KEY`, `TWITCH_*`, `GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI`, `KICK_*`, `TIKTOK_CLIENT_KEY/SECRET/REDIRECT_URI`, `TIKTOK_LINKING_ENABLED`, `YOUTUBE_LINKING_ENABLED` |
| `command` | as de Supabase/JWT, `AUTH_SERVICE_URL`, `READER_URL`, `INTERNAL_WAKE_SECRET`, `INTERNAL_SERVICE_TOKEN`, `TOKEN_ENCRYPTION_KEY`, `LIVE_STATUS_URL`, `YOUTUBE_LIVE_CHAT_ID`, `TIKTOK_BROWSER_URL`, `TIKTOK_SEND_ENABLED`, `TIKTOK_LINKING_ENABLED`, `YOUTUBE_LINKING_ENABLED`, `YOUTUBE_SEND_DAILY_UNITS` |
| `reader` | `SUPABASE_*`, `INTERNAL_WAKE_SECRET`, `AUTO_START`, `TWITCH_*`, `YOUTUBE_API_KEY`, `YOUTUBE_LIVE_STATUS_URL`, `YOUTUBE_TRANSPORT`, `YOUTUBE_POLL_*`, `YOUTUBE_STREAM_GAP_*`, `YOUTUBE_DAILY_UNITS`, `YOUTUBE_BOOST_MESSAGES`, `KICK_*`, `TIKTOK_USERNAME` |
| `portal-api` | `DATABASE_URL`, `DATABASE_SCHEMA`, `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID`, `FS25_BISECT_*`, `FS25_XML_CODE`, `RESEND_API_KEY`, `ORIGIN_AUTH_SECRET`, `DISCORD_*` |
| `social-stats` (job) | `DATABASE_URL`, `YOUTUBE_API_KEY`, `INSTAGRAM_ACCESS_TOKEN`, `TIKTOK_CLIENT_KEY/SECRET` |

**Apenas uma** chave de API do YouTube deve ser usada (`YOUTUBE_API_KEY`). Somar cota com chaves de projetos diferentes viola a política de uso da API (verificar o texto vigente).

## 9. K3s, deploy e infraestrutura (`k8s-platform` e `k8s/` de cada repositório)
- `k8s-platform/base/`: `platform.yaml` (namespace `multichat`, `cloudflared`, Ingress), `healthz.yaml` (`GET /healthz` com a versão de cada serviço), `deployer.yaml` (RBAC do runner, só o namespace).
- `k8s-platform/scripts/`: `cloudflare-tunnel.sh` (cria tunnel/hostnames/DNS pela API; grava `tunnel.env` com modo 600), `bootstrap-vm.sh` (k3s + base + runner), `record-version.sh` / `wait-version.sh`.
- Deploy de cada serviço: `kubectl set image` + `rollout status` + `platform-record-version <serviço> <sha>` num runner self-hosted (`[self-hosted, k3s]`); `infra-check.yml` verifica de fora (runner do GitHub) se o `/healthz` responde.
- Terraform **não é usado** (decisão: uma VM só, criada uma vez).
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

## 11. Pendências e riscos conhecidos
| Item | Situação |
|---|---|
| Cota do YouTube estourada em 2026-10-09 | Volta às 07:00 UTC; o reader retoma sozinho |
| `INSTAGRAM_ACCESS_TOKEN` | Falta no `.env.docker`; sem ele a métrica do Instagram não aparece |
| Token do TikTok do admin (atualizado em 2026-09-10) | Renovação falha localmente; provável reconexão em `/admin/tiktok` `[causa não confirmada]` |
| Métrica do Kick | Coleta devolve "sem dado" `[causa não investigada]` |
| `crypto.ts` decifra AES-GCM sem `authTagLength` | Achado do SAST em `auth-service`, `multichat-command` e `tiktok-browser`; correção de 1 linha pendente |
| Ações do GitHub com tag mutável (67 usos) | Fixar por SHA pendente |
| Importação do D1 de produção para Postgres | Ferramenta pronta (`npm run import:d1`), não executada contra o D1 real |
| Rotação de credenciais | Ver seção 12 |
| Branches não enviadas | Todos os commits estão só locais |

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
Testes: `auth-service` 14, `command` 28, `reader` 35, `portal-api` 65, `portal` 11 (todos passando em 2026-10-09).

## 14. Glossário
- **liveChatId**: id do chat ao vivo de um vídeo do YouTube (`liveStreamingDetails.activeLiveChatId`). Tem formato derivável (protobuf em base64 de canal + vídeo), mas isso **não é documentado** e só é usado em uma sonda de teste.
- **Janela (stream)**: uma conexão `streamList` de ~10 s; a "pausa" é o intervalo entre janelas.
- **Boost**: pedido de consulta antecipada ao YouTube quando outras plataformas esquentam.
- **Quarentena do stream**: 5 min em polling após falha do stream.
- **Flag de vinculação**: ver seção 4.
- **Pages proxy**: `functions/[[path]].ts`, única Pages Function que encaminha para o backend.
