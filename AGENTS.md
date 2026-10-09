# AGENTS.md — galindogamerbr-portal

Frontend do site (React + Vite + react-router + zod + supabase-js), **compose local do sistema inteiro** e documentação.
Guia completo do sistema (arquitetura, fluxos, flags, cota do YouTube, invariantes): [`docs/LLM-GUIDE.md`](docs/LLM-GUIDE.md). Leia-o antes de mexer em algo que cruze serviços.

## Comandos
| Ação | Comando |
|---|---|
| Criar `.env.docker` | `node scripts/multichat-env.mjs` (preserva o existente) |
| Subir tudo | `docker compose --env-file .env.docker up --build -d --wait --remove-orphans` |
| Typecheck, testes, lint (o host **não** tem `node_modules`) | `docker compose --env-file .env.docker exec -T portal sh -c 'npx tsc -b; npx vitest run; npx oxlint'` |
| Build de produção | `npm run build` (roda no CI; `tsc -b && vite build && node scripts/seo-prerender.mjs dist`) |
| Job de estatísticas | `docker compose --env-file .env.docker --profile jobs run --rm social-stats` |

Sempre use `--env-file .env.docker`. Portal: `http://127.0.0.1:5173`; gateway: `http://127.0.0.1:8088`.

## Estrutura relevante
- `src/features/multichat/` — chat (`MultichatPage.tsx`, `useMultichat.ts`, `ChatVirtualList.tsx`, `types.ts`), login/conta (`PortalLogin`, `PortalAccount`, `PortalMember`), **`flags.ts`** (feature flags), `services.ts` (`command`, `publicGet`, `publicCommand`).
- `src/App.tsx` — rotas (`/live` é o multichat; `/multichat` redireciona 301 em `public/_redirects`).
- `functions/[[path]].ts` — única Pages Function: proxy para o backend (`ALLOWED`: `/api/`, `/oauth/`, `/webhooks/`, `/discord`).
- `compose.yaml`, `docker/` — stack local (Supabase, serviços, Traefik, mods).
- `docs/` — `LLM-GUIDE.md`, `MIGRATION-REPORT.md`, `multichat/`.

## Invariantes
- Integrações de conta são escondidas por `flags.ts` (`tiktokLinking`, `youtubeLinking`, `linkablePlatforms`, `chatFilterPlatforms`); variáveis `VITE_*_LINKING_ENABLED` **ausentes = desligado**. Não importe `import.meta.env` direto nos componentes para isso.
- O textarea do chat só é desabilitado para visitantes (`!session`), nunca durante envio/intervalo (5 s entre envios).
- Mensagens do chat sempre passam por `messageSchema`/`parseHistory` e `appendMessages` (ordena por timestamp, deduplica, limite 1000).
- O Vite roda com polling (`VITE_USE_POLLING`) por causa do volume do Docker no Windows; se o código servido estiver antigo, recrie o `portal`.
- Textos de UI em português.
