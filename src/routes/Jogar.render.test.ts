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
    expect(html).not.toContain('Instale o Mod Sync')
  })

  it('o alias antigo #participar abre "Como entrar"', async () => {
    expect(await render('#participar')).toContain('Entre no Discord')
  })

  it('#mods, #vip e #outros-jogos abrem as respectivas abas', async () => {
    expect(await render('#mods')).toContain('Instale o Mod Sync')
    expect(await render('#vip')).toContain('Ouro')
    const others = await render('#outros-jogos')
    expect(others).toContain('#wardogs')
    expect(others).toContain('Entrar no Discord')
  })
})
