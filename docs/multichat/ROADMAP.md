# Multichat: funcionalidades faltantes e plano

> Estado descrito: 2026-10-16. Verificado no código dos repositórios `multichat-reader`, `multichat-command` e `galindogamerbr-portal`, e na documentação oficial das plataformas. A seção 11 do [`LLM-GUIDE.md`](../LLM-GUIDE.md) aponta para este arquivo. Ao concluir um item, marque a caixa e atualize a coluna de situação.

> **Escopo:** só as funcionalidades principais de chat. O multichat não reimplementa a Twitch (moderação, polls, predictions, hype train e EventSub estão fora de escopo; ver a Fase 4).

## Resumo

O multichat já lê, envia e desenha emotes, mas ainda não trata eventos, reply, presença nem idempotência no envio.

Já existe: leitura de mensagens normais da Twitch por IRC anônimo, envio pelo Helix `chat/messages`, emotes Twitch, Kick, BTTV e FFZ, badges, seletor de emotes e fila de envio com mensagem provisória.

Pendência já rastreada e mais urgente que tudo abaixo: a política do Realtime no Supabase hospedado (`LLM-GUIDE.md`, seção 11). Sem ela o chat não chega ao vivo em produção, então qualquer funcionalidade nova fica invisível.

## Funcionalidades que faltam

P0 é risco de correção, P1 é paridade com o chat da Twitch, P2 é recurso da plataforma e P3 depende de decisão ou de trabalho grande.

| # | Prioridade | Item | Situação verificada no código |
| --- | --- | --- | --- |
| 1 | P0 | Idempotência no envio | O `id` UUID é aceito em `multichat-command/src/app.ts:157` e nunca usado. Uma resposta parcial ou uma repetição pode duplicar a mensagem. |
| 2 | P1 | Reply (Twitch, Kick, YouTube) | O reader não lê as tags `reply-parent-*` e o schema não tem `replyTo`. O envio não passa o campo de reply. |
| 3 | P1 | Eventos do IRC | `multichat-reader/src/twitch-irc.ts:6` só aceita `PRIVMSG`. Faltam `USERNOTICE` (sub, resub, gift, raid), `CLEARMSG`, `CLEARCHAT`, `ROOMSTATE` e a tag `bits`. |
| 4 | P1 | Docs defasadas | O README do reader ainda descreve EventSub, removido do código. O `LLM-GUIDE.md:136` cita "~600 ms entre envios", mas `sendQueue.ts` não pausa. |
| 5 | P2 | Usuários online | Nenhum uso de Presence no portal. |
| 6 | P2 | Menções | Sem autocomplete de `@` e sem destaque de "te mencionaram". O `ownNames` em `outbox.ts` já guarda os nomes do próprio usuário. |
| 7 | P2 | 7TV | Sem ocorrência no código. O provider de emote aceita só `twitch`, `bttv`, `kick` e `ffz` (`emotes.ts:6`), e os hosts permitidos estão em `emotes.ts:20`. |
| 8 | Fora de escopo | Moderação, comandos `/`, polls, predictions, hype train | Decisão do dono do projeto: o multichat não reimplementa a Twitch. Só as funcionalidades principais de chat. |
| 9 | Fora de escopo | Eventos da Kick além do chat | Mesma decisão. O reader continua assinando só `chat.message.sent`. |
| 10 | Fora de escopo | Canal fixo | Mesma decisão. O envio segue com um `TWITCH_BROADCASTER_ID` único do `.env`. |
| 11 | P3 | Histórico curto | O portal pede 15 mensagens (`HISTORY_LIMIT`). O endpoint aceita 200 e o reader guarda 200. |

## Plano em fases

Cada fase só começa quando o critério de aceite da anterior estiver cumprido. A ordem existe porque o reply reenvia mensagens e, sem idempotência, pode duplicá-las.

### Fase 0: confirmar premissas

