import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { MdCalendarMonth, MdChevronLeft, MdChevronRight } from 'react-icons/md'
import { cn } from '#/lib/cn'
import { DropdownPopover } from '#/features/workspaces/components/dropdown'
import {
  dueDateToPick,
  formatDueDatePart,
  getMonthGrid,
  isInDayRange,
  isSameDay,
  isValidDueDate,
  pickToDueDate,
} from './dueDate'
import type { Dayjs } from 'dayjs'
import type { DueDatePick, DueDateValue } from './dueDate'

export type DueDatePickerProps = {
  value?: DueDateValue | null
  defaultValue?: DueDateValue | null
  placeholder?: string
  endPlaceholder?: string
  onChange?: (value: DueDateValue | null) => void
  triggerClassName?: string
  contentClassName?: string
}

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

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

export function DueDatePicker({
  value,
  defaultValue = null,
  placeholder = 'Due date',
  endPlaceholder = 'End',
  onChange,
  triggerClassName,
  contentClassName,
}: DueDatePickerProps) {
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState<DueDateValue | null>(
    defaultValue,
  )
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<DueDatePick>({ start: null, end: null })
  const [anchor, setAnchor] = useState(() => dayjs())
  const current = isControlled ? (value ?? null) : internalValue
  const valid = isValidDueDate(current)
  const pick = dueDateToPick(current)

  useEffect(() => {
    if (open) {
      const next = dueDateToPick(current)
      setDraft(next)
      setAnchor(next.start ?? dayjs())
    }
  }, [open, current])

  function commit(next: DueDateValue | null) {
    if (!isControlled) setInternalValue(next)
    onChange?.(next)
  }

  function selectDay(day: Dayjs) {
    setDraft((prev) => {
      if (!prev.start) return { start: day, end: null }
      if (!prev.end) {
        if (day.isBefore(prev.start, 'day')) return { start: day, end: null }
        return { start: prev.start, end: day }
      }
      return { start: day, end: null }
    })
  }

  function handleSave() {
    commit(pickToDueDate(draft))
    setOpen(false)
  }

  function handleClear() {
    commit(null)
    setOpen(false)
  }

  const days = getMonthGrid(anchor)
  const selectedMonth = anchor.month()

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
        'w-[280px] overflow-hidden rounded-lg border border-slate-200/70 bg-white font-sans shadow-[0_10px_25px_-5px_rgba(0,0,0,0.08),0_8px_10px_-6px_rgba(0,0,0,0.04)]',
        contentClassName,
      )}
      trigger={
        <>
          <MdCalendarMonth className="size-3 shrink-0 text-slate-400" />
          {valid && pick.start ? (
            <span className="flex items-center gap-0.5 text-slate-700">
              <span className="tracking-tight">
                {formatDueDatePart(pick.start)}
              </span>
              <DueDateArrow />
              <span className="tracking-tight">
                {pick.end ? formatDueDatePart(pick.end) : endPlaceholder}
              </span>
            </span>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </>
      }
    >
      <header className="flex items-center justify-between border-b border-slate-100 px-3 pt-2.5 pb-2">
        <h2 className="text-[12px] font-bold uppercase tracking-wider text-slate-500">
          Due Date
        </h2>
        {draft.start ? (
          <span className="text-[11px] font-medium text-slate-500">
            {formatDueDatePart(draft.start)}
            {draft.end ? ` - ${formatDueDatePart(draft.end)}` : ''}
          </span>
        ) : null}
      </header>
      <div className="px-3 pt-2.5 pb-1">
        <div className="flex items-center justify-between px-1 pb-1.5">
          <button
            type="button"
            aria-label="Previous month"
            className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none"
            onClick={() => setAnchor(anchor.month(anchor.month() - 1))}
          >
            <MdChevronLeft className="size-4" />
          </button>
          <span className="text-[13px] font-semibold text-slate-700">
            {anchor.format('MMMM YYYY')}
          </span>
          <button
            type="button"
            aria-label="Next month"
            className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none"
            onClick={() => setAnchor(anchor.month(anchor.month() + 1))}
          >
            <MdChevronRight className="size-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 text-center">
          {WEEKDAY_LABELS.map((label) => (
            <span
              key={label}
              className="py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400"
            >
              {label}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-0.5 text-center">
          {days.map((day) => {
            const inMonth = day.month() === selectedMonth
            const isStart = isSameDay(day, draft.start)
            const isEnd = isSameDay(day, draft.end)
            const inRange = isInDayRange(day, draft.start, draft.end)
            const selected = isStart || isEnd
            return (
              <button
                key={day.valueOf()}
                type="button"
                onClick={() => selectDay(day)}
                className={cn(
                  'mx-auto flex size-7 items-center justify-center rounded-full text-[12px] transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400',
                  inMonth ? 'text-slate-700' : 'text-slate-300',
                  inRange && 'rounded-none bg-blue-50 text-blue-700',
                  selected
                    ? 'rounded-full bg-primary font-semibold text-white hover:bg-primary'
                    : !inRange && 'hover:bg-slate-100',
                )}
              >
                {day.date()}
              </button>
            )
          })}
        </div>
      </div>
      <footer className="flex items-center justify-between px-3 pt-2 pb-3">
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
          className="rounded-md bg-primary px-4 py-1 text-[12.5px] font-medium text-white shadow-sm transition duration-150 ease-in-out hover:bg-[#f05b44] hover:shadow focus:outline-none focus:ring-2 focus:ring-[#FF6B55] focus:ring-offset-1 active:bg-[#e04f38]"
          onClick={handleSave}
        >
          OK
        </button>
      </footer>
    </DropdownPopover>
  )
}

