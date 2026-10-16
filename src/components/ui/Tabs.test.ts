import { describe, expect, it } from 'vitest'
import { nextTabId, resolveTabFromHash, type TabItem } from './Tabs'

const tabs: TabItem[] = [
  { id: 'como-entrar', label: 'Como entrar', hashAliases: ['participar'] },
  { id: 'mods', label: 'Mods' },
  { id: 'vip', label: 'VIP' },
  { id: 'outros-jogos', label: 'Outros jogos' },
]
const ids = tabs.map((tab) => tab.id)

describe('resolveTabFromHash', () => {
  it('abre a aba apontada pelo hash', () => {
    expect(resolveTabFromHash('#vip', tabs, 'como-entrar')).toBe('vip')
    expect(resolveTabFromHash('#mods', tabs, 'como-entrar')).toBe('mods')
    expect(resolveTabFromHash('#outros-jogos', tabs, 'como-entrar')).toBe('outros-jogos')
  })

  it('aceita alias antigo e ignora maiúsculas', () => {
    expect(resolveTabFromHash('#participar', tabs, 'vip')).toBe('como-entrar')
    expect(resolveTabFromHash('#VIP', tabs, 'como-entrar')).toBe('vip')
  })

  it('hash vazio, desconhecido ou inválido cai no padrão', () => {
    expect(resolveTabFromHash('', tabs, 'como-entrar')).toBe('como-entrar')
    expect(resolveTabFromHash('#', tabs, 'como-entrar')).toBe('como-entrar')
    expect(resolveTabFromHash('#nada', tabs, 'como-entrar')).toBe('como-entrar')
    expect(resolveTabFromHash('#%E0%A4%A', tabs, 'como-entrar')).toBe('como-entrar')
  })
})

describe('nextTabId', () => {
  it('setas dão a volta nas pontas', () => {
    expect(nextTabId(ids, 'vip', 'ArrowRight')).toBe('outros-jogos')
    expect(nextTabId(ids, 'outros-jogos', 'ArrowRight')).toBe('como-entrar')
    expect(nextTabId(ids, 'como-entrar', 'ArrowLeft')).toBe('outros-jogos')
    expect(nextTabId(ids, 'mods', 'ArrowLeft')).toBe('como-entrar')
  })

  it('Home e End vão para a primeira e a última', () => {
    expect(nextTabId(ids, 'vip', 'Home')).toBe('como-entrar')
    expect(nextTabId(ids, 'vip', 'End')).toBe('outros-jogos')
  })

  it('outras teclas e abas desconhecidas devolvem null', () => {
    expect(nextTabId(ids, 'vip', 'Enter')).toBeNull()
    expect(nextTabId(ids, 'vip', 'ArrowDown')).toBeNull()
    expect(nextTabId(ids, 'nao-existe', 'ArrowRight')).toBeNull()
    expect(nextTabId([], 'vip', 'ArrowRight')).toBeNull()
  })
})
