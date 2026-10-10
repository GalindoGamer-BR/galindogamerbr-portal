type IconProps = { className?: string }

const base = { viewBox: '0 0 20 20', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const
const size = (className?: string) => className ?? 'inline-block h-4 w-4 shrink-0 align-[-2px]'

// Ícone de voltar (chevron para a esquerda) e de início (casinha), em currentColor.
export function BackIcon({ className }: IconProps) {
  return (
    <svg {...base} className={size(className)}>
      <path d="M12.5 4.5 7 10l5.5 5.5" />
    </svg>
  )
}

export function HomeIcon({ className }: IconProps) {
  return (
    <svg {...base} className={size(className)}>
      <path d="M3 9.2 10 3l7 6.2" />
      <path d="M4.8 8.4V16h3.7v-4.3h3V16h3.7V8.4" />
    </svg>
  )
}
