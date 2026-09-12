import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/workspace/$id/')({
  component: WorkspaceHome,
})

function WorkspaceHome() {
  const { id } = Route.useParams()

  return (
    <section className="flex min-h-[calc(100vh-3rem)] items-center justify-center p-6">
      <div className="w-full max-w-3xl rounded-xl border border-outline-variant bg-surface-container-lowest p-8">
        <p className="mb-2 text-label-md uppercase tracking-wider text-primary">
          Workspace
        </p>
        <h1 className="text-display-title">Welcome back</h1>
        <p className="mt-3 text-body-md text-on-surface-variant">
          Workspace ID: {id}
        </p>
      </div>
    </section>
  )
}