# Multichat local

## Pastas

Os repositórios ficam lado a lado em F:\Projects\GalindoGamer-BR:

- galindogamerbr-portal: rota /multichat e orquestração local.
- multichat-command: OAuth, contas vinculadas e envio.
- multichat-reader: leitura, normalização, métricas e Realtime.

Os backends são repositórios Git separados e privados na organização GalindoGamer-BR. O Compose usa os caminhos relativos ../multichat-command e ../multichat-reader.

## Subir tudo

Requisitos: Docker Desktop com motor Linux funcionando e Node 22+ apenas para gerar os segredos e executar o smoke test.

Dentro de galindogamerbr-portal:

```powershell
node scripts/multichat-env.mjs
docker compose --env-file .env.docker up --build -d --wait
docker compose --env-file .env.docker ps
```

Abra http://localhost:5173/multichat. Use localhost de forma consistente, pois CORS e URLs de sessão foram configurados para esse host. Entre pelo botão Entrar com Twitch, após configurar o OAuth abaixo. Clique em Conectar nas configurações para autorizar as contas reais (os callbacks OAuth precisam estar cadastrados). Todas as contas vinculadas recebem cada envio; para interromper o envio a uma plataforma, desvincule a conta.

Serviços: portal/Vite + Pages Functions + D1 local; Command em localhost:3001; Reader em localhost:3002; Supabase em localhost:54321. Postgres, Auth, PostgREST, Realtime e o simulador também rodam em Docker. Banco e estado do portal usam volumes nomeados.

O Compose padrão usa fontes reais; MOCK_PLATFORMS=false no Reader e no Command. O gerador mock-platform fica fora da inicialização padrão, no perfil simulation. A faixa na interface identifica o modo de teste. Ele emite mensagens das quatro plataformas e devolve envios pelo mesmo fluxo que produção:

Command → plataforma simulada → Reader → Supabase Realtime → portal.

As integrações do portal fora do Multichat que dependem de serviços externos continuam exigindo suas próprias credenciais. .dev.vars, .env*, estado Wrangler e node_modules do Windows nunca entram no contexto Docker. O Docker instala dependências Linux próprias.

## Verificação e parada

```powershell
node scripts/multichat-smoke.mjs
docker compose --env-file .env.docker logs --tail 100 reader command
docker compose --env-file .env.docker down
```

O smoke test cria e remove um usuário local, verifica Auth, endpoints protegidos, bloqueio de leitura de tokens, quatro plataformas e o retorno dos três envios via Reader. Não roda contra produção.

Para refletir alterações no código, rode novamente up --build. Não use down -v se quiser preservar as contas e os bancos locais. O gerador de .env.docker não sobrescreve segredos existentes.

## Ambiente real

1. Crie/configure um projeto Supabase e habilite o provedor Twitch em Authentication / Sign In / Providers.
2. Aplique a migration provider_accounts do Command e docker/realtime.sql deste portal. Broadcast privado: anon e authenticated podem receber no tópico live:galindogamerbr; apenas o backend publica. Não crie política INSERT para navegadores.
3. Configure os backends conforme seus .env.example e READMEs, com MOCK_PLATFORMS=false.
4. Configure as três variáveis de .env.example no build do portal. Somente URL Supabase, chave pública e URL Command vão ao frontend.
5. Cadastre os callbacks OAuth e o webhook HTTPS da Kick.
6. Informe os IDs reais dos canais/live chat. O ID do chat do YouTube precisa acompanhar a transmissão.
7. Teste com contas autorizadas e live ativa antes de publicar.

O login Supabase do Multichat é separado do login administrativo já existente no portal. O envio tem resultado individual e nunca acrescenta mensagem otimista na timeline. Mensagens ficam limitadas a 1000 no navegador e são virtualizadas.

## Limites do MVP

Credenciais reais e testes ao vivo são necessários para homologar os providers. TikTok usa biblioteca não oficial. O buffer e os controles de envio são em memória e não sobrevivem a reinícios. Rodar múltiplos Readers para o mesmo canal exige coordenação externa. Render Free não garante um processo de leitura continuamente ativo.

## Referências

- https://supabase.com/docs/guides/self-hosting/docker
- https://dev.twitch.tv/docs/chat/send-receive-messages/
- https://developers.google.com/youtube/v3/live/docs/liveChatMessages/list
- https://docs.kick.com/getting-started/generating-tokens-oauth2-flow
- https://github.com/zerodytrash/TikTok-Live-Connector

## Validação desta implementação

