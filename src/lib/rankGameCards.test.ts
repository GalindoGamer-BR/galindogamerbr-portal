import { describe, expect, it } from 'vitest'
import { rankGameCards } from './rankGameCards'

const highlights = [{ slug: 'furia' }, { slug: 'ets2' }]
const games = [{ slug: 'watch-dogs' }, { slug: 'hll' }]

describe('rankGameCards', () => {
  it('ordena grandes e pequenos juntos pela data do último vídeo e separa os primeiros como grandes', () => {
    const videos = [
      { slug: 'furia', publishedAt: '2026-10-05T00:00:00Z' },
      { slug: 'ets2', publishedAt: '2026-10-02T00:00:00Z' },
      { slug: 'watch-dogs', publishedAt: '2026-10-16T01:00:00Z' },
      { slug: 'hll', publishedAt: '2026-10-01T00:00:00Z' },
    ]
    const { big, small } = rankGameCards(highlights, games, videos, 2)
    expect(big.map((card) => card.slug)).toEqual(['watch-dogs', 'furia'])
    expect(small.map((card) => card.slug)).toEqual(['ets2', 'hll'])
    expect(big[0].game).toBeDefined()
    expect(big[1].highlight).toBeDefined()
  })

  it('sem datas mantém a ordem original: grandes antes dos pequenos', () => {
    const { big, small } = rankGameCards(highlights, games, [], 2)
    expect(big.map((card) => card.slug)).toEqual(['furia', 'ets2'])
    expect(small.map((card) => card.slug)).toEqual(['watch-dogs', 'hll'])
  })
})
