import { useCallback, useEffect, useRef, useState } from 'react'
import { SOURCES } from '../sources'
import type { Source } from '../types'

const LOAD_TIMEOUT_MS = 12_000

interface UseEmbedFallbackResult {
  source: Source
  remaining: number
  onIframeLoad: () => void
  onIframeError: () => void
  reset: () => void
}

// Tracks whether the current iframe loaded; if it doesn't fire `load` within
// LOAD_TIMEOUT_MS, or it errors, we rotate to the next source automatically.
// `embedKey` should change whenever the underlying media (movie id, episode)
// changes so we restart the watchdog.
export function useEmbedFallback(
  active: string,
  setActive: (id: string) => void,
  embedKey: string,
): UseEmbedFallbackResult {
  const [tried, setTried] = useState<Set<string>>(() => new Set([active]))
  const timerRef = useRef<number | null>(null)
  const loadedRef = useRef(false)

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const advance = useCallback(() => {
    if (loadedRef.current) return
    const next = SOURCES.find((s) => !tried.has(s.id) && s.id !== active)
    if (!next) return
    setTried((prev) => new Set(prev).add(next.id))
    setActive(next.id)
  }, [active, tried, setActive])

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
  return { source, remaining, onIframeLoad, onIframeError, reset }
}
