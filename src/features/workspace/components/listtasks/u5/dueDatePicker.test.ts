import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DueDatePicker } from './dueDatePicker'
import type { DueDateValue } from './dueDate'

function render(props: Record<string, unknown>) {
  return renderToStaticMarkup(createElement(DueDatePicker, { ...props }))
}

describe('DueDatePicker (U5)', () => {
  it('renders the placeholder when no due date is set', () => {
    const html = render({ value: null })
    expect(html).toContain('Due date')
    expect(html).not.toContain('Aug 19')
  })

  it('renders the dayjs-formatted range from the contract value', () => {
    const value: DueDateValue = {
      start: 'Aug 19 07:00',
      end: 'Aug 19 17:00',
    }
    const html = render({ value })
    expect(html).toContain('Aug 19 07:00')
    expect(html).toContain('Aug 19 17:00')
  })

  it('falls back to the placeholder when the value cannot be parsed', () => {
    const html = render({
      value: { start: 'not-a-date', end: 'also-not-a-date' },
    })
    expect(html).toContain('Due date')
    expect(html).not.toContain('not-a-date')
  })

  it('renders the placeholder again after a clear (null value)', () => {
    const cleared = render({ value: null })
    expect(cleared).toContain('Due date')
    expect(cleared).not.toContain('Aug 19')
  })
})