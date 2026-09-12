import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { cn } from '#/lib/cn'

const sizes = {
  sm: 'size-4 border-2',
  md: 'size-5 border-2',
  lg: 'size-6 border-[3px]',
} as const

export type LoadingProps = {
  className?: string
  size?: keyof typeof sizes
}

export function Loading({ className, size = 'md' }: LoadingProps) {
  const loadingRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    if (!loadingRef.current) return
    const animation = gsap.to(loadingRef.current, {
      rotation: 360,
      duration: 0.8,
      ease: 'none',
      repeat: -1,
    })

    return () => {
      animation.kill()
    }
  }, [])

  return (
    <span
      ref={loadingRef}
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block shrink-0 rounded-full border-current border-t-transparent',
        sizes[size],
        className,
      )}
    />
  )
}
