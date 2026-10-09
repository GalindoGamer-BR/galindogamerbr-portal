import { platforms, writablePlatforms } from "./types";

// Integracoes de conta (entrar com TikTok, sessao de envio por QR, YouTube). Desligadas por padrao e controladas
// no build por VITE_*_LINKING_ENABLED; a leitura do chat (as mensagens em "Todos") nao depende delas.
export const tiktokLinking = import.meta.env.VITE_TIKTOK_LINKING_ENABLED === "true";
export const youtubeLinking = import.meta.env.VITE_YOUTUBE_LINKING_ENABLED === "true";

// Plataformas que a pessoa pode vincular e usar para enviar mensagens (o player e a leitura nao mudam).
export const linkablePlatforms = writablePlatforms.filter((platform) => platform !== "youtube" || youtubeLinking);

// Abas de filtro do chat: sem o YouTube enquanto a flag do YouTube estiver desligada.
export const chatFilterPlatforms = platforms.filter((platform) => platform !== "youtube" || youtubeLinking);
