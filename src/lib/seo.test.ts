import { describe, expect, it } from 'vitest'
import { ROUTE_SEO } from './seo'
// @ts-expect-error módulo .mjs do build, sem tipos
import { ROUTES } from '../../scripts/seo-prerender.mjs'

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
})
