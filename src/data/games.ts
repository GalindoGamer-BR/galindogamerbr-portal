export type Game = {
  slug: string
  title: string
  tag: string
  icon: string | null
  description: string
  image: string
  href: string
  flagship?: boolean
}

export const GAMES: Game[] = [
  {
    slug: 'fs25',
    title: 'Farming Simulator 25',
    tag: 'Carro-chefe',
    icon: '/assets/logos/trator.webp',
    description: 'Fazendas, máquinas, produção, mods e histórias da comunidade, incluindo a série Fazenda Nova Aliança.',
    image: '', // carro-chefe: a pagina mostra o video, nao um banner (o arquivo nao existe mais)
    href: 'https://www.youtube.com/playlist?list=PLj6h86FobQUn2vIz-FSyMlL_ldV6_kzrN',
    flagship: true,
  },
  {
    slug: 'furia-reborn-rp',
    title: 'Fúria Reborn • GTA RP',
    tag: 'Roleplay',
    icon: '/assets/logos/furia_reborn_rp.webp',
    description: 'Roleplay imersivo, histórias e experiências na comunidade.',
    image: '/assets/banners/furia-reborn.webp',
    href: 'https://www.youtube.com/playlist?list=PLJtoEQhBWmWI',
  },
  {
    slug: 'snowrunner',
    title: 'SnowRunner',
    tag: 'Simulação',
    icon: '/assets/logos/caminhao.webp',
    description: 'Expedições, lama, carga pesada e desafios extremos.',
    image: '/assets/banners/snowrunner-banner.webp',
    href: 'https://www.youtube.com/playlist?list=PLDv3gOgRACDY',
  },
  {
    slug: 'ets2',
    title: 'Euro Truck Simulator 2',
    tag: 'Estradas',
    icon: '/assets/logos/cavalo.webp',
    description: 'Viagens, caminhões e muita estrada.',
    image: '/assets/banners/ets2-banner.webp',
    href: 'https://www.youtube.com/playlist?list=PLj6h86FobQUkbejSJ6f1D0eob6leKJAur',
  },
  {
    slug: 'dicas',
    title: 'Dicas do Galindo',
    tag: 'Tutoriais',
    icon: null,
    description: 'Tutoriais, truques, configurações e dicas que fazem a diferença.',
    image: '/assets/banners/dicas-banner.webp',
    href: 'https://www.youtube.com/playlist?list=PLj6h86FobQUmOBGsW2WBorqwszTEJihie',
  },
  {
    slug: 'contraband-police',
    title: 'Contraband Police',
    tag: 'Fiscalização de fronteira',
    icon: null,
    description: 'Inspeções, perseguições e decisões difíceis na fronteira de Acaristão, onde cada veículo pode esconder uma surpresa.',
    image: '/assets/banners/contraband-police.webp',
    href: 'https://www.youtube.com/watch?v=0OrMwgvz0mw&list=PLSLPCJiW7RZM',
  },
  // Jogos de /conteudos com playlist própria. `image` é o banner (WebP 1672×941 em /assets/banners); vazio = arte ainda
  // não enviada, e o card usa a miniatura do vídeo mais recente da série. Os slugs batem com as playlists de
  // galindogamerbr-api/src/lib/series.ts, e a ordem na página segue o último vídeo de cada playlist (rankGameCards).
  {
    slug: 'construction-simulator',
    title: 'Construction Simulator',
    tag: 'Simulação',
    icon: null,
    description: 'Obras, máquinas pesadas e projetos do zero. A obra não pode parar!',
    image: '/assets/banners/construction-simulator.webp',
    href: 'https://www.youtube.com/playlist?list=PLNIYa7Wh3_Os',
  },
  {
    slug: 'watch-dogs', // identificador interno legado (liga ao slug da API); a série é WARDOGS
    title: 'WARDOGS',
    tag: 'Operações militares',
    icon: null,
    description: 'Operações militares e combate tático com o GalindoGamerBR.',
    image: '/assets/banners/wardogs.webp',
    href: 'https://www.youtube.com/playlist?list=PLPrDkzFyI_V4',
  },
  {
    slug: 'hell-let-loose',
    title: 'Hell Let Loose',
    tag: 'Guerra tática',
    icon: null,
    description: 'Guerra realista, trabalho em equipe e combate intenso na Segunda Guerra Mundial.',
    image: '/assets/banners/hell-let-loose.webp',
    href: 'https://www.youtube.com/playlist?list=PLHQC4n-xJg9k',
  },
  {
    slug: 'god-of-war-2018',
    title: 'God of War (2018)',
    tag: 'Ação e aventura',
    icon: null,
    description: 'A jornada de Kratos e Atreus pelos reinos nórdicos, do início ao fim.',
    image: '/assets/banners/god-of-war-2018.webp',
    href: 'https://www.youtube.com/playlist?list=PLj6h86FobQUnGQatZojTChJMyQHYAr1ou',
  },
]

