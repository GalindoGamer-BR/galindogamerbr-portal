import type { LiveStatus } from "../../lib/api/live";
import type { WritablePlatform } from "./types";

/**
 * O canal está offline na plataforma do player? Só vale quando o servidor confirmou: `stale` (consulta que falhou ou
 * cota esgotada) e a falta de dados contam como "não sei", e aí o player aparece normalmente.
 */
export function playerOffline(player: WritablePlatform, status: LiveStatus | null): boolean {
  if (!status) return false;
  const platform = status.platforms?.[player];
  if (platform) return !platform.isLive && !platform.stale;
  return player === "youtube" && !status.isLive;
}

/** Endereço do player embutido; null quando não há o que mostrar (YouTube sem live nem arquivo). */
export function playerEmbedUrl(player: WritablePlatform, hostname: string, youtubeVideoId: string | null): string | null {
  if (player === "twitch") return `https://player.twitch.tv/?channel=galindogamerbr&parent=${encodeURIComponent(hostname)}&autoplay=false`;
  if (player === "kick") return "https://player.kick.com/galindogamerbr?autoplay=false";
  // youtube-nocookie: não grava cookie de rastreamento antes de o visitante dar play. `rel=0` limita os vídeos
  // relacionados ao mesmo canal e `playsinline` evita a tela cheia forçada no iOS.
  return youtubeVideoId ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeVideoId)}?autoplay=0&rel=0&playsinline=1` : null;
}
