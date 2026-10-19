import { useRef, useState } from 'react'
import { Button } from '../ui/Button'
import { DownloadIcon } from '../ui/DownloadIcon'
import { ScheduleExportTemplate } from './ScheduleExportTemplate'
import { exportScheduleImage } from '../../lib/exportScheduleImage'
import { getPublicSchedule } from '../../lib/api/schedule'
import type { ScheduleBlock } from '../../lib/api/schedule'

// Versão pública do botão de exportação — busca a programação publicada
// na hora do clique, em vez de receber blocos já carregados (como o
// editor admin faz).
export function PublicScheduleExportButton() {
  const portraitRef = useRef<HTMLDivElement>(null)
  const wideRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([])

  async function handleExport() {
    setExporting(true)
    try {
      const schedule = await getPublicSchedule()
      const week = schedule.weeks[0]
      setBlocks(week ? week.blocks.map((block) => ({ ...block, cycleIndex: week.cycleIndex })) : [])

      // Espera o template re-renderizar com os dados novos antes de capturar.
      await new Promise((resolve) => requestAnimationFrame(resolve))
      const useWide = window.matchMedia('(orientation: landscape)').matches
      const node = useWide ? wideRef.current : portraitRef.current
      if (node) {
        await exportScheduleImage(
          node,
          useWide ? 'programacao-galindogamerbr-youtube.jpg' : 'programacao-galindogamerbr.jpg',
        )
      }
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <Button variant="default" className="w-full" onClick={handleExport} disabled={exporting}>
        {!exporting && <DownloadIcon />}
        {exporting ? 'Gerando imagem...' : 'Baixar imagem da programação'}
      </Button>
      <div style={{ position: 'fixed', top: 0, left: -9999, pointerEvents: 'none' }} aria-hidden="true">
        <ScheduleExportTemplate ref={portraitRef} blocks={blocks} variant="portrait" />
        <ScheduleExportTemplate ref={wideRef} blocks={blocks} variant="wide" />
      </div>
    </>
  )
}
