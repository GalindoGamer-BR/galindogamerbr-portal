import { platforms, writablePlatforms } from "./types";

// Integracoes de conta (entrar com TikTok, sessao de envio por QR, YouTube). Desligadas por padrao e controladas
// no build por VITE_*_LINKING_ENABLED; a leitura do chat (as mensagens em "Todos") nao depende delas.
export const tiktokLinking = import.meta.env.VITE_TIKTOK_LINKING_ENABLED === "true";
export const youtubeLinking = import.meta.env.VITE_YOUTUBE_LINKING_ENABLED === "true";
// Entrar com Google (provedor do Supabase): só liga depois de o provedor estar configurado no Supabase.
export const googleLogin = import.meta.env.VITE_GOOGLE_LOGIN_ENABLED === "true";
// Entrar com Google já pedindo o escopo do YouTube e vinculando o chat sozinho (como o login da Twitch). Pede uma permissão sensível a todo
// mundo que entra com Google: só vale a pena depois que o app passar pela verificação do Google.
export const googleLoginYoutube = googleLogin && youtubeLinking && import.meta.env.VITE_GOOGLE_LOGIN_YOUTUBE_ENABLED === "true";

// Plataformas que a pessoa pode vincular e usar para enviar mensagens (o player e a leitura nao mudam).
export const linkablePlatforms = writablePlatforms.filter((platform) => platform !== "youtube" || youtubeLinking);

// Abas de filtro do chat: leitura, independente das flags de vinculação (o YouTube aparece sempre).
export const chatFilterPlatforms = platforms;
