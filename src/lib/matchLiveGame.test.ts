import { describe, expect, it } from 'vitest'
import { matchLiveGameSlug } from './matchLiveGame'
import { GAMES } from '../data/games'

describe('matchLiveGameSlug', () => {
  it('reconhece o jogo pelo título da live, ignorando acento e caixa', () => {
    expect(matchLiveGameSlug('🕶️ WARDOGS | SEASON 2 — Muni Perfurante')).toBe('watch-dogs')
    expect(matchLiveGameSlug('🔥 Fúria Reborn RP | Sua História')).toBe('furia-reborn-rp')
    expect(matchLiveGameSlug('Farming Simulator 25 | Fazenda Nova Aliança #300')).toBe('fs25')
    expect(matchLiveGameSlug('🔴 AO VIVO | HELL LET LOOSE')).toBe('hell-let-loose')
  })

  it('devolve null quando não reconhece ou não há título', () => {
    expect(matchLiveGameSlug('Resenha com a galera')).toBeNull()
    expect(matchLiveGameSlug(null)).toBeNull()
  })

  it('só devolve slugs que existem em games.ts', () => {
    for (const title of ['wardogs', 'euro truck', 'snowrunner', 'contraband', 'construction simulator', 'god of war', 'farming simulator']) {
      const slug = matchLiveGameSlug(title)
      expect(GAMES.some((game) => game.slug === slug), title).toBe(true)
    }
  })
})
