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

## Validado com Docker (2026-10-08)
- `docker compose --env-file .env.docker up`: 11 serviços saudáveis (GoTrue, Realtime, auth-service, command, reader, portal-api, gateway Traefik, Vite, monitor FS25, mods-sync, nginx de mods); migrations dos 4 repos aplicadas em Postgres real (tabelas de `public` movidas para `auth_service`/`multichat`, dados preservados).
- Ponta a ponta pelo gateway: rotas públicas da API com dados reais; JWT do GoTrue validado localmente no command; gate de e-mail; OTP admin (request/verify/me/logout) e acesso a `/api/admin/*` por cookie; criar/publicar programação (RETURNING, transação, KV); rate limit; exclusão de conta; `/internal/*` sem rota pública e com token de serviço; job de estatísticas; monitor FS25 e mods-sync (API, lock, dotfiles bloqueados).
- Build do portal (tsc + Vite + SEO) e lint; `kubeconform` (23 recursos válidos); imagens `linux/arm64` de todos os serviços construídas.

## Validado (local, sem Docker)
- Testes: auth-service 12, multichat-command 14, galindogamerbr-api 56 (inclui 52 portados), fs25-monitoring-worker 6, fs25-mods-sync 8 — todos passando; `tsc --noEmit` limpo nos projetos TypeScript; `esbuild` gera `dist/server.js` e o job.
- Tradução D1→Postgres (`?`→`$n`, `datetime('now'[, mod])`) testada; teste de deriva garante que toda tabela usada no código existe na migration.
- JWT local (assinatura, audience, issuer, expiração), allowlist/rate limit do admin, rotas internas protegidas, flag `TIKTOK_SEND_ENABLED`.
- YAML de compose, Traefik e todos os manifests K8s parseiam; dependências do compose consistentes; variáveis exigidas existem no `.env.docker`.
- Geração de SEO por rota (`scripts/seo-prerender.mjs`) conferida em diretório temporário.

## NÃO validado (depende de infraestrutura ou credenciais)
- `kubectl apply` em um cluster real (só `kubeconform` foi executado) e execução das imagens em arm64 de verdade.
- Paridade fina de respostas da `galindogamerbr-api` com as Pages Functions antigas (rotas testadas contra Postgres real, mas não comparadas lado a lado com o D1 de produção).
- Login admin (código por e-mail ou Twitch, direto no Supabase): exige SMTP no Supabase com a Resend (`supabase-auth-config.ps1 -Smtp`), as Redirect URLs `/admin/login` e a role `admin` definida por SQL. Não testado com e-mail real.
- OAuth Twitch/Kick/YouTube/TikTok, webhooks (WebSub, Instagram, Kick) e callbacks após a troca de origem (as URLs públicas continuam em `galindogamerbr.com.br` pelo proxy; confirmar redirect URIs nos provedores).
- Realtime do multichat, monitor FS25 (Bisect real), mods-sync (SFTP real), CronJobs, recuperação de pods, ARM64 em runtime.
- Cloudflare Tunnel/Traefik/runner self-hosted na VM Oracle (não existe ainda); o proxy do Pages só funciona com `API_ORIGIN` e `ORIGIN_AUTH_SECRET` definidos.
- Envio TikTok e YouTube em live real (TikTok segue experimental, desligado).

## Pontos de atenção
1. **Ordem de deploy dos dados**: aplicar migrations (auth-service → multichat-command → galindogamerbr-api → fs25) em staging antes; as migrations *movem* tabelas de `public` para schemas próprios (`ALTER TABLE … SET SCHEMA`). O command/auth-service antigos leem `public.*`: fazer a troca de serviços e das tabelas no mesmo passo (ou criar views temporárias em `public`).
2. **Importar o D1**: `npm run import:d1 -- --from-d1` (dry run) e depois `--apply`, no repo `galindogamerbr-api` — somente leitura no D1, uma transação, idempotente; imprime o `ADMIN_EMAILS`. Validado contra o Postgres local com dados de exemplo (ids, sequências, blocos da programação). Ainda não executado contra o D1 real.
3. **Admin**: não há mais cookie `ggb_session` nem rotas `/api/auth/*`. O portal usa a sessão do Supabase e envia o Bearer; a `galindogamerbr-api` valida o JWT e a role `admin` (SQL). Sessões antigas deixam de valer. O `admin_allowlist` do D1 só indica quem deve receber a role.
4. **PostgREST**: os schemas `auth_service` e `multichat` precisam estar em *Exposed schemas* (acesso só para `service_role`) porque auth-service e command usam `supabase-js`.
5. **Segredos compartilhados** (iguais entre serviços): `TOKEN_ENCRYPTION_KEY`, `INTERNAL_SERVICE_TOKEN`, `INTERNAL_WAKE_SECRET`, `SUPABASE_JWT_*`, `ORIGIN_AUTH_SECRET` — ver `k8s-platform/README.md`.
6. **Legado a remover somente após validar**: `functions/` e `workers/social-stats-cron` (já removidos *apenas* na branch `refactor/pages-frontend-only`; a `feat/multichat` mantém tudo), D1/KV, Azure Functions. `compose.tiktok-tunnel.yaml` (o `compose.preview.yaml` e o proxy do preview foram removidos depois, em 2026-10-09) e `deploy-preview.yml` foram adaptados; `compose.tiktok-pilot.yaml` e `start-tiktok-pilot.ps1` foram removidos (o piloto dependia do `tiktok-worker`, já removido do command). O CI agora checa o proxy do Pages e o audit (`source-map-js` atualizado de 1.2.1 para 1.2.2).
7. **Segredos locais**: `.env.docker` e `.dev.vars` contêm credenciais reais do painel FS25 (ignorados pelo git) — rotacionar após a migração.
8. **Pendências conhecidas do plano**: `NetworkPolicy` para `/internal` só existe para o auth-service; limite do Supabase Free (500 MB) para o banco; `wrangler.toml` local (skip-worktree) ainda lista D1/KV.
