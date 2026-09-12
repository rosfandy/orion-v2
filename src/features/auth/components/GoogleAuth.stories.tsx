import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { GoogleAuth } from './GoogleAuth'

const meta = {
  title: 'Features/Auth/GoogleAuth',
  component: GoogleAuth,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof GoogleAuth>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { args: { className: 'w-80' } }
