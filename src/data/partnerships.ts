// Fonte única das opções apresentadas no formulário e aceitas pela API.
// Mantê-las juntas evita que a interface ofereça algo que o backend rejeita.
export const PARTNERSHIP_TYPES = [
  { value: 'productPromotion', label: 'Produto para divulgação' },
  { value: 'affiliateCoupon', label: 'Afiliado / cupom' },
  { value: 'brandPromotion', label: 'Divulgação de marca' },
  { value: 'sponsorship', label: 'Patrocínio' },
  { value: 'campaignSpecialAction', label: 'Campanha / ação especial' },
  { value: 'otherProposal', label: 'Outra proposta' },
] as const

export type PartnershipType = (typeof PARTNERSHIP_TYPES)[number]['value']
