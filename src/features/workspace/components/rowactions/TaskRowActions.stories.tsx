import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { TaskRowActions } from './TaskRowActions'

const meta = {
  title: 'Features/Tasks/TaskRowActions',
  component: TaskRowActions,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    taskId: 'task-1',
  },
} satisfies Meta<typeof TaskRowActions>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const InGroupRow: Story = {
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="p-6">
        <table>
          <tbody>
            <tr className="group border-b border-gray-100">
              <td className="px-4 py-1.5">Example task row</td>
              <td className="px-4 py-1.5">
                <div className="flex justify-end">
                  <Story />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    ),
  ],
}

export const WithCallbacks: Story = {
  args: {
    onDelete: async (taskId) => {
      await new Promise((resolve) => setTimeout(resolve, 600))
      console.info('deleted', taskId)
    },
    onDeleteSuccess: (taskId) => console.info('success', taskId),
    onDeleteError: (taskId, error) => console.error('error', taskId, error),
  },
}
