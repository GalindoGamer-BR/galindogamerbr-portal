# Atualização: cadastro sem e-mail
O usuário entra apenas com TikTok, sem coleta de e-mail ou envio de código.
O open_id único vincula a identidade TikTok ao UUID do usuário.
Para manter sessões nativas renováveis no GoTrue, novos usuários recebem um alias aleatório no domínio reservado .invalid, marcado em app_metadata.email_is_internal. Esse alias é técnico, não representa um endereço de contato ou e-mail verificado do usuário e não deve ser usado para comunicação, recuperação ou união de contas.
A página /conta exibe apenas o vínculo TikTok, logout e exclusão.
A autorização e a prova do navegador continuam obrigatórias.
Não há alteração de escopos TikTok nem habilitação de envio LIVE.

## Área de membro
O login retorna para /membro, com perfil protegido, foto TikTok, data do cadastro, tempo na comunidade e total de vínculos reais. Votações, conteúdos e feed são espaços futuros identificados como Em breve.
A autorização usa disable_auto_auth=1 para solicitar a tela TikTok mesmo quando existe autorização anterior. O comportamento automático anterior também é documentado pelo TikTok; não era evidência, por si só, de violação de diretrizes.
O avatar vem de user.info.basic. Estatísticas sociais só são consultadas quando o token já inclui user.info.stats; não ampliamos os escopos solicitados automaticamente. Campos ausentes não são preenchidos com números fictícios.
## Histórico anterior (substituído pelo fluxo acima)
# Conta pública do portal
## Fluxo ativo
- /login: TikTok oficial, escopo user.info.basic; Twitch desabilitado no frontend e no GoTrue local.
- Primeira entrada: autorização TikTok, e-mail informado no portal e código de seis dígitos. Só após verificação é salvo o vínculo com o usuário do Supabase.
- Próximas entradas: autorização TikTok e troca de prova de navegador de uso único por sessão Supabase do mesmo usuário.
- /conta: e-mail, identidade TikTok, logout e exclusão confirmada do cadastro.
- ID UUID interno permanece como chave primária. E-mail verificado pertence ao usuário de autenticação. open_id é único e não pode pertencer a dois usuários.
- Exclusão remove auth.users e os vínculos/tokens locais por cascade. Não apaga contas nem mensagens nas plataformas externas.
- A autorização Login Kit não habilita envio ao chat LIVE.

## Configuração local
Execute Docker Compose com compose.yaml e compose.tiktok-tunnel.yaml. O callback `/oauth/tiktok/*` é atendido pelo `auth-service` (via gateway).
Cadastre no Login Kit Web o HTTPS do túnel com /oauth/tiktok/callback e use a mesma URL em TIKTOK_REDIRECT_URI. Preserve o callback de produção do admin.
O proxy público permite somente GET /oauth/tiktok/authorize e /oauth/tiktok/callback.
Quick Tunnel é temporário: ao reiniciar, confira o hostname e atualize a configuração.
O e-mail usa SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/SMTP_FROM; localmente reaproveita o serviço Resend do portal.
Autoconfirmação de e-mail está desabilitada. Templates de cadastro e acesso mostram apenas o código, com validade de dez minutos.
As alterações do provedor Twitch e SMTP também precisam ser aplicadas ao serviço de autenticação de produção quando houver deploy.

## Avaliação TikTok
Finalidade: facilitar o acesso de espectadores à comunidade pública do canal e aproximá-los do streamer.
O Login Kit serve à identificação/vinculação de conta. Demonstre somente recursos reais e acessíveis na submissão.
O cadastro no feed de notícias é uma finalidade planejada: a newsletter ainda está desativada no portal e não deve ser apresentada como funcional até sua implementação.
Teste e aprovação externa ainda dependem do painel TikTok e de conta autorizada no sandbox.
