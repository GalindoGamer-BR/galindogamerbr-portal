import { useEffect, useState } from 'react'
import { getFarmStatus, type FarmStatusResponse } from '../lib/api/farmStatus'

const CACHE_KEY = 'ggb:farm-status'

function readCache(): FarmStatusResponse | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    const cached = raw ? (JSON.parse(raw) as FarmStatusResponse) : null
    return cached?.ok && cached.status ? cached : null
  } catch {
    return null
  }
}

// Consulta o servidor ao montar o componente; o Worker busca os dados na hora.
export function useFarmStatus(): { data: FarmStatusResponse | null; loading: boolean } {
  const [data, setData] = useState<FarmStatusResponse | null>(() => readCache())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getFarmStatus()
      .then((response) => {
        if (!active) return
        if (!response.ok || !response.status) {
          setData(null)
          try { localStorage.removeItem(CACHE_KEY) } catch { /* Armazenamento indisponível. */ }
          return
        }
        setData(response)
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(response))
        } catch {
          // localStorage indisponível (modo privado, storage cheio etc.) — só não persiste
        }
      })
      .catch(() => {
        if (active) setData(null)
        try { localStorage.removeItem(CACHE_KEY) } catch { /* Armazenamento indisponível. */ }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return { data, loading }
}
