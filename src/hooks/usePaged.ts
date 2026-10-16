import { useEffect, useEffectEvent, useState } from 'react'
import type { Paged } from '../types'

interface Loaded<T> {
  items: T[]
  pages: number
  totalPages: number
  totalResults: number
}

interface State<T> {
  key: string | null
  data: Loaded<T>
  wanted: number
}

const EMPTY: Loaded<never> = { items: [], pages: 0, totalPages: 0, totalResults: 0 }

// Keeps loaded pages per query so going back to a results page restores what was
// there (and how far it was scrolled) instead of starting over at page 1.
const cache = new Map<string, Loaded<unknown>>()
const CACHE_LIMIT = 20

function remember(key: string, data: Loaded<unknown>) {
  cache.delete(key)
  cache.set(key, data)
  if (cache.size > CACHE_LIMIT) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
}

function initial<T>(key: string | null): State<T> {
  const cached = key ? (cache.get(key) as Loaded<T> | undefined) : undefined
  return { key, data: cached ?? EMPTY, wanted: Math.max(1, cached?.pages ?? 1) }
}

/**
 * Loads TMDB pages one at a time for `key`; changing the key starts over.
 * A null key means there is nothing to load (e.g. an empty search box).
 */
export function usePaged<T extends { id: number; media_type: string }>(
  key: string | null,
  fetchPage: (page: number, signal: AbortSignal) => Promise<Paged<T>>,
) {
  const [state, setState] = useState<State<T>>(() => initial<T>(key))
  const [failed, setFailed] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  // Reset during render (not in an effect) so a new key never shows the old results.
  let current = state
  if (state.key !== key) {
    current = initial<T>(key)
    setState(current)
  }

  const { data, wanted } = current
  const nextPage = key !== null && data.pages < wanted ? data.pages + 1 : null
  const requestId = nextPage === null ? null : `${key}#${nextPage}#${attempt}`
  const loading = requestId !== null && failed !== requestId
  const error = requestId !== null && failed === requestId

  const load = useEffectEvent(fetchPage)

  useEffect(() => {
    if (key === null || nextPage === null || requestId === null) return
    const controller = new AbortController()
    load(nextPage, controller.signal)
      .then((res) => {
        setState((prev) => {
          if (prev.key !== key || prev.data.pages >= nextPage) return prev
          // Popularity shifts between page requests, so TMDB can repeat a title.
          const seen = new Set(prev.data.items.map((it) => `${it.media_type}-${it.id}`))
          const fresh = res.results.filter((it) => !seen.has(`${it.media_type}-${it.id}`))
          const next: Loaded<T> = {
            items: [...prev.data.items, ...fresh],
            pages: nextPage,
            totalPages: res.total_pages,
            totalResults: res.total_results,
          }
          remember(key, next)
          return { ...prev, data: next }
        })
      })
      .catch((e) => {
        if ((e as Error).name !== 'AbortError') setFailed(requestId)
      })
    return () => controller.abort()
  }, [key, nextPage, requestId])

  return {
    items: data.items,
    totalResults: data.totalResults,
    /** Nothing loaded yet for this key. */
    initialLoading: loading && data.pages === 0,
    loading,
    error,
    hasMore: data.pages > 0 && data.pages < data.totalPages,
    loadMore: () => {
      if (loading || error) return
      setState((prev) => ({ ...prev, wanted: prev.data.pages + 1 }))
    },
    retry: () => setAttempt((n) => n + 1),
  }
}
