import { useEffect, useState } from 'react'
import { DAYS } from '../../data/days'
import { getPublicSchedule, type PublicSchedule } from '../../lib/api/schedule'
import { blockIconKind } from '../../lib/blockIcon'

const LETTERS = 'ABCDEFGHIJ'

function cycleLabel(index: number, total: number): string {
  // Ciclo de até 10 semanas usa "Semana A/B/C..." (nome familiar); além
  // disso cai pro genérico "Semana N" — não deve acontecer na prática.
  return total <= LETTERS.length ? `Semana ${LETTERS[index]}` : `Semana ${index + 1}`
}

// Domingo=0 no JS Date; convertido pra 1=segunda..7=domingo (mesma
// convenção ISO usada em DAYS/schedule_blocks.day_of_week).
function todayIso(): number {
  const day = new Date().getDay()
  return day === 0 ? 7 : day
}

// Reusado no teaser da Home e na página completa de Programação — busca
// direto de /api/schedule (editor no-code da Fase 3 escreve nesses dados).
export function ScheduleTabs() {
  const [schedule, setSchedule] = useState<PublicSchedule | null>(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    getPublicSchedule().then(setSchedule)
  }, [])

  if (!schedule || schedule.weeks.length === 0) {
    return <div className="rounded-md border border-line bg-panel p-4 text-sm text-muted">Programação indisponível no momento.</div>
  }

  const week = schedule.weeks.find((w) => w.cycleIndex === active) ?? schedule.weeks[0]
  const today = todayIso()

  return (
    <div>
      {schedule.weeks.length > 1 && (
        <div role="tablist" aria-label="Escolha a semana" className="flex flex-wrap gap-2">
          {schedule.weeks.map((w) => (
            <button
              key={w.cycleIndex}
              type="button"
              role="tab"
              aria-selected={active === w.cycleIndex}
              onClick={() => setActive(w.cycleIndex)}
              className={`rounded-md px-4 py-2 text-sm font-semibold uppercase tracking-wide transition ${
                active === w.cycleIndex ? 'bg-gold text-bg' : 'bg-panel2 text-white/70 hover:text-white'
              }`}
            >
              {cycleLabel(w.cycleIndex, schedule.weeks.length)}
            </button>
          ))}
        </div>
      )}

      <div className={`${schedule.weeks.length > 1 ? 'mt-4 ' : ''}divide-y divide-line rounded-md border border-line bg-panel`}>
        {DAYS.map((day) => {
          const dayBlocks = week.blocks.filter((b) => b.dayOfWeek === day.value)
          const isToday = day.value === today
          const isOffline = dayBlocks.length === 0

          return (
            <div key={day.value} className={`flex items-center gap-3 px-4 py-3 text-sm ${isToday ? 'bg-gold/10' : ''}`}>
              <span
                className={`flex w-11 shrink-0 items-center justify-center rounded-md py-1 text-xs font-bold tracking-wide ${
                  isToday ? 'bg-gold text-bg' : 'bg-panel2 text-white/70'
                }`}
              >
                {day.label}
              </span>

              {isOffline ? (
                <span className="text-xs font-semibold uppercase tracking-wide text-white/30">Sem transmissão</span>
              ) : (
                <div className="flex flex-1 flex-col items-start gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-1">
                  {dayBlocks.map((b, index) => (
                    <span key={index} className="inline-flex items-center gap-1.5 text-white">
                      <img
                        src={
                          blockIconKind(b.startTime) === 'sun'
                            ? '/assets/icons/schedule-icon-sun.webp'
                            : '/assets/icons/schedule-icon-sunset.webp'
                        }
                        alt=""
                        className="h-4 w-4"
                      />
                      {b.startTime} até {b.endTime}
                    </span>
                  ))}
                </div>
              )}

              {isToday && <span className="ml-auto shrink-0 text-xs font-bold uppercase tracking-widest text-gold">Hoje</span>}
            </div>
          )
        })}
      </div>

      <p className="mt-4 text-xs text-muted">Horários de Brasília.</p>
    </div>
  )
}
