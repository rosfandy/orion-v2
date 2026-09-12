import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'

export type DueDateValue = {
  start: string
  end: string
}

export type DueDatePick = {
  start: Dayjs | null
  end: Dayjs | null
}

export const DUE_DATE_PART_FORMAT = 'MMM D HH:mm'
export const DUE_DATE_SEPARATOR = '->'

export function parseDueDatePart(value: string): Dayjs | null {
  const parsed = dayjs(value.trim(), DUE_DATE_PART_FORMAT, true)
  return parsed.isValid() ? parsed : null
}

export function formatDueDatePart(date: Dayjs): string {
  return date.format(DUE_DATE_PART_FORMAT)
}

export function parseDueDate(value?: string | null): DueDateValue | null {
  if (!value) return null
  const [start = '', end = start] = value.split(DUE_DATE_SEPARATOR)
  const startPart = start.trim()
  if (!startPart || !parseDueDatePart(startPart)) return null
  const endPart = end.trim()
  if (endPart && !parseDueDatePart(endPart)) {
    return { start: startPart, end: startPart }
  }
  return { start: startPart, end: endPart || startPart }
}

export function serializeDueDate(value?: DueDateValue | null): string {
  if (!value) return ''
  const start = value.start.trim()
  if (!start) return ''
  const end = value.end.trim() || start
  return `${start}${DUE_DATE_SEPARATOR}${end}`
}

export function dueDateToPick(value?: DueDateValue | null): DueDatePick {
  if (!value) return { start: null, end: null }
  return {
    start: parseDueDatePart(value.start),
    end: parseDueDatePart(value.end),
  }
}

export function pickToDueDate(pick?: DueDatePick | null): DueDateValue | null {
  const start = pick?.start
  if (!start) return null
  if (!pick.end) {
    return { start: formatDueDatePart(start), end: formatDueDatePart(start) }
  }
  return {
    start: formatDueDatePart(start),
    end: formatDueDatePart(pick.end),
  }
}

export function isValidDueDate(value?: DueDateValue | null): boolean {
  if (!value) return false
  const start = parseDueDatePart(value.start)
  if (!start) return false
  const endPart = value.end.trim()
  if (!endPart) return true
  return parseDueDatePart(endPart) !== null
}

export function formatDueDateReadable(value?: DueDateValue | null): string | null {
  const normalized = parseDueDate(serializeDueDate(value))
  if (!normalized) return null
  return `${normalized.start}${DUE_DATE_SEPARATOR}${normalized.end}`
}

const MONTH_GRID_SIZE = 42

export function getMonthGrid(anchor: Dayjs): Dayjs[] {
  const firstOfMonth = anchor.date(1)
  const start = firstOfMonth.day(0)
  return Array.from({ length: MONTH_GRID_SIZE }, (_, index) =>
    start.add(index, 'day'),
  )
}

export function isSameDay(a?: Dayjs | null, b?: Dayjs | null): boolean {
  return Boolean(a && b && a.isSame(b, 'day'))
}

export function isInDayRange(
  day: Dayjs,
  start?: Dayjs | null,
  end?: Dayjs | null,
): boolean {
  if (!start || !end) return false
  return day.isAfter(start.startOf('day')) && day.isBefore(end.startOf('day'))
}