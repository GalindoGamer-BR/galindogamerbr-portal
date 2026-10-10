import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from './navItems'

type MobileMenuProps = {
  open: boolean
  onClose: () => void
  signedIn: boolean
  onLogout: () => void
}

export function MobileMenu({ open, onClose, signedIn, onLogout }: MobileMenuProps) {
  if (!open) return null

  return (
    <div className="xl:hidden">
      <nav className="flex flex-col gap-1 border-t border-line bg-panel px-5 py-4" aria-label="Menu principal">
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
        <NavLink to={signedIn ? '/membro' : '/login'} onClick={onClose} className="rounded-md px-3 py-3 text-sm font-semibold uppercase tracking-wide text-white/80">{signedIn ? 'Área do membro' : 'Entrar'}</NavLink>
        {signedIn && (
          <button type="button" onClick={() => { onClose(); onLogout() }} className="rounded-md px-3 py-3 text-left text-sm font-semibold uppercase tracking-wide text-white/80 hover:bg-panel2">
            Sair
          </button>
        )}
      </nav>
    </div>
  )
}
