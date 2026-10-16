import { forwardRef } from 'react'
import { fontStack } from '../../styles/theme'
import type { ScheduleBlock } from '../../lib/api/schedule'
import { blockIconKind, type BlockIconKind } from '../../lib/blockIcon'

export type ScheduleExportVariant = 'portrait' | 'wide'

const FULL_DAY_NAMES: Record<number, string> = {
  1: 'SEGUNDA',
  2: 'TERÇA',
  3: 'QUARTA',
  4: 'QUINTA',
  5: 'SEXTA',
  6: 'SÁBADO',
  7: 'DOMINGO',
}

// Posição de cada slot de horário (em px, na resolução nativa 1024x1536) —
// medida via varredura de pixel nas bordas dos cards do template (v3, sem
// o selo quadrado à esquerda — removido da arte), não é um chute visual.
// As linhas de TERÇA e QUINTA já nascem mais altas na própria arte
// (108/104px vs ~85-92px das demais) porque são os dois dias com dois
// blocos de horário. Ver conversa/memória do projeto pra reproduzir se o
// template (WebP) for atualizado de novo.
const PORTRAIT_DAY_ROWS: Array<{ day: number; top: number; height: number }> = [
  { day: 1, top: 449, height: 103 },
  { day: 2, top: 559, height: 104 },
  { day: 3, top: 670, height: 103 },
  { day: 4, top: 780, height: 103 },
  { day: 5, top: 891, height: 102 },
  { day: 6, top: 1001, height: 103 },
  { day: 7, top: 1112, height: 103 },
]

const OFFLINE_RED = '#E53935'
const ICON_GAP = 10

const TEMPLATES = {
  portrait: {
    width: 1080,
    height: 1350,
    background: '/assets/programacao/schedule-export-template-v2.webp',
    rows: PORTRAIT_DAY_ROWS,
    boxLeft: 318,
    boxRight: 1057,
    dayIconLeft: 0,
    dayIconSize: 0,
    timeIconSize: 38,
    timeFontSize: 32,
    offlineTitleSize: 31,
    offlineTextSize: 25,
  },
  wide: {
    width: 1920,
    height: 1080,
    background: '/assets/programacao/schedule-export-template-wide.webp',
    rows: [
      { day: 1, top: 372, height: 71 },
      { day: 2, top: 451, height: 71 },
      { day: 3, top: 530, height: 71 },
      { day: 4, top: 609, height: 67 },
      { day: 5, top: 684, height: 68 },
      { day: 6, top: 761, height: 67 },
      { day: 7, top: 834, height: 68 },
    ],
    boxLeft: 1015,
    boxRight: 1823,
    dayIconLeft: 712,
    dayIconSize: 39,
    timeIconSize: 30,
    timeFontSize: 28,
    offlineTitleSize: 25,
    offlineTextSize: 20,
  },
} as const

// Ícones dos ícones do Flaticon (Magnific — "sun"/"sunset" packs, indicados
// pelo Pedro) recoloridos pra dourado da marca e salvos como PNG comuns em
// public/assets — <img> é o único tipo de elemento confirmado confiável com
// html-to-image nesse projeto (emoji e <svg>/<div> decorativo sumiam no PNG
// exportado; os selos de dia antigos usavam <img> e sempre apareceram certo).
function TimeIcon({ kind, size }: { kind: BlockIconKind; size: number }) {
  return (
    <img
      src={kind === 'sun' ? '/assets/icons/schedule-icon-sun.webp' : '/assets/icons/schedule-icon-sunset.webp'}
      alt=""
      style={{ width: size, height: size, flexShrink: 0 }}
    />
  )
}

type ScheduleExportTemplateProps = {
  blocks: ScheduleBlock[]
  variant?: ScheduleExportVariant
}

// Template offscreen renderizado pra exportação de imagem (ScheduleExportButton
// / PublicScheduleExportButton). Usa a arte de fundo pronta (template (WebP)) e só
// sobrepõe o texto de cada dia nas posições medidas acima — mais simples e mais
// fiel ao design de referência do que recriar o layout inteiro em CSS.
export const ScheduleExportTemplate = forwardRef<HTMLDivElement, ScheduleExportTemplateProps>(function ScheduleExportTemplate(
  { blocks, variant = 'portrait' },
  ref,
) {
  const template = TEMPLATES[variant]

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        width: template.width,
        height: template.height,
        backgroundImage: `url(${template.background})`,
        backgroundSize: `${template.width}px ${template.height}px`,
        fontFamily: fontStack('body'),
      }}
    >
      {template.rows.map(({ day, top, height, ...row }) => {
        const nudge = 'nudge' in row ? row.nudge : undefined
        const dayBlocks = blocks
          .filter((b) => b.dayOfWeek === day)
          .slice()
          .sort((a, b) => a.startTime.localeCompare(b.startTime))
        const isOffline = dayBlocks.length === 0

        return (
          <div key={day} style={{ transform: nudge ? `translateY(${nudge}px)` : undefined }}>
            {template.dayIconSize > 0 && (
              <img
                src={isOffline ? '/assets/icons/schedule-icon-offline.webp' : '/assets/icons/schedule-icon-calendar.webp'}
                alt=""
                style={{
                  position: 'absolute',
                  left: template.dayIconLeft,
                  top: top + (height - template.dayIconSize) / 2,
                  width: template.dayIconSize,
                  height: template.dayIconSize,
                }}
              />
            )}
            <div
              aria-label={FULL_DAY_NAMES[day]}
              style={{
                position: 'absolute',
                left: template.boxLeft,
                top,
                width: template.boxRight - template.boxLeft,
                height,
                display: 'flex',
                alignItems: 'center',
                paddingLeft: 14,
                paddingRight: 10,
                boxSizing: 'border-box',
              }}
            >
              {isOffline ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', alignItems: 'center', width: '100%' }}>
                  <div style={{ justifySelf: 'center', fontSize: template.offlineTitleSize, fontWeight: 800, color: OFFLINE_RED, letterSpacing: 1 }}>OFFLINE</div>
                  <div style={{ justifySelf: 'center', textAlign: 'center', fontSize: template.offlineTextSize, fontWeight: 600, color: '#f3f5f7', lineHeight: 1.3 }}>
                    Descanso e preparação
                    <br />
                    para novas lives!
                  </div>
                </div>
              ) : dayBlocks.length === 1 ? (
                <div style={{ display: 'flex', width: '50%', alignItems: 'center', justifyContent: 'center', gap: ICON_GAP }}>
                  <TimeIcon kind={blockIconKind(dayBlocks[0].startTime)} size={template.timeIconSize} />
                  <span style={{ fontSize: template.timeFontSize, fontWeight: 1000, letterSpacing: 0.1, color: '#f3f5f7', whiteSpace: 'nowrap' }}>
                    {dayBlocks[0].startTime} às {dayBlocks[0].endTime}
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    width: '100%',
                    alignItems: 'center',
                  }}
                >
                  {dayBlocks.map((block, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: ICON_GAP }}>
                      <TimeIcon kind={blockIconKind(block.startTime)} size={template.timeIconSize} />
                      <span style={{ fontSize: template.timeFontSize, fontWeight: 1000, letterSpacing: 0.1, color: '#f3f5f7', whiteSpace: 'nowrap' }}>
                        {block.startTime} às {block.endTime}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
})
