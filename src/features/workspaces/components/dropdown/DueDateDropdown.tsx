import { useEffect, useState } from 'react'
import { MdCalendarMonth } from 'react-icons/md'
import { DropdownPopover } from './Popover'
import { cn } from '#/lib/cn'

export type DueDateValue = {
  start: string
  end: string
}

export type DueDateDropdownProps = {
  value?: DueDateValue | null
  defaultValue?: DueDateValue | null
  placeholder?: string
  startPlaceholder?: string
  endPlaceholder?: string
  onChange?: (value: DueDateValue | null) => void
  triggerClassName?: string
  contentClassName?: string
}

function DueDateArrow() {
  return (
    <svg
      className="size-3.5 shrink-0 text-slate-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path
        d="M14 5l7 7m0 0l-7 7m7-7H3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function DueDateDropdown({
  value,
  defaultValue = null,
  placeholder = 'Due date',
  startPlaceholder = 'Start',
  endPlaceholder = 'End',
  onChange,
  triggerClassName,
  contentClassName,
}: DueDateDropdownProps) {
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState<DueDateValue | null>(
    defaultValue,
  )
  const [open, setOpen] = useState(false)
  const [draftStart, setDraftStart] = useState('')
  const [draftEnd, setDraftEnd] = useState('')
  const current = isControlled ? (value ?? null) : internalValue

  useEffect(() => {
    if (open) {
      setDraftStart(current?.start ?? '')
      setDraftEnd(current?.end ?? '')
    }
  }, [open, current])

  function commit(next: DueDateValue | null) {
    if (!isControlled) setInternalValue(next)
    onChange?.(next)
  }

  function handleClear() {
    commit(null)
    setOpen(false)
  }

  function handleSave() {
    const start = draftStart.trim()
    const end = draftEnd.trim()
    commit(start || end ? { start, end } : null)
    setOpen(false)
  }

  return (
    <DropdownPopover
      ariaLabel="Set due date"
      open={open}
      onOpenChange={setOpen}
      triggerClassName={cn(
        'inline-flex items-center gap-1 rounded px-1 py-0.5 text-[11px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700',
        triggerClassName,
      )}
      contentClassName={cn(
        'w-[290px] overflow-hidden rounded-lg border border-slate-200/70 bg-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.08),0_8px_10px_-6px_rgba(0,0,0,0.04)]',
        contentClassName,
      )}
      trigger={
        <>
          <MdCalendarMonth className="size-3 shrink-0 text-slate-400" />
          {current ? (
            <span className="flex items-center gap-0.5 text-slate-700">
              <span className="tracking-tight">
                {current.start || startPlaceholder}
              </span>
              <DueDateArrow />
              <span className="tracking-tight">
                {current.end || endPlaceholder}
              </span>
            </span>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </>
      }
    >
      <header className="border-b border-slate-100 px-4 pt-3 pb-2.5">
        <h2 className="text-[12px] font-bold uppercase tracking-wider text-slate-500">
          Due Date
        </h2>
      </header>
      <div className="px-3 py-2.5">
        <div className="flex items-center justify-between rounded-md border border-primary bg-white px-2.5 py-1.5 shadow-[0_0_0_1px_#FF6B55] transition-all">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 text-[14px] font-medium text-slate-700 select-none">
            <input
              type="text"
              value={draftStart}
              onChange={(event) => setDraftStart(event.target.value)}
              placeholder={startPlaceholder}
              className="w-0 flex-1 border-0 bg-transparent p-0 text-[12.5px] font-medium tracking-tight text-slate-700 placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-0"
            />
            <DueDateArrow />
            <input
              type="text"
              value={draftEnd}
              onChange={(event) => setDraftEnd(event.target.value)}
              placeholder={endPlaceholder}
              className="w-0 flex-1 border-0 bg-transparent p-0 text-[12.5px] font-medium tracking-tight text-slate-700 placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-0"
            />
          </div>
          <button
            type="button"
            aria-label="Clear date field"
            className="bg-primary ml-1.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-slate-200/90 text-slate-400 transition-colors hover:bg-slate-300 hover:text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-400"
            onClick={() => {
              setDraftStart('')
              setDraftEnd('')
            }}
          >
            <svg className="size-2.5" fill="currentColor" viewBox="0 0 16 16">
              <path
                clipRule="evenodd"
                d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"
                fillRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
      <footer className="flex items-center justify-between px-3 pt-0.5 pb-3">
        <button
          type="button"
          className="inline-flex items-center text-[12.5px] font-medium text-slate-500 transition-colors hover:text-slate-700 focus:outline-none"
          onClick={handleClear}
        >
          <svg
            className="mr-1 size-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            viewBox="0 0 24 24"
          >
            <path
              d="M6 18L18 6M6 6l12 12"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Clear
        </button>
        <button
          type="button"
          className="rounded-md bg-primary px-4 py-1 text-[12.5px] font-medium text-white shadow-sm transition duration-150 ease-in-out hover:bg-[#f05b44] hover:shadow focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 active:bg-primary"
          onClick={handleSave}
        >
          Save
        </button>
      </footer>
    </DropdownPopover>
  )
}

