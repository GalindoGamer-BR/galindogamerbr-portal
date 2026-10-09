# GalindoGamerBR — Hub Portal


[![Deploy](https://github.com/GalindoGamer-BR/galindogamerbr-portal/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/GalindoGamer-BR/galindogamerbr-portal/actions/workflows/deploy.yml)
[![CI](https://github.com/GalindoGamer-BR/galindogamerbr-portal/actions/workflows/ci.yml/badge.svg)](https://github.com/GalindoGamer-BR/galindogamerbr-portal/actions/workflows/ci.yml)
[![Security Scan](https://github.com/GalindoGamer-BR/galindogamerbr-portal/actions/workflows/security-scan.yml/badge.svg)](https://github.com/GalindoGamer-BR/galindogamerbr-portal/actions/workflows/security-scan.yml)
[![CodeQL](https://github.com/GalindoGamer-BR/galindogamerbr-portal/actions/workflows/codeql.yml/badge.svg)](https://github.com/GalindoGamer-BR/galindogamerbr-portal/actions/workflows/codeql.yml)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-7-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-F38020?logo=cloudflare&logoColor=white)

Portal da comunidade GalindoGamerBR. **Frontend** React + TypeScript + Vite, publicado como site estático no Cloudflare Pages. O backend roda em outros repositórios, no K3s (Oracle) com dados no Supabase.

## Arquitetura

```
Browser → Cloudflare Pages (estático) ── functions/[[path]].ts (proxy) ──► API_ORIGIN
                                                    Cloudflare Tunnel → Traefik → serviços
```

| Parte | Repositório |
|---|---|
| Identidade, OAuth, contas, login admin (`/oauth/*`, `/api/auth/*`, `/api/account*`, `/api/member`) | `auth-service` |
| Conteúdo, estatísticas, webhooks, admin (`/api/*`, `/webhooks/*`, `/discord`) | `galindogamerbr-api` |
| Envio de mensagens (`/api/chat/*`, `/api/tiktok/*`) / leitura de chat | `multichat-command` / `multichat-reader` |
| Monitor do servidor FS25 e sincronização de mods | `fs25-monitoring-worker` / `fs25-mods-sync` |
| Namespace, túnel, roteamento, guia de instalação | `k8s-platform` |

- A **única** Pages Function é `functions/[[path]].ts`: repassa `/api`, `/oauth`, `/webhooks` e `/discord` ao `API_ORIGIN` (mesma origem do portal, então cookies e callbacks OAuth/WebSub/Instagram continuam nas URLs atuais). Restringida por `public/_routes.json`.
- SEO por rota (antes `_middleware.ts`): `scripts/seo-prerender.mjs` gera `dist/<rota>/index.html` no build; rotas desconhecidas e `/admin*` caem em `dist/spa.html` (`noindex`) via `public/_redirects`.
- O front só conhece chaves públicas: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` e `VITE_MULTICHAT_COMMAND_URL`.
- Relatório e pendências da migração: [`docs/MIGRATION-REPORT.md`](docs/MIGRATION-REPORT.md).

## Rodando local (stack completa em Docker)

Requer Docker. Os repositórios irmãos precisam estar lado a lado (`../auth-service`, `../galindogamerbr-api`, `../multichat-command`, `../multichat-reader`, `../fs25-*`).

```
node scripts/multichat-env.mjs                     # gera .env.docker com segredos locais (preserva o existente)
docker compose --env-file .env.docker up --build -d --wait
```

Abre em `http://127.0.0.1:5173` (Vite com hot reload). As rotas de backend passam pelo gateway Traefik (`http://127.0.0.1:8088`, `GATEWAY_PORT`), que espelha o roteamento de produção. Supabase local em `http://127.0.0.1:54321`. As migrations de todos os serviços rodam no serviço `migrate`.

Perfis opcionais: `--profile simulation` (plataformas simuladas), `--profile fs25` (monitor, mods-sync e nginx de mods; exigem credenciais do Bisect), `--profile jobs` (`docker compose --profile jobs run --rm social-stats`). A vinculação de contas fica desligada por padrão e a leitura do chat não depende dela: `TIKTOK_LINKING_ENABLED=true` (entrar com TikTok e sessão de envio por QR; o `tiktok-browser` só sobe com `--profile tiktok-link`) e `YOUTUBE_LINKING_ENABLED=true` (vincular o YouTube e enviar mensagens). No frontend (Pages) as mesmas flags são as variáveis de repositório `TIKTOK_LINKING_ENABLED` e `YOUTUBE_LINKING_ENABLED`, usadas no build; no k3s, as variáveis de `command.yaml` e `auth-service.yaml`. Override: `compose.tiktok-tunnel.yaml` (callback https do TikTok). Mais detalhes do multichat em `docs/multichat/README.md`.

Só o frontend, apontando para outro backend: `VITE_API_PROXY=https://… npm run dev`.

### Comandos úteis

```
npm run typecheck   # tsc -b
npm run lint        # oxlint
npm test            # vitest
npm run build       # tsc -b + vite build + seo-prerender (dist/)
```

## Fluxo de edição (main protegida)

Sem push direto em `main`: branch + Pull Request (Conventional Branches/Commits). O merge em `main` dispara o deploy.

## Deploy

### Produção
`deploy.yml` dispara via `workflow_run` quando o CI termina com sucesso em `main` (ou manualmente), reaproveita o `dist/` do CI e publica com `wrangler pages deploy --branch=main`. Não há mais migrations nem Worker de estatísticas aqui (agora são CronJobs da `galindogamerbr-api`).

Secrets do repositório: `CLOUDFLARE_API_TOKEN` (editar Pages) e `CLOUDFLARE_ACCOUNT_ID`. Variáveis do projeto Pages (produção): `API_ORIGIN` (`https://origin.<domínio>`) e `ORIGIN_AUTH_SECRET` (o mesmo valor do `galindogamerbr-api`).

### Preview (manual)
`deploy-preview.yml` publica `--branch=preview` (URL fixa). Para o backend do preview, defina no ambiente *Preview* do Pages `API_ORIGIN` (URL do backend do preview) e `ORIGIN_AUTH_SECRET`. As URLs `*.pages.dev` podem estar atrás do Cloudflare Access.

### Worker `fs25-portal-proxy`
Segue como Cloudflare Worker (`workers/fs25-portal-proxy`, deploy em `deploy-fs25-portal-proxy.yml`), fora desta migração.

## Legado
A `feat/multichat` mantém as Pages Functions, o D1/KV e o Worker de estatísticas até o corte validar a nova arquitetura. A pasta `migrations/` guarda o histórico do D1 (a versão Postgres está em `galindogamerbr-api/supabase/migrations`).
