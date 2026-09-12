import { useState } from 'react'
import { MdCheckCircle, MdFlag, MdSettings } from 'react-icons/md'
import { DropdownPopover } from './Popover'
import { cn } from '#/lib/cn'

export type Priority = 'urgent' | 'high' | 'medium' | 'low'

export type PriorityOption = {
  value: Priority
  label: string
  flagClassName: string
}

export const defaultPriorityOptions: PriorityOption[] = [
  { value: 'urgent', label: 'Urgent', flagClassName: 'text-red-600' },
  { value: 'high', label: 'High', flagClassName: 'text-orange-500' },
  { value: 'medium', label: 'Medium', flagClassName: 'text-amber-600/80' },
  { value: 'low', label: 'Low', flagClassName: 'text-slate-400' },
]

export type PriorityDropdownProps = {
  value?: Priority | null
  defaultValue?: Priority | null
  placeholder?: string
  options?: PriorityOption[]
  onChange?: (value: Priority | null) => void
  triggerClassName?: string
  contentClassName?: string
}

export function PriorityDropdown({
  value,
  defaultValue = null,
  placeholder = 'Priority',
  options = defaultPriorityOptions,
  onChange,
  triggerClassName,
  contentClassName,
}: PriorityDropdownProps) {
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState<Priority | null>(defaultValue)
  const [open, setOpen] = useState(false)
  const current = isControlled ? (value ?? null) : internalValue
  const selected = options.find((option) => option.value === current) ?? null

  function commit(next: Priority | null) {
    if (!isControlled) setInternalValue(next)
    onChange?.(next)
  }

  return (
    <DropdownPopover
      ariaLabel="Set priority"
      open={open}
      onOpenChange={setOpen}
      triggerClassName={cn(
        'inline-flex items-center gap-1 rounded px-1 py-0.5 text-[11px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700',
        triggerClassName,
      )}
      contentClassName={cn(
        'w-[190px] overflow-hidden rounded-lg border border-slate-200/80 bg-white text-sm shadow-lg',
        contentClassName,
      )}
      trigger={
        <>
          <MdFlag
            className={cn('size-3 shrink-0', selected?.flagClassName ?? 'text-slate-400')}
            fill="currentColor"
          />
          <span className={cn(!selected && 'text-slate-400')}>{selected?.label ?? placeholder}</span>
        </>
      }
    >
      <header className="flex items-center justify-between border-b border-slate-100 px-3 py-2 text-slate-500">
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 select-none">Priority</span>
        <button
          type="button"
          aria-label="Priority settings"
          className="rounded p-0.5 text-slate-400 transition-colors hover:text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-300"
        >
          <MdSettings className="size-3.5" />
        </button>
      </header>
      <div className="py-1" role="menu">
        {options.map((option) => {
          const active = option.value === current
          return (
            <button
              key={option.value}
              type="button"
              role="menuitem"
              className={cn(
                'flex w-full items-center justify-between px-3 py-1.5 text-left transition-colors hover:bg-slate-50 group',                active && 'bg-slate-50/80 hover:bg-slate-100',
              )}
              onClick={() => {
                commit(option.value)
                setOpen(false)
              }}
            >
              <span className="flex items-center">
                <MdFlag className={cn('mr-2.5 size-3.5 shrink-0', option.flagClassName)} fill="currentColor" />
                <span className={cn('text-[13px] font-medium leading-none text-slate-700 group-hover:text-slate-900', active && 'text-slate-800')}>{option.label}</span>
              </span>
              {active ? <MdCheckCircle className="size-3.5 shrink-0 text-blue-600" /> : null}
            </button>
          )
        })}
      </div>
      <footer className="border-t border-slate-100 px-3 py-2">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-1.5 text-sm font-normal text-slate-500 transition-colors hover:text-slate-700 focus:outline-none"
          onClick={() => commit(null)}
        >
          <span className="text-[12px]">Clear value</span>
        </button>
      </footer>
    </DropdownPopover>
  )
}