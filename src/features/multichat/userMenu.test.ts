import { describe, expect, it } from "vitest";
import { userMenuLinks } from "./userMenu";

describe("menu do usuário no multichat", () => {
  it("administrador vê o painel admin entre a área do membro e o portal", () => {
    const links = userMenuLinks({ name: "ph_brz", avatarUrl: null, isAdmin: true });
    expect(links.map((link) => link.href)).toEqual(["/membro", "/admin", "/"]);
  });
  it("membro comum e visitante sem perfil carregado não veem o painel admin", () => {
    expect(userMenuLinks({ name: "ana", avatarUrl: null }).map((link) => link.href)).toEqual(["/membro", "/"]);
    expect(userMenuLinks({ name: "ana", avatarUrl: null, isAdmin: false }).map((link) => link.href)).toEqual(["/membro", "/"]);
    expect(userMenuLinks(null).map((link) => link.href)).toEqual(["/membro", "/"]);
  });
});
