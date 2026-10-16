// Jogos em que o Galindo joga junto com a comunidade (aba "Outros jogos" de /jogar). A entrada é sempre pelo Discord,
// onde cada jogo tem o seu canal; por isso a aba só lista o jogo e o canal, sem convite por jogo.
//
// ATENÇÃO (owner to confirm): `channel` e `text` abaixo são provisórios. Troque pelos nomes reais dos canais do Discord
// e pelo texto de cada jogo, e inclua ou retire jogos conforme for jogando junto (o slug vem de games.ts).
export type PlayTogetherGame = {
  /** Mesmo slug de games.ts (usado para o banner do card). */
  slug: string
  /** Nome do canal no Discord. */
  channel: string
  /** Frase curta sobre como é jogar junto. */
  text: string
  /** Só quem é sub entra neste jogo (mostra a tag "Somente subs"). */
  subsOnly?: boolean
}

export const PLAY_TOGETHER: PlayTogetherGame[] = [
  { slug: 'watch-dogs', channel: '#wardogs', text: 'Operações em equipe: combine a squad no Discord e entre na missão com a gente.' },
  { slug: 'hell-let-loose', channel: '#hell-let-loose', text: 'Guerra tática em esquadrão, com comunicação por voz e papel definido para cada um.' },
  { slug: 'construction-simulator', channel: '#construction-simulator', text: 'Obras e máquinas pesadas em cooperativo: cada um pega uma frente da obra.', subsOnly: true },
  { slug: 'ets2', channel: '#ets2', text: 'Coop de Euro Truck Simulator 2: monte o comboio, combine rota e carga e dirija junto com a galera.' },
  { slug: 'snowrunner', channel: '#snowrunner', text: 'Coop fora de estrada: lama, neve e muito guincho, com todo mundo ajudando a chegar ao destino.', subsOnly: true },
]
