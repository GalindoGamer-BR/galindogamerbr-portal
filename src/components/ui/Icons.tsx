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

export function CameraIcon({ className }: IconProps) {
  return (
    <svg {...base} className={size(className)}>
      <path d="M2.5 7.2c0-.9.7-1.7 1.7-1.7h1.4l1.1-1.6c.2-.3.5-.4.9-.4h4.8c.3 0 .6.1.8.4l1.1 1.6h1.5c.9 0 1.7.7 1.7 1.7v7c0 .9-.7 1.6-1.7 1.6H4.2c-.9 0-1.7-.7-1.7-1.6v-7Z" />
      <circle cx="10" cy="10.6" r="2.9" />
    </svg>
  )
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg {...base} className={size(className)}>
      <circle cx="10" cy="7" r="3.2" />
      <path d="M3.8 16.5c.6-3 3.1-4.7 6.2-4.7s5.6 1.7 6.2 4.7" />
    </svg>
  )
}

export function ChatIcon({ className }: IconProps) {
  return (
    <svg {...base} className={size(className)}>
      <path d="M4.2 4h11.6c.9 0 1.7.8 1.7 1.7v6.6c0 .9-.8 1.7-1.7 1.7H9.4L5.8 17v-3H4.2c-.9 0-1.7-.8-1.7-1.7V5.7C2.5 4.8 3.3 4 4.2 4Z" />
      <path d="M6.5 8h7M6.5 10.6h4.2" />
    </svg>
  )
}

export function LogoutIcon({ className }: IconProps) {
  return (
    <svg {...base} className={size(className)}>
      <path d="M8 3.5H5.2c-.9 0-1.7.8-1.7 1.7v9.6c0 .9.8 1.7 1.7 1.7H8" />
      <path d="M12.3 6.5 16 10l-3.7 3.5M16 10H8" />
    </svg>
  )
}

export function HelpIcon({ className }: IconProps) {
  return (
    <svg {...base} className={size(className)}>
      <circle cx="10" cy="10" r="7.2" />
      <path d="M7.9 7.9a2.2 2.2 0 1 1 3.3 1.9c-.8.5-1.2.9-1.2 1.8M10 14v.01" />
    </svg>
  )
}

export function SettingsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={size(className)}>
      <circle cx="10" cy="10" r="2.6" />
      <path d="M10 2.8v1.9M10 15.3v1.9M2.8 10h1.9M15.3 10h1.9M4.9 4.9l1.3 1.3M13.8 13.8l1.3 1.3M15.1 4.9l-1.3 1.3M6.2 13.8l-1.3 1.3" />
    </svg>
  )
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg {...base} className={size(className)}>
      <circle cx="8.8" cy="8.8" r="5.3" />
      <path d="m12.8 12.8 4 4" />
    </svg>
  )
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg {...base} className={size(className)}>
      <circle cx="10" cy="10" r="7.2" />
      <path d="M10 5.6V10l3 1.8" />
    </svg>
  )
}

export function GlobeIcon({ className }: IconProps) {
  return (
    <svg {...base} className={size(className)}>
      <circle cx="10" cy="10" r="7.2" />
      <path d="M2.8 10h14.4M10 2.8c2 2 3 4.4 3 7.2s-1 5.2-3 7.2c-2-2-3-4.4-3-7.2s1-5.2 3-7.2Z" />
    </svg>
  )
}
