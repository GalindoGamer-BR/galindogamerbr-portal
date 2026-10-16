// Substitui o functions/_middleware.ts (HTMLRewriter): gera, no build, uma página HTML por rota
// com title/canonical/description/robots/og/twitter. Cloudflare Pages passa a servir apenas arquivos estáticos.
//   dist/index.html            -> home
//   dist/<rota>/index.html     -> rotas conhecidas e aliases (canonical aponta para a rota principal)
//   dist/spa.html              -> fallback do SPA (rotas desconhecidas e /admin*): noindex, "não encontrada"
// public/_redirects aponta o fallback para /spa.html.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SITE_NAME = 'GalindoGamerBR'
const SITE_URL = 'https://galindogamerbr.com.br'
const DEFAULT_DESCRIPTION =
  'Lives, séries, simuladores, games e a comunidade do GalindoGamerBR. Acompanhe os conteúdos e participe da Fazenda Nova Aliança.'

export const ROUTES = {
  '/': { description: DEFAULT_DESCRIPTION },
  '/boasvindas': { title: 'Boas vindas', description: 'Conheça o GalindoGamerBR e descubra como participar dos conteúdos, da fazenda e da comunidade.' },
  '/conteudos': { title: 'Conteúdos', description: 'Assista às séries, lives e vídeos de simuladores e games do canal GalindoGamerBR.' },
  '/jogar': { title: 'Jogue com o Galindo', description: 'Jogue com o Galindo: entre na Fazenda Nova Aliança (Farming Simulator 25) e em outros jogos da comunidade, com mods, regras e VIP em um só lugar.' ,
    // Conteúdo estático que os robôs leem antes (ou sem) o JavaScript; o React o substitui ao montar (createRoot).
    fallback: {
      h1: 'Venha jogar com a gente',
      text: 'A Fazenda Nova Aliança, no Farming Simulator 25, e outros jogos em comunidade. Tudo começa no Discord.',
      items: ['Como entrar: 18 anos ou mais, regras em vídeo, VIP e mods', 'Fazenda Nova Aliança: o servidor, a série e os mods da fazenda', 'VIP: como virar VIP e pedir a liberação', 'Outros jogos: WARDOGS, Hell Let Loose, Construction Simulator, ETS2 e SnowRunner'],
      links: [{ href: '/discord', label: 'Entrar no Discord' }, { href: '/mods', label: 'Baixar o Mod Sync' }, { href: '/comunidade', label: 'Conhecer a comunidade' }],
    },
  },
  '/mods': { title: 'Mods da Fazenda', description: 'Baixe e sincronize os mods oficiais usados no servidor da Fazenda Nova Aliança no Farming Simulator 25.' },
  '/comunidade': { title: 'Comunidade', description: 'Entre nos canais oficiais e faça parte da comunidade GalindoGamerBR.' },
  '/sobre': { title: 'Sobre', description: 'Conheça Galindo, a história do canal GalindoGamerBR e a paixão por simuladores, games e comunidade.' },
  '/parceiros': { title: 'Parceiros', description: 'Conheça os parceiros do GalindoGamerBR e as possibilidades de parceria com o canal.' },
  '/privacidade': { title: 'Política de Privacidade', description: 'Entenda como o portal GalindoGamerBR trata dados, utiliza cookies técnicos, compartilha informações e atende aos direitos da LGPD.' },
  '/termos': { title: 'Termos de Uso', description: 'Consulte as regras para utilizar o portal, seus conteúdos, formulários e espaços ligados à comunidade GalindoGamerBR.' },
  '/creditos': { title: 'Créditos', description: 'Conheça os créditos do portal GalindoGamerBR, desenvolvido por Pedro Henrique, e as atribuições dos recursos visuais utilizados.' },
  '/mapa-do-site': { title: 'Mapa do Site', description: 'Encontre todas as páginas e seções do site oficial GalindoGamerBR.' },
  // Páginas de uso (exigem login) ou sem conteúdo próprio para busca: título correto, mas noindex.
  '/live': { title: 'Multichat ao vivo', description: 'Chat unificado do YouTube, Twitch e Kick para acompanhar e conversar durante as lives do GalindoGamerBR.', noIndex: true },
  '/login': { title: 'Entrar', description: 'Entre no portal GalindoGamerBR para usar o multichat e a área do membro.', noIndex: true },
  '/membro': { title: 'Área do membro', description: 'Gerencie seu perfil e as plataformas conectadas ao portal GalindoGamerBR.', noIndex: true },
  '/conta': { title: 'Minha conta', description: 'Dados e privacidade da sua conta no portal GalindoGamerBR.', noIndex: true },
}
export const ALIASES = { '/boas-vindas': '/boasvindas', '/comece-aqui': '/boasvindas', '/jogos': '/conteudos', '/fazenda': '/jogar' }
const NOT_FOUND = { title: 'Página não encontrada', description: 'A página que você procura não foi encontrada.' }

