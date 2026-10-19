import type { Platform } from "./types";

// Selos exibidos ao lado do nome no chat. A Twitch usa o catálogo de imagens (`useBadges`); YouTube e Kick são
// desenhados pelo portal a partir dos ids que o reader grava em `metadata.badges`.
export type BadgeDef = { id: string; label: string };
export type BadgePlatform = Extract<Platform, "twitch" | "youtube" | "kick">;

export const platformBadges: Record<BadgePlatform, BadgeDef[]> = {
  twitch: [
    { id: "broadcaster", label: "Streamer" },
    { id: "moderator", label: "Moderador" },
    { id: "vip", label: "VIP" },
    { id: "subscriber", label: "Inscrito" },
    { id: "founder", label: "Fundador" },
    { id: "sub-gifter", label: "Presenteador de subs" },
    { id: "bits", label: "Bits" },
    { id: "partner", label: "Parceiro" },
    { id: "premium", label: "Prime" },
    { id: "turbo", label: "Turbo" },
  ],
  youtube: [
    { id: "owner", label: "Dono do canal" },
    { id: "moderator", label: "Moderador" },
    { id: "member", label: "Membro" },
    { id: "verified", label: "Verificado" },
  ],
  kick: [
    { id: "broadcaster", label: "Streamer" },
    { id: "moderator", label: "Moderador" },
    { id: "vip", label: "VIP" },
    { id: "subscriber", label: "Inscrito" },
    { id: "founder", label: "Fundador" },
    { id: "og", label: "OG" },
    { id: "sub_gifter", label: "Presenteador de subs" },
    { id: "verified", label: "Verificado" },
  ],
};

export const badgeLabel = (platform: BadgePlatform, id: string) =>
  platformBadges[platform].find((badge) => badge.id === id)?.label ?? id;

/** "subscriber/12" (formato da Twitch) vira "subscriber": a preferência vale para o selo inteiro, não para cada versão. */
export const badgeSet = (id: string) => id.split("/")[0];

export const badgeKey = (platform: Platform, id: string) => `${platform}:${badgeSet(id)}`;

/** Lista de exclusão (chaves "plataforma:selo"): selos novos ou desconhecidos continuam aparecendo. */
export const isBadgeHidden = (hidden: readonly string[], platform: Platform, id: string) => hidden.includes(badgeKey(platform, id));

export function toggleBadge(hidden: readonly string[], platform: Platform, id: string): string[] {
  const key = badgeKey(platform, id);
  return hidden.includes(key) ? hidden.filter((item) => item !== key) : [...hidden, key];
}

/** Lê a lista salva no navegador, descartando o que não é uma chave de selo válida. */
export function parseHiddenBadges(raw: string | null): string[] {
  try {
    const value: unknown = JSON.parse(raw ?? "[]");
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && /^[a-z]+:[\w-]{1,32}$/.test(item)) : [];
  } catch {
    return [];
  }
}
