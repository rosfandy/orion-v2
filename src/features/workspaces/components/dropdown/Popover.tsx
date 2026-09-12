import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { gsap } from 'gsap'
import { cn } from '#/lib/cn'

export type DropdownPopoverProps = {
  trigger: ReactNode
  children: ReactNode
  ariaLabel?: string
  triggerClassName?: string
  contentClassName?: string
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export function DropdownPopover({
  trigger,
  children,
  ariaLabel,
  triggerClassName,
  contentClassName,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
}: DropdownPopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const [rect, setRect] = useState<{ top: number; left: number; width: number; right: number } | null>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const didAnimateRef = useRef(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) setUncontrolledOpen(nextOpen)
      onOpenChange?.(nextOpen)
    },
    [isControlled, onOpenChange],
  )

  useEffect(() => {
    if (!open) {
      setRect(null)
      return
    }

    const updateRect = () => {
      const el = triggerRef.current?.querySelector('button')
      if (!el) return
      const bounds = el.getBoundingClientRect()
      setRect({ top: bounds.bottom, left: bounds.left, width: bounds.width, right: bounds.right })
    }

    updateRect()
    window.addEventListener('scroll', updateRect, true)
    window.addEventListener('resize', updateRect)
    return () => {
      window.removeEventListener('scroll', updateRect, true)
      window.removeEventListener('resize', updateRect)
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node
      if (!triggerRef.current?.contains(target) && !contentRef.current?.contains(target)) {
        setOpen(false)
      }
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
  }, [open, setOpen])

  useEffect(() => {
    if (!open || !rect || !contentRef.current) {
      didAnimateRef.current = false
      return
    }
    if (didAnimateRef.current) return
    didAnimateRef.current = true

    const context = gsap.context(() => {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: -10, scale: 0.96, transformOrigin: 'top center' },
        { opacity: 1, y: 0, scale: 1, duration: 0.22, ease: 'power3.out', clearProps: 'transform' },
      )

      const items = contentRef.current?.querySelectorAll(
        '[role="menuitem"], [role="option"]',
      )
      if (items?.length) {
        gsap.fromTo(
          items,
          { opacity: 0, y: -6 },
          { opacity: 1, y: 0, stagger: 0.03, duration: 0.2, ease: 'power2.out', delay: 0.05 },
        )
      }
    }, contentRef)

    return () => context.revert()
  }, [open, rect])

  return (
    <div ref={triggerRef} className="inline-block">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(!open)}
        className={triggerClassName}
      >
        {trigger}
      </button>
      {open && rect
        ? (() => {
            const vw = typeof window !== 'undefined' ? window.innerWidth : 1000
            // Estimate content width from className or fallback
            let estimatedWidth = 280 // default
            if (typeof contentClassName === 'string') {
              const m = contentClassName.match(/w-\[(\d+)px\]/)
              if (m) estimatedWidth = parseInt(m[1], 10)
            }
            const willOverflow = rect.left + estimatedWidth > vw

            return createPortal(
              <div
                ref={contentRef}
                className={cn('z-50', contentClassName)}
                style={{
                  position: 'fixed',
                  top: rect.top + 4,
                  left: willOverflow ? undefined : rect.left,
                  right: willOverflow ? `calc(100vw - ${rect.right}px)` : undefined,
                  minWidth: rect.width,
                }}
              >
                {children}
              </div>,
              document.body,
            )
          })()
        : null}
    </div>
  )
}