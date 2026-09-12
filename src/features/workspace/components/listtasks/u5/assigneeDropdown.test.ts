import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { AssigneeDropdown } from './assigneeDropdown'
import type { MemberOption } from './memberOptions'

const members: MemberOption[] = [
  { id: 'u1', name: 'Alice', color: '#2563eb' },
  { id: 'u2', name: 'Bob Reyes', color: '#d83b7d' },
  { id: 'u3', name: 'Cindy Zhuo', color: '#f3533b' },
]

function render(props: Record<string, unknown>) {
  return renderToStaticMarkup(
    createElement(AssigneeDropdown, { members, ...props }),
  )
}

describe('AssigneeDropdown (U5)', () => {
  it('renders the placeholder when no members are selected', () => {
    const html = render({ value: [] })
    expect(html).toContain('Assignees')
    expect(html).not.toContain('Cindy Zhuo')
  })

  it('renders selected members from the members prop, not hardcoded options', () => {
    const html = render({ value: ['u3'] })
    expect(html).toContain('Cindy Zhuo')
    expect(html).toContain('CZ')
  })

  it('shows an overflow count when more than two members are selected', () => {
    const html = render({ value: ['u1', 'u2', 'u3'] })
    expect(html).toContain('+1')
  })

  it('falls back to the placeholder when selected ids are unknown', () => {
    const html = render({ value: ['ghost-user'] })
    expect(html).toContain('Assignees')
    expect(html).not.toContain('Alice')
    expect(html).not.toContain('ghost-user')
  })

  it('renders the placeholder again after a clear (empty value)', () => {
    const cleared = render({ value: undefined })
    const isEmpty = render({ value: [] })
    expect(cleared).toContain('Assignees')
    expect(isEmpty).toContain('Assignees')
  })
})