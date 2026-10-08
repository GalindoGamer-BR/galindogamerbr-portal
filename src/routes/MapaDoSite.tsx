import { Link } from 'react-router-dom'
import { Container } from '../components/ui/Container'
import { Eyebrow } from '../components/ui/Eyebrow'
import { Reveal } from '../components/ui/Reveal'

type MapPage = {
  label: string
  to: string
  description: string
  direct?: boolean
  external?: boolean
}

type MapBranch = {
  number: string
  title: string
  description: string
  color: 'gold' | 'green' | 'blue' | 'purple'
  pages: MapPage[]
}

const BRANCHES: MapBranch[] = [
  {
    number: '01',
    title: 'COMECE POR AQUI',
    description: 'As primeiras paradas para conhecer o canal.',
    color: 'gold',
    pages: [
      { label: 'Boas vindas', to: '/boasvindas', description: 'A mensagem do Galindo para quem está chegando.' },
      { label: 'Sobre', to: '/sobre', description: 'A história e o propósito por trás do canal.' },
    ],
  },
  {
    number: '02',
    title: 'CONTEÚDOS E FAZENDA',
    description: 'Séries, jogos e ferramentas para acompanhar cada jornada.',
    color: 'green',
    pages: [
      { label: 'Conteúdos', to: '/conteudos', description: 'Vídeos, séries, dicas e jogos do canal.' },
      { label: 'Participe da Fazenda', to: '/fazenda', description: 'Regras e acesso à Fazenda Nova Aliança.' },
      { label: 'Mods da Fazenda', to: '/mods', description: 'Lista e sincronização dos mods do servidor.', direct: true },
    ],
  },
  {
    number: '03',
    title: 'COMUNIDADE',
    description: 'Os espaços onde a conversa continua depois da live.',
    color: 'blue',
    pages: [
      { label: 'Comunidade', to: '/comunidade', description: 'Números, redes e formas de participar.' },
      { label: 'Discord oficial', to: '/discord', description: 'Atalho para o servidor oficial da comunidade.', direct: true, external: true },
      { label: 'Parceiros', to: '/parceiros', description: 'Possibilidades para marcas e projetos.' },
    ],
  },
  {
    number: '04',
    title: 'INSTITUCIONAL',
    description: 'Informações sobre o portal, seus responsáveis e suas regras.',
    color: 'purple',
    pages: [
      { label: 'Privacidade', to: '/privacidade', description: 'Tratamento de dados e direitos dos visitantes.' },
      { label: 'Termos de uso', to: '/termos', description: 'Condições para utilizar o portal.' },
      { label: 'Créditos', to: '/creditos', description: 'Desenvolvimento e recursos utilizados.' },
      { label: 'Administração', to: '/admin', description: 'Área restrita à equipe do canal.', direct: true },
    ],
  },
]

const BRANCH_COLORS = {
  gold: { border: 'border-gold/55', hover: 'hover:border-gold/70', text: 'text-gold', bg: 'bg-gold/10', line: 'bg-gold/45' },
  green: { border: 'border-green/55', hover: 'hover:border-green/70', text: 'text-green', bg: 'bg-green/10', line: 'bg-green/45' },
  blue: { border: 'border-blue/55', hover: 'hover:border-blue/70', text: 'text-blue', bg: 'bg-blue/10', line: 'bg-blue/45' },
  purple: { border: 'border-purple/55', hover: 'hover:border-purple/70', text: 'text-purple', bg: 'bg-purple/10', line: 'bg-purple/45' },
} as const

function PageNode({ page, color }: { page: MapPage; color: MapBranch['color'] }) {
  const colors = BRANCH_COLORS[color]
  const content = (
    <>
      <span className={`absolute left-0 top-1/2 h-px w-5 -translate-x-full ${colors.line}`} />
      <span className={`absolute left-0 top-1/2 h-2.5 w-2.5 -translate-x-[calc(50%+1.25rem)] -translate-y-1/2 rounded-full border ${colors.border} bg-bg`} />
      <span className="flex flex-wrap items-center gap-2">
        <strong className="text-sm text-white transition group-hover:text-gold">{page.label}</strong>
        {page.direct && <span className={`rounded-full border px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-widest ${colors.border} ${colors.bg} ${colors.text}`}>Acesso direto</span>}
      </span>
      <span className="mt-1 block text-xs leading-relaxed text-muted">{page.description}</span>
    </>
  )

  const className = `group relative block rounded-lg border border-line bg-panel2 p-4 transition duration-300 hover:-translate-y-0.5 ${colors.hover}`

  return page.external ? (
    <a href={page.to} className={className}>{content}</a>
  ) : (
    <Link to={page.to} className={className}>{content}</Link>
  )
}

function Branch({ branch }: { branch: MapBranch }) {
  const colors = BRANCH_COLORS[branch.color]

  return (
    <article className={`relative rounded-xl border bg-gradient-to-br from-panel to-panel2 p-5 sm:p-6 ${colors.border}`}>
      <div className={`absolute -top-8 left-1/2 hidden h-8 w-px -translate-x-1/2 lg:block ${colors.line}`} />
      <div className="flex items-start gap-4">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${colors.border} ${colors.bg} ${colors.text}`}>{branch.number}</span>
        <div>
          <h2 className="text-xl">{branch.title}</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted">{branch.description}</p>
        </div>
      </div>
      <div className={`relative ml-5 mt-6 space-y-3 border-l pl-5 ${colors.border}`}>
        {branch.pages.map((page) => <PageNode key={page.to} page={page} color={branch.color} />)}
      </div>
    </article>
  )
}

export function MapaDoSite() {
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-line py-16 sm:py-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_25%,rgba(217,177,79,0.14),transparent_32%),radial-gradient(circle_at_78%_55%,rgba(56,163,90,0.08),transparent_28%)]" />
        <Container>
          <div className="max-w-3xl">
            <Eyebrow>Rotas do portal</Eyebrow>
            <h1 className="mt-2 text-4xl leading-none sm:text-6xl">UM MAPA PARA TODO O UNIVERSO GALINDOGAMERBR</h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">Parta do início e siga as ramificações para encontrar conteúdos, comunidade, ferramentas e informações institucionais.</p>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Reveal>
          <Container>
            <div className="mx-auto max-w-sm text-center">
              <Link to="/" className="group relative block rounded-xl border-2 border-gold bg-gradient-to-br from-gold/15 to-panel p-6 shadow-[0_18px_55px_-32px_rgba(217,177,79,0.8)] transition hover:-translate-y-1">
                <Eyebrow>Ponto de partida</Eyebrow>
                <span className="mt-2 block text-3xl font-bold text-white transition group-hover:text-gold">INÍCIO</span>
                <span className="mt-2 block text-sm text-muted">Home, lives e destaques do canal</span>
              </Link>
              <div className="mx-auto h-10 w-px bg-gold/55" />
              <div className="mx-auto h-px w-[75%] bg-gradient-to-r from-transparent via-gold/55 to-transparent lg:w-[calc(300%+4.5rem)] lg:max-w-none lg:-translate-x-1/3" />
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-4">
              {BRANCHES.map((branch) => <Branch key={branch.number} branch={branch} />)}
            </div>

            <div className="mt-10 rounded-xl border border-line bg-panel/55 p-5 text-center">
              <p className="text-sm text-muted"><strong className="text-gold">Acesso direto</strong> identifica páginas e atalhos que não aparecem na navegação principal.</p>
            </div>
          </Container>
        </Reveal>
      </section>
    </>
  )
}
