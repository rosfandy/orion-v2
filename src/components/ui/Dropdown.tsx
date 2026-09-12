import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { gsap } from 'gsap'
import { Button } from './Button'
import type { ButtonProps } from './Button'
import { cn } from '#/lib/cn'

export type DropdownProps = {
  trigger: ReactNode
  children: ReactNode
  buttonProps?: Omit<ButtonProps, 'children' | 'onClick'>
  className?: string
  contentClassName?: string
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export function Dropdown({
  trigger,
  children,
  buttonProps,
  className,
  contentClassName,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
}: DropdownProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen

  function setOpen(nextOpen: boolean) {
    if (!isControlled) setUncontrolledOpen(nextOpen)
    onOpenChange?.(nextOpen)
  }

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (!open || !contentRef.current) return

    const animation = gsap.fromTo(
      contentRef.current,
      { opacity: 0, y: -6, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: 'power2.out' },
    )

    return () => {
      animation.kill()
    }
  }, [open])

  return (
    <div ref={containerRef} className={cn('relative inline-block', className)}>
      <Button
        {...buttonProps}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen(!open)}
      >
        {trigger}
      </Button>
      {open ? (
        <div
          ref={contentRef}
          role="menu"
          className={cn(
            'absolute right-0 z-50 mt-2 min-w-52 rounded-lg border border-slate-200 bg-surface-container-lowest p-1 shadow-lg',
            contentClassName,
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}
