import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, act } from '@testing-library/react'
import React from 'react'
import * as documentService from '#/features/documents/documentService'
import { useDocumentAutosave } from '#/features/documents/useDocumentAutosave'
import type { CurrentDocument } from '#/features/documents/documentService'

// ── Mock the service ──────────────────────────────────────────────────────

vi.mock('#/config/axios', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
    request: vi.fn(),
  },
}))

const getDocumentSpy = vi.spyOn(documentService, 'getDocument')
const putDocumentSpy = vi.spyOn(documentService, 'putDocument')

beforeEach(() => {
  vi.clearAllMocks()
  getDocumentSpy.mockResolvedValue({
    graph_id: 'doc-1',
    content: null,
    version: 0,
    updated_at: '2024-01-01T00:00:00Z',
  } satisfies CurrentDocument)
  putDocumentSpy.mockResolvedValue({
    graph_id: 'doc-1',
    content: null,
    version: 1,
    updated_at: '2024-01-01T00:00:01Z',
  } satisfies CurrentDocument)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function wrapperFactory(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

function makeClient(defaultOptions = {}) {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, ...defaultOptions } },
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────

/** Flush all pending microtasks + macrotasks (timers) */
async function flushTimers(ms = 0) {
  await new Promise((r) => setTimeout(r, ms))
  await Promise.resolve()
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('useDocumentAutosave', () => {
  describe('debounce — repeated edits collapse to one save', () => {
    it('only calls PUT once when multiple onChange fires within the debounce window', async () => {
      const qc = makeClient()
      const { result } = renderHook(
        () => useDocumentAutosave('doc-1', { debounceMs: 500 }),
        { wrapper: wrapperFactory(qc) },
      )

      // Simulate 3 rapid changes
      await act(async () => {
        result.current.onChange([{ id: 'b1' }])
        result.current.onChange([{ id: 'b2' }])
        result.current.onChange([{ id: 'b3' }])
      })

      // No save yet — still within debounce window
      expect(putDocumentSpy).not.toHaveBeenCalled()

      // Wait past the debounce window
      await flushTimers(600)

      // Exactly one PUT called, with the LATEST content
      expect(putDocumentSpy).toHaveBeenCalledTimes(1)
      expect(putDocumentSpy).toHaveBeenCalledWith('doc-1', {
        content: [{ id: 'b3' }],
        baseVersion: 0, // initial version from query
      })
      expect(result.current.saveState).toBe('saved')
    })
  })

  describe('edit during in-flight save schedules a follow-up save', () => {
    it('when a new edit arrives while PUT is pending, the newer snapshot is saved after settle', async () => {
      let resolveFirst: (v: CurrentDocument) => void
      const firstPut = new Promise<CurrentDocument>((resolve) => {
        resolveFirst = resolve
      })
      putDocumentSpy.mockReturnValueOnce(firstPut as any)

      const qc = makeClient()
      const { result } = renderHook(
        () => useDocumentAutosave('doc-1', { debounceMs: 100 }),
        { wrapper: wrapperFactory(qc) },
      )

      // Trigger an edit — this starts the first in-flight save
      await act(async () => {
        result.current.onChange([{ id: 'b1' }])
      })

      // Wait for debounce to fire, starting the PUT
      await flushTimers(150)

      // Resolve the first PUT FIRST — this updates versionRef to 1
      await act(async () => {
        resolveFirst!({
          graph_id: 'doc-1',
          content: [{ id: 'b1' }],
          version: 1,
          updated_at: '2024-01-01T00:00:01Z',
        })
      })

      // While first PUT is settled, trigger another edit
      await act(async () => {
        result.current.onChange([{ id: 'b2' }])
      })

      // Wait for the second debounced save to fire
      await flushTimers(200)

      // Two PUTs were made: first with b1 (version 0), second with b2 (version 1)
      expect(putDocumentSpy).toHaveBeenCalledTimes(2)
      expect(putDocumentSpy.mock.calls[0][1]).toEqual({
        content: [{ id: 'b1' }],
        baseVersion: 0,
      })
      expect(putDocumentSpy.mock.calls[1][1]).toEqual({
        content: [{ id: 'b2' }],
        baseVersion: 1,
      })
      expect(result.current.saveState).toBe('saved')
    })
  })

  describe('stale responses cannot produce false Saved state', () => {
    it('a late-resolving older request does not overwrite the UI with its data', async () => {
      // First PUT resolves slowly, second PUT resolves quickly
      let resolveSlow: (v: CurrentDocument) => void
      const slowPromise = new Promise<CurrentDocument>((resolve) => {
        resolveSlow = resolve
      })
      putDocumentSpy
        .mockReturnValueOnce(slowPromise as any)
        .mockResolvedValueOnce({
          graph_id: 'doc-1',
          content: [{ id: 'b2' }],
          version: 2,
          updated_at: '2024-01-01T00:00:03Z',
        } satisfies CurrentDocument)

      const qc = makeClient()
      const { result } = renderHook(
        () => useDocumentAutosave('doc-1', { debounceMs: 50 }),
        { wrapper: wrapperFactory(qc) },
      )

      // Trigger first change → starts slow PUT
      await act(async () => {
        result.current.onChange([{ id: 'b1' }])
      })
      await flushTimers(100)

      // Trigger second change → starts fast PUT
      await act(async () => {
        result.current.onChange([{ id: 'b2' }])
      })
      await flushTimers(100)

      // Fast PUT resolves first
      expect(result.current.saveState).toBe('saved')
      expect(result.current.version).toBe(2)

      // Now resolve the slow (stale) PUT
      await act(async () => {
        resolveSlow!({
          graph_id: 'doc-1',
          content: [{ id: 'b1' }],
          version: 1,
          updated_at: '2024-01-01T00:00:02Z',
        } satisfies CurrentDocument)
      })
      await flushTimers(50)

      // State must remain at the newer values, NOT the stale response
      expect(result.current.saveState).toBe('saved')
      expect(result.current.version).toBe(2)
      expect(result.current.latestContent).toEqual([{ id: 'b2' }])
    })
  })

  describe('failed save keeps content intact and enters error state', () => {
    it('on PUT rejection, saveState becomes save-failed and latestContent is preserved', async () => {
      putDocumentSpy.mockRejectedValueOnce(new Error('network error'))

      const qc = makeClient()
      const { result } = renderHook(
        () => useDocumentAutosave('doc-1', { debounceMs: 50 }),
        { wrapper: wrapperFactory(qc) },
      )

      await act(async () => {
        result.current.onChange([{ id: 'b1' }])
      })
      await flushTimers(100)

      expect(result.current.saveState).toBe('save-failed')
      expect(result.current.latestContent).toEqual([{ id: 'b1' }])
      // Version should NOT have advanced (no accepted response)
      expect(result.current.version).toBe(0)
    })
  })

  describe('retry advances durable version and returns to saved', () => {
    it('calling saveNow after a failure triggers a new PUT that can succeed', async () => {
      putDocumentSpy
        .mockRejectedValueOnce(new Error('server error'))
        .mockResolvedValueOnce({
          graph_id: 'doc-1',
          content: [{ id: 'b1' }],
          version: 1,
          updated_at: '2024-01-01T00:00:02Z',
        } satisfies CurrentDocument)

      const qc = makeClient()
      const { result } = renderHook(
        () => useDocumentAutosave('doc-1', { debounceMs: 50 }),
        { wrapper: wrapperFactory(qc) },
      )

      // Trigger edit → first PUT fails
      await act(async () => {
        result.current.onChange([{ id: 'b1' }])
      })
      await flushTimers(100)
      expect(result.current.saveState).toBe('save-failed')

      // Manually retry
      await act(async () => {
        result.current.saveNow()
      })
      await flushTimers(100)

      expect(result.current.saveState).toBe('saved')
      expect(result.current.version).toBe(1)
      expect(putDocumentSpy).toHaveBeenCalledTimes(2)
    })
  })

  describe('changing graphId cancels and resets pending work', () => {
    it('resets saveState and latestContent when graphId changes to a new doc', async () => {
      const qc = makeClient()
      const { result } = renderHook(
        () => useDocumentAutosave('doc-1'),
        { wrapper: wrapperFactory(qc) },
      )

      await act(async () => {
        result.current.onChange([{ id: 'b1' }])
      })
      expect(result.current.saveState).toBe('dirty')
      expect(result.current.latestContent).toEqual([{ id: 'b1' }])

      // Re-render with a different graphId
      const { result: result2 } = renderHook(
        ({ gid }: { gid: string }) => useDocumentAutosave(gid),
        {
          initialProps: { gid: 'doc-2' },
          wrapper: wrapperFactory(qc),
        },
      )

      // State should be reset for the new document
      expect(result2.current.saveState).toBe('saved')
      expect(result2.current.latestContent).toBeNull()
    })

    it('a stale in-flight PUT for the old graphId cannot commit after switch', async () => {
      let resolvePending: (v: CurrentDocument) => void
      const pendingPromise = new Promise<CurrentDocument>((resolve) => {
        resolvePending = resolve
      })
      putDocumentSpy.mockReturnValueOnce(pendingPromise as any)

      const qc = makeClient()

      // Render hook for doc-1
      const { result } = renderHook(
        () => useDocumentAutosave('doc-1', { debounceMs: 500 }),
        { wrapper: wrapperFactory(qc) },
      )

      // Trigger an edit on doc-1
      await act(async () => {
        result.current.onChange([{ id: 'b1' }])
      })

      // Switch to doc-2 before debounce fires
      const { result: result2 } = renderHook(
        ({ gid }: { gid: string }) =>
          useDocumentAutosave(gid, { debounceMs: 500 }),
        {
          initialProps: { gid: 'doc-2' },
          wrapper: wrapperFactory(qc),
        },
      )

      // Resolve the old pending PUT — should be ignored since seq changed
      await act(async () => {
        resolvePending!({
          graph_id: 'doc-1',
          content: [{ id: 'b1' }],
          version: 1,
          updated_at: '2024-01-01T00:00:01Z',
        })
      })

      // Wait long enough that if the stale response had been accepted,
      // it would have updated result2's state
      await flushTimers(600)

      // result2 should still show saved state with null content (doc-2's initial)
      expect(result2.current.saveState).toBe('saved')
      expect(result2.current.version).toBe(0)
    })
  })
})
