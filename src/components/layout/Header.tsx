import { useCallback, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { NAV_ITEMS } from './navItems'
import { MobileMenu } from './MobileMenu'
import { Logo } from '../ui/Logo'
import { AccountMenu } from './AccountMenu'
import { LoginModal } from './LoginModal'
import { useNavSession } from './useNavSession'

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const closeLogin = useCallback(() => setLoginOpen(false), [])
  const { signedIn, member, logout } = useNavSession()

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-container items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <Link to="/" className="flex items-center gap-3" aria-label="GalindoGamerBR, início">
          <Logo className="h-[52px] w-[52px]" />
          <div className="text-center leading-tight">
            <strong className="block text-sm tracking-wide">
              GALINDO<span className="text-gold">GAMER</span>BR
            </strong>
            <small className="block text-[10px] uppercase tracking-widest text-muted">Streaming Community</small>
            <span className="mt-1 block h-px w-full bg-gold" />
          </div>
        </Link>

        <nav className="hidden items-center gap-6 xl:flex" aria-label="Menu principal">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `group relative py-1 text-sm font-semibold uppercase tracking-wide transition hover:text-gold ${
                  isActive ? 'text-gold' : 'text-white/80'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  {/* Barrinha embaixo do item — cheia na página ativa, cresce a
                      partir do centro no hover das outras. */}
                  <span
                    className={`absolute inset-x-0 -bottom-1 h-0.5 origin-center scale-x-0 rounded-full bg-gold transition-transform duration-300 group-hover:scale-x-100 ${
                      isActive ? 'scale-x-100' : ''
                    }`}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="hidden xl:block">
          {signedIn ? (
            <AccountMenu member={member} onLogout={() => void logout()} />
          ) : (
            <button type="button" onClick={() => setLoginOpen(true)} className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-white/90 transition hover:border-gold hover:text-gold">
              Entrar
            </button>
          )}
        </div>

        <button
          type="button"
          className="rounded-md border border-line px-3 py-2 text-xl leading-none xl:hidden"
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} signedIn={signedIn} isAdmin={member?.isAdmin} onLogin={() => setLoginOpen(true)} onLogout={() => void logout()} />
      {loginOpen && <LoginModal onClose={closeLogin} />}
    </header>
  )
}
