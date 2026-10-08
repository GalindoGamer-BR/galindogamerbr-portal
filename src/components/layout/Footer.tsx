import { SocialLinks } from './SocialLinks'
import { Link } from 'react-router-dom'
import { FOOTER_ITEMS } from './navItems'
import { Container } from '../ui/Container'

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-bg py-6">
      <Container className="flex flex-col items-center gap-3 text-center">
        <SocialLinks className="mb-2 flex-wrap justify-center" />
        <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-white/70" aria-label="Rodapé">
          {FOOTER_ITEMS.map((item) => (
            <Link key={item.to} to={item.to} className="hover:text-gold">
              {item.label}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-muted">© 2026 GalindoGamerBR. Todos os direitos reservados.</p>
      </Container>
    </footer>
  )
}
