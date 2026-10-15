type Dated = { slug: string; publishedAt: string }

// Ordena os itens pela série com o vídeo mais recente primeiro. Quem ainda não tem vídeo carregado vai para o fim,
// mantendo a ordem original entre si (o sort do JS é estável).
export function sortByLatestVideo<T extends { slug: string }>(items: T[], videos: Dated[]): T[] {
  const latest = new Map<string, string>()
  for (const video of videos) {
    const current = latest.get(video.slug)
    if (!current || video.publishedAt > current) latest.set(video.slug, video.publishedAt)
  }
  return [...items].sort((a, b) => (latest.get(b.slug) ?? '').localeCompare(latest.get(a.slug) ?? ''))
}
