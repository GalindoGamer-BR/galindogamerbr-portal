import { Button } from '../ui/Button'
import { DownloadIcon } from '../ui/DownloadIcon'

// Versão pública do botão de exportação — só baixa o JPEG já renderizado no servidor
// (GET /api/schedule/image, gerado por tools/schedule-images na API). Nada é desenhado
// no navegador: o editor admin (ScheduleExportButton) é quem ainda usa o template local.
export function PublicScheduleExportButton() {
  function handleDownload() {
    // Mesma regra de antes: paisagem baixa a arte 16:9, retrato a 4:5. O ?download=1 responde
    // com Content-Disposition: attachment, o que dispara o download também em iOS/Android.
    const variant = window.matchMedia('(orientation: landscape)').matches ? 'wide' : 'portrait'
    window.location.assign(`/api/schedule/image?variant=${variant}&download=1`)
  }

  return (
    <Button variant="default" className="w-full" onClick={handleDownload}>
      <DownloadIcon />
      Baixar imagem da programação
    </Button>
  )
}
