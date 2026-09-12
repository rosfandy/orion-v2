import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { MembersPage } from './MembersPage'

const creator = {
  id: 'm-1',
  userId: 'user-creator',
  workspaceId: 'ws-1',
  role: 'creator',
  user: { id: 'user-creator', name: 'Creator User', email: 'creator@example.com' },
}

const memberA = {
  id: 'm-2',
  userId: 'user-member-a',
  workspaceId: 'ws-1',
  role: 'member',
  user: { id: 'user-member-a', name: 'Member A', email: 'memberA@example.com' },
}

const admin = {
  id: 'm-4',
  userId: 'user-admin',
  workspaceId: 'ws-1',
  role: 'admin',
  user: { id: 'user-admin', name: 'Admin User', email: 'admin@example.com' },
}

const allMembers = [creator, admin, memberA]

function Wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

const meta = {
  title: 'Features/Members/MembersPage',
  component: MembersPage,
  decorators: [(Story) => (
    <Wrapper>
      <Story />
    </Wrapper>
  )],
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof MembersPage>

export default meta
type Story = StoryObj<typeof meta>

/** Creator view — full management capability */
export const CreatorView: Story = {
  args: {
    workspaceId: 'ws-1',
    currentUserId: 'user-creator',
  },
  decorators: [
    (Story) => (
      <QueryClientProvider
        client={new QueryClient({
          defaultOptions: {
            queries: {
              retry: false,
              staleTime: Infinity,
              placeholderData: {
                id: 'ws-1',
                graph_id: 'g1',
                name: 'Test Workspace',
                members: allMembers,
              },
            },
          },
        })}
      >
        <Story />
      </QueryClientProvider>
    ),
  ],
}

/** Read-only view — non-creator can see but not manage */
export const ReadOnlyView: Story = {
  args: {
    workspaceId: 'ws-1',
    currentUserId: 'user-reader',
  },
  decorators: [
    (Story) => (
      <QueryClientProvider
        client={new QueryClient({
          defaultOptions: {
            queries: {
              retry: false,
              staleTime: Infinity,
              placeholderData: {
                id: 'ws-1',
                graph_id: 'g1',
                name: 'Test Workspace',
                members: allMembers,
              },
            },
          },
        })}
      >
        <Story />
      </QueryClientProvider>
    ),
  ],
}

/** Empty workspace — no members yet */
export const EmptyMembers: Story = {
  args: {
    workspaceId: 'ws-empty',
    currentUserId: 'user-creator',
  },
  decorators: [
    (Story) => (
      <QueryClientProvider
        client={new QueryClient({
          defaultOptions: {
            queries: {
              retry: false,
              staleTime: Infinity,
              placeholderData: {
                id: 'ws-empty',
                graph_id: 'g0',
                name: 'Empty Workspace',
                members: [],
              },
            },
          },
        })}
      >
        <Story />
      </QueryClientProvider>
    ),
  ],
}

/** Only one member (the current user) */
export const SingleMemberSelf: Story = {
  args: {
    workspaceId: 'ws-1',
    currentUserId: 'user-creator',
  },
  decorators: [
    (Story) => (
      <QueryClientProvider
        client={new QueryClient({
          defaultOptions: {
            queries: {
              retry: false,
              staleTime: Infinity,
              placeholderData: {
                id: 'ws-1',
                graph_id: 'g1',
                name: 'Solo Workspace',
                members: [creator],
              },
            },
          },
        })}
      >
        <Story />
      </QueryClientProvider>
    ),
  ],
}
