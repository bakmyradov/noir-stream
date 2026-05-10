import { useCallback, useEffect, useRef, useState } from 'react'
import { SOURCES } from '../sources'
import type { Source } from '../types'

const LOAD_TIMEOUT_MS = 12_000

interface UseEmbedFallbackResult {
  source: Source
  remaining: number
  total: number
  onIframeLoad: () => void
  onIframeError: () => void
  reset: () => void
}

// Tracks whether the current iframe loaded; if it doesn't fire `load` within
// LOAD_TIMEOUT_MS, or it errors, we rotate to the next source automatically.
// `embedKey` should change whenever the underlying media (movie id, episode)
// changes so we restart the watchdog and the tried-source set.
//
// Note: cross-origin iframes don't reliably emit `error`, so the timeout is the
// real fallback path — `onIframeError` is best-effort only.
export function useEmbedFallback(
  active: string,
  setActive: (id: string) => void,
  embedKey: string,
): UseEmbedFallbackResult {
  const [tried, setTried] = useState<Set<string>>(() => new Set([active]))
  const [lastKey, setLastKey] = useState(embedKey)
  const timerRef = useRef<number | null>(null)
  const loadedRef = useRef(false)

  // When the underlying media changes, drop the tried-source memory so each
  // title gets a fresh fallback chain. Resetting state during render (rather
  // than in an effect) avoids a cascading re-render.
  if (lastKey !== embedKey) {
    setLastKey(embedKey)
    setTried(new Set([active]))
  }

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const advance = useCallback(() => {
    if (loadedRef.current) return
    setTried((prev) => {
      const next = SOURCES.find((s) => !prev.has(s.id) && s.id !== active)
      if (!next) return prev
      setActive(next.id)
      return new Set(prev).add(next.id)
    })
  }, [active, setActive])

  useEffect(() => {
    loadedRef.current = false
    clearTimer()
    timerRef.current = window.setTimeout(advance, LOAD_TIMEOUT_MS)
    return clearTimer
  }, [embedKey, active, advance])

  const reset = useCallback(() => {
    setTried(new Set([active]))
  }, [active])

  const onIframeLoad = useCallback(() => {
    loadedRef.current = true
    clearTimer()
  }, [])

  const onIframeError = useCallback(() => {
    clearTimer()
    advance()
  }, [advance])

  const source = SOURCES.find((s) => s.id === active) ?? SOURCES[0]!

  const remaining = SOURCES.length - tried.size
  return { source, remaining, total: SOURCES.length, onIframeLoad, onIframeError, reset }
}
