import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { AssigneesDropdown, DueDateDropdown, PriorityDropdown, StatusDropdown } from './'
import type { DueDateValue } from './DueDateDropdown'
import type { Priority } from './PriorityDropdown'

const meta = {
  title: 'Workspaces/Dropdown',
  component: PriorityDropdown,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof PriorityDropdown>

export default meta
type Story = StoryObj<typeof meta>

export const PriorityMenu: Story = {
  render: () => <PriorityDropdown />,
}

export const PrioritySelected: Story = {
  render: () => {
    const [value, setValue] = useState<Priority | null>('urgent')
    return <PriorityDropdown value={value} onChange={setValue} />
  },
}

export const Status: Story = {
  render: () => <StatusDropdown />,
}

export const StatusSelected: Story = {
  render: () => <StatusDropdown defaultValue="in-progress" />,
}

export const Assignees: Story = {
  render: () => <AssigneesDropdown />,
}

export const AssigneesSelected: Story = {
  render: () => <AssigneesDropdown defaultValue={['bagus-ridho', 'rommy-zohara']} />,
}

export const DueDate: Story = {
  render: () => <DueDateDropdown />,
}

export const DueDateSelected: Story = {
  render: () => {
    const [value, setValue] = useState<DueDateValue | null>({ start: 'Aug 19 07:00', end: 'Aug 19 17:00' })
    return <DueDateDropdown value={value} onChange={setValue} />
  },
}

export const Row: Story = {
  render: () => (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
      <StatusDropdown defaultValue="todo" />
      <PriorityDropdown />
      <AssigneesDropdown defaultValue={['super']} />
      <DueDateDropdown />
    </div>
  ),
}