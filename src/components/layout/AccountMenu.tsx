import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { NavMember } from './useNavSession'

type AccountMenuProps = {
  member: NavMember | null
  onLogout: () => void
}

// Foto do usuário na navbar; abre um menu com a área do membro, o multichat e o sair.
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
  const itemClass = 'block w-full px-4 py-2.5 text-left text-sm text-white/85 transition hover:bg-panel2 hover:text-gold'

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Menu da conta de ${name}`}
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-line bg-panel2 text-sm font-bold text-gold transition hover:border-gold"
      >
        {member?.avatarUrl && !avatarFailed ? (
          <img src={member.avatarUrl} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" onError={() => setAvatarFailed(true)} />
        ) : (
          <span aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
        )}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-lg border border-line bg-panel shadow-xl">
          <p className="truncate border-b border-line px-4 py-3 text-sm font-semibold text-white">{name}</p>
          <Link role="menuitem" to="/membro" onClick={() => setOpen(false)} className={itemClass}>Área do membro</Link>
          <Link role="menuitem" to="/live" onClick={() => setOpen(false)} className={itemClass}>Multichat</Link>
          <button role="menuitem" type="button" onClick={() => { setOpen(false); onLogout() }} className={`${itemClass} border-t border-line`}>Sair</button>
        </div>
      )}
    </div>
  )
}
