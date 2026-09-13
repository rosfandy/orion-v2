import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { DocumentVersion } from '#/features/documents/services/documentVersionService'
import { VersionHistoryFullError, createManualSnapshot, deleteDocumentVersion, listDocumentVersions } from '#/features/documents/services/documentVersionService'
import { useDocumentVersions } from '#/features/documents/hooks/useDocumentVersions'
import * as docVersionService from '#/features/documents/services/documentVersionService'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { isHistoryFull, sortVersionsNewestFirst } from '#/features/documents/versionHistoryUtils'

// ---- mocks ----

vi.mock('#/config/axios', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

const { apiClient } = await import('#/config/axios')
const getMock = vi.mocked(apiClient.get)
const postMock = vi.mocked(apiClient.post)
const deleteMock = vi.mocked(apiClient.delete)

function makeResponse<T>(data: T) {
  return Promise.resolve({ data: { success: true, data, message: '' } })
}

function makeVersion(overrides: Partial<DocumentVersion> & { version_number: number; is_manual: boolean }): DocumentVersion {
  return {
    id: `v-${overrides.id ?? '1'}`,
    graph_id: 'g-1',
    version_number: overrides.version_number,
    created_at: overrides.created_at ?? '2024-01-01T00:00:00Z',
    is_manual: overrides.is_manual,
    text_preview: overrides.text_preview ?? '',
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  getMock.mockResolvedValue(makeResponse([
    makeVersion({ version_number: 3, is_manual: false, id: 'v3' }),
    makeVersion({ version_number: 2, is_manual: true, id: 'v2' }),
    makeVersion({ version_number: 1, is_manual: true, id: 'v1' }),
  ]))
  postMock.mockResolvedValue(makeResponse(makeVersion({ version_number: 4, is_manual: true, id: 'v4' })))
  deleteMock.mockResolvedValue(makeResponse(null))
})

// ─────────────────────────────────────────────
// Service layer tests
// ─────────────────────────────────────────────

describe('service — listDocumentVersions', () => {
  it('returns data on success', async () => {
    const versions = [makeVersion({ version_number: 1, is_manual: true })]
    getMock.mockResolvedValueOnce(makeResponse(versions))
    const result = await listDocumentVersions('g-1')
    expect(result).toEqual(versions)
    expect(getMock).toHaveBeenCalledWith('/documents/g-1/versions')
  })

  it('throws on failure response', async () => {
    getMock.mockResolvedValueOnce({ data: { success: false, message: 'oops', data: [] } })
    await expect(listDocumentVersions('g-1')).rejects.toThrow('oops')
  })
})

describe('service — createManualSnapshot', () => {
  it('calls POST and returns the new version', async () => {
    const newVer = makeVersion({ version_number: 5, is_manual: true })
    postMock.mockResolvedValueOnce(makeResponse(newVer))
    const result = await createManualSnapshot({ graph_id: 'g-1' })
    expect(result.version_number).toBe(5)
    expect(postMock).toHaveBeenCalledWith('/documents/g-1/versions', {})
  })

  it('throws VersionHistoryFullError on VERSION_HISTORY_FULL conflict', async () => {
    const msg = 'VERSION_HISTORY_FULL: All 10 history slots are occupied by manual snapshots'
    postMock.mockResolvedValueOnce({ data: { success: false, message: msg, data: null } })
    await expect(createManualSnapshot({ graph_id: 'g-1' })).rejects.toBeInstanceOf(VersionHistoryFullError)
  })
})

describe('service — deleteDocumentVersion', () => {
  it('calls DELETE and returns void', async () => {
    deleteMock.mockResolvedValueOnce(makeResponse(null))
    await expect(deleteDocumentVersion('g-1', 'v-abc')).resolves.toBeUndefined()
    expect(deleteMock).toHaveBeenCalledWith('/documents/g-1/versions/v-abc')
  })
})

// ─────────────────────────────────────────────
// Hook tests
// ─────────────────────────────────────────────

describe('useDocumentVersions', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  beforeEach(() => {
    queryClient.clear()
  })

  it('fetches versions on mount', async () => {
    const sList = vi.spyOn(docVersionService, 'listDocumentVersions')
    sList.mockResolvedValueOnce([
      makeVersion({ version_number: 1, is_manual: true }),
      makeVersion({ version_number: 2, is_manual: false }),
    ] as any)

    const { result } = renderHook(() => useDocumentVersions('g-1'), { wrapper })

    await waitFor(() => {
      expect(result.current.versions).toHaveLength(2)
    })
    expect(sList).toHaveBeenCalledWith('g-1')
  })

  it('createManual calls service and invalidates query', async () => {
    const sList = vi.spyOn(docVersionService, 'listDocumentVersions')
    const sCreate = vi.spyOn(docVersionService, 'createManualSnapshot')
    sList.mockResolvedValueOnce([makeVersion({ version_number: 1, is_manual: true })] as any)
    sCreate.mockResolvedValueOnce(makeVersion({ version_number: 2, is_manual: true }) as any)

    const { result } = renderHook(() => useDocumentVersions('g-1'), { wrapper })

    await waitFor(() => {
      expect(result.current.versions).toHaveLength(1)
    })

    await result.current.createManual()
    await waitFor(() => {
      expect(sCreate).toHaveBeenCalledWith({ graph_id: 'g-1', note: undefined })
    })
    await waitFor(() => {
      expect(sList).toHaveBeenCalledTimes(2)
    })
  })

  it('deleteVersion calls service and invalidates query', async () => {
    const sList = vi.spyOn(docVersionService, 'listDocumentVersions')
    const sDelete = vi.spyOn(docVersionService, 'deleteDocumentVersion')
    sList.mockResolvedValueOnce([
      makeVersion({ version_number: 1, is_manual: true }),
      makeVersion({ version_number: 2, is_manual: false }),
    ] as any)
    sDelete.mockResolvedValueOnce(undefined as any)

    const { result } = renderHook(() => useDocumentVersions('g-1'), { wrapper })

    await waitFor(() => {
      expect(result.current.versions).toHaveLength(2)
    })

    await result.current.deleteVersion('v1')
    await waitFor(() => {
      expect(sDelete).toHaveBeenCalledWith('g-1', 'v1')
    })
    await waitFor(() => {
      expect(sList).toHaveBeenCalledTimes(2)
    })
  })

  it('returns empty array before first fetch completes', async () => {
    const sList = vi.spyOn(docVersionService, 'listDocumentVersions')
    sList.mockImplementation(() => new Promise(() => {}))

    const { result } = renderHook(() => useDocumentVersions('g-1'), { wrapper })

    expect(result.current.versions).toEqual([])
    expect(result.current.isLoading).toBe(true)
  })
})