Builds dos três projetos e 65 testes automatizados passaram. O ambiente Docker foi iniciado também com volumes novos. O smoke test validou Supabase Auth, isolamento dos tokens, quatro plataformas simuladas e o retorno dos três writers via Reader/Realtime. Cadastro, vinculação e envio foram verificados no navegador. A homologação com plataformas reais depende de credenciais OAuth e transmissões ativas.


## Login com Twitch

O portal usa Supabase Auth com OAuth Twitch e PKCE. No aplicativo da Twitch, registre o callback local exato:

`http://localhost:54321/auth/v1/callback`

Em `.env.docker`, configure `TWITCH_AUTH_ENABLED=true`, `TWITCH_CLIENT_ID` e `TWITCH_CLIENT_SECRET`. As credenciais ficam apenas no serviço Auth, nunca em variáveis VITE. Depois:

```powershell
docker compose --env-file .env.docker up --build -d --wait auth portal
```

Em produção, configure Client ID e Secret no provedor Twitch do Supabase e registre na Twitch o callback mostrado pelo Supabase (`https://<projeto>.supabase.co/auth/v1/callback`). Autorize a URL do portal terminada em `/multichat` na lista de redirect URLs do Supabase.

Entrar identifica o usuário do portal; a permissão de envio continua sendo concedida em Configurações de conexões. Desvincular a Twitch do envio não encerra a sessão do portal. O Auth local mantém e-mail habilitado apenas para o smoke test via API; a interface usa Twitch.

Referências: [OAuth no Supabase](https://supabase.com/docs/reference/javascript/auth-signinwithoauth) e [configuração do Auth local](https://supabase.com/docs/guides/self-hosting/auth/config).


## Interface de transmissão e emotes

O Multichat ocupa a janela com player à esquerda e chat à direita. Em telas pequenas, o chat fica abaixo do player. O modo teatro amplia o player e mantém o chat e os links de inscrição; Escape sai do modo teatro. As abas Todos/Twitch/YouTube/Kick/TikTok filtram somente a leitura. Enter envia; Shift+Enter quebra a linha.

Conexões e instruções ficam nos botões do cabeçalho. O envio continua direcionado a todas as contas vinculadas. Os links de inscrição e presente abrem a página oficial de subs da Twitch; a escolha e o pagamento acontecem lá.

O endpoint público /api/multichat-emotes agrega emotes globais e do canal da Twitch e BTTV, incluindo shared emotes e imagens animadas. Usa cache de uma hora (30 segundos se parcial). As credenciais Twitch permanecem no Worker. No Docker, o script multichat-worker-env.mjs gera .dev.vars somente dentro do container. A imagem instala ca-certificates para validar HTTPS no Workerd.

O Reader preserva os fragmentos de emotes nativos do EventSub, inclusive emotes de outros canais presentes nas mensagens. O seletor inclui os catálogos globais e do canal, com busca e filtros Twitch/BTTV. Permissões de uso de emotes de assinante continuam sendo validadas pela Twitch. Em outras plataformas os códigos podem aparecer como texto; não há upload de arquivos. Falhas de imagem preservam o código textual.

Referências: [Twitch emotes](https://dev.twitch.tv/docs/api/reference#get-channel-emotes) e [BetterTTV API](https://betterttv.com/developers).


A leitura do chat, métricas e status funciona sem login. O canal continua com autorização Realtime: anon e authenticated recebem somente no tópico live:galindogamerbr, sem permissão INSERT/broadcast. Login e contas vinculadas continuam obrigatórios para enviar pelo Command. Ao atualizar um ambiente existente, reaplique docker/realtime.sql (no Docker: docker compose --env-file .env.docker run --rm migrate).


## Leitura real ativada

Twitch usa leitura pública via IRC sobre TLS quando não há token de usuário EventSub. A API oficial de streams controla se as mensagens são publicadas enquanto a live está online. Com token de usuário, o Reader mantém EventSub. TikTok conecta ao canal real. YouTube descobre a transmissão em /api/live e obtém activeLiveChatId pela API oficial; reconecta e descobre novamente nas próximas lives. O host interno portal está autorizado no Vite para essa descoberta.

Kick depende de configurar KICK_BROADCASTER_ID e o webhook HTTPS público do Reader no aplicativo Kick. Sem isso, permanece não configurada. Nenhum fallback gera mensagens artificiais.

Os scripts de smoke de simulação recusam execução com MOCK_PLATFORMS diferente de true para não enviar testes a canais reais. O teste de leitura real deve ser passivo. As contas simuladas anteriormente vinculadas precisam ser desvinculadas e vinculadas novamente para envio real.
