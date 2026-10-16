import { sortByLatestVideo } from './sortByLatestVideo'

type Dated = { slug: string; publishedAt: string }
export type RankedCard<H, G> = { slug: string; highlight?: H; game?: G }

// Junta os cards grandes (highlights) e os pequenos (games) numa única fila ordenada pela data do último vídeo da
// playlist de cada jogo. Os `bigCount` primeiros viram cards grandes; o resto fica na grade. Jogos sem data conhecida
// vão para o fim, na ordem original.
export function rankGameCards<H extends { slug: string }, G extends { slug: string }>(
  highlights: H[],
  games: G[],
  videos: Dated[],
  bigCount: number,
): { big: RankedCard<H, G>[]; small: RankedCard<H, G>[] } {
  const all: RankedCard<H, G>[] = [
    ...highlights.map((highlight) => ({ slug: highlight.slug, highlight })),
    ...games.map((game) => ({ slug: game.slug, game })),
  ]
  const ranked = sortByLatestVideo(all, videos)
  return { big: ranked.slice(0, bigCount), small: ranked.slice(bigCount) }
}
