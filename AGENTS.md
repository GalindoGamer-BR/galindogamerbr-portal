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
- `src/components/layout/` — navbar (`Header`, `AccountMenu`, `MobileMenu`), `LoginModal` e `useNavSession` (sessão, nome e foto; logout fica na página, exceto `/admin`, `/membro` e `/conta`). Ícones em `src/components/ui/Icons.tsx`.
- `src/features/multichat/` (além do acima) — `EmotePicker.tsx` (seletor estilo Kick), `useEmotes`/`useMyEmotes`/`useBadges`/`useTwitchChannel`/`useYoutubeChannel`/`useYoutubeLastLive` (dados públicos e do membro), `loginFlows.ts` (início do OAuth e retorno à página de origem), `RichText.tsx`/`parseRich.ts` (negrito e links das descrições), `chatColors.ts` (contraste dos nomes), `MemberAccounts`/`AccountSettings`/`MemberProfileEditor` (área do membro).
- `src/App.tsx` — rotas (`/live` é o multichat; `/multichat` redireciona 301 em `public/_redirects`).
- `functions/[[path]].ts` — única Pages Function: proxy para o backend (`ALLOWED`: `/api/`, `/oauth/`, `/webhooks/`, `/discord`).
- `compose.yaml`, `docker/` — stack local (Supabase, serviços, Traefik, mods).
- `docs/` — `LLM-GUIDE.md`, `MIGRATION-REPORT.md`, `multichat/`.

## Invariantes
- Integrações de conta são escondidas por `flags.ts` (`tiktokLinking`, `youtubeLinking`, `linkablePlatforms`, `chatFilterPlatforms`); variáveis `VITE_*_LINKING_ENABLED` **ausentes = desligado**. Não importe `import.meta.env` direto nos componentes para isso.
- O textarea do chat só é desabilitado para visitantes (`!session`), nunca durante o envio. Enviar não bloqueia: a mensagem vai para o chat na hora (provisória, com o nome de exibição do perfil) e os envios saem em fila, um por vez (`sendQueue.ts`, `outbox.ts`); no máximo 5 na fila. **Mensagem enviada pelo portal aparece uma vez só** (`sentLog.ts`): uma linha do portal com os ícones das plataformas de destino (`metadata.portal`), e as cópias que as plataformas devolvem (mesma plataforma, mesmo texto, do próprio usuário, até 2 min depois) ficam escondidas por `hideEchoes`; o registro dura 15 min em `localStorage` (`mc:sent-log`). Mensagem escrita direto na plataforma não passa por isso.
- Mensagens do chat sempre passam por `messageSchema`/`parseHistory` e `appendMessages` (ordena por timestamp, deduplica, limite 1000).
- O Vite roda com polling (`VITE_USE_POLLING`) por causa do volume do Docker no Windows; se o código servido estiver antigo, recrie o `portal`.
- Textos de UI em português.
- **Emote só na plataforma que o desenha:** código Twitch, BTTV, FFZ ou 7TV → mensagem só para a Twitch; Kick → só para a Kick (texto da Kick em `overrides.kick`). Ver `docs/LLM-GUIDE.md` seção 6.1.
- Emotes que o usuário não pode usar ficam visíveis, com cadeado e motivo, e não são inseridos. Ao mudar o formato de `/api/multichat-emotes`, aumente o `?v=N` em `useEmotes.ts` (a resposta tem cache de 1 h no navegador).
- Um hook que usa `player` ou `liveStatus` em `MultichatPage.tsx` vem **depois** da declaração deles; o teste `MultichatPage.render.test.ts` pega o erro que o `tsc` não pega.
- Não use `↗`, `→` nem `←` em textos: há ícones (`BackIcon`, `HomeIcon`...) em `components/ui/Icons.tsx`.
