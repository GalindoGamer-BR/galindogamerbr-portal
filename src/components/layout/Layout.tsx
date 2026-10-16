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

  if (pathname === "/live") return <><Seo /><Outlet /></>

  return (
    <div className="flex min-h-screen flex-col">
      <Seo />
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-md focus:bg-gold focus:px-4 focus:py-2 focus:font-semibold focus:text-bg">
        Pular para o conteúdo
      </a>
      {/* Fundo padrão de todas as páginas — uma página específica pode
          sobrepor renderizando seu próprio <PageBackground> (ex.: Sobre.tsx),
          que vence por vir depois no DOM, mesmo z-index. */}
      <PageBackground image="/assets/body-bg.webp" />
      <Header />
      <main id="conteudo" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
