import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/useAuth'
import type { LibraryRow, MediaType } from '../lib/database.types'

export interface LibraryItemSnapshot {
  tmdb_id: number
  media_type: MediaType
  title: string | null
  poster_path: string | null
}

export interface LibraryContextValue {
  items: LibraryRow[]
  loading: boolean
  isFavorited: (tmdbId: number, mediaType: MediaType) => boolean
  getItem: (tmdbId: number, mediaType: MediaType) => LibraryRow | undefined
  toggleFavorite: (snap: LibraryItemSnapshot) => Promise<void>
  recordOpen: (snap: LibraryItemSnapshot) => Promise<void>
  recordEpisode: (
    snap: LibraryItemSnapshot,
    season: number,
    episode: number,
  ) => Promise<void>
  removeFromHistory: (tmdbId: number, mediaType: MediaType) => Promise<void>
  clearHistory: () => Promise<void>
}

// eslint-disable-next-line react-refresh/only-export-components
export const LibraryContext = createContext<LibraryContextValue | null>(null)

function rowKey(tmdbId: number, mediaType: MediaType) {
  return `${mediaType}:${tmdbId}`
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [items, setItems] = useState<LibraryRow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems([])
      return
    }
    let cancelled = false
    setLoading(true)
    supabase
      .from('library')
      .select('*')
      .eq('user_id', user.id)
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error('library load failed', error)
          setItems([])
        } else {
          setItems((data ?? []) as LibraryRow[])
        }
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  const indexed = useMemo(() => {
    const map = new Map<string, LibraryRow>()
    for (const row of items) map.set(rowKey(row.tmdb_id, row.media_type), row)
    return map
  }, [items])

  const upsertLocal = useCallback((row: LibraryRow) => {
    setItems((prev) => {
      const idx = prev.findIndex(
        (r) => r.tmdb_id === row.tmdb_id && r.media_type === row.media_type,
      )
      if (idx === -1) return [...prev, row]
      const next = prev.slice()
      next[idx] = row
      return next
    })
  }, [])

  const removeLocal = useCallback((tmdbId: number, mediaType: MediaType) => {
    setItems((prev) =>
      prev.filter((r) => !(r.tmdb_id === tmdbId && r.media_type === mediaType)),
    )
  }, [])

  const upsertRemote = useCallback(
    async (row: LibraryRow) => {
      const { error } = await supabase
        .from('library')
        .upsert([row], { onConflict: 'user_id,tmdb_id,media_type' })
      if (error) console.error('library upsert failed', error)
    },
    [],
  )

  const value: LibraryContextValue = {
    items,
    loading,
    isFavorited(tmdbId, mediaType) {
      return indexed.get(rowKey(tmdbId, mediaType))?.favorited ?? false
    },
    getItem(tmdbId, mediaType) {
      return indexed.get(rowKey(tmdbId, mediaType))
    },
    async toggleFavorite(snap) {
      if (!user) return
      const existing = indexed.get(rowKey(snap.tmdb_id, snap.media_type))
      const nextFavorited = !(existing?.favorited ?? false)

      // If unfavoriting and the row has no last_opened_at, delete it instead of leaving an empty row
      if (existing && !nextFavorited && !existing.last_opened_at) {
        removeLocal(snap.tmdb_id, snap.media_type)
        const { error } = await supabase
          .from('library')
          .delete()
          .eq('user_id', user.id)
          .eq('tmdb_id', snap.tmdb_id)
          .eq('media_type', snap.media_type)
        if (error) {
          console.error('library delete failed', error)
          if (existing) upsertLocal(existing)
        }
        return
      }

      const row: LibraryRow = {
        user_id: user.id,
        tmdb_id: snap.tmdb_id,
        media_type: snap.media_type,
        favorited: nextFavorited,
        last_opened_at: existing?.last_opened_at ?? null,
        last_season: existing?.last_season ?? null,
        last_episode: existing?.last_episode ?? null,
        title: snap.title ?? existing?.title ?? null,
        poster_path: snap.poster_path ?? existing?.poster_path ?? null,
      }
      upsertLocal(row)
      await upsertRemote(row)
    },
    async recordOpen(snap) {
      if (!user) return
      const existing = indexed.get(rowKey(snap.tmdb_id, snap.media_type))
      const row: LibraryRow = {
        user_id: user.id,
        tmdb_id: snap.tmdb_id,
        media_type: snap.media_type,
        favorited: existing?.favorited ?? false,
        last_opened_at: new Date().toISOString(),
        last_season: existing?.last_season ?? null,
        last_episode: existing?.last_episode ?? null,
        title: snap.title ?? existing?.title ?? null,
        poster_path: snap.poster_path ?? existing?.poster_path ?? null,
      }
      upsertLocal(row)
      await upsertRemote(row)
    },
    async recordEpisode(snap, season, episode) {
      if (!user) return
      const existing = indexed.get(rowKey(snap.tmdb_id, snap.media_type))
      const row: LibraryRow = {
        user_id: user.id,
        tmdb_id: snap.tmdb_id,
        media_type: snap.media_type,
        favorited: existing?.favorited ?? false,
        last_opened_at: new Date().toISOString(),
        last_season: season,
        last_episode: episode,
        title: snap.title ?? existing?.title ?? null,
        poster_path: snap.poster_path ?? existing?.poster_path ?? null,
      }
      upsertLocal(row)
      await upsertRemote(row)
    },
    async removeFromHistory(tmdbId, mediaType) {
      if (!user) return
      const existing = indexed.get(rowKey(tmdbId, mediaType))
      if (!existing?.last_opened_at) return

      // Favorited rows stay in the watchlist — only wipe the watch progress
      if (existing.favorited) {
        const row: LibraryRow = {
          ...existing,
          last_opened_at: null,
          last_season: null,
          last_episode: null,
        }
        upsertLocal(row)
        await upsertRemote(row)
        return
      }

      removeLocal(tmdbId, mediaType)
      const { error } = await supabase
        .from('library')
        .delete()
        .eq('user_id', user.id)
        .eq('tmdb_id', tmdbId)
        .eq('media_type', mediaType)
      if (error) {
        console.error('library delete failed', error)
        upsertLocal(existing)
      }
    },
    async clearHistory() {
      if (!user) return
      const prev = items
      setItems((cur) =>
        cur
          .filter((r) => r.favorited)
          .map((r) =>
            r.last_opened_at
              ? { ...r, last_opened_at: null, last_season: null, last_episode: null }
              : r,
          ),
      )
      const [del, upd] = await Promise.all([
        supabase
          .from('library')
          .delete()
          .eq('user_id', user.id)
          .eq('favorited', false),
        supabase
          .from('library')
          .update({ last_opened_at: null, last_season: null, last_episode: null })
          .eq('user_id', user.id)
          .eq('favorited', true),
      ])
      if (del.error || upd.error) {
        console.error('library clear history failed', del.error ?? upd.error)
        setItems(prev)
      }
    },
  }

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}