const escape = (value) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

// Replaces one attribute of the first tag matching `pattern`; throws if the template lost the tag.
function setAttr(html, pattern, attr, value) {
  const tag = html.match(pattern)
  if (!tag) throw new Error(`seo-prerender: tag not found in index.html: ${pattern}`)
  const updated = tag[0].replace(new RegExp(`${attr}="[^"]*"`), () => `${attr}="${escape(value)}"`)
  return html.replace(tag[0], () => updated)
}

export function render(template, canonicalPath, data, robots) {
  const title = data.title ? `${data.title} | ${SITE_NAME}` : SITE_NAME
  const canonical = `${SITE_URL}${canonicalPath}`
  let html = template.replace(/<title>[^<]*<\/title>/, () => `<title>${escape(title)}</title>`)
  html = setAttr(html, /<link rel="canonical"[^>]*>/, 'href', canonical)
  html = setAttr(html, /<meta name="description"[^>]*>/, 'content', data.description)
  html = setAttr(html, /<meta name="robots"[^>]*>/, 'content', robots)
  html = setAttr(html, /<meta property="og:title"[^>]*>/, 'content', title)
  html = setAttr(html, /<meta property="og:description"[^>]*>/, 'content', data.description)
  html = setAttr(html, /<meta property="og:url"[^>]*>/, 'content', canonical)
  html = setAttr(html, /<meta name="twitter:title"[^>]*>/, 'content', title)
  html = setAttr(html, /<meta name="twitter:description"[^>]*>/, 'content', data.description)
  if (robots === INDEX && canonicalPath !== '/') html = html.replace('</head>', () => `${pageJsonLd(canonical, title, data)}
  </head>`)
  if (data.fallback) html = html.replace('<div id="root"></div>', () => `<div id="root">${fallbackHtml(data.fallback)}</div>`)
  return html
}

// Dados estruturados da página (WebPage + trilha de navegação) — o Organization do index.html já vale para o site todo.
function pageJsonLd(canonical, title, data) {
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: title,
        description: data.description,
        inLanguage: 'pt-BR',
        isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: `${SITE_URL}/` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Início', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: data.title ?? SITE_NAME, item: canonical },
        ],
      },
    ],
  }
  // `<` escapado para o JSON nunca fechar a tag <script>.
  return `<script type="application/ld+json">${JSON.stringify(graph).replace(/</g, '\\u003c')}</script>`
}

function fallbackHtml({ h1, text, items, links }) {
  const li = items.map((item) => `<li>${escape(item)}</li>`).join('')
  const nav = links.map((link) => `<a href="${escape(link.href)}">${escape(link.label)}</a>`).join(' ')
  return `<main><h1>${escape(h1)}</h1><p>${escape(text)}</p><ul>${li}</ul><nav>${nav}</nav></main>`
}

const INDEX = 'index, follow, max-image-preview:large'
const NOINDEX = 'noindex, nofollow'

export async function prerender(dist = 'dist') {
  const template = await readFile(join(dist, 'index.html'), 'utf8')
  const pages = []
  for (const [path, data] of Object.entries(ROUTES)) pages.push([path, path, data, data.noIndex ? NOINDEX : INDEX])
  for (const [alias, target] of Object.entries(ALIASES)) pages.push([alias, target, ROUTES[target], ROUTES[target].noIndex ? NOINDEX : INDEX])
  for (const [path, canonicalPath, data, robots] of pages) {
    const html = render(template, canonicalPath, data, robots)
    const file = path === '/' ? join(dist, 'index.html') : join(dist, path.slice(1), 'index.html')
    if (path !== '/') await mkdir(join(dist, path.slice(1)), { recursive: true })
    await writeFile(file, html)
  }
  // SPA fallback: unknown routes and /admin* keep the old "not found + noindex" tags.
  await writeFile(join(dist, 'spa.html'), render(template, '/', NOT_FOUND, NOINDEX))
  return pages.length
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const count = await prerender(process.argv[2] ?? 'dist')
  console.log(`seo-prerender: ${count} pages + spa.html`)
}
