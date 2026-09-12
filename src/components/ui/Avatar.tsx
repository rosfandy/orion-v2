import type { ImgHTMLAttributes } from 'react'
import { cn } from '#/lib/cn'

export type AvatarProps = ImgHTMLAttributes<HTMLImageElement> & {
  fallback?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'size-6',
  md: 'size-10',
  lg: 'size-12',
} as const

export function Avatar({
  alt = '',
  fallback,
  size = 'md',
  className,
  src,
  ...props
}: AvatarProps) {
  if (!src) {
    return (
      <span
        role="img"
        aria-label={alt || fallback}
        className={cn(
          'inline-flex items-center justify-center rounded-full bg-primary-container text-label-md font-semibold text-on-primary',
          sizes[size],
          className,
        )}
      >
        {fallback}
      </span>
    )
  }

  return (
    <img
      {...props}
      src={src}
      alt={alt}
      className={cn('rounded-full object-cover', sizes[size], className)}
    />
  )
}
