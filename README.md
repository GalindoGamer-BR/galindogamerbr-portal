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

Portal da comunidade GalindoGamerBR. React + TypeScript + Vite no front, Cloudflare Pages Functions (`/functions`) + Cloudflare D1 no back — mesmo repositório, deploy único.

## Stack

- **Front**: Vite + React + TypeScript + Tailwind CSS
- **Back**: Cloudflare Pages Functions (colocadas em `/functions`) + Cloudflare D1
- **Cache**: Cloudflare Workers KV (binding `PUBLIC_CACHE`) — live status, viewer count, status Twitch/Kick, inscritos/posts de redes sociais e a programação publicada são cache-first no KV; D1 continua sendo a fonte de verdade normalizada. Compartilhado entre produção e preview (mesmo namespace).
- **Auth**: código OTP por e-mail via Resend
- **Live/vídeos**: sem API key do YouTube — feed Atom público + oEmbed (ver `functions/lib/youtube.ts`)
- **Métricas de redes sociais**: coletadas por um worker separado (`workers/social-stats-cron`, cron a cada 20min) que escreve no KV (produção e preview) e no D1 (só produção) — ver seção própria abaixo

## Rodando local

```
npm install
npm run dev
```

Abre em `http://127.0.0.1:5173` — o Vite serve o front-end com hot reload e encaminha `/api/*` para as Pages Functions locais, executadas pelo Wrangler em `http://127.0.0.1:8788`. Um watcher mantém `dist/` reconstruído a cada mudança, então a porta `8788` também reflete o build atual.

`npm run dev:full` continua disponível como alias de `npm run dev`. Para subir apenas o front-end com hot reload, use `npm run dev:client`.

O `dev:full` exige que as duas portas estejam livres. Se precisar testar só as Pages Functions, use:

```
npm run dev:worker
```

Sem hot reload — precisa rodar de novo a cada mudança, mas sempre funciona. Abra `http://127.0.0.1:8788` nesse modo.

Só front-end, sem `/api/*` (mais rápido pra mexer em CSS/layout que não depende de dados):

```
npm run dev
```

### Banco de dados local

```
npm run db:migrate:local
```

Aplica as migrations em `/migrations` num D1 local (sqlite via `wrangler`, isolado do banco de produção).

Pra testar com dado real em vez de um banco local vazio/desatualizado, dá pra puxar um snapshot completo do D1 de produção pro local (`wrangler pages dev`/`dev:full` continuam sempre lendo do D1 local — não existe `--remote` pra Pages dev):

```
npm run db:sync-from-prod
```

Roda `wrangler d1 export --remote` no banco de produção e importa o resultado no D1 local (`scripts/db-sync-from-prod.mjs`), substituindo o conteúdo local inteiro. Sob demanda, não é automático — roda de novo sempre que precisar atualizar o snapshot.

### Outros comandos úteis

```
npm run typecheck   # só o TypeScript, sem buildar
npm run build        # build de produção (dist/)
npm run lint          # oxlint
```

## Workflow de edição (main protegida)

A branch `main` é protegida — sem push direto. Todo mundo edita por branch + Pull Request:

```
git checkout main
git pull
git checkout -b minha-mudanca
# ... edita, commita ...
git push -u origin minha-mudanca
```

Abre o PR no GitHub, revisa, e **merge pra `main`** — isso dispara o deploy automático de produção (ver `.github/workflows/deploy.yml`).

## Deploy

### Produção (automático)

`deploy.yml` **não** dispara direto no push — dispara via `workflow_run` só depois que `ci.yml` terminar com sucesso num push em `main` (lint/typecheck/audit/sequência de migrations viram gate real do deploy, não só do PR). Reusa o `dist/` já buildado no `ci.yml` (`upload-artifact`/`download-artifact`) em vez de buildar de novo. Tem `concurrency` (`group: deploy-production`) pra nunca rodar duas migrations/deploys de D1 em paralelo. Também dá pra disparar manualmente (`workflow_dispatch`, ex.: pra pegar uma env var nova do dashboard da Cloudflare sem mudar código) — nesse caso builda direto, sem artefato de CI associado.

Passos: aplica migrations do D1 → `wrangler pages deploy` com `--branch=main` → dispara uma rodada de coleta do worker de social stats (ver seção própria abaixo), sem esperar os até 20min do cron.

Precisa desses secrets configurados no repositório (Settings → Secrets and variables → Actions):

- `CLOUDFLARE_API_TOKEN` — token com permissão de editar Pages, D1 e Workers
- `CLOUDFLARE_ACCOUNT_ID` — id da conta Cloudflare (não fica hardcoded em lugar nenhum do repo)
- `CLOUDFLARE_D1_DATABASE_ID` — id do banco D1 de produção; o workflow substitui o placeholder do `wrangler.toml` por esse valor antes de aplicar migrations/deployar (o id real nunca fica commitado — só nesse secret e no working tree local, via `skip-worktree`)
- `CLOUDFLARE_KV_NAMESPACE_ID` — id do namespace Workers KV (`PUBLIC_CACHE`) usado pelo cache-first de live/viewer/Twitch/Kick/social stats/programação — mesmo tratamento de placeholder que o `CLOUDFLARE_D1_DATABASE_ID`. Compartilhado entre produção e preview (mesmo namespace, id igual nos dois).
- `CRON_TRIGGER_SECRET` — autoriza o gatilho manual de coleta do worker `workers/social-stats-cron` depois do deploy (ver seção própria). Não derruba o deploy se faltar/errar (só não aquece o cache antes da hora).

