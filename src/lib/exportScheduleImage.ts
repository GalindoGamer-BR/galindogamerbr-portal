// Import dinâmico: html-to-image só é usado quando o usuário clica em
// "Baixar imagem" (ScheduleExportButton.tsx) — carregar estático colocava a
// lib inteira no bundle de qualquer visitante da página de programação.
export async function exportScheduleImage(
  node: HTMLElement,
  filename = 'programacao-galindogamerbr.jpg',
  pixelRatio = 1,
): Promise<void> {
  const dataUrl = await renderScheduleImage(node, pixelRatio)
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.click()
}

export async function renderScheduleImage(node: HTMLElement, pixelRatio = 1): Promise<string> {
  const { toJpeg } = await import('html-to-image')
  // Os templates já usam a resolução final de publicação (vertical em
  // 1080x1350); pixelRatio maior duplicaria desnecessariamente o arquivo.
  // JPEG: bem menor que PNG (o edge limita o corpo da requisição) e vira foto normal no WhatsApp.
  return toJpeg(node, { pixelRatio, quality: 0.9 })
}
