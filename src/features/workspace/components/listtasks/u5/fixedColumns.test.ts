import { describe, expect, it } from 'vitest'
import {
  defaultFixedColumns,
  isColumnFixed,
  stickyCellStyle,
  taskColumnKeys,
  taskColumnOffsets,
} from './fixedColumns'
import type { FixedColumnsConfig } from './fixedColumns'

describe('fixed columns building block', () => {
  it('ships a default config with name/assignee/duedate fixed', () => {
    expect(defaultFixedColumns.enabled).toBe(true)
    expect(defaultFixedColumns.fixed).toEqual([
      'name',
      'assignee',
      'duedate',
    ])
    expect(defaultFixedColumns.zIndex.header).toBeGreaterThan(
      defaultFixedColumns.zIndex.body,
    )
  })

  it('covers every task column key with an offset', () => {
    for (const key of taskColumnKeys) {
      expect(taskColumnOffsets[key]).toBeTruthy()
    }
  })

  it('reports fixed status per column', () => {
    expect(isColumnFixed('name')).toBe(true)
    expect(isColumnFixed('assignee')).toBe(true)
    expect(isColumnFixed('duedate')).toBe(true)
    expect(isColumnFixed('priority')).toBe(false)
    expect(isColumnFixed('status')).toBe(false)
    expect(isColumnFixed('actions')).toBe(false)
  })

  it('returns empty style for unfixed or disabled columns', () => {
    expect(stickyCellStyle('status')).toEqual({})
    expect(
      stickyCellStyle('name', { ...defaultFixedColumns, enabled: false }),
    ).toEqual({})
  })

  it('builds a sticky style with the configured offsets and z-index', () => {
    expect(stickyCellStyle('name')).toEqual({
      position: 'sticky',
      left: '0',
      zIndex: 10,
      background: '#ffffff',
    })
    expect(stickyCellStyle('duedate', defaultFixedColumns, 'header')).toMatchObject({
      position: 'sticky',
      left: '46%',
      zIndex: 20,
    })
  })

  it('respects a custom fixed column list', () => {
    const config: FixedColumnsConfig = {
      ...defaultFixedColumns,
      fixed: ['duedate'],
    }
    expect(isColumnFixed('duedate', config)).toBe(true)
    expect(isColumnFixed('name', config)).toBe(false)
    expect(stickyCellStyle('duedate', config)).toMatchObject({ left: '46%' })
  })
})