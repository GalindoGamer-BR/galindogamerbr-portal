import { useRef, useState } from 'react'
import { Button } from '../ui/Button'
import { DownloadIcon } from '../ui/DownloadIcon'
import { ScheduleExportTemplate } from './ScheduleExportTemplate'
import { exportScheduleImage } from '../../lib/exportScheduleImage'
import type { ScheduleBlock } from '../../lib/api/schedule'

type ScheduleExportButtonProps = {
  blocks: ScheduleBlock[]
}

export function ScheduleExportButton({ blocks }: ScheduleExportButtonProps) {
  const portraitRef = useRef<HTMLDivElement>(null)
  const wideRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState<'portrait' | 'wide' | null>(null)

  async function handleExport(variant: 'portrait' | 'wide') {
    const node = variant === 'portrait' ? portraitRef.current : wideRef.current
    if (!node) return
    setExporting(variant)
    try {
      await exportScheduleImage(
        node,
        variant === 'portrait' ? 'programacao-galindogamerbr.jpg' : 'programacao-galindogamerbr-youtube.jpg',
        1,
      )
    } finally {
      setExporting(null)
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button variant="default" onClick={() => handleExport('portrait')} disabled={exporting !== null}>
          {exporting !== 'portrait' && <DownloadIcon />}
          {exporting === 'portrait' ? 'Gerando...' : 'Retrato 4:5 · 1080×1350'}
        </Button>
        <Button variant="default" onClick={() => handleExport('wide')} disabled={exporting !== null}>
          {exporting !== 'wide' && <DownloadIcon />}
          {exporting === 'wide' ? 'Gerando...' : 'Paisagem 16:9 · 1920×1080'}
        </Button>
      </div>
      {/* Renderizado fora da tela (não display:none — html-to-image precisa de layout real pra capturar). */}
      <div style={{ position: 'fixed', top: 0, left: -9999, pointerEvents: 'none' }} aria-hidden="true">
        <ScheduleExportTemplate ref={portraitRef} blocks={blocks} variant="portrait" />
        <ScheduleExportTemplate ref={wideRef} blocks={blocks} variant="wide" />
      </div>
    </>
  )
}
