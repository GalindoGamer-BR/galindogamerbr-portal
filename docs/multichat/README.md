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

Abra http://localhost:5173/multichat. Use localhost de forma consistente, pois CORS e URLs de sessão foram configurados para esse host. Crie uma conta de teste com e-mail e senha de pelo menos 8 caracteres. A confirmação por e-mail fica desativada somente no Auth local. Clique em Conectar para vincular as contas simuladas.

Serviços: portal/Vite + Pages Functions + D1 local; Command em localhost:3001; Reader em localhost:3002; Supabase em localhost:54321. Postgres, Auth, PostgREST, Realtime e o simulador também rodam em Docker. Banco e estado do portal usam volumes nomeados.

O Compose padrão é de simulação. A faixa na interface identifica o modo de teste. Ele emite mensagens das quatro plataformas e devolve envios pelo mesmo fluxo que produção:

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

1. Crie/configure um projeto Supabase e habilite login por e-mail/senha.
2. Aplique a migration provider_accounts do Command e docker/realtime.sql deste portal. Broadcast privado: authenticated pode receber no tópico live:galindogamerbr; apenas o backend publica. Não crie política INSERT para navegadores.
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
