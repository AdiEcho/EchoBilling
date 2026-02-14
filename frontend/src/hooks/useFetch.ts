import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../lib/utils'

interface UseFetchOptions {
  /** Extra dependencies that trigger refetch */
  deps?: unknown[]
  /** Skip the initial fetch (useful for conditional fetching) */
  skip?: boolean
  /** Items per page for paginated endpoints */
  limit?: number
}

interface UseFetchReturn<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

interface PaginatedReturn<T> extends UseFetchReturn<T> {
  page: number
  totalPages: number
  setPage: (page: number) => void
}

/**
 * Generic data fetching hook that replaces the repeated
 * useState + useEffect + api() pattern across pages.
 */
export function useFetch<T>(path: string, options: UseFetchOptions = {}): UseFetchReturn<T> {
  const { deps = [], skip = false } = options
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(!skip)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  const fetchData = useCallback(async () => {
    if (skip) return
    setLoading(true)
    setError(null)
    try {
      const result = await api<T>(path)
      if (mountedRef.current) {
        setData(result)
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Request failed')
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [path, skip])

  useEffect(() => {
    mountedRef.current = true
    void fetchData()
    return () => {
      mountedRef.current = false
    }
  }, [fetchData, ...deps])

  return { data, loading, error, refetch: fetchData }
}

/**
 * Paginated data fetching hook.
 * Expects the API to return `{ [key]: T[], total: number }`.
 */
export function usePaginatedFetch<T>(
  basePath: string,
  dataKey: string,
  options: UseFetchOptions = {},
): PaginatedReturn<T[]> {
  const { deps = [], skip = false, limit = 10 } = options
  const [data, setData] = useState<T[] | null>(null)
  const [loading, setLoading] = useState(!skip)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const mountedRef = useRef(true)

  const fetchData = useCallback(async () => {
    if (skip) return
    setLoading(true)
    setError(null)
    try {
      const separator = basePath.includes('?') ? '&' : '?'
      const result = await api<Record<string, unknown>>(
        `${basePath}${separator}page=${page}&limit=${limit}`,
      )
      if (mountedRef.current) {
        setData((result[dataKey] as T[]) ?? [])
        const total = (result.total as number) ?? 0
        setTotalPages(Math.max(1, Math.ceil(total / limit)))
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Request failed')
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [basePath, dataKey, page, limit, skip])

  useEffect(() => {
    mountedRef.current = true
    void fetchData()
    return () => {
      mountedRef.current = false
    }
  }, [fetchData, ...deps])

  return { data, loading, error, refetch: fetchData, page, totalPages, setPage }
}
