import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { ListTasks } from './ListTasks'
import type { ListTask } from './ListTasks'

// Simple mock for Storybook's fn() when @storybook/test is not available
const fn = () => () => {}

const sampleTasks: ListTask[] = [
  {
    id: 'task-1',
    name: 'Design review',
    status: 'todo',
    assignees: ['bagus-ridho'],
    dueDate: { start: 'Aug 19 07:00', end: 'Aug 19 17:00' },
    priority: 'high',
  },
  {
    id: 'task-2',
    name: 'Implement API',
    status: 'in-progress',
    assignees: ['super', 'rommy'],
    dueDate: null,
    priority: 'urgent',
    comments: 3,
    selected: true,
  },
  {
    id: 'task-3',
    name: 'Write tests',
    status: 'done',
    assignees: [],
    dueDate: null,
    priority: 'low',
    expandable: true,
  },
]

const meta = {
  title: 'Features/Tasks/ListTasks',
  component: ListTasks,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof ListTasks>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    listId: 'list-1',
    title: 'Project Tasks',
    tasks: sampleTasks,
    onAddTask: fn(),
    onUpdateTask: fn(),
  },
}

export const Empty: Story = {
  args: {
    listId: 'list-empty',
    title: 'Empty List',
    tasks: [],
    onAddTask: fn(),
    onUpdateTask: fn(),
  },
}

export const WithCallbacks: Story = {
  args: {
    listId: 'list-callback',
    title: 'Interactive Tasks',
    tasks: sampleTasks,
    onAddTask: fn(),
    onUpdateTask: fn(),
  },
}

export const PayloadContract: Story = {
  args: {
    listId: 'list-payload',
    title: 'Payload Contract Test',
    tasks: [
      {
        id: 'task-payload',
        name: 'Test Task',
        status: 'todo',
        assignees: ['user1'],
        dueDate: { start: 'Sep 12 09:00', end: 'Sep 12 17:00' },
        priority: 'medium',
      },
    ],
    onAddTask: fn(),
    onUpdateTask: fn(),
  },
}

export const UIOnlyFieldsNotPersisted: Story = {
  args: {
    listId: 'list-ui-fields',
    title: 'UI Fields Test',
    tasks: [
      {
        id: 'task-ui',
        name: 'UI Test Task',
        status: 'todo',
        assignees: [],
        dueDate: null,
        priority: null,
        expandable: true,
        selected: true,
        comments: 5,
      },
    ],
    onAddTask: fn(),
    onUpdateTask: fn(),
  },
}
