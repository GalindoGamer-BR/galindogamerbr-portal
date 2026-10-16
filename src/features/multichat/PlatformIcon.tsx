import { labels, type Platform } from "./types";

/** Caminho do ícone da plataforma (Kick é SVG; as outras são WebP). Exportado para o teste de assets conferir o arquivo. */
export const platformIconSrc = (platform: Platform) => `/assets/logos/${platform}.${platform === "kick" ? "svg" : "webp"}`;

export function PlatformIcon({ platform }: { platform: Platform }) {
  return (
    <img
      className="mc-platform-icon" width={22} height={22}
      src={platformIconSrc(platform)}
      alt={labels[platform]}
    />
  );
}
