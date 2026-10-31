export const SITE_NAME = 'GalindoGamerBR'
export const SITE_URL = 'https://galindogamerbr.com.br'

export type SeoData = {
  title?: string
  description: string
  noIndex?: boolean
}

const DEFAULT_DESCRIPTION =
  'Lives, séries, simuladores, games e a comunidade do GalindoGamerBR. Acompanhe os conteúdos e jogue junto com a comunidade.'

export const ROUTE_SEO: Record<string, SeoData> = {
  '/': { description: DEFAULT_DESCRIPTION },
  '/boasvindas': {
    title: 'Boas vindas',
    description: 'Conheça o GalindoGamerBR e descubra como participar dos conteúdos, dos jogos e da comunidade.',
  },
  '/conteudos': {
    title: 'Conteúdos',
    description: 'Assista às séries, lives e vídeos de simuladores e games do canal GalindoGamerBR.',
  },
  '/jogar': {
    title: 'Jogue com o Galindo',
    description: 'Jogue com o Galindo: servidores abertos para quem segue o canal e coop com VIP, com regras e requisitos em um só lugar.',
  },
  '/mods': {
    title: 'Mod Sync',
    description: 'Baixe e sincronize a coleção de mods da Fazenda Nova Aliança no Farming Simulator 25.',
  },
  '/comunidade': {
    title: 'Comunidade',
    description: 'Entre nos canais oficiais e faça parte da comunidade GalindoGamerBR.',
  },
  '/sobre': {
    title: 'Sobre',
    description: 'Conheça Galindo, a história do canal GalindoGamerBR e a paixão por simuladores, games e comunidade.',
  },
  '/parceiros': {
    title: 'Parceiros',
    description: 'Conheça os parceiros do GalindoGamerBR e as possibilidades de parceria com o canal.',
  },
  '/privacidade': {
    title: 'Política de Privacidade',
    description: 'Entenda como o portal GalindoGamerBR trata dados, utiliza cookies técnicos, compartilha informações e atende aos direitos da LGPD.',
  },
  '/termos': {
    title: 'Termos de Uso',
    description: 'Consulte as regras para utilizar o portal, seus conteúdos, formulários e espaços ligados à comunidade GalindoGamerBR.',
  },
  '/creditos': {
    title: 'Créditos',
    description: 'Conheça os créditos do portal GalindoGamerBR, desenvolvido por Pedro Henrique, e as atribuições dos recursos visuais utilizados.',
  },
  '/live': {
    title: 'Multichat ao vivo',
    description: 'Chat unificado do YouTube, Twitch e Kick para acompanhar e conversar durante as lives do GalindoGamerBR.',
    noIndex: true,
  },
  '/login': { title: 'Entrar', description: 'Entre no portal GalindoGamerBR para usar o multichat e a área do membro.', noIndex: true },
  '/membro': { title: 'Área do membro', description: 'Gerencie seu perfil e as plataformas conectadas ao portal GalindoGamerBR.', noIndex: true },
  '/conta': { title: 'Minha conta', description: 'Dados e privacidade da sua conta no portal GalindoGamerBR.', noIndex: true },
  '/mapa-do-site': {
    title: 'Mapa do Site',
    description: 'Encontre todas as páginas e seções do site oficial GalindoGamerBR.',
  },
}

const CANONICAL_ALIASES: Record<string, string> = {
  '/boas-vindas': '/boasvindas',
  '/comece-aqui': '/boasvindas',
  '/jogos': '/conteudos',
  '/fazenda': '/jogar',
}

export function normalizeSeoPath(pathname: string): string {
  const normalizedPath = pathname !== '/' ? pathname.replace(/\/$/, '') : pathname
  return CANONICAL_ALIASES[normalizedPath] ?? normalizedPath
}
