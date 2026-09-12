import { useState } from 'react'
import { MdCheckCircle, MdSettings } from 'react-icons/md'
import { DropdownPopover } from './Popover'
import { cn } from '#/lib/cn'

export type TaskStatus = 'todo' | 'in-progress' | 'done'

export type StatusOption = {
  value: TaskStatus
  label: string
  dotClassName: string
}

export const defaultStatusOptions: StatusOption[] = [
  { value: 'todo', label: 'To Do', dotClassName: 'text-slate-400' },
  { value: 'in-progress', label: 'In Progress', dotClassName: 'text-amber-500' },
  { value: 'done', label: 'Done', dotClassName: 'text-emerald-500' },
]

export type StatusDropdownProps = {
  value?: TaskStatus | null
  defaultValue?: TaskStatus | null
  placeholder?: string
  options?: StatusOption[]
  onChange?: (value: TaskStatus | null) => void
  triggerClassName?: string
  contentClassName?: string
}

function StatusDot({ className }: { className?: string }) {
  return (
    <svg
      className={cn('size-4 shrink-0', className)}
      fill="none"
      stroke="currentColor"
      strokeDasharray="2 3"
      strokeLinecap="round"
      strokeWidth="2"
      viewBox="0 0 16 16"
    >
      <circle cx="8" cy="8" r="6" />
    </svg>
  )
}

export function StatusDropdown({
  value,
  defaultValue = null,
  placeholder = 'Status',
  options = defaultStatusOptions,
  onChange,
  triggerClassName,
  contentClassName,
}: StatusDropdownProps) {
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState<TaskStatus | null>(defaultValue)
  const [open, setOpen] = useState(false)
  const current = isControlled ? (value ?? null) : internalValue
  const selected = options.find((option) => option.value === current) ?? null

  function commit(next: TaskStatus | null) {
    if (!isControlled) setInternalValue(next)
    onChange?.(next)
  }

  return (
    <DropdownPopover
      ariaLabel="Set status"
      open={open}
      onOpenChange={setOpen}
      triggerClassName={cn(
        'inline-flex items-center gap-1 rounded px-1 py-0.5 text-[11px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700',
        triggerClassName,
      )}
      contentClassName={cn(
        'w-[200px] overflow-hidden rounded-lg border border-slate-200/80 bg-white text-sm shadow-xl',
        contentClassName,
      )}
      trigger={
        <>
          <StatusDot className={cn('size-3', selected?.dotClassName ?? 'text-slate-400')} />
          <span className={cn(!selected && 'text-slate-400')}>{selected?.label ?? placeholder}</span>
        </>
      }
    >
      <header className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Status</span>
        <button
          type="button"
          aria-label="Settings"
          className="text-slate-400 transition-colors hover:text-slate-600"
        >
          <MdSettings className="size-3" />
        </button>
      </header>
      <ul className="py-0.5" aria-label="Status selection" role="listbox">
        {options.map((option) => {
          const active = option.value === current
          return (
            <li key={option.value} aria-selected={active} role="option">
              <button
                type="button"
                className={cn(
                  'flex w-full items-center justify-between px-3 py-1.5 text-left transition-colors hover:bg-slate-50 group',
                  active && 'bg-slate-50/80 hover:bg-slate-100',
                )}
                onClick={() => {
                  commit(option.value)
                  setOpen(false)
                }}
              >
                <span className="flex items-center">
                  <span className="mr-2.5 flex size-3.5 items-center justify-center">
                    <StatusDot className={option.dotClassName} />
                  </span>
                  <span
                    className={cn('text-[12.5px] font-normal text-slate-700 group-hover:text-slate-900', active && 'text-slate-800')}
                  >
                    {option.label}
                  </span>
                </span>
                {active ? (
                  <span className="flex items-center justify-center text-blue-600">
                    <MdCheckCircle className="size-3.5" />
                  </span>
                ) : null}
              </button>
            </li>
          )
        })}
      </ul>
      <footer className="border-t border-slate-100 px-3 py-1.5 text-center">
        <button
          type="button"
          className="inline-flex items-center justify-center space-x-1.5 py-0.5 text-[12px] text-slate-500 transition-colors hover:text-slate-700"
          onClick={() => commit(null)}
        >
          <span>Clear value</span>
        </button>
      </footer>
    </DropdownPopover>
  )
}