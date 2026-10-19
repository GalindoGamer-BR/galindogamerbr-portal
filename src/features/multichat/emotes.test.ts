import { describe, expect, it } from "vitest";
import { emoteSchema, messageParts, type Emote } from "./emotes";
import type { ChatMessage } from "./types";
const emote: Emote = {
  id: "test",
  code: "KEKW",
  provider: "bttv",
  url: "https://cdn.betterttv.net/emote/test/2x",
};
const message = (text: string): ChatMessage => ({
  id: "1",
  platform: "twitch",
  platformMessageId: "1",
  user: { username: "viewer", displayName: "Viewer" },
  message: text,
  timestamp: new Date().toISOString(),
});
describe("emotes", () => {
  it("matches whole codes while preserving whitespace, emoji and unknown text", () => {
    const parts = messageParts(
      message("😀 KEKW\nKEKWish <script>"),
      new Map([["KEKW", emote]]),
    );
    expect(parts.map((p) => p.text).join("")).toBe("😀 KEKW\nKEKWish <script>");
    expect(parts.filter((p) => p.emote)).toHaveLength(1);
  });
  it("preserves Twitch fragment identity, including adjacent native emotes", () => {
    const m = message("KappaKappa");
    m.metadata = {
      fragments: [
        { text: "Kappa", emoteId: "25" },
        { text: "Kappa", emoteId: "25" },
      ],
    };
    expect(messageParts(m, new Map()).map((p) => p.emote?.id)).toEqual([
      "25",
      "25",
    ]);
    m.metadata.fragments![0].text = "untrusted mismatch";
    expect(messageParts(m, new Map())).toEqual([
      { text: "KappaKappa", emote: undefined },
    ]);
  });
  it("rejects unexpected image hosts and insecure URLs", () => {
    for (const url of [
      "javascript:alert(1)",
      "https://example.org/emote",
      "http://cdn.betterttv.net/emote/test/2x",
      "https://cdn.betterttv.net.evil.test/emote",
    ])
      expect(emoteSchema.safeParse({ ...emote, url }).success).toBe(false);
    expect(emoteSchema.safeParse(emote).success).toBe(true);
  });
});

describe("emotes do 7TV", () => {
  const seven = { id: "01G3WEGZN0000ET2J0MQP5YJ0G", code: "GAMBA", provider: "7tv", source: "channel", url: "https://cdn.7tv.app/emote/01G3WEGZN0000ET2J0MQP5YJ0G/2x.webp" };
  it("aceita o provider 7tv só com URL do CDN do 7TV", () => {
    expect(emoteSchema.safeParse(seven).success).toBe(true);
    expect(emoteSchema.safeParse({ ...seven, url: "https://evil.example/emote/x/2x.webp" }).success).toBe(false);
    expect(emoteSchema.safeParse({ ...seven, url: "http://cdn.7tv.app/emote/x/2x.webp" }).success).toBe(false);
  });
  it("reconhece o código do 7TV no texto recebido, como faz com BTTV e FFZ", () => {
    const parsed = emoteSchema.parse(seven);
    const parts = messageParts(message("vai de GAMBA hoje"), new Map([["GAMBA", parsed]]));
    expect(parts.filter((p) => p.emote).map((p) => p.emote?.provider)).toEqual(["7tv"]);
    expect(parts.map((p) => p.text).join("")).toBe("vai de GAMBA hoje");
  });
});
