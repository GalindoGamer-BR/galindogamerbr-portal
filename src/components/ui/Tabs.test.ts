import { describe, expect, it } from 'vitest'
import { findTabByHash, nextTabId, resolveTabFromHash, type TabItem } from './Tabs'

const tabs: TabItem[] = [
  { id: 'como-entrar', label: 'Como entrar', hashAliases: ['participar'] },
  { id: 'fazenda', label: 'Fazenda' },
  { id: 'mods', label: 'Mods' },
  { id: 'outros-jogos', label: 'Outros jogos' },
]
const ids = tabs.map((tab) => tab.id)

describe('resolveTabFromHash', () => {
  it('abre a aba apontada pelo hash', () => {
    expect(resolveTabFromHash('#fazenda', tabs, 'como-entrar')).toBe('fazenda')
    expect(resolveTabFromHash('#mods', tabs, 'como-entrar')).toBe('mods')
    expect(resolveTabFromHash('#outros-jogos', tabs, 'como-entrar')).toBe('outros-jogos')
  })

  it('aceita alias antigo e ignora maiúsculas', () => {
    expect(resolveTabFromHash('#participar', tabs, 'mods')).toBe('como-entrar')
    expect(resolveTabFromHash('#FAZENDA', tabs, 'como-entrar')).toBe('fazenda')
  })

  it('hash vazio, desconhecido ou inválido cai no padrão', () => {
    expect(resolveTabFromHash('', tabs, 'como-entrar')).toBe('como-entrar')
    expect(resolveTabFromHash('#', tabs, 'como-entrar')).toBe('como-entrar')
    expect(resolveTabFromHash('#nada', tabs, 'como-entrar')).toBe('como-entrar')
    expect(resolveTabFromHash('#%E0%A4%A', tabs, 'como-entrar')).toBe('como-entrar')
  })
})

describe('findTabByHash', () => {
  it('só reconhece hash de aba; seção da página (#vip) e vazio dão null', () => {
    expect(findTabByHash('#mods', tabs)).toBe('mods')
    expect(findTabByHash('#participar', tabs)).toBe('como-entrar')
    expect(findTabByHash('#vip', tabs)).toBeNull()
    expect(findTabByHash('', tabs)).toBeNull()
  })
})

describe('nextTabId', () => {
  it('setas dão a volta nas pontas', () => {
    expect(nextTabId(ids, 'fazenda', 'ArrowRight')).toBe('mods')
    expect(nextTabId(ids, 'outros-jogos', 'ArrowRight')).toBe('como-entrar')
    expect(nextTabId(ids, 'como-entrar', 'ArrowLeft')).toBe('outros-jogos')
    expect(nextTabId(ids, 'mods', 'ArrowLeft')).toBe('fazenda')
  })

  it('Home e End vão para a primeira e a última', () => {
    expect(nextTabId(ids, 'fazenda', 'Home')).toBe('como-entrar')
    expect(nextTabId(ids, 'fazenda', 'End')).toBe('outros-jogos')
  })

  it('outras teclas e abas desconhecidas devolvem null', () => {
    expect(nextTabId(ids, 'fazenda', 'Enter')).toBeNull()
    expect(nextTabId(ids, 'fazenda', 'ArrowDown')).toBeNull()
    expect(nextTabId(ids, 'nao-existe', 'ArrowRight')).toBeNull()
    expect(nextTabId([], 'fazenda', 'ArrowRight')).toBeNull()
  })
})
