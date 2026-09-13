import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, cleanup, act } from '@testing-library/react'
import * as Y from 'yjs'
import { useDocumentCollaboration } from './hooks/useDocumentCollaboration'
import * as authService from './services/collaborationAuthService'
import type { CollaborationAuthData } from './types'

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('#/config/axios', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    request: vi.fn(),
  },
}))

const mockGetCollaborationAuth = vi.spyOn(authService, 'getCollaborationAuth')

// ── vi.mock: fully self-contained factory ─────────────────────────────────────
// Each call to `new WebsocketProvider()` returns a FRESH stub — no shared state between tests.
vi.mock('y-partykit/provider', () => {
  // Track instances for test inspection.
  const instances: Array<Record<string, unknown>> = []

  function createStub(url: string, _room: string, doc: Y.Doc) {
    const docRef = { current: doc }
    const listeners = new Map<string, Set<(e: unknown) => void>>()
    const autoConnected = { current: false }

    const emit = ((event: string, ...args: unknown[]) => {
      listeners.get(event)?.forEach(cb => cb(args[0]))
    }) as (...a: unknown[]) => void

    const on = ((event: string, cb: (e: unknown) => void) => {
      let set = listeners.get(event)
      if (!set) { set = new Set(); listeners.set(event, set) }
      set.add(cb)
      // Auto-fire 'connected' once when first status listener attaches.
      if (event === 'status' && !autoConnected.current) {
        autoConnected.current = true
        listeners.get('status')?.forEach(c => c({ status: 'connected' }))
      }
      return () => {}
    }) as (event: string, cb: (e: unknown) => void) => () => void

    const stub = {
      get url() { return url },
      get doc() { return docRef.current },
      awareness: {} as Record<string, unknown>,
      synced: true,
      emit,
      on,
      off: vi.fn(),
      destroy: vi.fn(),
    }
    instances.push(stub)
    return stub
  }

  function Constructor(_url: string, _room: string, d: Y.Doc, options?: Record<string, unknown>) {
    // When isPrefixedUrl is true, the full websocket URL is passed as the first arg.
    const finalUrl = (options?.isPrefixedUrl as boolean) ? _url : `${_url}/${_room}`
    return createStub(finalUrl, _room, d)
  }

  const spy = vi.fn(Constructor) as unknown as typeof import('y-partykit/provider').WebsocketProvider

  return { __esModule: true, WebsocketProvider: spy }
})

// Import the spy for call inspection — not used directly, suppresses TS6133 via mock side-effect.
import { WebsocketProvider } from 'y-partykit/provider'
void WebsocketProvider

// ── Test helpers ──────────────────────────────────────────────────────────────

const DEFAULT_AUTH_DATA: CollaborationAuthData = {
  room: 'room-doc-1',
  websocketUrl: 'wss://party.example.com/collaboration',
  token: 'mock-token',
  permissionMode: 'edit',
}

function seedSuccessfulAuth(override?: Partial<CollaborationAuthData>) {
  mockGetCollaborationAuth.mockResolvedValueOnce({ ...DEFAULT_AUTH_DATA, ...override })
}

