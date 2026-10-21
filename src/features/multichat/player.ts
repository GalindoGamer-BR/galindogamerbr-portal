import type { LiveStatus } from "../../lib/api/live";
import type { WritablePlatform } from "./types";

// Lista de envios do canal: o ID do canal com o prefixo UC trocado por UU.
const YOUTUBE_UPLOADS_PLAYLIST = "UUZGlbfvpoitCSFTsWVWVAow";

/**
 * O canal está offline na plataforma do player? Só vale quando o servidor confirmou: `stale` (consulta que falhou ou
 * cota esgotada) e a falta de dados contam como "não sei". Serve só para o texto de status: o player embutido
 * sempre carrega e mostra a tela oficial de offline da plataforma.
 */
export function playerOffline(player: WritablePlatform, status: LiveStatus | null): boolean {
  if (!status) return false;
  const platform = status.platforms?.[player];
  if (platform) return !platform.isLive && !platform.stale;
  return player === "youtube" && !status.isLive;
}

/** Endereço do player embutido. */
export function playerEmbedUrl(player: WritablePlatform, hostname: string, youtubeVideoId: string | null): string {
  if (player === "twitch") return `https://player.twitch.tv/?channel=galindogamerbr&parent=${encodeURIComponent(hostname)}&autoplay=false`;
  if (player === "kick") return "https://player.kick.com/galindogamerbr?autoplay=false";
  // youtube-nocookie: não grava cookie de rastreamento antes de o visitante dar play. `rel=0` limita os vídeos
  // relacionados ao mesmo canal e `playsinline` evita a tela cheia forçada no iOS.
  // Sem transmissão o embed `live_stream` mostra "Vídeo indisponível": abre a última live encerrada e, se ela ainda não
  // for conhecida, a lista de envios do canal (o player oficial toca o mais recente).
  const source = youtubeVideoId
    ? `${encodeURIComponent(youtubeVideoId)}?`
    : `videoseries?list=${YOUTUBE_UPLOADS_PLAYLIST}&`;
  return `https://www.youtube-nocookie.com/embed/${source}autoplay=0&rel=0&playsinline=1`;
}
