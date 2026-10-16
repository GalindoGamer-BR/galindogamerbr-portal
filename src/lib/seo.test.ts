import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { normalizeSeoPath, ROUTE_SEO } from './seo'
// @ts-expect-error módulo .mjs do build, sem tipos
import { ALIASES, render, ROUTES } from '../../scripts/seo-prerender.mjs'

// A tabela existe duas vezes (runtime em seo.ts, build em seo-prerender.mjs); este teste impede que divirjam.
describe('SEO', () => {
  it('prerender e runtime têm as mesmas rotas, títulos, descrições e noindex', () => {
    const normalize = (table: Record<string, { title?: string; description: string; noIndex?: boolean }>) =>
      Object.fromEntries(Object.entries(table).map(([path, d]) => [path, { title: d.title, description: d.description, noIndex: !!d.noIndex }]))
    expect(normalize(ROUTES)).toEqual(normalize(ROUTE_SEO))
  })

  it('a página /live tem título próprio e não é "não encontrada"', () => {
    expect(ROUTE_SEO['/live']?.title).toBe('Multichat ao vivo')
    expect(ROUTE_SEO['/live']?.noIndex).toBe(true)
  })

  it('os aliases do prerender e do runtime coincidem', () => {
    for (const [alias, target] of Object.entries(ALIASES as Record<string, string>)) expect(normalizeSeoPath(alias), alias).toBe(target)
  })

  it('/jogar tem a página e /fazenda virou alias dela (canonical em /jogar)', () => {
    expect(ROUTE_SEO['/jogar']?.title).toBe('Jogue com o Galindo')
    expect(ROUTE_SEO['/fazenda']).toBeUndefined()
    expect(normalizeSeoPath('/fazenda')).toBe('/jogar')
    expect(normalizeSeoPath('/fazenda/')).toBe('/jogar')
    expect(ALIASES['/fazenda']).toBe('/jogar')
  })

  it('/jogar sai do prerender com dados estruturados e conteúdo estático para os robôs', () => {
    const template = '<html><head><meta charset="UTF-8" /><link rel="canonical" href="x" /><meta name="description" content="x" /><meta name="robots" content="x" /><meta property="og:title" content="x" /><meta property="og:description" content="x" /><meta property="og:url" content="x" /><meta name="twitter:title" content="x" /><meta name="twitter:description" content="x" /><title>x</title></head><body><div id="root"></div></body></html>'
    const html = render(template, '/jogar', ROUTES['/jogar'], 'index, follow, max-image-preview:large')
    expect(html).toContain('"@type":"BreadcrumbList"')
    expect(html).toContain('"@id":"https://galindogamerbr.com.br/jogar#webpage"')
    expect(html).toContain('<div id="root"><main><h1>Venha jogar com a gente</h1>')
    expect(html).toContain('href="/discord"')
    // página noindex não ganha dados estruturados
    expect(render(template, '/login', { title: 'Entrar', description: 'x' }, 'noindex, nofollow')).not.toContain('ld+json')
  })

  it('/fazenda tem 301 de verdade no _redirects (antes do fallback do SPA)', () => {
    const redirects = readFileSync(new URL('../../public/_redirects', import.meta.url), 'utf8').split(/\r?\n/)
    expect(redirects).toContain('/fazenda /jogar 301')
    expect(redirects.indexOf('/fazenda /jogar 301')).toBeLessThan(redirects.indexOf('/* /index.html 200'))
  })
})
