// Descobre de qual jogo é a live pelo título, para o destaque de /conteudos funcionar mesmo quando o vídeo da live ainda
// não entrou na playlist (a live só aparece na playlist depois de publicada). Os slugs são os de games.ts.
const KEYWORDS: Array<[slug: string, words: string[]]> = [
  ['fs25', ['farming simulator', 'fs25', 'fazenda nova alian']],
  ['furia-reborn-rp', ['furia reborn', 'furia rp', 'gta rp']],
  ['ets2', ['euro truck', 'ets2', 'caminhoneiro']],
  ['snowrunner', ['snowrunner', 'snow runner']],
  ['contraband-police', ['contraband']],
  ['construction-simulator', ['construction simulator', 'a obra nao pode parar']],
  ['watch-dogs', ['wardogs', 'war dogs', 'watch dogs']],
  ['hell-let-loose', ['hell let loose']],
  ['god-of-war-2018', ['god of war']],
]

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function matchLiveGameSlug(title: string | null | undefined): string | null {
  if (!title) return null
  const text = normalize(title)
  return KEYWORDS.find(([, words]) => words.some((word) => text.includes(word)))?.[0] ?? null
}
