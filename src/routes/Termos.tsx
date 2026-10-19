import { LegalDocument, type LegalSection } from '../components/shared/LegalDocument'

const SECTIONS: LegalSection[] = [
  {
    title: 'Aceitação e finalidade',
    content: (
      <div className="space-y-3">
        <p>Estes Termos de Uso regulam o acesso ao portal galindogamerbr.com.br, página institucional do canal GalindoGamerBR. Ao navegar, criar uma conta ou utilizar seus recursos, você declara estar de acordo com estas condições e com a Política de Privacidade.</p>
        <p>O portal reúne informações sobre o canal, programação, vídeos, comunidade, Fazenda Nova Aliança, parceiros e caminhos para serviços mantidos em outras plataformas.</p>
      </div>
    ),
  },
  {
    title: 'Conteúdo e propriedade intelectual',
    content: (
      <div className="space-y-3">
        <p>A marca GalindoGamerBR, os textos, a identidade visual, as imagens próprias e a organização do portal são protegidos pela legislação aplicável. Recursos de terceiros permanecem sujeitos aos direitos de seus respectivos titulares e são identificados na página de Créditos quando necessário.</p>
        <p>Você pode compartilhar links públicos do portal e dos conteúdos do canal. Não é permitido copiar, vender, modificar ou explorar comercialmente materiais protegidos sem autorização, nem utilizar a marca de forma que sugira parceria ou aprovação inexistente.</p>
      </div>
    ),
  },
  {
    title: 'Uso adequado do portal',
    content: (
      <div className="space-y-3">
        <p>O portal deve ser utilizado de maneira lícita e respeitosa. É proibido tentar obter acesso não autorizado, contornar controles de segurança, interferir na disponibilidade do serviço, enviar conteúdo malicioso ou utilizar formulários para fraude, assédio, spam ou finalidade incompatível.</p>
        <p>Medidas de proteção e limitação de acesso poderão ser aplicadas quando houver indícios de abuso, risco à segurança ou violação destes termos.</p>
      </div>
    ),
  },
  {
    title: 'Formulários e informações enviadas',
    content: (
      <div className="space-y-3">
        <p>Ao enviar uma proposta pela página Parceiros, você declara que as informações são verdadeiras, que possui autorização para representar a empresa ou marca indicada e que pode ser contatado pelos dados fornecidos.</p>
        <p>O envio não cria contrato, promessa de resposta, exclusividade ou obrigação de aceitar a proposta. Uma parceria somente existirá após acordo expresso entre as partes.</p>
      </div>
    ),
  },
  {
    title: 'Comunidade e Fazenda',
    content: (
      <div className="space-y-3">
        <p>O acesso ao Discord, WhatsApp, servidores de jogos e demais espaços da comunidade pode depender de regras próprias, disponibilidade técnica, moderação e requisitos adicionais.</p>
        <p>A participação no servidor da Fazenda Nova Aliança é reservada a maiores de 18 anos que atendam aos requisitos informados, conheçam as regras e recebam a liberação da administração. A participação pode ser suspensa em caso de descumprimento das regras da comunidade.</p>
      </div>
    ),
  },
  {
    title: 'Conta, login e multichat',
    content: (
      <div className="space-y-3">
        <p>Algumas funções, como o multichat e a área do membro, exigem uma conta. Você pode entrar com Twitch, Google, TikTok ou e-mail e é responsável por manter o acesso seguro e pelas mensagens enviadas pela sua conta. Ao enviar uma mensagem pelo multichat, ela é publicada em seu nome nas plataformas que você conectou e fica sujeita às regras de cada uma delas.</p>
        <p>Mantenha o respeito no chat: não é permitido assédio, discurso de ódio, spam, divulgação de golpes, conteúdo ilegal ou o envio de mensagens em nome de outra pessoa. Contas poderão ser limitadas ou removidas em caso de abuso.</p>
        <p>Você pode vincular e desvincular plataformas, adicionar e remover e-mails secundários, mesclar outra conta sua a esta (a conta absorvida é excluída e a operação não pode ser desfeita) e excluir a sua conta a qualquer momento na área do membro. O tratamento dos dados nesses casos está descrito na <a href="/privacidade" className="font-semibold text-gold hover:underline">Política de Privacidade</a>.</p>
      </div>
    ),
  },
  {
    title: 'Serviços de API do YouTube',
    content: (
      <div className="space-y-3">
        <p>O portal usa os Serviços de API do YouTube para exibir dados públicos do canal e do chat ao vivo e, se você vincular sua conta, enviar mensagens ao chat do YouTube. <strong className="text-white">Ao usar essas funções, você concorda em ficar vinculado aos <a href="https://www.youtube.com/t/terms" className="font-semibold text-gold hover:underline">Termos de Serviço do YouTube</a></strong>, e o tratamento de dados pelo Google segue a <a href="https://policies.google.com/privacy" className="font-semibold text-gold hover:underline">Política de Privacidade do Google</a>.</p>
        <p>As mensagens enviadas ao chat do YouTube também seguem as Diretrizes da Comunidade do YouTube e podem ser removidas ou moderadas pelo YouTube ou pelo canal; o portal não controla esse processo. Você pode revogar o acesso do portal à sua conta a qualquer momento nas <a href="https://security.google.com/settings/security/permissions" className="font-semibold text-gold hover:underline">configurações de segurança do Google</a> ou desvinculando o YouTube na área do membro.</p>
        <p>O portal é independente: não é afiliado, patrocinado nem endossado pelo YouTube ou pelo Google. YouTube e Google são marcas da Google LLC.</p>
      </div>
    ),
  },
  {
    title: 'Serviços e conteúdos de terceiros',
    content: (
      <p>
        Vídeos, transmissões, redes sociais, convites, grupos, pagamentos e outros recursos podem ser fornecidos por YouTube, Twitch, Kick, TikTok, Instagram, Discord, WhatsApp e demais terceiros. Cada serviço possui termos, políticas, disponibilidade e práticas próprias. O GalindoGamerBR não controla esses ambientes e não responde por alterações, bloqueios ou indisponibilidades causadas por eles.
      </p>
    ),
  },
  {
    title: 'Informações dinâmicas e disponibilidade',
    content: (
      <div className="space-y-3">
        <p>Programações, status de live, vídeos, números da comunidade, disponibilidade do servidor, listas de mods e demais dados dinâmicos podem sofrer atrasos, mudanças ou interrupções. A programação divulgada é uma previsão e pode ser alterada por compromissos pessoais, trabalho, manutenção ou fatores externos.</p>
        <p>O portal é fornecido como está e poderá ser atualizado, suspenso ou descontinuado. Buscamos manter as informações corretas e o serviço disponível, mas não garantimos funcionamento contínuo nem ausência total de erros.</p>
      </div>
    ),
  },
  {
    title: 'Área administrativa',
    content: (
      <p>
        O painel disponível em <code className="rounded bg-bg px-1.5 py-0.5 text-white">/admin</code> é de uso exclusivo das pessoas autorizadas pela administração do canal. Não se trata de uma área de cadastro público. Credenciais, códigos de acesso e sessões não devem ser compartilhados.
      </p>
    ),
  },
  {
    title: 'Alterações, legislação e contato',
    content: (
      <div className="space-y-3">
        <p>Estes termos poderão ser atualizados para refletir mudanças no portal, na comunidade ou na legislação. A versão vigente será publicada nesta página com a respectiva data de atualização.</p>
        <p>Estes termos são regidos pela legislação brasileira. Dúvidas podem ser enviadas para <a href="mailto:contato@galindogamerbr.com.br" className="font-semibold text-gold hover:underline">contato@galindogamerbr.com.br</a>.</p>
      </div>
    ),
  },
]

export function Termos() {
  return (
    <LegalDocument
      eyebrow="Regras do portal"
      title="TERMOS DE USO"
      introduction="Conheça as condições para utilizar o portal, acessar conteúdos e interagir com os espaços ligados ao GalindoGamerBR."
      updatedAt="19 de outubro de 2026"
      sections={SECTIONS}
    />
  )
}
