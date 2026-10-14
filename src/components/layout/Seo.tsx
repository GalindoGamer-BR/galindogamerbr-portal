import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { normalizeSeoPath, ROUTE_SEO, SITE_NAME, SITE_URL } from '../../lib/seo'

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
    const canonicalPath = normalizeSeoPath(pathname)
    const isAdmin = canonicalPath === '/admin' || canonicalPath.startsWith('/admin/')
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
