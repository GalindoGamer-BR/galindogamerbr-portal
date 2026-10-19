import { LegalDocument, type LegalSection } from '../components/shared/LegalDocument'

const EMAIL_LINK = (
  <a href="mailto:contato@galindogamerbr.com.br" className="font-semibold text-gold hover:underline">
    contato@galindogamerbr.com.br
  </a>
)

const SECTIONS: LegalSection[] = [
  {
    title: 'Responsável e canal de contato',
    content: (
      <p>
        O GalindoGamerBR é responsável pelas decisões sobre o tratamento de dados realizado por este portal. Solicitações, dúvidas e comunicações sobre privacidade podem ser enviadas para {EMAIL_LINK}.
      </p>
    ),
  },
  {
    title: 'Login com TikTok',
    content: (
      <div className="space-y-4">
        <p>Esta seção se aplica à integração do aplicativo <strong className="text-white">Portal GalindoGamerBR</strong> com o TikTok Login Kit. O aplicativo é administrado pelo GalindoGamerBR e utiliza essa integração para criar e acessar a conta do membro da comunidade. Dúvidas e solicitações sobre esses dados podem ser enviadas para {EMAIL_LINK}.</p>
        <h3 className="text-lg font-semibold text-white">Autorização e dados recebidos</h3>
        <p>Ao selecionar Entrar com TikTok, você é direcionado ao TikTok para autenticar sua conta e autorizar o aplicativo. A permissão solicitada é user.info.basic. Com sua autorização, recebemos o identificador da sua conta no aplicativo (open_id), seu nome de exibição (display_name) e sua foto de perfil (avatar_url), além dos tokens de acesso e renovação e da validade da autorização. O portal também registra o identificador interno e a data de criação do cadastro.</p>
        <h3 className="text-lg font-semibold text-white">Como utilizamos os dados</h3>
        <p>Utilizamos o identificador TikTok para associar sua conta ao cadastro e reconhecer você nos próximos acessos; o nome e a foto para apresentar seu perfil na área do membro; e os dados de autorização para realizar as operações autenticadas da integração. Esses dados também permitem gerenciar os vínculos e atender à solicitação de exclusão da conta.</p>
        <p>O Login Kit não fornece sua senha do TikTok ao portal. Essa integração não solicita acesso a mensagens privadas, contatos, histórico de vídeos assistidos ou publicação de vídeos, nem autoriza o envio de mensagens em lives. Você pode recusar a autorização e continuar navegando nas páginas públicas, mas não poderá concluir o acesso à conta de membro por TikTok.</p>
        <h3 className="text-lg font-semibold text-white">Armazenamento, segurança e compartilhamento</h3>
        <p>O cadastro e o perfil autorizado são armazenados na infraestrutura de autenticação e banco de dados do portal, baseada em Supabase, enquanto sua conta permanecer cadastrada. Os tokens do TikTok são armazenados criptografados no servidor, com acesso restrito. A expiração de um token não exclui automaticamente o cadastro.</p>
        <p>Durante a autenticação, utilizamos um cookie técnico de segurança com validade de até dez minutos, removido no retorno do TikTok. A sessão do membro é mantida no armazenamento local do navegador para preservar o acesso e permitir sua renovação. Sair da conta encerra a sessão, mas não apaga o cadastro.</p>
        <p>Compartilhamos com o TikTok os dados técnicos necessários à autenticação, à consulta do perfil autorizado e à revogação da autorização. A infraestrutura do portal processa os dados necessários à autenticação, ao armazenamento e à segurança. Os dados recebidos do TikTok não são vendidos nem utilizados para publicidade.</p>
        <p>O Portal GalindoGamerBR é independente do TikTok. A autenticação e a autorização realizadas no ambiente do TikTok seguem também a <a href="https://www.tiktok.com/legal/page/row/privacy-policy/pt-BR" className="font-semibold text-gold hover:underline">Política de Privacidade do TikTok</a>.</p>
        <h3 className="text-lg font-semibold text-white">Revogar o acesso e excluir seus dados</h3>
        <p>Para excluir sua conta do Portal GalindoGamerBR, acesse <a href="/conta" className="font-semibold text-gold hover:underline">Minha conta</a>, selecione Excluir minha conta, digite EXCLUIR e confirme em Excluir definitivamente. O procedimento revoga a autorização do aplicativo no TikTok e, quando concluído com sucesso, remove o cadastro e os vínculos locais, incluindo o perfil TikTok e os tokens armazenados. Sua conta e seus conteúdos no TikTok não são apagados.</p>
        <p>Se a revogação no TikTok falhar, a exclusão não será concluída e o portal informará o erro. Se isso acontecer ou você não conseguir acessar a conta, solicite a exclusão pelo e-mail {EMAIL_LINK}. Podemos confirmar sua identidade antes de atender à solicitação para proteger seus dados.</p>
        <p>Você também pode remover o acesso do Portal GalindoGamerBR nas configurações de segurança e permissões da sua conta TikTok, na área de aplicativos conectados. Essa ação revoga o acesso no TikTok; para apagar os dados já armazenados no portal, utilize a exclusão de conta ou o canal de contato acima. Eventuais registros cuja conservação seja necessária por obrigação legal ou para exercício de direitos ficam restritos a essas finalidades e pelo período aplicável.</p>
      </div>
    ),
  },
  {
    title: 'Login com Google',
    content: (
      <div className="space-y-4">
        <p>Esta seção se aplica à opção Entrar com Google do <strong className="text-white">Portal GalindoGamerBR</strong>, usada para criar e acessar sua conta na comunidade. Dúvidas e solicitações podem ser enviadas para {EMAIL_LINK}.</p>
        <h3 className="text-lg font-semibold text-white">Autorização e dados recebidos</h3>
        <p>Ao selecionar Entrar com Google, você é direcionado ao Google para escolher a conta e autorizar o acesso. As permissões solicitadas são <code>openid</code>, <code>https://www.googleapis.com/auth/userinfo.email</code> e <code>https://www.googleapis.com/auth/userinfo.profile</code>. Com sua autorização, recebemos o identificador da sua conta Google, o endereço de e-mail verificado, o nome e a foto de perfil. Não recebemos sua senha do Google e essa opção não dá acesso a Gmail, Drive, contatos ou qualquer outro serviço. Quando o portal oferece vincular o YouTube já no login, a tela do Google também pede a permissão do YouTube descrita na seção Vínculo com YouTube; você pode recusá-la e entrar mesmo assim, e nesse caso o YouTube não é vinculado.</p>
        <h3 className="text-lg font-semibold text-white">Como utilizamos os dados</h3>
        <p>Utilizamos o identificador e o e-mail para criar seu cadastro e reconhecer você nos próximos acessos; o nome e a foto para apresentar seu perfil na área do membro. Os dados não são vendidos nem usados para publicidade. O uso das informações recebidas das APIs do Google segue a <a href="https://developers.google.com/terms/api-services-user-data-policy" className="font-semibold text-gold hover:underline">Política de Dados do Usuário dos Serviços de API do Google</a>, incluindo os requisitos de Uso Limitado.</p>
        <h3 className="text-lg font-semibold text-white">Armazenamento, revogação e exclusão</h3>
        <p>O cadastro é armazenado na infraestrutura de autenticação e banco de dados do portal, baseada em Supabase, enquanto sua conta permanecer cadastrada. Você pode excluir sua conta em <a href="/conta" className="font-semibold text-gold hover:underline">Minha conta</a> e também remover o acesso do portal em <a href="https://myaccount.google.com/permissions" className="font-semibold text-gold hover:underline">myaccount.google.com/permissions</a>. O vínculo do YouTube para enviar mensagens é separado e opcional, descrito na seção a seguir.</p>
      </div>
    ),
  },
  {
    title: 'Serviços de API do YouTube',
    content: (
      <div className="space-y-4">
        <p>O <strong className="text-white">Portal GalindoGamerBR</strong> usa os <strong className="text-white">Serviços de API do YouTube</strong> (YouTube Data API v3). Ao usar os recursos do portal que dependem deles, você também concorda em ficar vinculado aos <a href="https://www.youtube.com/t/terms" className="font-semibold text-gold hover:underline">Termos de Serviço do YouTube</a>. O tratamento de dados pelo Google segue a <a href="https://policies.google.com/privacy" className="font-semibold text-gold hover:underline">Política de Privacidade do Google</a>.</p>
        <p>O uso e a transferência, para qualquer outro aplicativo, das informações recebidas das APIs do Google seguem a <a href="https://developers.google.com/terms/api-services-user-data-policy" className="font-semibold text-gold hover:underline">Política de Dados do Usuário dos Serviços de API do Google</a>, incluindo os requisitos de Uso Limitado. O portal é independente e não é afiliado, patrocinado nem endossado pelo YouTube ou pelo Google.</p>
        <p>O portal usa esses serviços de duas formas: (1) dados públicos do canal e do chat ao vivo, sem login, descritos na próxima seção; e (2) o vínculo opcional da sua conta do YouTube para enviar mensagens ao chat, descrito na seção Vínculo com YouTube.</p>
      </div>
    ),
  },
  {
    title: 'Dados públicos do YouTube no site',
    content: (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">O que obtemos</h3>
        <p>Por meio da API, o portal consulta dados públicos do canal GalindoGamerBR (título, descrição, número de inscritos e de vídeos, se há transmissão ao vivo, título e miniatura da transmissão e o vídeo da última live) e as mensagens públicas do chat ao vivo do canal: nome de exibição e foto de perfil de quem escreveu, o texto da mensagem, o valor de Super Chat quando houver e se a pessoa é dona do canal, moderadora, membro ou verificada.</p>
        <h3 className="text-lg font-semibold text-white">Como utilizamos, armazenamos e compartilhamos</h3>
        <p>Essas informações são exibidas no multichat e nas páginas do portal, junto com as mensagens das outras plataformas. As mensagens do chat ficam apenas na memória do servidor (as últimas 200) e no navegador de quem está com o chat aberto; <strong className="text-white">não são gravadas em banco de dados</strong> e desaparecem quando o serviço é reiniciado. Os dados do canal ficam em cache por até uma hora. Nenhum dado obtido dessa forma é mantido por mais de 30 dias, vendido, usado para publicidade ou compartilhado com terceiros, exceto o necessário para exibi-lo a quem acessa o portal.</p>
        <h3 className="text-lg font-semibold text-white">Mensagens de outras pessoas</h3>
        <p>Se você escreveu no chat do YouTube e quer que uma mensagem sua deixe de aparecer no portal, escreva para {EMAIL_LINK}. A mensagem original continua no YouTube, que a controla.</p>
      </div>
    ),
  },
  {
    title: 'Vínculo com YouTube',
    content: (
      <div className="space-y-4">
        <p>Esta seção se aplica ao vínculo opcional da sua conta do YouTube (Google) ao <strong className="text-white">Portal GalindoGamerBR</strong>, usado somente para que você envie mensagens no chat das transmissões ao vivo do canal pelo multichat do portal. Dúvidas e solicitações podem ser enviadas para {EMAIL_LINK}.</p>
        <h3 className="text-lg font-semibold text-white">Autorização e dados que acessamos</h3>
        <p>Ao vincular, você é direcionado ao Google para autorizar o aplicativo e vê a tela de consentimento do Google. A permissão solicitada é <code>https://www.googleapis.com/auth/youtube.force-ssl</code>. Com ela, o portal acessa apenas: o identificador e o nome do seu canal do YouTube (para saber a qual canal sua conta corresponde) e a função de publicar no chat da transmissão ao vivo, em seu nome, a mensagem que você digitou. Também recebemos e guardamos os tokens de acesso e de renovação da autorização. O portal não lê nem altera seus vídeos, inscrições, playlists, comentários, e-mail ou histórico, e não publica nada que você não tenha digitado.</p>
        <h3 className="text-lg font-semibold text-white">Como utilizamos os dados</h3>
        <p>O token é usado apenas para enviar ao chat da transmissão ao vivo do canal as mensagens que você escreve no multichat e para identificar o seu canal. Os dados recebidos por essa autorização não são vendidos, usados para publicidade, combinados com outros dados para criar perfis, transferidos a terceiros nem usados para outra finalidade, salvo exigência legal.</p>
        <h3 className="text-lg font-semibold text-white">Armazenamento, retenção e segurança</h3>
        <p>Os tokens são armazenados criptografados no servidor, com acesso restrito e sem exibição em registros. O identificador e o nome do canal ficam associados ao seu cadastro para exibir o vínculo na área do membro. Esses dados são mantidos apenas enquanto o vínculo existir: são apagados quando você desvincula o YouTube ou exclui a conta.</p>
        <h3 className="text-lg font-semibold text-white">Revogar o acesso e excluir seus dados</h3>
        <p>Você pode desvincular o YouTube a qualquer momento em <a href="/membro" className="font-semibold text-gold hover:underline">Minha conta</a>. A desvinculação revoga a autorização no Google e remove imediatamente os tokens e o perfil do canal armazenados; se a revogação não puder ser confirmada, o vínculo é mantido e o portal informa o erro para você tentar novamente. Excluir sua conta do portal também revoga a autorização e apaga esses dados.</p>
        <p>Você pode remover o acesso do portal diretamente nas <a href="https://security.google.com/settings/security/permissions" className="font-semibold text-gold hover:underline">configurações de segurança do Google</a> (também em <a href="https://myaccount.google.com/permissions" className="font-semibold text-gold hover:underline">myaccount.google.com/permissions</a>). Se você revogar por lá, o token guardado deixa de funcionar; para apagar os dados que ainda estejam armazenados, desvincule em Minha conta ou envie o pedido para {EMAIL_LINK}, e eles serão apagados em até 7 dias. Seu canal e seus conteúdos no YouTube não são apagados.</p>
      </div>
    ),
  },
  {
    title: 'Contas, e-mails e mesclagem',
    content: (
      <div className="space-y-4">
        <p>Sua conta no portal pode ter mais de um login (Twitch, Google ou TikTok) e mais de um e-mail. Em Logins e e-mails, na área do membro, você pode adicionar e remover e-mails secundários, mediante código enviado ao endereço, e entrar por qualquer um deles. Também pode remover um login principal quando houver mais de um; a autorização dele é revogada na plataforma e o vínculo de chat correspondente é apagado.</p>
        <p>Você pode mesclar outra conta sua a esta. Para isso confirmamos que você controla as duas, por código enviado ao e-mail de cada uma ou entrando na outra conta. A conta absorvida é excluída, seus vínculos e logins passam para a conta principal e o e-mail dela passa a ser secundário. A mesclagem não pode ser desfeita. Os códigos são de uso único, expiram em minutos e são enviados pela Resend.</p>
      </div>
    ),
  },
  {
    title: 'Dados tratados',
    content: (
      <div className="space-y-4">
        <p>A navegação pública não exige cadastro. Conforme a forma de uso do portal, podem ser tratados:</p>
        <ul className="space-y-3">
          <li><strong className="text-white">Dados técnicos e de segurança:</strong> endereço IP, data e hora, rota acessada, informações básicas do navegador e eventos usados para proteção contra abuso, estabilidade e diagnóstico.</li>
          <li><strong className="text-white">Métricas agregadas:</strong> visualizações de páginas, origem aproximada e características gerais de acesso por meio do Cloudflare Web Analytics.</li>
          <li><strong className="text-white">Contato comercial:</strong> empresa ou marca, nome, email, telefone opcional, tipo de parceria e mensagem enviados voluntariamente no formulário de Parceiros. Esses dados são encaminhados por email e não são gravados no banco de dados do portal.</li>
          <li><strong className="text-white">Administração:</strong> email autorizado, tentativas de autenticação, sessão e registros técnicos necessários para proteger o acesso restrito.</li>
        </ul>
        <p>As métricas públicas exibidas na página Comunidade são totais agregados obtidos de fontes públicas ou APIs oficiais. Essa consulta de métricas não fornece ao portal a lista de seguidores nem os dados pessoais de cada integrante dessas redes. Os dados autorizados no login com TikTok são tratados conforme a seção específica acima.</p>
      </div>
    ),
  },
  {
    title: 'Finalidades e bases legais',
    content: (
      <div className="space-y-3">
        <p>Os dados são tratados para operar e proteger o portal, responder propostas enviadas pelo usuário, criar e autenticar contas de membros, apresentar seus perfis, gerenciar vínculos e exclusões de conta, autenticar a equipe administrativa, produzir estatísticas agregadas e cumprir obrigações legais.</p>
        <p>Conforme o caso, o tratamento se apoia na execução de procedimentos solicitados pelo titular, no legítimo interesse de manter um portal seguro e funcional e no cumprimento de obrigação legal ou regulatória. Quando o consentimento for necessário, ele será solicitado de forma específica.</p>
        <p>O GalindoGamerBR não vende dados pessoais nem utiliza as informações recebidas pelo formulário para criar listas de publicidade.</p>
      </div>
    ),
  },
  {
    title: 'Cookies e armazenamento no navegador',
    content: (
      <div className="space-y-3">
        <p>O acesso público não utiliza cookies de publicidade ou rastreamento comportamental. O Cloudflare Web Analytics é usado em formato voltado à privacidade e seu marcador não lê cookies nem outros armazenamentos do navegador.</p>
        <p>O portal utiliza armazenamento local para guardar temporariamente dados públicos já consultados, como vídeos, status da Fazenda e números da comunidade. Também pode usar armazenamento de sessão para recuperação técnica após uma atualização do site. Esses registros de cache de conteúdo público não criam um perfil pessoal. O armazenamento de sessão dos membros é descrito na seção Login com TikTok.</p>
        <p>No acesso administrativo, um cookie técnico, seguro e inacessível a scripts é criado após o login. A sessão expira em até sete dias ou pode ser encerrada antes pelo usuário.</p>
      </div>
    ),
  },
  {
    title: 'Serviços externos e compartilhamento',
    content: (
      <div className="space-y-3">
        <p>Dados são compartilhados apenas quando necessário para a operação. A Cloudflare fornece hospedagem, banco de dados, proteção e métricas; a Resend realiza o envio dos emails administrativos e das propostas comerciais. O conteúdo do formulário segue diretamente para a caixa de email responsável pelo contato.</p>
        <p>Ao escolher reproduzir um vídeo ou a transmissão, o player incorporado do YouTube (em modo de privacidade aprimorada, youtube-nocookie.com) é carregado e o YouTube poderá tratar dados conforme os Termos de Serviço do YouTube e a Política de Privacidade do Google. A Supabase fornece a autenticação e o banco de dados das contas, e a Resend envia os códigos de acesso por e-mail. Links para YouTube, Twitch, Discord, TikTok, Kick, Instagram, WhatsApp e outros serviços levam a ambientes controlados por essas empresas.</p>
        <p>Alguns fornecedores podem processar informações fora do Brasil. Nesses casos, o tratamento fica sujeito às salvaguardas contratuais e às regras de proteção de dados aplicáveis ao serviço.</p>
      </div>
    ),
  },
  {
    title: 'Conservação e segurança',
    content: (
      <div className="space-y-3">
        <p>O portal não mantém um banco de propostas comerciais. As mensagens permanecem na caixa de email do destinatário e podem constar nos registros operacionais do serviço de envio pelo período necessário à entrega, ao relacionamento comercial, ao atendimento de obrigações legais e ao exercício de direitos.</p>
        <p>Para prevenir abuso, o banco do portal registra eventos técnicos associados ao endereço IP usado no envio. Esses registros não incluem o conteúdo da proposta, são utilizados apenas para limitar tentativas excessivas e são eliminados automaticamente em até 24 horas.</p>
        <p>Registros de autenticação e segurança possuem acesso restrito. São adotadas medidas técnicas compatíveis com o serviço, incluindo conexão criptografada, cookies seguros, autenticação por código temporário e limitação de tentativas. Nenhum ambiente conectado à internet, porém, pode oferecer segurança absoluta.</p>
      </div>
    ),
  },
  {
    title: 'Direitos do titular',
    content: (
      <div className="space-y-3">
        <p>Nos termos da LGPD, você pode solicitar confirmação e acesso aos dados, correção, anonimização, bloqueio ou eliminação de dados inadequados, portabilidade quando aplicável, informação sobre compartilhamentos, revisão de decisões automatizadas e revogação do consentimento.</p>
        <p>Também é possível se opor a tratamentos realizados em desconformidade com a lei ou pedir a eliminação de dados tratados com consentimento, observadas as hipóteses legais de conservação. A identidade do solicitante poderá ser confirmada antes do atendimento para proteger os próprios dados.</p>
        <p>Envie sua solicitação para {EMAIL_LINK}. Você também pode apresentar uma petição à Autoridade Nacional de Proteção de Dados.</p>
      </div>
    ),
  },
  {
    title: 'Alterações desta política',
    content: (
      <p>
        Esta política poderá ser atualizada para acompanhar mudanças no portal, nos fornecedores ou na legislação. A versão vigente sempre ficará disponível nesta página, acompanhada da data de atualização.
      </p>
    ),
  },
]

export function Privacidade() {
  return (
    <LegalDocument
      eyebrow="Privacidade e transparência"
      title="POLÍTICA DE PRIVACIDADE"
      introduction="Saiba como o Portal GalindoGamerBR utiliza e protege seus dados pessoais e como você pode exercer seus direitos."
      updatedAt="19 de outubro de 2026"
      sections={SECTIONS}
    />
  )
}
