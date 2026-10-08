# Relatório da migração — Cloudflare Pages + Oracle K3s + Supabase

Estado em 2026-10-08. Tudo em commits **locais** (sem push), cada projeto em seu repositório.

## Repositórios e branches
| Repo | Branch | Resultado |
|---|---|---|
| galindogamerbr-portal | `refactor/pages-frontend-only` (sobre `feat/multichat`) | só frontend + `functions/[[path]].ts` (proxy) + SEO estático; compose local |
| auth-service (novo) | `main` | identidade, OAuth, tokens, admin OTP (Supabase Auth), rotas internas |
| galindogamerbr-api (novo) | `main` | ex-`functions/` + CronJobs de estatísticas, sobre Postgres |
| multichat-command | `refactor/extract-auth-service` | só envio; JWT local; tokens via auth-service |
| multichat-reader | `chore/k8s-deploy` | manifests K8s e imagem |
| fs25-monitoring-worker (novo, cópia) | `main` | processo persistente de 30 s, estado no Postgres |
| fs25-mods-sync (novo, cópia) | `main` | CronJob + API + PVC |
| k8s-platform (novo) | `main` | namespace, cloudflared, Traefik Ingress, guia de instalação |
`fs25-portal-proxy` não foi tocado (permanece Cloudflare Worker). Os projetos originais do GitLab/Azure e o D1/KV/Worker de produção estão intactos.

## Validado (local, sem Docker)
- Testes: auth-service 12, multichat-command 14, galindogamerbr-api 56 (inclui 52 portados), fs25-monitoring-worker 6, fs25-mods-sync 8 — todos passando; `tsc --noEmit` limpo nos projetos TypeScript; `esbuild` gera `dist/server.js` e o job.
- Tradução D1→Postgres (`?`→`$n`, `datetime('now'[, mod])`) testada; teste de deriva garante que toda tabela usada no código existe na migration.
- JWT local (assinatura, audience, issuer, expiração), allowlist/rate limit do admin, rotas internas protegidas, flag `TIKTOK_SEND_ENABLED`.
- YAML de compose, Traefik e todos os manifests K8s parseiam; dependências do compose consistentes; variáveis exigidas existem no `.env.docker`.
- Geração de SEO por rota (`scripts/seo-prerender.mjs`) conferida em diretório temporário.

## NÃO validado (depende de infraestrutura ou credenciais)
- **Docker indisponível nesta máquina**: `docker compose up`, build das imagens (arm64/amd64), `kubeconform`/`kubectl apply --dry-run`, e as migrations SQL contra um Postgres/GoTrue reais não foram executados. O primeiro `docker compose up` pode exigir ajustes.
- Rotas do `galindogamerbr-api` contra um Postgres real (o adaptador D1→pg só tem teste unitário); paridade fina de respostas com as Pages Functions antigas.
- Login admin por OTP com e-mail real: exige SMTP no Supabase (ex.: Resend) com OTP de 6 dígitos e `ADMIN_EMAILS`; o usuário ganha `app_metadata.role=admin` no primeiro login.
- OAuth Twitch/Kick/YouTube/TikTok, webhooks (WebSub, Instagram, Kick) e callbacks após a troca de origem (as URLs públicas continuam em `galindogamerbr.com.br` pelo proxy; confirmar redirect URIs nos provedores).
- Realtime do multichat, monitor FS25 (Bisect real), mods-sync (SFTP real), CronJobs, recuperação de pods, ARM64 em runtime.
- Cloudflare Tunnel/Traefik/runner self-hosted na VM Oracle (não existe ainda); o proxy do Pages só funciona com `API_ORIGIN` e `ORIGIN_AUTH_SECRET` definidos.
- Envio TikTok e YouTube em live real (TikTok segue experimental, desligado).

## Pontos de atenção
1. **Ordem de deploy dos dados**: aplicar migrations (auth-service → multichat-command → galindogamerbr-api → fs25) em staging antes; as migrations *movem* tabelas de `public` para schemas próprios (`ALTER TABLE … SET SCHEMA`). O command/auth-service antigos leem `public.*`: fazer a troca de serviços e das tabelas no mesmo passo (ou criar views temporárias em `public`).
2. **Importar o D1**: `wrangler d1 export --remote` (somente leitura) e carga no schema `portal` — não há script pronto; as colunas de data continuam `text` no mesmo formato.
3. **Admin**: o cookie `ggb_session` agora carrega o access token do Supabase (+ `ggb_session_refresh` em `/api/auth`). Sessões antigas deixam de valer; o frontend admin não muda. `admin_allowlist` do D1 vira `ADMIN_EMAILS`.
4. **PostgREST**: os schemas `auth_service` e `multichat` precisam estar em *Exposed schemas* (acesso só para `service_role`) porque auth-service e command usam `supabase-js`.
5. **Segredos compartilhados** (iguais entre serviços): `TOKEN_ENCRYPTION_KEY`, `INTERNAL_SERVICE_TOKEN`, `INTERNAL_WAKE_SECRET`, `SUPABASE_JWT_*`, `ORIGIN_AUTH_SECRET` — ver `k8s-platform/README.md`.
6. **Legado a remover somente após validar**: `functions/` e `workers/social-stats-cron` (já removidos *apenas* na branch `refactor/pages-frontend-only`; a `feat/multichat` mantém tudo), D1/KV, Azure Functions. `compose.preview.yaml`, `compose.tiktok-*.yaml` e `deploy-preview.yml` ainda assumem o serviço `portal` com Wrangler e precisam ser revistos.
7. **Segredos locais**: `.env.docker` e `.dev.vars` contêm credenciais reais do painel FS25 (ignorados pelo git) — rotacionar após a migração.
8. **Pendências conhecidas do plano**: script de importação do D1; `NetworkPolicy` para `/internal` só existe para o auth-service; limite do Supabase Free (500 MB) para o banco; `wrangler.toml` local (skip-worktree) ainda lista D1/KV.
