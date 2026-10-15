# Pedido de aumento de cota da YouTube Data API

Material para o formulário **YouTube API Services - Audit and Quota Extension** (e para a verificação do escopo `youtube.force-ssl` na tela de consentimento OAuth). Os blocos em inglês estão prontos para colar. Os números da tabela de consumo são **estimativas calculadas do código**; a descoberta de live tem **medição real** (seção "Medições", 14/10/2026). Confira o restante com o uso real do Google Cloud Console (APIs e serviços > YouTube Data API v3 > Cotas) antes de enviar.

## Antes de enviar (checklist)

- [ ] Projeto Google Cloud **dedicado ao vínculo/envio** com o OAuth client (a cota do envio é do projeto do `GOOGLE_CLIENT_ID`; leitura e estatísticas usam a `YOUTUBE_API_KEY` de outro projeto). Ver `multichat-command/AGENTS.md`.
- [ ] Política de Privacidade publicada com a seção "Vínculo com YouTube" (já está em `src/routes/Privacidade.tsx`; URL: `https://galindogamerbr.com.br/privacidade`) e Termos em `/termos`.
- [ ] Tela de consentimento com nome, logo, domínio autorizado `galindogamerbr.com.br`, links de privacidade e termos, e o escopo `youtube.force-ssl` justificado.
- [ ] Vídeo de demonstração (não listado no YouTube): login no portal, vincular o YouTube (tela de consentimento do Google com o escopo visível), enviar uma mensagem pelo multichat durante uma live, ver a mensagem no chat do YouTube, desvincular em Minha conta.
- [ ] Contato da equipe responsável (`contato@galindogamerbr.com.br`).
- [ ] **Código novo em produção** (sem scraping, ver "Pontos para conferir") e `YOUTUBE_PUBSUB_SECRET` configurado na VM com a inscrição WebSub ativa: sem ele o push do YouTube não valida e a descoberta cai para o intervalo de 5 min (576 unidades/dia em vez de 96). Só então afirme o texto do formulário.

## Consumo estimado (unidades/dia)

Custos oficiais: `liveChatMessages.streamList` 5 por conexão, `liveChatMessages.list` 5, `liveChatMessages.insert` 20, `videos.list` 1, `playlistItems.list` 1, `channels.list` 1.

| Consumidor | Projeto da cobrança | Regra de consumo | Estimativa |
|---|---|---|---|
| Leitura do chat (`multichat-reader`, `streamList`) | API key | Janela de ~10 s e pausa adaptativa de 4 a 35 s. Chat ativo: ~14 s por ciclo, ~1.300/h. Chat quieto: ~45 s por ciclo, ~400/h | 4 h ao vivo: 1.600 a 5.100. Teto configurado: 7.000 (`YOUTUBE_DAILY_UNITS`) |
| Estado da live (`/api/live`, título, espectadores e `liveChatId`) | API key | um `videos.list` (`snippet,liveStreamingDetails`, 1 unidade), memo de 120 s compartilhado, só com live ativa | ~30/h ao vivo |
| Descoberta de live (rede de segurança do WebSub) | API key | `playlistItems.list` (playlist `UU`) + `videos.list`: 2 unidades a cada 30 min com WebSub ativo, ou a cada 5 min sem ele | 96/dia com WebSub (48 checagens), 576/dia sem (288 checagens) |
| Reconferência por multistream | API key | Outra plataforma ao vivo com o YouTube offline: checagens a cada 1, 2 e 5 min durante no máximo 15 min (flag `LIVE_CROSS_CHECK_ENABLED`) | ~16 por episódio |
| Último vídeo (sem live) | API key | `playlistItems.list` `UU` + `UUSH` + `videos.list`, só ao trocar o estado, com cache no banco | ~3 por troca |
| Estatísticas do canal (`social-stats`) | API key | `channels.list` | até ~72/dia |
| Canal e último vídeo (portal) | API key | `channels.list` 1/h, `playlistItems`+`videos` a cada 30 min | ~120/dia |
| Envio de mensagens | **OAuth client** | `insert` 20 + `videos.list` 1 por resolução do chat (cache de 5 min) | 20 por mensagem; teto atual 2.000 (`YOUTUBE_SEND_DAILY_UNITS`), ~100 mensagens |

Passivo fora de live: ~290 unidades/dia com o WebSub ativo (descoberta 96, estatísticas ~72 e portal ~120). Passivo durante a live: ~30/h, mais a leitura do chat.

## Medições (14 e 15/10/2026, durante uma live)

Duas sondas rodaram em paralelo comparando a descoberta **só pela API oficial** com o método anterior de ler a página `/channel/<id>/live` (`scripts/youtube-live-probe.ts` no `galindogamerbr-api`):

| | Sonda 1 | Sonda 2 |
|---|---|---|
| Intervalo | ~3 min | ~1 min |
| Rodadas | 275 | 233 |
| Unidades de cota gastas | 881 | 747 |
| Custo medido por rodada | 3,2 unidades (com amostras extras de Shorts) | 3,2 unidades |
| Divergências API × página | 0 | 0 |
| Erros de API ou de rede | 0 | 0 |

