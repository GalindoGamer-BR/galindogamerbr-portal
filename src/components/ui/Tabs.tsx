import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'

export type TabItem = { id: string; label: string; /** Outros hashes que abrem esta aba (links antigos, como #participar). */ hashAliases?: string[] }

/** Aba que o hash da URL aponta (`#mods`), ou `null` quando o hash é vazio ou não é de nenhuma aba (ex.: `#vip`, que é seção). */
export function findTabByHash(hash: string, tabs: TabItem[]): string | null {
  const wanted = decodeSafe(hash.replace(/^#/, '')).toLowerCase()
  if (!wanted) return null
  const found = tabs.find((tab) => tab.id.toLowerCase() === wanted || tab.hashAliases?.some((alias) => alias.toLowerCase() === wanted))
  return found ? found.id : null
}

/** Aba que o hash aponta, ou `fallback` quando vazio ou desconhecido. */
export function resolveTabFromHash(hash: string, tabs: TabItem[], fallback: string): string {
  return findTabByHash(hash, tabs) ?? fallback
}

/** Para onde o teclado leva o foco: setas com volta ao outro lado, Home e End. `null` para qualquer outra tecla. */
export function nextTabId(ids: string[], current: string, key: string): string | null {
  const index = ids.indexOf(current)
  if (index === -1 || ids.length === 0) return null
  if (key === 'ArrowRight') return ids[(index + 1) % ids.length]
  if (key === 'ArrowLeft') return ids[(index - 1 + ids.length) % ids.length]
  if (key === 'Home') return ids[0]
  if (key === 'End') return ids[ids.length - 1]
  return null
}

function decodeSafe(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

type TabsProps = {
  tabs: TabItem[]
  defaultId: string
  /** Prefixo dos ids de DOM (`<prefixo>-tab-<id>`, `<prefixo>-panel-<id>`). */
  idPrefix: string
  ariaLabel: string
  /** Só o painel ativo é renderizado. */
  renderPanel: (id: string) => ReactNode
}

/**
 * Abas acessíveis (WAI-ARIA tabs) sincronizadas com o hash da URL: `/pagina#mods` abre a aba Mods, trocar de aba troca o
 * hash sem empilhar histórico, e o hash também reage a links internos que mudam só o `#`.
 */
export function Tabs({ tabs, defaultId, idPrefix, ariaLabel, renderPanel }: TabsProps) {
  const [active, setActive] = useState(() => resolveTabFromHash(typeof window === 'undefined' ? '' : window.location.hash, tabs, defaultId))
  const wrapperRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef(new Map<string, HTMLButtonElement>())

  const select = useCallback((id: string) => {
    setActive(id)
    window.history.replaceState(window.history.state, '', `#${id}`)
  }, [])

  useEffect(() => {
    // Hash que não é de aba (#vip, uma seção da página) não mexe na aba atual.
    const onHashChange = () => {
      const id = findTabByHash(window.location.hash, tabs)
      if (id) setActive(id)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [tabs])

  // Deep link (abriu /pagina#mods): leva a barra de abas para a tela. O Layout rola para o topo a cada troca de rota, então
  // isto roda depois dele (setTimeout) para não ser desfeito. Hash que não é de aba fica por conta de quem o usa.
  useEffect(() => {
    if (!findTabByHash(window.location.hash, tabs)) return
    const timer = window.setTimeout(() => wrapperRef.current?.scrollIntoView({ block: 'start' }), 0)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só na montagem
  }, [])

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = nextTabId(tabs.map((tab) => tab.id), active, event.key)
    if (!next) return
    event.preventDefault()
    select(next)
    tabRefs.current.get(next)?.focus()
  }

  return (
    <div ref={wrapperRef} className="scroll-mt-24">
      <div
        role="tablist"
        aria-label={ariaLabel}
        onKeyDown={onKeyDown}
        className="-mx-5 flex snap-x gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
      >
        {tabs.map((tab) => {
          const selected = tab.id === active
          return (
            <button
              key={tab.id}
              ref={(element) => {
                if (element) tabRefs.current.set(tab.id, element)
                else tabRefs.current.delete(tab.id)
              }}
              type="button"
              role="tab"
              id={`${idPrefix}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${idPrefix}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(tab.id)}
              className={`snap-start whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition ${
                selected ? 'border-green bg-green/15 text-white' : 'border-line text-muted hover:border-gold/60 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      <div role="tabpanel" id={`${idPrefix}-panel-${active}`} aria-labelledby={`${idPrefix}-tab-${active}`} tabIndex={0} className="mt-6 focus:outline-none">
        {renderPanel(active)}
      </div>
    </div>
  )
}
