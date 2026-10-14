import { useEffect, useRef, useState } from "react";
import { HomeIcon, LogoutIcon, UserIcon } from "../../components/ui/Icons";
import type { NavMember } from "../../components/layout/useNavSession";

// Menu do usuário na barra do multichat: foto e nome de exibição; abre área do membro, portal e sair.
export function MultichatUserMenu({ member, onLogout }: { member: NavMember | null; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("pointerdown", onPointerDown); document.removeEventListener("keydown", onKeyDown); };
  }, [open]);
  const name = member?.name ?? "Minha conta";
  return <div ref={root} className="mc-user">
    <button type="button" className="mc-user-trigger" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(value => !value)}>
      <span className="mc-user-avatar">{member?.avatarUrl && !avatarFailed ? <img src={member.avatarUrl} alt="" referrerPolicy="no-referrer" onError={() => setAvatarFailed(true)} /> : <span aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>}</span>
      <span className="mc-user-name">{name}</span>
      <span className={`mc-user-caret${open ? " mc-user-caret-open" : ""}`} aria-hidden="true">▾</span>
    </button>
    {open && <div role="menu" className="mc-user-menu">
      <a role="menuitem" href="/membro"><UserIcon />Área do membro</a>
      <a role="menuitem" href="/"><HomeIcon />Voltar ao portal</a>
      <button role="menuitem" type="button" onClick={() => { setOpen(false); onLogout(); }}><LogoutIcon />Sair</button>
    </div>}
  </div>;
}
