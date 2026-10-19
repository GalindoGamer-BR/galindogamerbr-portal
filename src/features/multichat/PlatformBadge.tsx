import { badgeLabel, type BadgePlatform } from "./badgeDefs";

// Glifos (viewBox 20x20) e cor de cada selo do YouTube e da Kick. Selo fora da lista usa o glifo de estrela.
const star = "M10 2.5l2.2 4.8 5.2.6-3.9 3.5 1.1 5.1L10 13.9l-4.6 2.6 1.1-5.1L2.6 7.9l5.2-.6z";
const crown = "M3 6l3.5 3L10 4l3.5 5L17 6l-1.5 9h-11z";
const glyphs: Record<string, { color: string; path: string }> = {
  owner: { color: "#e11d48", path: crown },
  broadcaster: { color: "#e11d48", path: crown },
  moderator: { color: "#4f8ef7", path: "M13.5 3a4 4 0 00-3.7 5.5L3.5 14.8a1.4 1.4 0 002 2l6.3-6.3A4 4 0 0017 6.5l-2.4 2.4-2-.5-.5-2z" },
  member: { color: "#2ba640", path: "M10 16.5S3 12.3 3 7.7C3 5.5 4.6 4 6.5 4c1.4 0 2.6.8 3.5 2 .9-1.2 2.1-2 3.5-2C15.4 4 17 5.5 17 7.7c0 4.6-7 8.8-7 8.8z" },
  verified: { color: "#8f8f9a", path: "M10 2.5a7.5 7.5 0 100 15 7.5 7.5 0 000-15zM8.7 12.8l-2.3-2.3 1-1 1.3 1.3 3.9-3.9 1 1z" },
  vip: { color: "#e005b9", path: "M10 16.5L3 8l2.5-3.5h9L17 8z" },
  subscriber: { color: "#d2ac56", path: star },
  founder: { color: "#9146ff", path: "M10 2.5l6 2v5c0 3.5-2.5 6.2-6 7.5-3.5-1.3-6-4-6-7.5v-5z" },
  og: { color: "#f59e0b", path: "M4 10a3.5 3.5 0 117 0 3.5 3.5 0 01-7 0zm9-3.5h3v7h-3z" },
  sub_gifter: { color: "#53fc18", path: "M3 7h14v3.5H3zM4 11.5h12V17H4zM9 7h2v10H9z" },
};

export function PlatformBadge({ platform, id }: { platform: BadgePlatform; id: string }) {
  const glyph = glyphs[id] ?? { color: "#8f8f9a", path: star };
  const label = badgeLabel(platform, id);
  return (
    <svg className="mc-badge mc-badge-glyph" viewBox="0 0 20 20" role="img" aria-label={label}>
      <title>{label}</title>
      <rect width="20" height="20" rx="4" fill={glyph.color} fillOpacity="0.22" />
      <path d={glyph.path} fill={glyph.color} fillRule="evenodd" />
    </svg>
  );
}
