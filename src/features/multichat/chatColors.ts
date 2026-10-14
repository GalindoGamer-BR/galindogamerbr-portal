// Cores de nome da Twitch (ex.: azul escuro) somem no fundo escuro do chat: clareia só o necessário para o contraste
// mínimo de leitura (WCAG AA, 4,5:1) contra o fundo do chat (#18181b).
const BACKGROUND_LUMINANCE = 0.0092;
const MIN_CONTRAST = 4.5;

const channel = (value: number) => {
  const v = value / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const luminance = (r: number, g: number, b: number) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
const contrast = (l: number) => (l + 0.05) / (BACKGROUND_LUMINANCE + 0.05);

export function readableColor(hex: string | undefined): string | undefined {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return undefined;
  const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
  if (contrast(luminance(...rgb)) >= MIN_CONTRAST) return hex;
  // Mistura com branco até atingir o contraste (busca binária na fração de branco).
  let low = 0, high = 1;
  for (let i = 0; i < 12; i++) {
    const mid = (low + high) / 2;
    const mixed = rgb.map((c) => c + (255 - c) * mid) as [number, number, number];
    if (contrast(luminance(...mixed)) >= MIN_CONTRAST) high = mid; else low = mid;
  }
  return "#" + rgb.map((c) => Math.round(c + (255 - c) * high).toString(16).padStart(2, "0")).join("");
}
