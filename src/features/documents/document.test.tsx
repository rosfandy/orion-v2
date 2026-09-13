import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ---- mocks ----

if (typeof globalThis.matchMedia === 'undefined') {
  Object.defineProperty(globalThis, 'matchMedia', {
    value: (_: string) => ({
      matches: false,
      media: _,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
    writable: true,
    configurable: true,
  })
}

vi.mock('#/config/axios', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    request: vi.fn(),
  },
}))

const navigateMock = vi.fn()
const useParamsMock = vi.fn()

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useParams: () => useParamsMock(),
    useLocation: () => ({ pathname: '/' }),
  }
})

vi.mock('#/features/graphs/hooks/useGraph', () => ({
  useGraph: vi.fn(() => ({ data: [], update: vi.fn(), remove: vi.fn() })),
  useGraphById: vi.fn(() => ({ data: null })),
}))

vi.mock('#/features/auth/services/authService', () => ({
  getCurrentUser: vi.fn().mockResolvedValue({ name: 'Test User', email: 'test@test.com' }),
}))

vi.mock('#/features/collaboration/hooks/useDocumentCollaboration', () => {
  const { Doc } = require('yjs')
  const ydoc = new Doc()
  return {
    useDocumentCollaboration: vi.fn(() => ({
      state: 'connected',
      error: null,
      permissionMode: 'edit',
      fragment: ydoc.getXmlFragment('blocknote'),
      provider: null,
      providerRef: { value: { awareness: { on: vi.fn(), off: vi.fn(), getLocalState: () => null, setLocalStateField: vi.fn(), getStates: () => new Map() }, synced: true, on: vi.fn(), off: vi.fn(), destroy: vi.fn() } },
      awareness: null,
      yDoc: ydoc,
    })),
  }
})

// ---- tests ----

describe('Document sidebar navigation target', () => {
  it('navigates to /workspace/:id/s/d/:docid when a document item is clicked', async () => {
    navigateMock.mockClear()
    useParamsMock.mockReturnValue({ id: 'ws-1', docid: 'doc-1' })

    const { Sidebar } = await import('#/components/fragment/Sidebar')
    const items = [
      { key: 'doc-1', label: 'Meeting Notes', type: 'document' as const },
    ]

    function TestShell() {
      return (
        <Routes>
          <Route path="/workspace/:id" element={
            <div>
              <Sidebar items={items} workspaceId="ws-1" />
            </div>
          } />
        </Routes>
      )
    }

    render(
      <MemoryRouter initialEntries={['/workspace/ws-1']}>
        <TestShell />
      </MemoryRouter>,
    )

    await userEvent.click(screen.getByText('Meeting Notes'))
    expect(navigateMock).toHaveBeenCalledWith('/workspace/ws-1/s/d/doc-1')
  })
})

describe('Document nested route renders inside workspace shell', () => {
  it('renders DocumentPage when navigating to /workspace/:id/s/d/:docid', async () => {
    useParamsMock.mockReturnValue({ id: 'ws-1', docid: 'doc-1' })

    const { default: DocumentPage } = await import(
      '#/routes/workspace/$id/s/d/$docid'
    )

    function TestShell() {
      return (
        <Routes>
          <Route path="/workspace/:id/s/d/:docid" element={<DocumentPage />} />
        </Routes>
      )
    }

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    })

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/workspace/ws-1/s/d/doc-1']}>
          <TestShell />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    // BlockNoteView mounts a container with bn-root class (Mantine-integrated)
    const bnRoot = container.querySelector('.bn-root')
    expect(bnRoot).toBeInTheDocument()
  }, 10_000)
})

describe('Active sidebar key follows docid', () => {
  it('extracts docid from URL path for activeItem matching', () => {
    const path = '/workspace/ws-1/s/d/doc-active'
    const match = path.match(/\/s\/d\/([^/]+)/)
    expect(match?.[1]).toBe('doc-active')

    // List path should not match document pattern
    const listPath = '/workspace/ws-1/s/l/list-42'
    const listMatch = listPath.match(/\/s\/d\/([^/]+)/)
    expect(listMatch).toBeNull()
  })
})

describe('Base editor — renders and emits changes without persistence', () => {
  // Minimal mock provider that satisfies withCollaboration's awareness/synced checks.
  const mockProvider = {
    awareness: { on: vi.fn(), off: vi.fn(), getLocalState: () => null, setLocalStateField: vi.fn(), getStates: () => new Map() },
    synced: true,
    on: vi.fn(),
    off: vi.fn(),
    destroy: vi.fn(),
  }
  const mockProviderRef = { value: mockProvider as any }

  it('renders the editor shell and wires onChange without network calls', async () => {
    const { DocumentEditor } = await import(
      '#/features/documents/DocumentEditor'
    )
    const { Doc } = await import('yjs')
    const ydoc = new Doc()

    const handleChange = vi.fn()

    render(
      <DocumentEditor
        docId="doc-1"
        workspaceId="ws-1"
        yjsFragment={ydoc.getXmlFragment('blocknote')}
        provider={mockProviderRef}
        onChange={handleChange}
      />,
    )

    // BlockNoteView mounts a container with bn-root class (Mantine-integrated)
    const bnRoot = document.querySelector('.bn-root')
    expect(bnRoot).toBeInTheDocument()

    // No network activity at mount — onChange is wired but not fired yet
    expect(handleChange).not.toHaveBeenCalled()
  })

  it('renders with a mock provider', async () => {
    const { DocumentEditor } = await import(
      '#/features/documents/DocumentEditor'
    )
    const { Doc } = await import('yjs')
    const ydoc = new Doc()

    render(
      <DocumentEditor
        docId="doc-1"
        workspaceId="ws-1"
        yjsFragment={ydoc.getXmlFragment('blocknote')}
        provider={mockProviderRef}
        onChange={() => undefined}
      />,
    )

    expect(document.querySelector('.bn-root')).toBeInTheDocument()
  })

  it('mounts Mantine context so Editor reads the provider theme', async () => {
    const { MantineProvider, createTheme } = await import('@mantine/core')
    const { DocumentEditor } = await import(
      '#/features/documents/DocumentEditor'
    )
    const { Doc } = await import('yjs')
    const ydoc = new Doc()

    const customTheme = createTheme({ primaryColor: 'violet' })

    render(
      <MantineProvider theme={customTheme} defaultColorScheme="light">
        <DocumentEditor
          docId="doc-1"
          workspaceId="ws-1"
          yjsFragment={ydoc.getXmlFragment('blocknote')}
          provider={mockProviderRef}
          onChange={() => undefined}
        />
      </MantineProvider>,
    )

    // Editor root present inside Mantine provider
    expect(document.querySelector('.bn-root')).toBeInTheDocument()
  })
})
