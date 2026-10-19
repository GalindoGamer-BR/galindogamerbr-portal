import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { NavMember } from './useNavSession'
import { LogoutIcon, SettingsIcon, UserIcon } from '../ui/Icons'

type AccountMenuProps = {
  member: NavMember | null
  onLogout: () => void
}

// Foto e nome de exibição do usuário na navbar; o clique abre o menu com área do membro e sair.
export function AccountMenu({ member, onLogout }: AccountMenuProps) {
  const [open, setOpen] = useState(false)
  const [avatarFailed, setAvatarFailed] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false) }
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => { document.removeEventListener('pointerdown', onPointerDown); document.removeEventListener('keydown', onKeyDown) }
  }, [open])

  const name = member?.name ?? 'Minha conta'
  const itemClass = 'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-white/85 transition hover:bg-panel2 hover:text-gold'
  const iconClass = 'h-[18px] w-[18px] shrink-0 text-white/60'

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex items-center gap-2.5 rounded-full border border-line bg-panel2/60 py-1 pl-1 pr-3 text-sm font-semibold text-white/90 transition hover:border-gold hover:text-gold"
      >
        <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-gold/50 bg-panel text-xs font-bold text-gold">
          {member?.avatarUrl && !avatarFailed ? (
            <img src={member.avatarUrl} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" onError={() => setAvatarFailed(true)} />
          ) : (
            <span aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
          )}
        </span>
        <span className="max-w-[140px] truncate">{name}</span>
        <span aria-hidden="true" className={`text-xs text-white/60 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-lg border border-line bg-panel shadow-xl">
          <Link to="/membro" onClick={() => setOpen(false)} className={itemClass}><UserIcon className={iconClass} />Área do membro</Link>
          {member?.isAdmin && <Link to="/admin" onClick={() => setOpen(false)} className={itemClass}><SettingsIcon className={iconClass} />Painel admin</Link>}
          <button type="button" onClick={() => { setOpen(false); onLogout() }} className={`${itemClass} border-t border-line`}><LogoutIcon className={iconClass} />Sair</button>
        </div>
      )}
    </div>
  )
}