// ─────────────────────────────────────────────
// Utility tests
// ─────────────────────────────────────────────

describe('sortVersionsNewestFirst', () => {
  it('sorts versions descending by version_number', () => {
    const versions: DocumentVersion[] = [
      makeVersion({ version_number: 1, is_manual: true }),
      makeVersion({ version_number: 3, is_manual: false }),
      makeVersion({ version_number: 2, is_manual: true }),
    ]
    const sorted = sortVersionsNewestFirst(versions)
    expect(sorted.map(v => v.version_number)).toEqual([3, 2, 1])
  })

  it('returns empty array for empty input', () => {
    expect(sortVersionsNewestFirst([])).toEqual([])
  })

  it('does not mutate the original array', () => {
    const versions = [
      makeVersion({ version_number: 1, is_manual: true }),
      makeVersion({ version_number: 2, is_manual: false }),
    ]
    const originalIds = versions.map(v => v.id)
    sortVersionsNewestFirst(versions)
    expect(versions.map(v => v.id)).toEqual(originalIds)
  })

  it('preserves all fields when sorting', () => {
    const v1 = makeVersion({ version_number: 1, is_manual: true, text_preview: 'first' })
    const v2 = makeVersion({ version_number: 2, is_manual: false, text_preview: 'second' })
    const sorted = sortVersionsNewestFirst([v1, v2])
    expect(sorted[0].text_preview).toBe('second')
    expect(sorted[1].text_preview).toBe('first')
  })
})

describe('isHistoryFull', () => {
  it('returns true for VersionHistoryFullError', () => {
    expect(isHistoryFull(new VersionHistoryFullError('VERSION_HISTORY_FULL: slots occupied'))).toBe(true)
  })

  it('returns false for null', () => {
    expect(isHistoryFull(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isHistoryFull(undefined)).toBe(false)
  })

  it('returns false for a plain Error', () => {
    expect(isHistoryFull(new Error('something else'))).toBe(false)
  })

  it('returns false for a string', () => {
    expect(isHistoryFull('error message')).toBe(false)
  })

  it('returns false for an object', () => {
    expect(isHistoryFull({ message: 'oops' })).toBe(false)
  })
})
