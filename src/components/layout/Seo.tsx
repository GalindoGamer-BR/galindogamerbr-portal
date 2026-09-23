import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const SITE_NAME = 'GalindoGamerBR'
const SITE_URL = 'https://galindogamerbr.com.br'
const DEFAULT_DESCRIPTION =
  'Lives, séries, simuladores, games e a comunidade do GalindoGamerBR. Acompanhe os conteúdos e participe da Fazenda Nova Aliança.'

type SeoData = {
  title?: string
  description: string
  noIndex?: boolean
}

const ROUTE_SEO: Record<string, SeoData> = {
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
  '/multichat': {
    title: 'Multichat',
    description: 'Acompanhe os chats de Twitch, YouTube, Kick e TikTok em uma única conversa.',
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

const CANONICAL_ALIASES: Record<string, string> = {
  '/boas-vindas': '/boasvindas',
  '/comece-aqui': '/boasvindas',
  '/jogos': '/conteudos',
}

function setMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector)
  if (!element) {
    element = document.createElement('meta')
    document.head.appendChild(element)
  }
  Object.entries(attributes).forEach(([name, value]) => element!.setAttribute(name, value))
}

function setCanonical(href: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!element) {
    element = document.createElement('link')
    element.rel = 'canonical'
    document.head.appendChild(element)
  }
  element.href = href
}

export function Seo() {
  const { pathname } = useLocation()

  useEffect(() => {
    const normalizedPath = pathname !== '/' ? pathname.replace(/\/$/, '') : pathname
    const canonicalPath = CANONICAL_ALIASES[normalizedPath] ?? normalizedPath
    const isAdmin = normalizedPath === '/admin' || normalizedPath.startsWith('/admin/')
    const data = ROUTE_SEO[canonicalPath] ?? {
      title: 'Página não encontrada',
      description: 'A página que você procura não foi encontrada.',
      noIndex: true,
    }
    const noIndex = isAdmin || data.noIndex
    const pageTitle = data.title ? `${data.title} | ${SITE_NAME}` : SITE_NAME
    const canonicalUrl = `${SITE_URL}${canonicalPath === '/' ? '' : canonicalPath}`

    document.title = pageTitle
    setCanonical(canonicalUrl)
    setMeta('meta[name="description"]', { name: 'description', content: data.description })
    setMeta('meta[name="robots"]', {
      name: 'robots',
      content: noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large',
    })
    setMeta('meta[property="og:title"]', { property: 'og:title', content: pageTitle })
    setMeta('meta[property="og:description"]', { property: 'og:description', content: data.description })
    setMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl })
    setMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: pageTitle })
    setMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: data.description })
  }, [pathname])

  return null
}
