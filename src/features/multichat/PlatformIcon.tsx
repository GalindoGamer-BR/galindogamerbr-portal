import { labels, type Platform } from "./types";
export function PlatformIcon({ platform }: { platform: Platform }) {
  return (
    <img
      className="mc-platform-icon" width={22} height={22}
      src={`/assets/logos/${platform}.${platform === "kick" ? "svg" : "png"}`}
      alt={labels[platform]}
    />
  );
}
