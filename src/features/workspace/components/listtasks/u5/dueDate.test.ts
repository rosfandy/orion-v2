import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import {
  dueDateToPick,
  formatDueDatePart,
  formatDueDateReadable,
  getMonthGrid,
  isInDayRange,
  isSameDay,
  isValidDueDate,
  parseDueDate,
  parseDueDatePart,
  pickToDueDate,
  serializeDueDate,
} from './dueDate'
import { assigneesToPatch, buildTaskUpdates, dueDateToPatch } from './taskPatch'

describe('due date - contract round-trip', () => {
  it('parses "start->end" and serializes back to the same string', () => {
    const value = parseDueDate('Aug 19 07:00->Aug 19 17:00')
    expect(value).toEqual({
      start: 'Aug 19 07:00',
      end: 'Aug 19 17:00',
    })
    expect(serializeDueDate(value)).toBe('Aug 19 07:00->Aug 19 17:00')
  })

  it('survives a full contract -> dayjs -> contract round-trip', () => {
    const value = { start: 'Aug 19 07:00', end: 'Aug 19 17:00' }
    const pick = dueDateToPick(value)
    expect(pick.start?.isValid()).toBe(true)
    expect(pickToDueDate(pick)).toEqual(value)
  })

  it('keeps single-date contract (no arrow) as both start and end', () => {
    expect(parseDueDate('Aug 19 07:00')).toEqual({
      start: 'Aug 19 07:00',
      end: 'Aug 19 07:00',
    })
  })

  it('trims whitespace around contract parts', () => {
    expect(parseDueDate('  Aug 19 07:00 -> Aug 19 17:00  ')).toEqual({
      start: 'Aug 19 07:00',
      end: 'Aug 19 17:00',
    })
  })
})

describe('due date - clear state', () => {
  it('serializes null or undefined to an empty string', () => {
    expect(serializeDueDate(null)).toBe('')
    expect(serializeDueDate(undefined)).toBe('')
  })

  it('parses empty or undefined contract to null', () => {
    expect(parseDueDate('')).toBeNull()
    expect(parseDueDate(undefined)).toBeNull()
    expect(parseDueDate(null)).toBeNull()
  })

  it('converts a cleared pick to null', () => {
    expect(pickToDueDate({ start: null, end: null })).toBeNull()
    expect(pickToDueDate(null)).toBeNull()
    expect(pickToDueDate(undefined)).toBeNull()
  })

  it('reports an empty value as invalid', () => {
    expect(isValidDueDate(null)).toBe(false)
    expect(isValidDueDate(undefined)).toBe(false)
  })
})

describe('due date - invalid value fallback', () => {
  it('returns null when the start part cannot be parsed', () => {
    expect(parseDueDate('not-a-date')).toBeNull()
    expect(parseDueDate('not-a-date->Aug 19 17:00')).toBeNull()
  })

  it('returns null for blank contract strings', () => {
    expect(parseDueDate('   ')).toBeNull()
  })

  it('falls back to a start-only value when the end part is invalid', () => {
    expect(parseDueDate('Aug 19 07:00->zzz')).toEqual({
      start: 'Aug 19 07:00',
      end: 'Aug 19 07:00',
    })
  })

  it('flags values with unparseable parts as invalid', () => {
    expect(isValidDueDate({ start: 'nope', end: 'Aug 19 17:00' })).toBe(false)
    expect(isValidDueDate({ start: 'Aug 19 07:00', end: 'nope' })).toBe(false)
    expect(isValidDueDate({ start: 'Aug 19 07:00', end: '' })).toBe(true)
  })

  it('formats unparseable values to null (no readable fallback)', () => {
    expect(formatDueDateReadable({ start: 'nope', end: 'nope' })).toBeNull()
  })
})

describe('due date - dayjs helpers', () => {
  it('parses contract parts and formats them back', () => {
    const part = parseDueDatePart('Aug 19 07:00')
    expect(part).not.toBeNull()
    expect(formatDueDatePart(part!)).toBe('Aug 19 07:00')
    expect(parseDueDatePart('garbage')).toBeNull()
  })

  it('builds a 42-day month grid starting on Sunday', () => {
    const grid = getMonthGrid(dayjs('2026-08-15T00:00:00'))
    expect(grid).toHaveLength(42)
    expect(grid[0].day()).toBe(0)
    expect(grid.some((d) => d.date() === 1 && d.month() === 7)).toBe(true)
  })

  it('compares days and ranges without time components', () => {
    const start = dayjs('2026-08-19T07:00:00')
    const end = dayjs('2026-08-21T17:00:00')
    expect(isSameDay(start, dayjs('2026-08-19T23:59:00'))).toBe(true)
    expect(isSameDay(start, null)).toBe(false)
    expect(isInDayRange(dayjs('2026-08-20T00:00:00'), start, end)).toBe(true)
    expect(isInDayRange(dayjs('2026-08-19T00:00:00'), start, end)).toBe(false)
    expect(isInDayRange(end, start, end)).toBe(false)
  })
})

describe('task patch - U9 wire-up helpers', () => {
  it('joins assignees into the contract assignee prop', () => {
    expect(assigneesToPatch(['u1', 'u2'])).toEqual({ assignee: 'u1,u2' })
    expect(assigneesToPatch([])).toEqual({ assignee: '' })
  })

  it('serializes due date into the contract duedate prop', () => {
    expect(
      dueDateToPatch({ start: 'Aug 19 07:00', end: 'Aug 19 17:00' }),
    ).toEqual({ duedate: 'Aug 19 07:00->Aug 19 17:00' })
    expect(dueDateToPatch(null)).toEqual({ duedate: '' })
  })

  it('builds a combined partial patch for the task node', () => {
    expect(buildTaskUpdates({})).toEqual({})
    expect(
      buildTaskUpdates({ assignees: ['u1'], dueDate: null }),
    ).toEqual({ assignee: 'u1', duedate: '' })
  })
})