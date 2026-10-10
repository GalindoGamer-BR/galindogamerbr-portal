import { Link } from 'react-router-dom'
import { Eyebrow } from '../ui/Eyebrow'

type AdminHeaderProps = {
  title: string
  email: string
  onLogout: () => void
  backTo?: string
}

// Cabeçalho comum do painel: mantém identidade, sessão, logout e navegação
// entre telas administrativas no mesmo lugar.
export function AdminHeader({ title, email, onLogout, backTo }: AdminHeaderProps) {
  return (
    <>
      <Eyebrow>Admin</Eyebrow>
      <h1 className="text-4xl">{title}</h1>
      <div className="mt-2 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">Logado como {email}.</p>
          {backTo && (
            <Link to={backTo} className="mt-1 inline-block text-xs font-semibold uppercase text-gold hover:underline">
              Voltar ao painel
            </Link>
          )}
        </div>
        <button type="button" onClick={onLogout} className="text-xs font-semibold uppercase text-white/50 hover:text-red">
          Sair
        </button>
      </div>
    </>
  )
}
