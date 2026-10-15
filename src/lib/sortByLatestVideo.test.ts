import { describe, expect, it } from 'vitest'
import { sortByLatestVideo } from './sortByLatestVideo'

const games = [{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }, { slug: 'd' }]

describe('sortByLatestVideo', () => {
  it('põe primeiro a série com o vídeo mais recente, usando o vídeo mais novo de cada uma', () => {
    const videos = [
      { slug: 'a', publishedAt: '2026-10-01T00:00:00Z' },
      { slug: 'b', publishedAt: '2026-10-13T00:00:00Z' },
      { slug: 'a', publishedAt: '2026-10-14T00:00:00Z' },
      { slug: 'c', publishedAt: '2026-10-09T00:00:00Z' },
    ]

    expect(sortByLatestVideo(games, videos).map((g) => g.slug)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('deixa as séries sem vídeo no fim, na ordem original', () => {
    const videos = [{ slug: 'c', publishedAt: '2026-10-09T00:00:00Z' }]

    expect(sortByLatestVideo(games, videos).map((g) => g.slug)).toEqual(['c', 'a', 'b', 'd'])
  })

  it('mantém a ordem original enquanto nada foi carregado e não altera a lista recebida', () => {
    expect(sortByLatestVideo(games, []).map((g) => g.slug)).toEqual(['a', 'b', 'c', 'd'])
    expect(games.map((g) => g.slug)).toEqual(['a', 'b', 'c', 'd'])
  })
})
