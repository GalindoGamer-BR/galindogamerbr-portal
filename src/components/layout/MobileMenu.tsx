import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from './navItems'

type MobileMenuProps = {
  open: boolean
  onClose: () => void
  signedIn: boolean
  onLogin: () => void
  onLogout: () => void
}

export function MobileMenu({ open, onClose, signedIn, onLogin, onLogout }: MobileMenuProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="xl:hidden">
      <nav className="flex max-h-[calc(100dvh-5rem)] flex-col gap-1 overflow-y-auto border-t border-line bg-panel px-5 py-4" aria-label="Menu principal">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `rounded-md px-3 py-3 text-sm font-semibold uppercase tracking-wide ${
                isActive ? 'bg-panel2 text-gold' : 'text-white/80 hover:bg-panel2'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
        {signedIn ? (
          <NavLink to="/membro" onClick={onClose} className="rounded-md px-3 py-3 text-sm font-semibold uppercase tracking-wide text-white/80">Área do membro</NavLink>
        ) : (
          <button type="button" onClick={() => { onClose(); onLogin() }} className="rounded-md px-3 py-3 text-left text-sm font-semibold uppercase tracking-wide text-white/80 hover:bg-panel2">Entrar</button>
        )}
        {signedIn && (
          <button type="button" onClick={() => { onClose(); onLogout() }} className="rounded-md px-3 py-3 text-left text-sm font-semibold uppercase tracking-wide text-white/80 hover:bg-panel2">
            Sair
          </button>
        )}
      </nav>
    </div>
  )
}