function seedAuthFailure(message = 'Unauthorized') {
  mockGetCollaborationAuth.mockRejectedValueOnce(new Error(message))
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

const BASE_OPTIONS = {
  graphId: 'doc-1',
  workspaceId: 'ws-1',
  userName: 'Test User',
  userColor: '#FF0000',
}

describe('useDocumentCollaboration', () => {
  it('requests auth with the correct document/workspace context', async () => {
    seedSuccessfulAuth()
    renderHook(() => useDocumentCollaboration(BASE_OPTIONS))
    await waitFor(() => {
      expect(mockGetCollaborationAuth).toHaveBeenCalledWith('doc-1', 'ws-1')
    })
  })

  it('creates a Y.Doc and provider after auth resolves', async () => {
    seedSuccessfulAuth()
    const { result } = renderHook(() => useDocumentCollaboration(BASE_OPTIONS))
    await waitFor(() => {
      expect(result.current.yDoc).toBeInstanceOf(Y.Doc)
      expect(result.current.provider).not.toBeNull()
      expect(result.current.fragment).toBeInstanceOf(Y.XmlFragment)
    })
  })

  it('uses backend-authorized room identity (websocketUrl + room)', async () => {
    seedSuccessfulAuth({ room: 'custom-room', websocketUrl: 'wss://custom.host/collaboration', permissionMode: 'read' })
    const { result } = renderHook(() => useDocumentCollaboration(BASE_OPTIONS))
    await waitFor(() => {
      expect(result.current.provider).not.toBeNull()
      const p = result.current.provider as unknown as Record<string, unknown>
      // With isPrefixedUrl=true the URL is the raw websocketUrl; room is tracked separately.
      expect((p.url as string)).toContain('custom.host')
      expect(result.current.yDoc).toBeInstanceOf(Y.Doc)
    })
  })

  it('exposes exactly one Y.Doc/provider lifecycle per active Document', async () => {
    seedSuccessfulAuth()
    const { result, rerender } = renderHook(
      ({ opts }: { opts: typeof BASE_OPTIONS }) => useDocumentCollaboration(opts),
      { initialProps: { opts: BASE_OPTIONS } },
    )
    await waitFor(() => expect(result.current.yDoc).not.toBeNull())
    const firstDoc = result.current.yDoc
    const firstProvider = result.current.provider
    rerender({ opts: BASE_OPTIONS })
    await waitFor(() => {
      expect(result.current.yDoc).toBe(firstDoc)
      expect(result.current.provider).toBe(firstProvider)
    })
  })

  it('disposing old pair and creating a new one when graphId changes', async () => {
    seedSuccessfulAuth()
    const { result, rerender } = renderHook(
      ({ opts }: { opts: typeof BASE_OPTIONS }) => useDocumentCollaboration(opts),
      { initialProps: { opts: BASE_OPTIONS } },
    )
    await waitFor(() => expect(result.current.yDoc).not.toBeNull())
    const oldDoc = result.current.yDoc!

    seedSuccessfulAuth({ room: 'room-doc-2', websocketUrl: 'wss://party.example.com/collaboration' })
    rerender({ opts: { ...BASE_OPTIONS, graphId: 'doc-2', workspaceId: 'ws-1' } })

    await waitFor(() => {
      expect(result.current.yDoc).not.toBeNull()
      expect(result.current.yDoc).not.toBe(oldDoc)
    })
  })

  it('auth failure prevents room connection and surfaces error', async () => {
    seedAuthFailure('Forbidden')
    const { result } = renderHook(() => useDocumentCollaboration(BASE_OPTIONS))
    await waitFor(() => {
      expect(result.current.state).toBe('error')
      expect(result.current.error).toContain('Forbidden')
      expect(result.current.yDoc).toBeNull()
      expect(result.current.provider).toBeNull()
    })
  })

  it('reconnect preserves Yjs synchronization (no block replacement)', async () => {
    seedSuccessfulAuth()
    const { result } = renderHook(() => useDocumentCollaboration(BASE_OPTIONS))
    await waitFor(() => expect(result.current.yDoc).not.toBeNull())

    const doc = result.current.yDoc!
    doc.getXmlFragment('blocknote').push([new Y.XmlText('local-change')])

    // Fire initial 'connected' then simulate reconnect cycle.
    const provider = result.current.provider!
    act(() => {
      ;(provider.emit as (...a: unknown[]) => void)('status', { status: 'connected' })
    })
    await waitFor(() => expect(result.current.state).toBe('connected'))

    act(() => {
      ;(provider.emit as (...a: unknown[]) => void)('status', { status: 'disconnected' })
    })
    await waitFor(() => expect(result.current.state).toBe('reconnecting'))

    act(() => {
      ;(provider.emit as (...a: unknown[]) => void)('status', { status: 'connected' })
    })
    await waitFor(() => expect(result.current.state).toBe('connected'))

    expect(result.current.fragment).toBe(doc.getXmlFragment('blocknote'))
  })

  it('connection-state transitions are exposed correctly', async () => {
    seedSuccessfulAuth()
    const { result } = renderHook(() => useDocumentCollaboration(BASE_OPTIONS))

    // Wait for auto-fire 'connected' (fires when hook registers status listener).
    await waitFor(() => expect(result.current.state).toBe('connected'))

    // Simulate disconnect → reconnect cycle.
    act(() => {
      ;(result.current.provider!.emit as (...a: unknown[]) => void)('status', { status: 'disconnected' })
    })
    await waitFor(() => expect(result.current.state).toBe('reconnecting'))

    act(() => {
      ;(result.current.provider!.emit as (...a: unknown[]) => void)('status', { status: 'connected' })
    })
    await waitFor(() => expect(result.current.state).toBe('connected'))
  })

  it('connected/synced state never maps to a "Saved" durable state', async () => {
    seedSuccessfulAuth()
    const { result } = renderHook(() => useDocumentCollaboration(BASE_OPTIONS))

    // Fire connected manually.
    act(() => {
      ;((result.current.provider as any)?.emit as (...a: unknown[]) => void)?.('status', { status: 'connected' })
    })
    await waitFor(() => expect(result.current.state).toBe('connected'))

    expect('saved' in result.current).toBe(false)
    expect(result.current.state).not.toBe('saved')
    expect(result.current.state).not.toBe('synced')
  })

  it('awareness object is exposed when connected', async () => {
    seedSuccessfulAuth()
    const { result } = renderHook(() => useDocumentCollaboration(BASE_OPTIONS))
    await waitFor(() => {
      const aw = result.current.awareness
      expect(aw).not.toBeNull()
      expect(typeof aw).toBe('object')
    })
  })

  it('permissionMode is read-only when backend issues read mode', async () => {
    seedSuccessfulAuth({ room: 'r', websocketUrl: 'wss://h/collaboration', permissionMode: 'read' })
    const { result } = renderHook(() => useDocumentCollaboration(BASE_OPTIONS))
    await waitFor(() => expect(result.current.permissionMode).toBe('read'))
  })
})
