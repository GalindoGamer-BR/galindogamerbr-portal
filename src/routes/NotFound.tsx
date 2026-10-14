import { Link } from 'react-router-dom'
import { Container } from '../components/ui/Container'
import { HomeIcon } from '../components/ui/Icons'

export function NotFound() {
  return (
    <section className="py-24 text-center">
      <Container>
        <h1 className="text-5xl">404</h1>
        <p className="mt-4 text-muted">Página não encontrada.</p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 rounded-md bg-gold px-5 py-3 text-sm font-semibold uppercase tracking-wide text-bg transition hover:-translate-y-0.5 hover:brightness-110"
        >
          <HomeIcon /> Voltar ao início
        </Link>
      </Container>
    </section>
  )
}
