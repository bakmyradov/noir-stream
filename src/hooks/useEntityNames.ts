import { useEffect, useState } from 'react'
import { lookupName } from '../api'
import type { NamedEntity } from '../types'

/** Names for keyword / company ids taken from the URL, looked up once each. */
export function useEntityNames(kind: 'keyword' | 'company', ids: number[]): NamedEntity[] {
  const [names, setNames] = useState<Record<string, string>>({})
  const idsKey = ids.join(',')

  useEffect(() => {
    const wanted = idsKey ? idsKey.split(',').map(Number) : []
    if (wanted.length === 0) return
    let cancelled = false
    void Promise.all(
      wanted.map((id) => lookupName(kind, id).catch(() => ({ id, name: `#${id}` }))),
    ).then((found) => {
      if (cancelled) return
      setNames((prev) => {
        const next = { ...prev }
        for (const e of found) next[`${kind}:${e.id}`] = e.name
        return next
      })
    })
    return () => {
      cancelled = true
    }
  }, [kind, idsKey])

  return ids.map((id) => ({ id, name: names[`${kind}:${id}`] ?? '…' }))
}
