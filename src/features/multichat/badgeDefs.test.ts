import { describe, expect, it } from "vitest";
import { badgeKey, badgeLabel, badgeSet, isBadgeHidden, parseHiddenBadges, toggleBadge } from "./badgeDefs";

describe("selos do chat", () => {
  it("agrupa as versões de um selo da Twitch no mesmo conjunto", () => {
    expect(badgeSet("subscriber/12")).toBe("subscriber");
    expect(badgeSet("moderator")).toBe("moderator");
    expect(badgeKey("twitch", "subscriber/12")).toBe("twitch:subscriber");
  });
  it("esconde e volta a mostrar sem mexer nos outros selos", () => {
    const hidden = toggleBadge([], "youtube", "member");
    expect(hidden).toEqual(["youtube:member"]);
    expect(isBadgeHidden(hidden, "youtube", "member")).toBe(true);
    expect(isBadgeHidden(hidden, "kick", "member")).toBe(false);
    expect(isBadgeHidden(hidden, "youtube", "moderator")).toBe(false);
    expect(toggleBadge(hidden, "youtube", "member")).toEqual([]);
  });
  it("ignora lixo no que foi salvo no navegador", () => {
    expect(parseHiddenBadges('["youtube:member", 3, "x", "kick:vip"]')).toEqual(["youtube:member", "kick:vip"]);
    expect(parseHiddenBadges("não é json")).toEqual([]);
    expect(parseHiddenBadges(null)).toEqual([]);
  });
  it("usa o id quando o selo não está na lista", () => {
    expect(badgeLabel("youtube", "member")).toBe("Membro");
    expect(badgeLabel("kick", "novo_selo")).toBe("novo_selo");
  });
});
