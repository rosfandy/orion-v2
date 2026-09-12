import type { CSSProperties } from 'react'

export const taskColumnKeys = [
  'name',
  'assignee',
  'duedate',
  'priority',
  'status',
  'actions',
] as const

export type TaskColumnKey = (typeof taskColumnKeys)[number]

export type FixedColumnsConfig = {
  enabled: boolean
  fixed: TaskColumnKey[]
  stickyBackground: string
  zIndex: {
    header: number
    body: number
  }
}

export const taskColumnOffsets: Record<TaskColumnKey, string> = {
  name: '0',
  assignee: '34%',
  duedate: '46%',
  priority: '58%',
  status: '68%',
  actions: '82%',
}

export const taskColumnWidths: Record<TaskColumnKey, string> = {
  name: '34%',
  assignee: '12%',
  duedate: '12%',
  priority: '10%',
  status: '14%',
  actions: '8%',
}

export const defaultFixedColumns: FixedColumnsConfig = {
  enabled: true,
  fixed: ['name', 'assignee', 'duedate'],
  stickyBackground: '#ffffff',
  zIndex: { header: 20, body: 10 },
}

export function isColumnFixed(
  key: TaskColumnKey,
  config: FixedColumnsConfig = defaultFixedColumns,
): boolean {
  return config.enabled && config.fixed.includes(key)
}

export function stickyCellStyle(
  key: TaskColumnKey,
  config: FixedColumnsConfig = defaultFixedColumns,
  layer: 'header' | 'body' = 'body',
): CSSProperties {
  if (!isColumnFixed(key, config)) return {}
  return {
    position: 'sticky',
    left: taskColumnOffsets[key],
    zIndex: config.zIndex[layer],
    background: config.stickyBackground,
  }
}