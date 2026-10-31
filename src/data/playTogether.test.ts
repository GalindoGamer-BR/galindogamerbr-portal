import { describe, expect, it } from 'vitest'
import { GAMES } from './games'
import { PLAY_TOGETHER, PLAY_TOGETHER_OPEN, PLAY_TOGETHER_VIP } from './playTogether'

describe('PLAY_TOGETHER', () => {
  it('Construction Simulator e SnowRunner pedem VIP; Wardogs, War Thunder, Hell Let Loose e ETS2 só pedem seguir o canal', () => {
    expect(PLAY_TOGETHER_VIP.map((game) => game.slug).sort()).toEqual(['construction-simulator', 'snowrunner'])
    expect(PLAY_TOGETHER_OPEN.map((game) => game.slug).sort()).toEqual(['ets2', 'hell-let-loose', 'war-thunder', 'watch-dogs'])
  })

  it('cada jogo existe em games.ts (ou traz título próprio) e não se repete', () => {
    const slugs = PLAY_TOGETHER.map((game) => game.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const game of PLAY_TOGETHER) expect(Boolean(game.title) || GAMES.some((entry) => entry.slug === game.slug), game.slug).toBe(true)
  })

  it('tem canal do Discord e texto em todos, sem glifos de seta (regra do AGENTS.md)', () => {
    for (const game of PLAY_TOGETHER) {
      expect(game.channel.startsWith('#'), game.slug).toBe(true)
      expect(game.text.trim().length, game.slug).toBeGreaterThan(10)
      expect(`${game.channel}${game.text}`).not.toMatch(/[↗→←]/)
    }
  })
})
