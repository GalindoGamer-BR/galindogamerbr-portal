export const SITE_NAME = 'GalindoGamerBR'
export const SITE_URL = 'https://galindogamerbr.com.br'

export type SeoData = {
  title?: string
  description: string
  noIndex?: boolean
}

export const DEFAULT_DESCRIPTION =
  'Lives, séries, simuladores, games e a comunidade do GalindoGamerBR. Acompanhe os conteúdos e participe da Fazenda Nova Aliança.'

export const ROUTE_SEO: Record<string, SeoData> = {
  '/': { description: DEFAULT_DESCRIPTION },
  '/boasvindas': {
    title: 'Boas vindas',
    description: 'Conheça o GalindoGamerBR e descubra como participar dos conteúdos, da fazenda e da comunidade.',
  },
  '/conteudos': {
    title: 'Conteúdos',
    description: 'Assista às séries, lives e vídeos de simuladores e games do canal GalindoGamerBR.',
  },
  '/fazenda': {
    title: 'Fazenda Nova Aliança',
    description: 'Conheça a Fazenda Nova Aliança no Farming Simulator 25 e saiba como participar do servidor e da comunidade.',
  },
  '/mods': {
    title: 'Mods da Fazenda',
    description: 'Baixe e sincronize os mods oficiais usados no servidor da Fazenda Nova Aliança no Farming Simulator 25.',
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
  '/mapa-do-site': {
    title: 'Mapa do Site',
    description: 'Encontre todas as páginas e seções do site oficial GalindoGamerBR.',
  },
}

export const CANONICAL_ALIASES: Record<string, string> = {
  '/boas-vindas': '/boasvindas',
  '/comece-aqui': '/boasvindas',
  '/jogos': '/conteudos',
}

export function normalizeSeoPath(pathname: string): string {
  const normalizedPath = pathname !== '/' ? pathname.replace(/\/$/, '') : pathname
  return CANONICAL_ALIASES[normalizedPath] ?? normalizedPath
}
