import { HomeIcon, SettingsIcon, UserIcon } from "../../components/ui/Icons";
import type { NavMember } from "../../components/layout/useNavSession";

/** Links do menu (fora o "Sair"): o painel admin só aparece para administradores, como no menu da navbar do site. */
export function userMenuLinks(member: NavMember | null) {
  return [
    { href: "/membro", label: "Área do membro", icon: UserIcon },
    ...(member?.isAdmin ? [{ href: "/admin", label: "Painel admin", icon: SettingsIcon }] : []),
    { href: "/", label: "Voltar ao portal", icon: HomeIcon },
  ];
}