export const FAZENDA_NOVA_ALIANCA = {
  // Thumbnail/vídeo reais vêm de /api/flagship (src/hooks/useFlagshipVideo.ts),
  // sempre o mais recente da playlist — com fallback pro último vídeo salvo
  // em D1 se a busca ao vivo falhar (ver functions/api/flagship.ts). Sem
  // imagem estática fixa aqui — não há garantia de imagem antes do primeiro
  // request bem-sucedido, mas isso é aceitável (self-heal na próxima visita).
  description:
    'A Fazenda Nova Aliança é um gameplay num servidor dedicado, jogado ao vivo ao lado de parceiros do canal e membros VIP da comunidade. A história começou do zero: só um fordinho velho e um sonho grande demais pra caber numa live só. Antes de conseguir comprar nosso primeiro terreno de verdade, fechamos contrato atrás de contrato com os vizinhos, plantando, colhendo e prestando serviço pra juntar cada centavo. Máquina por máquina, hectare por hectare, transmissão após transmissão, aquele projeto pequeno virou algo muito maior do que qualquer um de nós imaginou. Hoje, depois de muito suor (e alguns imprevistos daqueles que só o campo sabe dar), somos donos de uma fazenda enorme, e a comunidade acompanha ao vivo cada decisão, cada expansão e cada capítulo novo dessa saga.',
  href: 'https://www.youtube.com/playlist?list=PLj6h86FobQUn2vIz-FSyMlL_ldV6_kzrN',
}

export const FURIA_REBORN = {
  // Vídeos recentes reais vêm de /api/furia (src/hooks/useFuriaVideos.ts).
  description:
    'Boas vindas ao universo Fúria Reborn! Perseguições de tirar o fôlego, missões insanas, guerra de facções e histórias que só existem porque a comunidade tá junto ao vivo. Cada transmissão escreve um capítulo novo dessa cidade sem lei.',
  image: '/assets/banners/furia-reborn.webp',
  href: 'https://www.youtube.com/playlist?list=PLJtoEQhBWmWI',
}

export const DICAS = {
  // Vídeos recentes reais vêm de /api/dicas (src/hooks/useDicasVideos.ts).
  description:
    'Quer jogar melhor sem sofrer sozinho? Aqui tem truque, configuração, otimização e solução rápida pra tirar o máximo de cada jogo. Um espaço pensado pra ajudar a comunidade inteira a evoluir junto.',
  image: '/assets/banners/dicas-banner.webp',
  href: 'https://www.youtube.com/playlist?list=PLj6h86FobQUmOBGsW2WBorqwszTEJihie',
}

export const ETS2 = {
  // Vídeos recentes reais vêm de /api/ets2 (src/hooks/useEts2Videos.ts).
  description:
    'Bota o caminhão na estrada e relaxa! Viagens longas, paisagens reais e entregas que testam paciência e planejamento. Um dos simuladores mais tranquilos (e viciantes) do canal, onde a estrada é a verdadeira protagonista.',
  image: '/assets/banners/ets2-banner.webp',
  href: 'https://www.youtube.com/playlist?list=PLj6h86FobQUkbejSJ6f1D0eob6leKJAur',
}

export const SNOWRUNNER = {
  // Vídeos recentes reais vêm de /api/snowrunner (src/hooks/useSnowrunnerVideos.ts).
  // image separado do usado no card pequeno (snowrunner.webp é retrato,
  // pensado pro grid de "outros jogos" — este é o banner largo dedicado.
  description:
    'Neve, lama e muita adrenalina! Expedições brutais fora de estrada em terrenos que parecem impossíveis de atravessar, resgates de veículos presos e um inverno hostil que não perdoa. Cada transmissão é um novo duelo contra a natureza.',
  image: '/assets/banners/snowrunner-banner.webp',
  href: 'https://www.youtube.com/playlist?list=PLDv3gOgRACDY',
}

export const CONTRABAND_POLICE = {
  description:
    'Inspeções, perseguições e decisões difíceis na fronteira de Acaristão, onde cada veículo pode esconder uma surpresa.',
  image: '/assets/banners/contraband-police.webp',
  href: 'https://www.youtube.com/watch?v=0OrMwgvz0mw&list=PLSLPCJiW7RZM',
}
