import { afterEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'

// Renderiza /jogar no servidor para cada hash e confere qual aba abre. Pega erro de execução que o typecheck não vê e
// garante que os links antigos (#vip, #participar, #fazenda, #outros-jogos) continuam abrindo a aba certa.
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
    expect(html).toContain('Siga o canal')
    expect(html).toContain('18 ANOS OU MAIS')
  })

  it('não gira mais em torno da fazenda: sem status do servidor, mods nem vídeo das regras da fazenda', async () => {
    const html = await render('')
    expect(html).not.toContain('Prepare os mods')
    expect(html).not.toContain('Mod Sync')
    expect(html).not.toContain('REGRAS DA FAZENDA')
    expect(html).not.toContain('Fazenda 24/7')
  })

  it('mostra o resumo do que é preciso (seguir o canal ou ser VIP) no lugar do status do servidor', async () => {
    const html = await render('')
    expect(html).toContain('SERVIDOR ABERTO')
    expect(html).toContain('COOP RESTRITO')
  })

  it('o alias antigo #participar abre "Como entrar"', async () => {
    expect(await render('#participar')).toContain('Siga o canal')
  })

  it('servidores abertos: Wardogs, War Thunder, Hell Let Loose e ETS2, sem exigir VIP', async () => {
    for (const hash of ['#servidores-abertos', '#outros-jogos']) {
      const open = await render(hash)
      expect(open, hash).toContain('#wardogs')
      expect(open, hash).toContain('#war-thunder')
      expect(open, hash).toContain('#hell-let-loose')
      expect(open, hash).toContain('#ets2')
      expect(open, hash).not.toContain('#snowrunner')
      expect(open, hash).toContain('SUGERIR NOVOS JOGOS')
      expect(open, hash).not.toContain('Somente VIP')
    }
  })

  it('coop com VIP: Construction Simulator e SnowRunner trazem a etiqueta "Somente VIP"; #fazenda e #coop abrem a mesma aba', async () => {
    for (const hash of ['#coop-vip', '#coop', '#fazenda', '#fazenda-nova-alianca']) {
      const vip = await render(hash)
      expect(vip, hash).toContain('#construction-simulator')
      expect(vip, hash).toContain('#snowrunner')
      expect(vip.match(/Somente VIP/g), hash).toHaveLength(2)
      expect(vip, hash).not.toContain('#wardogs')
    }
  })

  it('o VIP é uma seção própria, fora das abas: aparece em qualquer aba e #vip não troca a aba', async () => {
    for (const hash of ['', '#servidores-abertos', '#coop-vip', '#vip']) {
      const html = await render(hash)
      expect(html, hash).toContain('id="vip"')
      expect(html, hash).toContain('Ouro')
    }
    expect(await render('#vip')).toContain('Siga o canal')
    expect(await render('')).not.toContain('id="jogar-tab-vip"')
  })
})
