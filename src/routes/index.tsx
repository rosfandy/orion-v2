import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { MdAdd } from 'react-icons/md'
import { Card } from '#/components/fragment/Card'
import { Form } from '#/components/fragment/Form'
import { Button } from '#/components/ui/Button'
import { Input } from '#/components/ui/Input'
import { Modal } from '#/components/ui/Modal'
import { authMiddleware, hasAuthSession } from '#/middleware/authMiddleware'
import { useWorkspaces } from '#/features/workspaces/hooks/useWorkspaces'
import type { Workspace } from '#/features/workspaces/services/workspaceService'

export const Route = createFileRoute('/')({
  beforeLoad: authMiddleware,
  component: WorkspaceList,
})

function WorkspaceList() {
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [modal, setModal] = useState<
    'create' | 'edit' | 'member' | 'delete' | null
  >(null)
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(
    null,
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const { workspaces, isLoading, error, create, update, remove, addMember } =
    useWorkspaces()

  useEffect(() => {
    hasAuthSession().then((authenticated) => {
      if (authenticated) {
        setIsAuthenticated(true)
        return
      }

      window.location.assign('/auth/login')
    })
  }, [])

  if (!isAuthenticated) return null

  function openModal(nextModal: typeof modal, workspace?: Workspace) {
    setActionError(null)
    setSelectedWorkspace(workspace ?? null)
    setModal(nextModal)
  }

  function closeModal() {
    setModal(null)
    setSelectedWorkspace(null)
    setActionError(null)
  }

  async function submitAction(action: () => Promise<unknown>) {
    setIsSubmitting(true)
    setActionError(null)
    try {
      await action()
      setModal(null)
      setSelectedWorkspace(null)
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : 'Workspace action failed',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="min-h-screen w-full bg-background p-6 md:p-8 xl:p-10">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-display-title font-bold text-on-surface">
              Your Workspaces
            </h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Manage and access all your organization's active environments.
            </p>
          </div>
          <Button icon={MdAdd} size="sm" onClick={() => openModal('create')}>
            Create Workspace
          </Button>
        </div>
        {isLoading ? (
          <p className="text-body-sm text-on-surface-variant">
            Loading workspaces...
          </p>
        ) : null}
        {error ? (
          <p className="text-body-sm text-error">
            {error instanceof Error
              ? error.message
              : 'Unable to load workspaces'}
          </p>
        ) : null}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {workspaces.map((workspace) => (
            <Card
              key={workspace.id}
              name={workspace.name}
              description={workspace.description ?? ''}
              members={
                Array.isArray(workspace.members)
                  ? workspace.members.length
                  : (workspace.members ?? 0)
              }
              plan={workspace.plan ?? 'Free'}
              onOpen={() =>
                navigate({
                  to: '/workspace/$id',
                  params: { id: workspace.graph_id },
                })
              }
            >
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(event) => {
                    event.stopPropagation()
                    openModal('edit', workspace)
                  }}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(event) => {
                    event.stopPropagation()
                    openModal('member', workspace)
                  }}
                >
                  Add member
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(event) => {
                    event.stopPropagation()
                    openModal('delete', workspace)
                  }}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
      <Modal
        open={modal !== null}
        onClose={closeModal}
        title={
          modal === 'create'
            ? 'Create workspace'
            : modal === 'edit'
              ? 'Edit workspace'
              : modal === 'member'
                ? 'Add member'
                : 'Delete workspace'
        }
      >
        {modal === 'delete' ? (
          <div className="space-y-5">
            <p className="text-body-sm text-on-surface-variant">
              Delete <strong>{selectedWorkspace?.name}</strong>? This action
              cannot be undone.
            </p>
            {actionError ? (
              <p className="text-sm text-error">{actionError}</p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={isSubmitting}
                onClick={() => {
                  if (selectedWorkspace) {
                    void submitAction(() => remove(selectedWorkspace.id))
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        ) : modal === 'member' ? (
          <Form
            initialValues={{ role: 'member' }}
            onFinish={async (values) => {
              if (!selectedWorkspace) return
              await submitAction(() =>
                addMember(
                  selectedWorkspace.id,
                  String(values.email ?? ''),
                  String(values.role ?? 'member'),
                ),
              )
            }}
          >
            <Form.Item
              name="email"
              label="Email"
              rules={[
                {
                  required: true,
                  type: 'email',
                  message: 'Valid email required',
                },
              ]}
            >
              <Input type="email" placeholder="user@example.com" />
            </Form.Item>
            <Form.Item
              name="role"
              label="Role"
              rules={[{ required: true, message: 'Role required' }]}
            >
              <select
                className="h-10 w-full rounded-lg border border-slate-200 bg-surface-container-lowest px-3 py-2 text-body-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                defaultValue="member"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </Form.Item>
            {actionError ? (
              <p className="text-sm text-error">{actionError}</p>
            ) : null}
            <Button
              type="submit"
              loading={isSubmitting}
              className="mt-4 w-full"
            >
              Add member
            </Button>
          </Form>
        ) : (
          <Form
            initialValues={
              selectedWorkspace
                ? {
                    name: selectedWorkspace.name,
                    description: selectedWorkspace.description ?? '',
                  }
                : undefined
            }
            onFinish={async (values) => {
              const input = {
                name: String(values.name ?? ''),
                description: String(values.description ?? ''),
              }
              await submitAction(() =>
                modal === 'edit' && selectedWorkspace
                  ? update(selectedWorkspace.id, input)
                  : create(input),
              )
            }}
          >
            <Form.Item
              name="name"
              label="Workspace name"
              rules={[{ required: true, message: 'Workspace name required' }]}
            >
              <Input placeholder="My Workspace" />
            </Form.Item>
            <Form.Item name="description" label="Description">
              <Input placeholder="Workspace description" />
            </Form.Item>
            {actionError ? (
              <p className="text-sm text-error">{actionError}</p>
            ) : null}
            <Button
              type="submit"
              loading={isSubmitting}
              className="mt-4 w-full"
            >
              {modal === 'edit' ? 'Save changes' : 'Create workspace'}
            </Button>
          </Form>
        )}
      </Modal>
    </section>
  )
}