### Preview (manual, outras branches)

O workflow `deploy-preview.yml` roda sob demanda (Actions → Deploy Preview → Run workflow, escolhendo a branch) — não dispara sozinho a cada push. Mesmos passos do deploy de produção (typecheck → build → migrations → deploy), mas publicando como *preview deployment*.

**URL fixa, não uma por branch**: todo run publica com `--branch=preview` (alias fixo), então a URL é sempre `https://preview.galindogamerbr-hub-portal.pages.dev`, não importa qual branch rodou o workflow. Antes de publicar o novo, o workflow apaga todo deployment de preview existente (`wrangler pages deployment list/delete`) — só existe "o" preview atual, nunca um acumulado de runs antigos com hash na URL.

O preview usa banco D1 **separado** (`galindogamerbr_hub_preview`) — nunca lê/escreve no banco de produção. Cloudflare Pages ignora seções `[env.preview]` no `wrangler.toml` (isso é coisa de Workers, não de Pages — confirmado testando), então o workflow sobrescreve com `sed` o `database_id` e o `ENVIRONMENT` do bloco de topo antes de buildar, só nesse job (nunca fica commitado assim). O KV (`PUBLIC_CACHE`) **não** é separado — preview e produção compartilham o mesmo namespace de propósito (é só cache de dado público, sem custo em duplicar por ambiente). Também precisa de:

- `CLOUDFLARE_D1_PREVIEW_DATABASE_ID` — id do banco D1 de preview (também usado pelo worker de social stats, ver abaixo, pra escrever nos dois D1)

O e-mail de OTP em preview também sai de um remetente separado (`acesso-preview@galindogamerbr.com.br`, ver `functions/lib/resend.ts`), pra não misturar com o remetente de produção.

**As URLs de preview (`*.pages.dev`) exigem login na conta Cloudflare pra abrir** — tem uma Cloudflare Access Application protegendo elas por padrão. Isso é intencional por ora: removê-la exige ativar o Zero Trust na conta, que pede cadastro de cartão mesmo no plano free. Só quem tem acesso à conta Cloudflare consegue ver os previews; pra liberar pra qualquer um (ex.: mandar link pra alguém de fora revisar), seria preciso ativar o Zero Trust e apagar/editar a Access Application em Zero Trust → Access → Applications.

Pra rodar um preview manualmente a partir de outra branch, sem esperar o push:

```
git checkout minha-mudanca
npm run deploy
```

Isso builda e faz `wrangler pages deploy dist --project-name=galindogamerbr-portal` **sem** `--branch` fixo — o wrangler detecta o branch git atual e publica como preview (numa URL própria daquela branch, diferente da URL fixa `/preview` que `deploy-preview.yml` usa). Só que localmente o `wrangler.toml` tem o `database_id`/KV `id` de produção nos bindings de topo (é o que o `skip-worktree` guarda) — então um deploy manual local com esse comando ainda aponta pro banco/cache de produção; prefira deixar o `deploy-preview.yml` cuidar disso.

### Worker de social stats (`workers/social-stats-cron`)

Worker separado (cron, não Pages Functions — ver `workers/social-stats-cron/README.md`) que coleta seguidores/posts do YouTube/TikTok/Instagram/Twitch/Kick a cada 20min, escrevendo no KV compartilhado (`PUBLIC_CACHE`, lido pelo site) e no D1 — nos **dois** bancos, produção e preview, pra nenhum dos dois ambientes ficar com o fallback de leitura vazio. Um segundo agendamento, fixo aos domingos meia-noite BRT, soma o total de visitas do site desde o início (a GraphQL Analytics API da Cloudflare só cobre ~90 dias por consulta) e persiste em D1 + KV — lido pelo contador de visitas lifetime na Home (`resolveLifetimeVisits` em `functions/api/community-stats.ts`). Deploy próprio (`deploy-cron-worker.yml`, dispara em push que mexe em `workers/social-stats-cron/**` ou manualmente), com um `fetch()` handler protegido por secret (`CRON_TRIGGER_SECRET`, header `x-trigger-secret`) que `deploy.yml`, `deploy-preview.yml` e o próprio `deploy-cron-worker.yml` chamam depois de todo deploy — assim o cache nunca fica frio esperando os 20min do agendamento normal. Precisa, além dos secrets de produção/preview já citados, dos secrets próprios do worker (`YOUTUBE_API_KEY`, `INSTAGRAM_ACCESS_TOKEN`, `TIKTOK_CLIENT_KEY`/`TIKTOK_CLIENT_SECRET`, `CRON_TRIGGER_SECRET`, `CLOUDFLARE_ANALYTICS_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) — ver `workers/social-stats-cron/README.md`.

### Banco remoto (D1)

Migrations novas em `/migrations` sobem sozinhas: o workflow de deploy aplica `wrangler d1 migrations apply --remote` antes de publicar. Não precisa rodar nada manualmente depois de um merge em `main`.

Pra aplicar numa situação fora do fluxo normal de deploy:

```
npm run db:migrate:remote
```

## Multichat

A rota /multichat integra os serviços multichat-command e multichat-reader. Consulte [o guia de Docker e configuração](docs/multichat/README.md).
