import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { AssigneesDropdown, DueDateDropdown, PriorityDropdown, StatusDropdown } from './'
import type { DueDateValue } from './DueDateDropdown'
import type { Priority } from './PriorityDropdown'
import type { MemberOption } from '#/features/workspace/components/listtasks/u5'

const storyMembers: MemberOption[] = [
  { id: 'bagus-ridho', name: 'Bagus Ridho', color: '#f3533b' },
  { id: 'rommy-zohara', name: 'Rommy Zohara', color: '#2563eb' },
  { id: 'super', name: 'Super', color: '#d83b7d' },
  { id: 'lailatul-fitria', name: 'Lailatul Fitria', color: '#e63980' },
  { id: 'dimas-fauzi', name: 'Dimas Fauzi', color: '#e02d3c' },
]

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
  render: () => <AssigneesDropdown assignees={storyMembers} />,
}

export const AssigneesSelected: Story = {
  render: () => (
    <AssigneesDropdown
      defaultValue={['bagus-ridho', 'rommy-zohara']}
      assignees={storyMembers}
    />
  ),
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
      <AssigneesDropdown defaultValue={['super']} assignees={storyMembers} />
      <DueDateDropdown />
    </div>
  ),
}