export const NAV_ITEMS = [
  { label: 'Início', to: '/' },
  { label: 'Boas vindas', to: '/boasvindas' },
  { label: 'Conteúdos', to: '/conteudos' },
  { label: 'Jogue com o Galindo', to: '/jogar' },
  { label: 'Comunidade', to: '/comunidade' },
  { label: 'Parceiros', to: '/parceiros' },
  { label: 'Multichat', to: '/live' },
] as const

// Só o que não está na navbar (NAV_ITEMS; o Sobre mora aqui para dar lugar ao Multichat lá) — repetir os mesmos links nos
// dois lugares era redundante. O mapa do site (/mapa-do-site) reúne os dois
// grupos pra quem quiser ver tudo num lugar só.
export const FOOTER_ITEMS = [
  { label: 'Sobre', to: '/sobre' },
  { label: 'Privacidade', to: '/privacidade' },
  { label: 'Termos', to: '/termos' },
  { label: 'Créditos', to: '/creditos' },
  { label: 'Mapa do site', to: '/mapa-do-site' },
  { label: 'Admin', to: '/admin' },
] as const
