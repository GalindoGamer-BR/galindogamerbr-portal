import { lazy, Suspense, type ComponentType, type ReactElement } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Home } from './routes/Home'
import { BemVindo } from './routes/BemVindo'
import { Conteudos } from './routes/Conteudos'
import { Fazenda } from './routes/Fazenda'
import { Mods } from './routes/Mods'
import { Comunidade } from './routes/Comunidade'
import { Sobre } from './routes/Sobre'
import { Parceiros } from './routes/Parceiros'
import { Privacidade } from './routes/Privacidade'
import { Termos } from './routes/Termos'
import { Creditos } from './routes/Creditos'
import { MapaDoSite } from './routes/MapaDoSite'
import { NotFound } from './routes/NotFound'

// Chunks têm hash de conteúdo no nome (ver vite.config) — depois de um
// deploy novo, os arquivos antigos somem do servidor. Uma aba que ficou
// aberta desde antes do deploy (ou um bfcache/HTML em cache) tenta buscar o
// chunk antigo, recebe 404, e o import() rejeitado sobe até o errorElement
// (NotFound, que exibe "404") sem nenhuma explicação — parece um bug de
// rota. Recarregar a página pega o index.html/hashes atuais e resolve
// sozinho; só uma vez por navegação pra não entrar em loop se o erro for
// outra coisa (ex.: rede offline de verdade).
function lazyWithReload<T extends ComponentType<unknown>>(load: () => Promise<{ default: T }>) {
  return lazy(() =>
    load().catch((err: unknown) => {
      const key = 'ggb:chunk-reload-attempted'
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1')
        window.location.reload()
        return new Promise<{ default: T }>(() => {}) // nunca resolve — a página já vai recarregar
      }
      throw err
    }),
  )
}

// Rotas /admin/*: ninguém que não seja o próprio admin visita — importar
// estático colocava Login/editor de programação/TikTok no bundle de
// qualquer visitante da Home. Um único Suspense pro grupo inteiro (a
// navegação entre elas já é rara o suficiente pra não precisar de
// granularidade por rota).
const MultichatPage = lazyWithReload(() => import('./features/multichat/MultichatPage'))
const Login = lazyWithReload(() => import('./routes/admin/Login').then((m) => ({ default: m.Login })))
const AdminIndex = lazyWithReload(() => import('./routes/admin/Index').then((m) => ({ default: m.AdminIndex })))
const Schedule = lazyWithReload(() => import('./routes/admin/Schedule').then((m) => ({ default: m.Schedule })))
const TikTok = lazyWithReload(() => import('./routes/admin/TikTok').then((m) => ({ default: m.TikTok })))
const Discord = lazyWithReload(() => import('./routes/admin/Discord').then((m) => ({ default: m.Discord })))
const FarmWelcomeVideo = lazyWithReload(() => import('./routes/admin/FarmWelcomeVideo').then((m) => ({ default: m.FarmWelcomeVideo })))

function AdminRouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-line border-t-gold" />
    </div>
  )
}

function withAdminSuspense(element: ReactElement): ReactElement {
  return <Suspense fallback={<AdminRouteFallback />}>{element}</Suspense>
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <NotFound />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/boasvindas', element: <BemVindo /> },
      { path: '/boas-vindas', element: <Navigate to="/boasvindas" replace /> },
      { path: '/comece-aqui', element: <Navigate to="/boasvindas" replace /> },
      { path: '/conteudos', element: <Conteudos /> },
      { path: '/jogos', element: <Navigate to="/conteudos" replace /> },
      { path: '/fazenda', element: <Fazenda /> },
      { path: '/mods', element: <Mods /> },
      { path: '/comunidade', element: <Comunidade /> },
      { path: '/multichat', element: withAdminSuspense(<MultichatPage />) },
      { path: '/sobre', element: <Sobre /> },
      { path: '/parceiros', element: <Parceiros /> },
      { path: '/privacidade', element: <Privacidade /> },
      { path: '/termos', element: <Termos /> },
      { path: '/creditos', element: <Creditos /> },
      { path: '/mapa-do-site', element: <MapaDoSite /> },
      { path: '/admin', element: withAdminSuspense(<AdminIndex />) },
      { path: '/admin/login', element: withAdminSuspense(<Login />) },
      { path: '/admin/programacao', element: withAdminSuspense(<Schedule />) },
      { path: '/admin/tiktok', element: withAdminSuspense(<TikTok />) },
      { path: '/admin/discord', element: withAdminSuspense(<Discord />) },
      { path: '/admin/fazenda/video', element: withAdminSuspense(<FarmWelcomeVideo />) },
      { path: '*', element: <NotFound /> },
    ],
  },
])

export function App() {
  return <RouterProvider router={router} />
}
