// Jogos em que o Galindo joga junto com a comunidade (aba de /jogar). A entrada é sempre pelo Discord, onde cada jogo
// tem o seu canal; por isso a página só lista o jogo, o canal e o que é preciso para entrar, sem convite por jogo.
//
// Acesso: 'seguidor' = servidor aberto, basta seguir o canal; 'vip' = coop restrito, só para membros VIP.
//
// ATENÇÃO (owner to confirm): `channel` e `text` abaixo são provisórios. Troque pelos nomes reais dos canais do Discord
// e pelo texto de cada jogo, e inclua ou retire jogos conforme for jogando junto (o slug vem de games.ts).
export type PlayAccess = 'seguidor' | 'vip'

export type PlayTogetherGame = {
  /** Mesmo slug de games.ts (usado para o título e o banner do card); jogo sem série própria usa `title`/`image`. */
  slug: string
  /** Nome e banner próprios, para jogo que ainda não tem série em games.ts. */
  title?: string
  image?: string
  /** Nome do canal no Discord. */
  channel: string
  /** Frase curta sobre como é jogar junto. */
  text: string
  /** O que a pessoa precisa para entrar. */
  access: PlayAccess
}

export const PLAY_TOGETHER: PlayTogetherGame[] = [
  { slug: 'watch-dogs', channel: '#wardogs', text: 'Operações em equipe: combine a squad no Discord e entre na missão com a gente.', access: 'seguidor' },
  { slug: 'war-thunder', title: 'War Thunder', channel: '#war-thunder', text: 'Combate aéreo, terrestre e naval em servidor aberto: entre na partida e jogue junto com a galera.', access: 'seguidor' },
  { slug: 'hell-let-loose', channel: '#hell-let-loose', text: 'Guerra tática em esquadrão, com comunicação por voz e papel definido para cada um.', access: 'seguidor' },
  { slug: 'ets2', channel: '#ets2', text: 'Coop de Euro Truck Simulator 2: monte o comboio, combine rota e carga e dirija junto com a galera.', access: 'seguidor' },
  { slug: 'construction-simulator', channel: '#construction-simulator', text: 'Obras e máquinas pesadas em cooperativo: cada um pega uma frente da obra.', access: 'vip' },
  { slug: 'snowrunner', channel: '#snowrunner', text: 'Coop fora de estrada: lama, neve e muito guincho, com todo mundo ajudando a chegar ao destino.', access: 'vip' },
]

export const PLAY_TOGETHER_OPEN = PLAY_TOGETHER.filter((game) => game.access === 'seguidor')
export const PLAY_TOGETHER_VIP = PLAY_TOGETHER.filter((game) => game.access === 'vip')
