import { afterEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'

// Renderiza /jogar no servidor para cada hash e confere qual aba abre. Pega erro de execução que o typecheck não vê e
// garante que os links antigos (#vip, #participar) continuam abrindo a aba certa.
async function render(hash: string): Promise<string> {
  ;(globalThis as { React?: unknown }).React = React
  vi.stubGlobal('window', {
    location: { search: '', hash, pathname: '/jogar', hostname: 'localhost', origin: 'http://localhost:5173' },
    addEventListener() {},
    removeEventListener() {},
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  })
  vi.stubGlobal('localStorage', { getItem: () => null, setItem() {} })
  vi.stubGlobal('document', { addEventListener() {}, removeEventListener() {}, getElementById: () => null })
  const { Jogar } = await import('./Jogar')
  return renderToString(React.createElement(MemoryRouter, null, React.createElement(Jogar)))
}

describe('página /jogar', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('abre em "Como entrar" por padrão e mostra um único botão cheio de Discord no topo', async () => {
    const html = await render('')
    expect(html).toContain('VENHA JOGAR COM A GENTE')
    expect(html).toContain('aria-selected="true"')
    expect(html).toContain('Entre no Discord')
    expect(html).toContain('Prepare os mods')
    expect(html).toContain('18 ANOS OU MAIS')
    expect(html).not.toContain('Uma fazenda feita em conjunto')
  })

  it('o alias antigo #participar abre "Como entrar"', async () => {
    expect(await render('#participar')).toContain('Entre no Discord')
  })

  it('#fazenda abre a aba da fazenda, com a história, os mods e os blocos da comunidade', async () => {
    const farm = await render('#fazenda')
    expect(farm).toContain('FAZENDA NOVA ALIANÇA')
    expect(farm).toContain('Instale o Mod Sync')
    expect(farm).toContain('Uma fazenda feita em conjunto')
    expect(farm).not.toContain('Prepare os mods')
    expect(await render('#fazenda-nova-alianca')).toContain('A resenha continua')
  })

  it('o VIP é uma seção própria, fora das abas: aparece em qualquer aba e #vip não troca a aba', async () => {
    for (const hash of ['', '#mods', '#fazenda', '#outros-jogos', '#vip']) {
      const html = await render(hash)
      expect(html, hash).toContain('id="vip"')
      expect(html, hash).toContain('Ouro')
    }
    expect(await render('#vip')).toContain('Prepare os mods')
    expect(await render('')).not.toContain('id="jogar-tab-vip"')
  })

  it('os mods moram na aba da fazenda: #mods abre a fazenda e não há aba Mods', async () => {
    const mods = await render('#mods')
    expect(mods).toContain('Instale o Mod Sync')
    expect(mods).toContain('FAZENDA NOVA ALIANÇA')
    expect(mods).not.toContain('id="jogar-tab-mods"')
  })

  it('#outros-jogos abre a aba de outros jogos', async () => {
    const others = await render('#outros-jogos')
    expect(others).toContain('#wardogs')
    expect(others).toContain('#ets2')
    expect(others).toContain('#snowrunner')
    expect(others).toContain('Entrar no Discord')
  })
})
