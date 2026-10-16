import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

export type ParamChanges = Record<string, string | number | null | undefined>

/**
 * Search params plus an `update` that merges changes into the URL. Empty values
 * drop the param. Filter tweaks replace the history entry, so Back still leaves the page.
 */
export function useUrlParams() {
  const [params, setParams] = useSearchParams()
  const update = useCallback(
    (changes: ParamChanges) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [k, v] of Object.entries(changes)) {
            if (v === null || v === undefined || v === '') next.delete(k)
            else next.set(k, String(v))
          }
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )
  return [params, update] as const
}

export function intParam(value: string | null): number | undefined {
  const n = Number(value)
  return value && Number.isInteger(n) && n > 0 ? n : undefined
}

export function idListParam(value: string | null): number[] {
  return (value ?? '')
    .split(',')
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0)
}
