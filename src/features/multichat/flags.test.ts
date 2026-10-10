import { afterEach, describe, expect, it, vi } from "vitest";

const load = async () => {
  vi.resetModules();
  return import("./flags");
};
afterEach(() => vi.unstubAllEnvs());

describe("linking feature flags", () => {
  it("are off by default: YouTube cannot be linked, Twitch and Kick can; the YouTube chat filter is always shown", async () => {
    const flags = await load();
    expect(flags.tiktokLinking).toBe(false);
    expect(flags.youtubeLinking).toBe(false);
    expect([...flags.linkablePlatforms]).toEqual(["twitch", "kick"]);
    expect([...flags.chatFilterPlatforms]).toEqual(["twitch", "youtube", "kick", "tiktok"]);
  });
  it("turn on only with the exact value 'true'", async () => {
    vi.stubEnv("VITE_YOUTUBE_LINKING_ENABLED", "true");
    vi.stubEnv("VITE_TIKTOK_LINKING_ENABLED", "1");
    const flags = await load();
    expect(flags.youtubeLinking).toBe(true);
    expect(flags.tiktokLinking).toBe(false);
    expect([...flags.linkablePlatforms]).toEqual(["twitch", "youtube", "kick"]);
    expect([...flags.chatFilterPlatforms]).toEqual(["twitch", "youtube", "kick", "tiktok"]);
  });
});
