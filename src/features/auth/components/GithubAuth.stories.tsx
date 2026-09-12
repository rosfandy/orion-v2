import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { GithubAuth } from './GithubAuth'

const meta = {
  title: 'Features/Auth/GithubAuth',
  component: GithubAuth,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof GithubAuth>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { args: { className: 'w-80' } }
