export type SocialPlatform = 'youtube' | 'tiktok' | 'instagram' | 'twitch' | 'kick' | 'discord'

export type Social = {
  platform: SocialPlatform
  name: string
  href: string
  // Nome-base do SVG monocromático em /assets/icons (fill="#fff") — usado
  // nos links diretos (SocialLinks) fora do tema escuro colorido.
  icon: string
  // Logo colorido de verdade em /assets/logos — usado no grid de
  // seguidores (CommunityStatsGrid), onde a cor já vem embutida na imagem.
  logo: string
  // Cor de marca oficial de cada rede — usada no indicador de "ao vivo"
  // (CommunityStatsGrid), pra ficar reconhecível qual plataforma tá com
  // aquele número de espectadores.
  color: string
}

// Fonte única das redes do canal — usado tanto pelos links estáticos
// (SocialLinks) quanto pelos cards de seguidores (CommunityStatsGrid), pra
// não duplicar URL/ícone em dois lugares. Ordem importa pro grid: as redes
// com "posts" (YouTube/TikTok/Instagram) ficam juntas primeiro, separadas
// das redes só de live/chat (Twitch/Kick/Discord).
export const SOCIALS: Social[] = [
  { platform: 'instagram', name: 'Instagram', href: 'https://www.instagram.com/galindogamerbr', icon: 'instagram', logo: 'instagram.webp', color: '#E1306C' },
  { platform: 'youtube', name: 'YouTube', href: 'https://www.youtube.com/@galindogamerbr', icon: 'youtube', logo: 'youtube.webp', color: '#FF0000' },
  { platform: 'tiktok', name: 'TikTok', href: 'https://www.tiktok.com/@galindogamerbr', icon: 'tiktok', logo: 'tiktok.webp', color: '#FE2C55' },
  { platform: 'twitch', name: 'Twitch', href: 'https://www.twitch.tv/galindogamerbr', icon: 'twitch', logo: 'twitch.webp', color: '#9146FF' },
  { platform: 'kick', name: 'Kick', href: 'https://kick.com/galindogamerbr', icon: 'kick', logo: 'kick.svg', color: '#53FC18' },
  // /discord (não o link cru) — redireciona pro convite guardado em D1,
  // editável em /admin/discord sem precisar de deploy (ver functions/discord.ts).
  { platform: 'discord', name: 'Discord', href: '/discord', icon: 'discord', logo: 'discord.webp', color: '#5865F2' },
]