- A live apareceu **na mesma rodada** nas playlists de uploads (`UU`) e de lives (`UULV`), e na página. A API não ficou atrás do método anterior.
- Só a descoberta (`UU` + `videos.list`) custa **2 unidades por checagem**; o resto da medição inclui amostras de Shorts.
- A playlist de Shorts (`UUSH`) concordou com a classificação do YouTube em todas as amostras; a de "vídeos sem Shorts" (`UULF`) trouxe um Short de 1m01s, por isso usamos `UUSH` e não a duração.
- Limite da medição: uma única live (detectada às 18:52 em Brasília e ainda no ar na última rodada, às 21:57) e resolução de 1 minuto; o fim da live não foi capturado.

## Valor sugerido para pedir

Estimativa minha, ajuste conforme o uso real:

- **Projeto do envio (OAuth): 20.000 unidades/dia** (~1.000 mensagens/dia, por exemplo 100 membros enviando 10 mensagens cada). Hoje o teto do código é 2.000.
- **Projeto da leitura (API key): 25.000 unidades/dia**, para suportar lives de 8 h com chat ativo (~10.000) e picos sem pausar a leitura.

Peça o aumento no projeto que de fato estoura (comece pelo do envio, que é o que o Google costuma exigir justificar mais).

## Respostas para o formulário (inglês)

**What does your API client do? / Describe the use case**

> Portal GalindoGamerBR (https://galindogamerbr.com.br) is the website of a Brazilian gaming streamer. Its "multichat" shows the live chats of YouTube, Twitch, Kick and TikTok in a single feed and lets signed-in members write in the YouTube live chat of the channel without leaving the portal. Members opt in by linking their own YouTube channel through Google OAuth. When they type a message in the portal, we post that exact message to the live chat of the channel's current broadcast on their behalf, using their own token. We also read the channel's live chat (to display it), the channel's public statistics (subscriber count) and the latest uploads/live status (to show "live now" and the latest video).

**Which API methods do you use, and why?**

> - `liveChat/messages.streamList` (and `liveChatMessages.list` as fallback): read the live chat of the channel's own broadcast, with an API key, to render the unified chat.
> - `liveChat/messages.insert`: post a message typed by a member who linked their account, with their OAuth token, to the channel's active live chat.
> - `videos.list` (`snippet`, `liveStreamingDetails`): one call returns the title, `activeLiveChatId`, concurrent viewers and whether the broadcast is live.
> - `channels.list` (`mine=true`): identify the channel of the member who is linking the account (id and title). Also public statistics for the streamer's own channel.
> - `playlistItems.list`: list the channel's recent uploads (uploads playlist, `UU`) to find the current live and the latest video, and its Shorts playlist (`UUSH`) to exclude Shorts. We do not use `search.list`.

**Why do you need more quota? / How did you estimate it?**

> The default 10,000 units/day is shared between reading the chat (`streamList` costs 5 units per connection, about 1,300 units per hour when the chat is busy) and posting messages (`insert` costs 20 units). Reading a single 4-hour broadcast can use about 5,000 units, leaving room for only about 100 member messages per day. We already minimize usage: chat reading uses the streaming endpoint with adaptive pauses instead of polling, live status is cached for 60 seconds and shared across services, live discovery relies on PubSubHubbub push notifications with an infrequent API fallback (every 30 minutes) and a short, bounded re-check only while another platform of the same streamer is live, we never read YouTube web pages, `search.list` is never used, all calls go through a daily budget guard, and after a `quotaExceeded` response all calls stop until the daily reset. We request <X> units/day for the OAuth project (member message posting) and <Y> units/day for the API-key project (chat reading and channel data).

**How do you handle user data? (Google API Services User Data Policy)**

> We request a single scope, `https://www.googleapis.com/auth/youtube.force-ssl`, only when a member chooses to link their channel. We store the channel id and title and the OAuth tokens. Tokens are encrypted at rest (AES-256-GCM, with a per-user/provider context) and are only decrypted server-side to post the message the member typed. We do not read the member's videos, subscriptions, playlists, comments or email; we do not sell data, use it for advertising, profiling or to train AI models, and do not transfer it to third parties beyond what is needed to provide the feature. Members can unlink at any time in "Minha conta" (we revoke the token at Google first and keep the link if revocation cannot be confirmed), deleting the account also revokes the grant and removes the data, and members can revoke access at myaccount.google.com/permissions. Our privacy policy (https://galindogamerbr.com.br/privacidade) includes the Google API Services User Data Policy / Limited Use statement and links to the YouTube Terms of Service and Google Privacy Policy.

**Do you comply with the YouTube API Services Terms of Service and Developer Policies?**

> Yes. We keep API data cached only briefly (live status 60 s; channel statistics and uploads for at most 30 min to 1 h), we do not use quota workarounds, and we show YouTube content only through official embeds and links.

## Pontos para conferir antes de afirmar

- Scraping: **removido do código** (era `getLiveVideoId`, que lia o HTML de `youtube.com/channel/<id>/live`, e `isShort`, que consultava `youtube.com/shorts/<id>`; também saiu o oEmbed). Hoje tudo vem da Data API v3. Só afirme isso no formulário depois de o código novo estar em produção. O TikTok e a Kick têm leituras próprias de status ao vivo, que não são do YouTube.
- A frase sobre embeds assume que os vídeos do site usam o player oficial do YouTube; confirme.
- Substitua `<X>` e `<Y>` pelos valores finais.
