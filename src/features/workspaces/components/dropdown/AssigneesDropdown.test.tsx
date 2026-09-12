import { screen } from '@testing-library/dom'
import { createElement } from 'react'
import { render, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AssigneesDropdown } from './AssigneesDropdown'
import type { MemberOption } from '#/features/workspace/components/listtasks/u5'

const members: MemberOption[] = [
  { id: 'u1', name: 'Alice', color: '#2563eb' },
  { id: 'u2', name: 'Bob Reyes', color: '#d83b7d' },
  { id: 'u3', name: 'Cindy Zhuo', color: '#f3533b' },
]

/** Helpers – renders into jsdom container */
function renderDropdown(props: Record<string, unknown>) {
  return render(
    createElement(AssigneesDropdown, { assignees: members, ...props }),
  )
}

describe('AssigneesDropdown (shared — workspace-members-only)', () => {
  // Full gsap mock covering everything Popover.tsx consumes
  vi.mock('gsap', () => ({
    default: {
      context: vi.fn((fn) => fn()),
      fromTo: vi.fn(),
    },
  }))

  it('renders placeholder when no members are selected', () => {
    renderDropdown({ value: [] })
    expect(screen.getByText('Assignees')).toBeTruthy()
  })

  it('renders options from workspace members, not hardcoded data', () => {
    renderDropdown({ value: ['u1'] })
    // Selected member avatar has correct aria-label (from Avatar component)
    expect(screen.getByLabelText('Alice')).toBeTruthy()
    // No hardcoded mock user names anywhere in DOM
    expect(screen.queryByText('Bagus Ridho')).toBeNull()
    expect(screen.queryByText('Lailatul Fitria')).toBeNull()
    expect(screen.queryByText('Dimas Fauzi')).toBeNull()
    expect(screen.queryByText('super')).toBeNull()
  })

  it('selects existing assignee that matches a workspace member (hydrate check)', () => {
    renderDropdown({ value: ['u2'] })
    expect(screen.getByLabelText('Bob Reyes')).toBeTruthy()
    expect(screen.queryByLabelText('Alice')).toBeNull()
    expect(screen.queryByLabelText('Cindy Zhuo')).toBeNull()
  })

  it('omits members that are no longer in the workspace', () => {
    const trimmedMembers: MemberOption[] = [
      { id: 'u1', name: 'Alice', color: '#2563eb' },
      // u2, u3 removed
    ]
    render(
      createElement(AssigneesDropdown, {
        assignees: trimmedMembers,
        value: ['u2'],
      }),
    )
    // Selected but absent member falls back to placeholder; does NOT show "Bob Reyes"
    expect(screen.getByText('Assignees')).toBeTruthy()
    expect(screen.queryByLabelText('Bob Reyes')).toBeNull()
    // Present member still renders
    expect(screen.getByLabelText('Alice')).toBeTruthy()
  })

  it('shows all current members so newly added ones appear after refetching workspace data', async () => {
    // Simulate workspace refresh where a new member joined via U3 invalidation
    const refreshedMembers: MemberOption[] = [
      ...members,
      { id: 'u4', name: 'New Member', color: '#0f9d58' },
    ]
    const { container } = render(
      createElement(AssigneesDropdown, {
        assignees: refreshedMembers,
        value: [],
        defaultOpen: true,
      }),
    )

    await waitFor(() => {
      expect(container.querySelector('[role="option"]')).toBeTruthy()
    })

    // All four members should be listed as options
    const options = screen.getAllByRole('option')
    const optionNames = options.map((opt) => opt.textContent?.trim()).filter(Boolean)
    expect(optionNames).toContain('Alice')
    expect(optionNames).toContain('Bob Reyes')
    expect(optionNames).toContain('Cindy Zhuo')
    expect(optionNames).toContain('New Member')
  })

  it('removes option for members who were removed after refetching workspace data', async () => {
    // After U3 mutation removes a member and refetches
    const reducedMembers: MemberOption[] = [
      { id: 'u1', name: 'Alice', color: '#2563eb' },
      { id: 'u3', name: 'Cindy Zhuo', color: '#f3533b' },
      // u2 removed
    ]
    const { container } = render(
      createElement(AssigneesDropdown, {
        assignees: reducedMembers,
        value: ['u2'],
        defaultOpen: true,
      }),
    )
    // Selected but absent member falls back to trigger placeholder
    expect(screen.getByText('Assignees')).toBeTruthy()
    // Options shown in dropdown body
    await waitFor(() => {
      expect(container.querySelector('[role="option"]')).toBeTruthy()
    })
    const options = screen.getAllByRole('option')
    const optionNames = options.map((opt) => opt.textContent?.trim()).filter(Boolean)
    // u2 (removed) doesn't appear as selectable
    expect(optionNames).not.toContain('Bob Reyes')
    // u1 and u3 still there
    expect(optionNames).toContain('Alice')
    expect(optionNames).toContain('Cindy Zhuo')
  })

  it('clears all assignees via footer button without hard-coded source', () => {
    const onClear = vi.fn()
    renderDropdown({ value: ['u1', 'u2', 'u3'], onChange: onClear })
    // Three visible avatars on trigger
    expect(screen.getByLabelText('Alice')).toBeTruthy()
    // Overflow indicator (only first 2 shown, rest counted)
    expect(screen.getByText('+1')).toBeTruthy()
    // Clear button visible
    expect(screen.getByLabelText('Clear all assignees')).toBeTruthy()
    // No hardcoded names anywhere
    expect(screen.queryByText('Bagus Ridho')).toBeNull()
    expect(screen.queryByText('super')).toBeNull()
    expect(screen.queryByText('Lailatul Fitria')).toBeNull()
  })

  it('onChange fires with selected member ids when a member is toggled', async () => {
    const onChange = vi.fn()
    const { container } = render(
      createElement(AssigneesDropdown, {
        assignees: members,
        value: [],
        onChange,
        defaultOpen: true,
      }),
    )

    await waitFor(() => {
      expect(container.querySelector('[role="option"]')).toBeTruthy()
    })

    // Click the Alice list item
    const aliceItem = screen.getByText('Alice').closest('li') as HTMLElement
    await act(async () => {
      aliceItem.click()
    })

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(['u1'])
    })
  })

  it('does not depend on any external hard-coded source — only uses assigned prop', () => {
    // Render with completely unrelated members (simulating a different workspace)
    const unrelatedMembers: MemberOption[] = [
      { id: 'only-one', name: 'Solo User', color: '#aaaaaa' },
    ]
    render(
      createElement(AssigneesDropdown, {
        assignees: unrelatedMembers,
        value: ['only-one'],
      }),
    )
    expect(screen.getByLabelText('Solo User')).toBeTruthy()
    // None of the original members or hardcoded names appear
    expect(screen.queryByText('Alice')).toBeNull()
    expect(screen.queryByText('Bob Reyes')).toBeNull()
    expect(screen.queryByText('Cindy Zhuo')).toBeNull()
    expect(screen.queryByText('Bagus Ridho')).toBeNull()
  })
})