- [ ] Aplicar a política do Realtime no Supabase hospedado (já rastreado no `LLM-GUIDE.md`). Depende de acesso ao Supabase hospedado, fora do repositório.
- [x] Escopo `user:write:chat` da Twitch: **já é pedido** em `auth-service/src/providers.ts:64` e em `galindogamerbr-portal/src/features/multichat/loginFlows.ts:16`. Membros que entraram antes dele falham no envio, não só no reply. O escopo da Kick (`chat:write`) está em `auth-service/src/providers.ts:80`.
- [x] Webhook `chat.message.sent` da Kick: **traz reply**, em `replies_to` (com `message_id`, `content` e `sender` do pai). Fonte: [Kick, eventos](https://docs.kick.com/events/event-types).
- [x] `msg-id` do `USERNOTICE` documentados pela Twitch: `sub`, `resub`, `subgift`, `submysterygift`, `giftpaidupgrade`, `rewardgift`, `anongiftpaidupgrade`, `raid`, `unraid`, `bitsbadgetier`, `sharedchatnotice`, `modiversary`, `viewermilestone`. `announcement` e `ritual` **não** constam na página do IRC. Fonte: [Twitch, IRC](https://dev.twitch.tv/docs/chat/irc/).
- [x] Tags de moderação (Twitch): `CLEARMSG` traz `target-msg-id` (UUID) e `login`; `CLEARCHAT` traz `target-user-id` (ausente se o chat inteiro foi limpo) e `ban-duration` (presente só em timeout).
- [ ] Formato do `message_id` da Kick: a doc de eventos não o especifica (o exemplo não é UUID), mas `reply_to_message_id` do `POST /public/v1/chat` pede UUID. Conferir com uma mensagem real antes de ligar o reply nativo na Kick.
- [x] Corrigir `multichat-reader/README.md` (EventSub) e `LLM-GUIDE.md` (pausa de 600 ms).

Aceite: as dúvidas respondidas e anotadas neste arquivo; docs coerentes com o código. Pendentes: política do Realtime e formato do `message_id` da Kick.

### Fase 1: idempotência no envio (item 1)

Implementado em `multichat-command/src/idempotency.ts` (`SendDedupe`) e `src/app.ts`, com testes em `test/idempotency.test.ts` (23 testes passando no serviço). Sem commit.

- [x] Guardar o resultado por `userId:id:plataforma` em um `Map` com TTL de 5 minutos e teto de 10 mil entradas.
- [x] Pedido repetido enquanto o primeiro roda devolve a mesma promise, sem enviar de novo.
- [x] Pedido repetido depois de concluído devolve os resultados guardados. Se alguma plataforma falhou, reenvia só ela e mantém as que deram certo.
- [x] Repetição servida inteira pelo cache devolve a unidade ao contador de 10 envios por 5 s. A checagem continua depois do contador, então um 429 com a cota cheia ainda é possível; o `Retry-After` de 5 s do cliente cobre esse caso.
- [ ] Tornar o `id` obrigatório. Adiado: os testes de `security.test.ts` e qualquer cliente sem `id` quebrariam.
- [ ] Opcional: tratar falha de rede/timeout como repetível em `sendQueue.ts`, reusando o mesmo `id` (exige uma classe de erro própria para rede em `services.ts`).
- [x] Testes: duplicata concorrente, duplicata sequencial, reenvio parcial, expiração do TTL, teto de entradas, sem `id`, usuários distintos e cota não consumida. Uma mutação (deduplicação desligada) fez 3 deles falharem.

Decisão em aberto: `Map` em memória basta com uma única instância (Docker Compose da VM) e perde o histórico de 5 minutos em um restart. Para sobreviver a restart ou a várias réplicas, usar uma tabela no Postgres.

Contexto: o portal já envia o UUID em `id` (`MultichatPage.tsx:175`). O README do `multichat-command` (linha 29) já diz que uma resposta parcial não deve provocar reenvio automático para todas as plataformas. A Twitch não oferece chave de idempotência, então a garantia é nossa.

Aceite: enviar o mesmo `id` duas vezes, em sequência ou ao mesmo tempo, entrega uma única mensagem em cada plataforma.

### Fase 2: reply e eventos do IRC (itens 2 e 3)

Reply:

Implementado, sem commit. Testes passando: reader 55, command 28, portal 74 (`tsc` limpo).

- [x] Reader: lê `reply-parent-msg-id`, `reply-parent-display-name` e `reply-parent-msg-body` em `twitch-irc.ts` (`metadata.replyTo`).
- [x] Schema: `replyTo` em `domain.ts` (reader) e `types.ts` (portal).
- [x] Envio: `reply_parent_message_id` no Helix da Twitch e `reply_to_message_id` na Kick (`multichat-command/src/providers.ts`, `SendOptions`). Na Kick só com id em formato UUID; fora dele cai no prefixo `@nome`.
- [x] Regra: reply nativo só na plataforma do pai (Twitch ou Kick); as demais recebem `@nome` (`replyFor` em `multichat-command/src/app.ts`), e o limite de caracteres vale depois do prefixo.
- [x] UI: botão "Responder" ao passar o mouse, citação do pai acima da resposta, chip "Respondendo a" no campo de envio (Esc cancela). O eco da mensagem enviada é reconhecido mesmo com o `@nome` na frente (`dropEchoed`).
- [x] Limitação: uma mensagem provisória não tem `platformMessageId`, então não se responde a ela enquanto estiver pendente (o botão não aparece).
- [ ] Não testado contra Twitch e Kick reais: o corpo enviado está coberto por testes com `fetch` falso, mas o comportamento do reply nativo e o formato do `message_id` da Kick precisam de conta vinculada e live.
- [ ] Incerto: se a Twitch, num reply enviado pelo Helix, entrega o texto com ou sem o `@nome` do pai. O portal tolera os dois casos no eco, mas a exibição só será confirmada ao vivo.

| Plataforma | Envio | Leitura | Fonte |
| --- | --- | --- | --- |
| Twitch | `reply_parent_message_id` no Helix `chat/messages`, escopo `user:write:chat` | Tags `reply-parent-*` no IRC | [Send and receive messages](https://dev.twitch.tv/docs/chat/send-receive-messages/), [IRC](https://dev.twitch.tv/docs/chat/irc/) |
| Kick | `reply_to_message_id` (UUID) em `POST /public/v1/chat`, escopo `chat:write` | Não verificado | [Chat API](https://docs.kick.com/apis/chat) |
| YouTube | Sem campo documentado em `liveChatMessages.insert`. Fallback: prefixo `@nome` | Não aplicável | [LiveChatMessages](https://developers.google.com/youtube/v3/live/docs/liveChatMessages) |

Eventos do IRC:

- [x] `USERNOTICE`: sub, resub, subgift, submysterygift, raid e announcement viram `ChatMessage` com `metadata.event`, exibidos como aviso em português (`notices.ts`). Outros `msg-id` são ignorados. `announcement` não consta na página do IRC da Twitch, então esse caso está coberto só por teste com linha sintética.
- [x] `CLEARMSG` e `CLEARCHAT`: viram `live_event` de moderação (`delete`, `ban`, `timeout`, `clear`) e o portal marca as mensagens como removidas. O portal não consumia `live_event` antes; agora `useMultichat` o assina.
- [ ] `ROOMSTATE`: modos slow, sub-only, emote-only e followers-only. **Adiado:** o estado inicial chega uma vez, na entrada no canal, e um assinante que abre a página depois nunca o receberia. Exige o reader guardar o último estado e republicá-lo de tempos em tempos (como já faz com `metrics` e `provider_status`).
- [x] Tag `bits` para cheers (`metadata.bits`, exibido como "N bits").
- [x] Tudo normalizado em `ChatMessage` e validado no `messageSchema` do reader e do portal.
- [ ] Limitação: `/api/chat/recent` devolve o histórico sem a marca de moderação, então uma mensagem apagada volta a aparecer ao recarregar a página.

Aceite: responder a uma mensagem da Twitch cria um reply nativo visível no chat da Twitch; eventos de sub, raid e mensagem apagada aparecem no multichat.

### Fase 3: presença, menções e 7TV (itens 5, 6 e 7)

Implementado, sem commit. Testes passando: portal 88, API 84 (`tsc` limpo nos dois).

- [x] Presence: `useMultichat` rastreia quem está logado, tem nome de exibição e não se escondeu, no canal que o portal já assina (`presence.ts`, `OnlineMembers.tsx`). Chave de presença aleatória por aba (o id do usuário não vai para os outros). A lista mostra até 200 nomes e o total.
- [ ] Presence para visitantes: **não implementado de propósito.** Contar visitantes anônimos exigiria política de `INSERT` para `anon` no Realtime. O contador mostra só membros logados.
- [ ] **Política do Realtime (obrigatória para a lista funcionar):** `multichat_presence` (INSERT, só `authenticated`, só `live:galindogamerbr`, só `extension in ('presence')`) foi adicionada a `galindogamerbr-portal/docker/realtime.sql`, `deploy-platform/scripts/supabase-realtime-policy.ps1` e `supabase-apply-migrations.ps1`. **Não foi aplicada nem testada** (Docker parado nesta máquina e o Supabase hospedado está fora do repositório). Sem ela o chat funciona e ninguém aparece na lista.
- [x] Menções: autocomplete de `@` limitado aos membros online (setas, Enter ou Tab, Esc) e destaque de "te mencionaram" (`mentions.ts`). Nomes com espaço viram `@Nome_com_underscores`.
- [ ] Menção real na Twitch: **não implementado.** O `@nome` é só texto e não notifica ninguém na Twitch, porque o nome do portal costuma diferir do login. Trocar pelo login vinculado depende de decisão de privacidade (o membro autorizar que o vínculo fique visível).
- [x] 7TV: provider `7tv` no catálogo da API (`galindogamerbr-api/src/lib/sevenTv.ts`, global e do canal; 404 do 7TV é canal sem conta), no schema e na allowlist de hosts (`cdn.7tv.app`) do portal, no seletor e nas regras de envio (7TV só vai para a Twitch, como BTTV e FFZ). `useEmotes.ts` passou para `?v=4`. Emotes privados e zero width são descartados.
- [ ] Não testado contra o 7TV real a partir do servidor: o formato foi conferido nas respostas públicas (`/v3/emote-sets/global` e `/v3/users/twitch/<id>`), mas a chamada feita pela API em produção não foi exercitada.
- Limitações assumidas: o nome na lista de online é declarado pelo navegador de cada membro, então outro membro poderia se passar por alguém. A lista é informativa e nunca deve decidir permissão.

Aceite: lista de online atualiza ao entrar e sair; menção a um membro online fica destacada para ele; emotes 7TV aparecem no seletor e no texto.

### Fase 4: fora de escopo

Decisão do dono do projeto: o multichat **não reimplementa a Twitch**; entram só as funcionalidades principais de chat. Ficam de fora, sem previsão: moderação e comandos `/`, polls, predictions, hype train, EventSub (removido de propósito), eventos da Kick além de `chat.message.sent` e canal configurável. Não os proponha de novo sem pedido.

Único item opcional que sobra, por ser de chat:

- [ ] Histórico: subir `HISTORY_LIMIT` de 15 para até 200 (`useMultichat.ts`), se o valor baixo não for deliberado. Aguarda confirmação.

## Riscos

- Presence em live grande pode ficar caro. Começar só com o contador limita o custo.
- O `Map` de idempotência some em restart. Aceitável para um TTL de 5 minutos, mas não com várias réplicas.
- Sem o escopo `user:write:chat`, o reply na Twitch falha para quem entrou antes dele. O mesmo mecanismo de `needs_reauth` dos emotes (invariante 14) pode servir de modelo.
