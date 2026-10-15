import type { AnchorHTMLAttributes, ButtonHTMLAttributes, PropsWithChildren } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

const VARIANTS = {
  default: 'bg-panel2 border border-line hover:border-white/40',
  red: 'bg-red text-white hover:brightness-110',
  purple: 'bg-purple text-white hover:brightness-110',
  green: 'bg-green text-white hover:brightness-110',
  blue: 'bg-blue text-white hover:brightness-110',
  gold: 'bg-gold text-bg hover:brightness-110',
} as const

type Variant = keyof typeof VARIANTS

// Duas variações de tamanho — evita passar "text-xs" solto via className,
// que entraria em conflito de especificidade com o "text-sm" do base
// (a ordem de geração do Tailwind decide o vencedor, não a ordem no JSX).
const SIZES = {
  md: 'gap-2 rounded-md px-5 py-3 text-sm',
  sm: 'gap-1.5 rounded-md px-4 py-2.5 text-xs',
} as const

type Size = keyof typeof SIZES

const baseClasses = 'inline-flex items-center justify-center font-semibold uppercase tracking-wide transition hover:-translate-y-0.5'

function buttonClasses(variant: Variant = 'default', size: Size = 'md', className = ''): string {
  return `${baseClasses} ${SIZES[size]} ${VARIANTS[variant]} ${className}`
}

type ButtonProps = PropsWithChildren<{ variant?: Variant; size?: Size; className?: string }> &
  ButtonHTMLAttributes<HTMLButtonElement>

export function Button({ variant = 'default', size = 'md', className = '', children, ...rest }: ButtonProps) {
  return (
    <button className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </button>
  )
}

type LinkButtonProps = PropsWithChildren<{ variant?: Variant; size?: Size; className?: string }> &
  AnchorHTMLAttributes<HTMLAnchorElement>

// Para links externos (<a href>).
export function LinkButton({ variant = 'default', size = 'md', className = '', children, ...rest }: LinkButtonProps) {
  return (
    <a className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </a>
  )
}

type NavButtonProps = PropsWithChildren<{ variant?: Variant; size?: Size; className?: string }> & LinkProps

// Para navegação interna (react-router <Link>), mesmo visual do LinkButton.
export function NavButton({ variant = 'default', size = 'md', className = '', children, ...rest }: NavButtonProps) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </Link>
  )
}
