import { describe, expect, it } from "vitest";
import { playerEmbedUrl, playerOffline } from "./player";
import type { LiveStatus } from "../../lib/api/live";

const base: LiveStatus = { isLive: false, videoId: null, title: null, thumbnailUrl: null, viewerCount: null };

describe("player do multichat", () => {
  it("sem dados não afirma que o canal está offline", () => {
    expect(playerOffline("youtube", null)).toBe(false);
    expect(playerOffline("twitch", base)).toBe(false);
  });
  it("só confia no offline confirmado pelo servidor", () => {
    const platforms = { twitch: { isLive: false, viewerCount: null, stale: true }, kick: { isLive: false, viewerCount: null, stale: false }, youtube: { isLive: true, viewerCount: 3, stale: false } };
    expect(playerOffline("twitch", { ...base, platforms })).toBe(false);
    expect(playerOffline("kick", { ...base, platforms })).toBe(true);
    expect(playerOffline("youtube", { ...base, isLive: true, platforms })).toBe(false);
  });
  it("resposta antiga (sem platforms) vale só para o YouTube", () => {
    expect(playerOffline("youtube", base)).toBe(true);
    expect(playerOffline("youtube", { ...base, isLive: true })).toBe(false);
    expect(playerOffline("kick", base)).toBe(false);
  });
  it("monta o embed de cada plataforma", () => {
    expect(playerEmbedUrl("twitch", "galindogamerbr.com.br", null)).toContain("parent=galindogamerbr.com.br");
    expect(playerEmbedUrl("kick", "x", null)).toBe("https://player.kick.com/galindogamerbr?autoplay=false");
    expect(playerEmbedUrl("youtube", "x", "abc_123-XYZ")).toBe("https://www.youtube-nocookie.com/embed/abc_123-XYZ?autoplay=0&rel=0&playsinline=1");
    expect(playerEmbedUrl("youtube", "x", null)).toBe("https://www.youtube-nocookie.com/embed/videoseries?list=UUZGlbfvpoitCSFTsWVWVAow&autoplay=0&rel=0&playsinline=1");
  });
});
