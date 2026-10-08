# Demonstração do login TikTok

## Escopo desta versão

Login com TikTok, criação e acesso ao perfil da comunidade, nome, foto, data de cadastro, logout e exclusão da conta do portal. Votações, conteúdos para membros e feed são recursos futuros, identificados como “Em breve”. Não há coleta de histórico de vídeos assistidos, doações ou métricas da live nesta tela.

## Justificativa para o Login Kit

O GalindoGamerBR é um portal voltado ao público da comunidade do canal. O Login Kit permite criar e acessar uma conta no portal sem cadastrar uma senha adicional. Utilizamos o identificador da conta TikTok para reconhecer o membro nos próximos acessos e o nome e a foto para apresentar seu perfil. O membro pode acessar sua área pessoal, sair e excluir seu cadastro no portal. Votações e um feed da comunidade estão planejados para versões futuras e ainda não estão disponíveis.

Permissão utilizada: user.info.basic. O identificador open_id associa a conta ao cadastro; display_name e avatar_url personalizam o perfil. Não justificar a permissão com funcionalidades futuras como se já existissem.

## Roteiro de gravação

1. Abra a página inicial e mostre o portal do canal e o convite para a comunidade.
2. Abra o cadastro. Mostre o botão “Entrar com TikTok” e os links de Termos de Uso e Política de Privacidade.
3. Clique em “Entrar com TikTok” e conclua o fluxo real do TikTok com uma conta de teste autorizada. Não grave senhas ou códigos de autenticação. Se o TikTok reutilizar uma autorização anterior, não apresente isso como uma nova tela de consentimento.
4. Mostre a área de membro: nome, foto, vínculo TikTok e data de cadastro.
5. Mostre brevemente os cartões “Em breve” e explique que são funcionalidades planejadas.
6. Abra “Gerenciar conta”. Mostre logout e a opção de exclusão. Se demonstrar a exclusão até o fim, use uma conta de teste cujo cadastro possa ser apagado.
7. Saia e mostre o retorno à página de login.

## Narração sugerida

“Este é o portal GalindoGamerBR, voltado à comunidade do canal. O TikTok facilita a criação e o acesso à conta do membro. Após o login, o portal exibe o nome e a foto autorizados pelo usuário e a data de cadastro na comunidade. Na área da conta, o membro pode sair ou excluir seu cadastro. Os cartões sinalizados como ‘Em breve’ apresentam recursos futuros; esta versão demonstra o login e o gerenciamento do perfil.”

## Antes de enviar ao TikTok

- No painel do aplicativo, mantenha apenas os produtos e permissões realmente demonstrados nesta submissão: Login Kit e user.info.basic para este fluxo.
- Cadastre o callback HTTPS exato configurado no backend. Um túnel temporário pode mudar de endereço; não reutilize um link de login antigo.
- Para primeira revisão, use o sandbox e uma conta de teste autorizada.
- O domínio apresentado no vídeo precisa corresponder ao website informado na submissão. A versão Docker em localhost serve para preparar a demonstração local; não substitui essa exigência.
- Não apresente esta preparação local como deploy de produção ou aprovação garantida. O TikTok exige site plenamente desenvolvido e informa que aplicativos ainda em desenvolvimento ou teste não são aprovados. Recursos futuros não comprovam utilidade já disponível.

Fonte: https://developers.tiktok.com/docs/en/app-review-guidelines

## Endereço local preparado em 01/10/2026

Portal para gravação: https://preview.galindogamerbr.com.br/login

Callback a cadastrar no Login Kit Web do sandbox:

https://preview.galindogamerbr.com.br/oauth/tiktok/callback

O preview usa o Docker local por túnel. Mantenha este computador, o Docker e o túnel ligados durante a gravação. O endereço público é fixo; se o túnel interno for recriado, o encaminhamento do preview precisa ser atualizado. O login real não foi testado nesta preparação.
