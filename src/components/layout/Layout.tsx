import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import { PageBackground } from './PageBackground'
import { Seo } from './Seo'

export function Layout() {
  const { pathname } = useLocation()

  useEffect(() => {
    // scroll-behavior: auto !important (global.css) só cobre rolagem via
    // CSS/anchor — behavior explícito no scrollTo() ignora isso, então
    // checa prefers-reduced-motion aqui também.
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    window.scrollTo({ top: 0, behavior })
  }, [pathname])

  if (pathname === "/multichat") return <><Seo /><Outlet /></>

  return (
    <div className="flex min-h-screen flex-col">
      <Seo />
      {/* Fundo padrão de todas as páginas — uma página específica pode
          sobrepor renderizando seu próprio <PageBackground> (ex.: Sobre.tsx),
          que vence por vir depois no DOM, mesmo z-index. */}
      <PageBackground image="/assets/body-bg.webp" />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
