export const NAV_ITEMS = [
  { label: 'Início', to: '/' },
  { label: 'Boas vindas', to: '/boasvindas' },
  { label: 'Conteúdos', to: '/conteudos' },
  { label: 'Participe da Fazenda', to: '/fazenda' },
  { label: 'Comunidade', to: '/comunidade' },
  { label: 'Sobre', to: '/sobre' },
  { label: 'Parceiros', to: '/parceiros' },
] as const

// Só o que não está na navbar (NAV_ITEMS) — repetir os mesmos links nos
// dois lugares era redundante. O mapa do site (/mapa-do-site) reúne os dois
// grupos pra quem quiser ver tudo num lugar só.
export const FOOTER_ITEMS = [
  { label: 'Privacidade', to: '/privacidade' },
  { label: 'Termos', to: '/termos' },
  { label: 'Créditos', to: '/creditos' },
  { label: 'Mapa do site', to: '/mapa-do-site' },
  { label: 'Admin', to: '/admin' },
] as const
