# Política de Privacidade — GalindoGamerBR

Última atualização: 19 de outubro de 2026.

A versão completa e vigente é a página pública **https://galindogamerbr.com.br/privacidade** (fonte: `src/routes/Privacidade.tsx`), junto com os Termos de Uso em `/termos` (`src/routes/Termos.tsx`). Este arquivo é só um resumo; em caso de diferença vale a página.

## Serviços de API do YouTube (requisitos da auditoria)

O portal usa a YouTube Data API v3. As páginas legais precisam manter, enquanto o app usar a API:

- **Termos de Uso**: dizer que, ao usar as funções que dependem da API, a pessoa concorda com os [Termos de Serviço do YouTube](https://www.youtube.com/t/terms); que o portal não é afiliado nem endossado pelo YouTube/Google; e como revogar o acesso.
- **Política de Privacidade**: que dados da API são acessados (canal público, chat ao vivo público, e — no vínculo opcional — identificador/nome do canal e o escopo `youtube.force-ssl` só para enviar mensagens), como são usados, guardados (tokens criptografados; chat só em memória, 200 mensagens; cache do canal de até 1 h) e compartilhados (não são); link para a [Política de Privacidade do Google](https://policies.google.com/privacy); declaração de conformidade com a [Política de Dados do Usuário dos Serviços de API do Google](https://developers.google.com/terms/api-services-user-data-policy), inclusive Uso Limitado; como revogar ([security.google.com/settings/security/permissions](https://security.google.com/settings/security/permissions)) e como pedir a exclusão (apagar em até 7 dias); contato.
- Sempre que a API ou os dados guardados mudarem (novos escopos, novo armazenamento), atualize as duas páginas **antes** de publicar.

## Resto

Login com Twitch, Google (`openid`, e-mail e perfil), TikTok e e-mail por código; mesclagem de contas e e-mails secundários; métricas públicas; formulário de parceiros; Cloudflare, Supabase e Resend como operadores. Contato: contato@galindogamerbr.com.br.
