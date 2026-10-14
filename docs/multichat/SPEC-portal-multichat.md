# SPEC — galindogamerbr-portal / Multichat

## 1. Objetivo
Adicionar ao portal Vite existente uma feature `/multichat` para:
- exibir chats de Twitch, YouTube, Kick e TikTok em uma timeline única;
- mostrar métricas por plataforma;
- filtrar mensagens;
- vincular contas;
- enviar mensagens para Twitch, YouTube e Kick;
- selecionar o player da plataforma que o usuário deseja assistir.

Não é um novo backend. É uma feature do portal existente.

## 2. Stack
- Vite
- React
- TypeScript
- Cloudflare Pages
- Supabase JS

## 3. Rota

```text
/multichat
```

## 4. Arquitetura de comunicação

### Leitura

```text
Reader
  ↓
Supabase Realtime
  ↓
Vite
```

O frontend não se conecta diretamente aos chats das plataformas.

### Escrita

```text
Vite
  ↓
multichat-command
  ↓
Twitch / YouTube / Kick
```

## 5. Layout sugerido

```text
┌─────────────────────────────────────────────────┐
│ Twitch ●   YouTube ●   Kick ●   TikTok ●        │
├─────────────────────────────────────────────────┤
│ TW 128      YT 83      Kick 42      TT 197      │
├─────────────────────────────────────────────────┤
│                                                 │
│ 🟣 Maria                             Twitch      │
│ boa noite                                       │
│                                                 │
│ 🔴 João                              YouTube     │
│ salve                                           │
│                                                 │
│ ⚫ Carlos                             TikTok      │
│ chegou agora                                    │
│                                                 │
├─────────────────────────────────────────────────┤
│ ☑ Twitch  ☑ YouTube  ☑ Kick  ☐ TikTok          │
│                                                 │
│ [ Digite sua mensagem................ ] [Enviar] │
└─────────────────────────────────────────────────┘
```

## 6. Estrutura sugerida

```text
src/features/multichat/
├── components/
│   ├── ChatMessage.tsx
│   ├── ChatVirtualList.tsx
│   ├── ChatComposer.tsx
│   ├── PlatformSelector.tsx
│   ├── PlatformFilter.tsx
│   ├── ProviderStatus.tsx
│   ├── MetricsBar.tsx
│   ├── LinkedAccounts.tsx
│   └── StreamPlayer.tsx
├── hooks/
│   ├── useMultichat.ts
│   ├── useRealtimeChat.ts
│   ├── useMetrics.ts
│   └── useLinkedAccounts.ts
├── services/
│   ├── multichat-api.ts
│   └── realtime.ts
├── types/
└── MultichatPage.tsx
```

## 7. Supabase Realtime

Canal:

```text
live:{streamerId}
```

Eventos:
- `chat_batch`
- `metrics`
- `provider_status`
- `live_status`

Exemplo:

```ts
channel.on(
  "broadcast",
  { event: "chat_batch" },
  ({ payload }) => {
    appendMessages(payload.messages);
  }
);
```

O frontend não deve conhecer os DTOs nativos das plataformas.

## 8. Estado

```ts
interface MultichatState {
  messages: ChatMessage[];

  metrics: Partial<
    Record<Platform, PlatformMetrics>
  >;

  providers: Record<
    Platform,
    ProviderStatus
  >;

  filters: Record<
    Platform,
    boolean
  >;

  sendPlatforms: {
    twitch: boolean;
    youtube: boolean;
    kick: boolean;
  };
}
```

## 9. Buffer e renderização
Mesmo recebendo batches, o frontend pode agrupar atualizações por 25–50 ms.

Manter no máximo:

```text
500–1.000 mensagens
```

Usar lista virtualizada para evitar milhares de elementos no DOM.

## 10. Filtros

```text
☑ Twitch
☑ YouTube
☑ Kick
☑ TikTok
```

O filtro altera somente a visualização local.

## 11. Envio

Plataformas suportadas no MVP:
- Twitch
- YouTube
- Kick

UI:

```text
☑ Twitch
☑ YouTube
☑ Kick

[ Boa noite pessoal!          ] [Enviar]
```

Request:

```http
POST {COMMAND_API}/api/chat/messages
Authorization: Bearer <supabase-jwt>
```

O frontend exibe o status do comando, mas não injeta a mensagem diretamente na timeline.

## 12. Contas conectadas
Exemplo:

```text
Twitch      ✓ @user
YouTube     ✓ Canal
Kick        ✓ @user
TikTok      ⚠ somente leitura
```

Ações:
- conectar
- desconectar
- visualizar status

## 13. Player
Player separado do chat.

```text
[Twitch] [YouTube] [Kick]
```

Somente o player escolhido pelo usuário fica ativo por padrão.

O player não interfere em:
- Reader
- Realtime
- métricas
- timeline do chat

## 14. Autenticação
Login via Supabase Auth.

O token da sessão é utilizado nas chamadas ao Command Service.

```ts
fetch(`${COMMAND_API}/api/chat/messages`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json"
  }
});
```

## 15. Estados de UI
- `Conectando aos chats...`
- `Reconectando TikTok...`
- `Nenhuma transmissão ativa.`
- `Inicializando serviço de envio...`
- estado de erro individual por provider

## 16. Segurança
Variáveis permitidas no frontend:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_MULTICHAT_COMMAND_URL=
```

Nunca expor:
- `SUPABASE_SECRET_KEY`
- client secrets das plataformas
- refresh tokens
- `TOKEN_ENCRYPTION_KEY`

## 17. Critérios de aceite
- login
- subscription Supabase
- chat Twitch
- chat YouTube
- chat Kick
- chat TikTok
- filtros
- lista virtualizada
- métricas
- status dos providers
- linked accounts
- envio Twitch
- envio YouTube
- envio Kick
- retorno individual do envio
- player selecionável
