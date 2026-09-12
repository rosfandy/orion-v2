import type { ButtonHTMLAttributes, ElementType } from 'react'
import { cn } from '#/lib/cn'
import { Loading } from './Loading'

const variants = {
  primary:
    'bg-primary-container !text-white hover:bg-primary hover:!text-white',
  secondary:
    'border border-slate-200 bg-surface-container-lowest text-on-surface hover:border-primary hover:text-primary',
  ghost: 'text-primary hover:bg-primary-container/10',
} as const

const sizes = {
  sm: 'h-8 px-2 text-xs',
  md: 'h-9 px-3 text-sm',
  lg: 'h-10 px-4 text-base',
} as const

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ElementType<{ className?: string }>
  iconOnly?: boolean
  loading?: boolean
  variant?: keyof typeof variants
  size?: keyof typeof sizes
}

export function Button({
  className,
  disabled,
  icon,
  iconOnly = false,
  loading = false,
  variant = 'primary',
  size = 'md',
  type = 'button',
  'aria-label': ariaLabel,
  children,
  ...props
}: ButtonProps) {
  const Icon = icon
  const iconSizes = { sm: 'size-4', md: 'size-5', lg: 'size-6' } as const

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-label={
        ariaLabel ??
        (iconOnly && typeof children === 'string' ? children : undefined)
      }
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-hanken font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-lowest disabled:cursor-not-allowed disabled:bg-surface-variant disabled:!text-white',
        variants[variant],
        iconOnly
          ? { sm: 'size-8', md: 'size-9', lg: 'size-10' }[size]
          : sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loading size={size} />
      ) : Icon ? (
        <Icon className={iconSizes[size]} />
      ) : null}
      {!iconOnly ? children : null}
    </button>
  )
}
