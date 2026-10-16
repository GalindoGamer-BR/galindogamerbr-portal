import { describe, expect, it } from 'vitest'
import { GAMES } from './games'
import { PLAY_TOGETHER } from './playTogether'

describe('PLAY_TOGETHER', () => {
  it('Construction Simulator e SnowRunner são somente para subs; os demais são abertos', () => {
    const subsOnly = PLAY_TOGETHER.filter((game) => game.subsOnly).map((game) => game.slug).sort()
    expect(subsOnly).toEqual(['construction-simulator', 'snowrunner'])
  })

  it('cada jogo existe em games.ts e não se repete', () => {
    const slugs = PLAY_TOGETHER.map((game) => game.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const slug of slugs) expect(GAMES.some((game) => game.slug === slug), slug).toBe(true)
  })

  it('tem canal do Discord e texto em todos, sem glifos de seta (regra do AGENTS.md)', () => {
    for (const game of PLAY_TOGETHER) {
      expect(game.channel.startsWith('#'), game.slug).toBe(true)
      expect(game.text.trim().length, game.slug).toBeGreaterThan(10)
      expect(`${game.channel}${game.text}`).not.toMatch(/[↗→←]/)
    }
  })
})
