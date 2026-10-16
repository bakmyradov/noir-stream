import { useEffect, useEffectEvent, useRef, useState } from 'react'
import Topbar from '../components/Topbar'
import { PosterGrid, ResultCard } from '../components/PosterCard'
import { FilterSelect, ResultsFooter, SegmentedTabs } from '../components/FilterControls'
import { findByImdbId, getGenres, searchPage, TMDB_KEY_PRESENT, type SearchType } from '../api'
import { MIN_RATINGS, YEARS } from '../filters'
import { usePaged } from '../hooks/usePaged'
import { useSearchShortcut } from '../hooks/useSearchShortcut'
import { intParam, useUrlParams } from '../hooks/useUrlParams'
import { compareByDate, parseQuery, plural, preferYear, ratingOf, resultKey, yearOf } from '../media'
import type { Genre, MediaType, SearchResult } from '../types'

const MIN_QUERY_LENGTH = 2

const TYPES: { id: SearchType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'movie', label: 'Movies' },
  { id: 'tv', label: 'TV' },
  { id: 'person', label: 'People' },
]

type ResultSort = 'relevance' | 'rating' | 'newest' | 'oldest'

const SORTS: { id: ResultSort; label: string }[] = [
  { id: 'relevance', label: 'Best match' },
  { id: 'rating', label: 'Top rated' },
  { id: 'newest', label: 'Newest' },
  { id: 'oldest', label: 'Oldest' },
]

function parseType(value: string | null): SearchType {
  return value === 'movie' || value === 'tv' || value === 'person' ? value : 'all'
}

function parseSort(value: string | null): ResultSort {
  return SORTS.some((s) => s.id === value) ? (value as ResultSort) : 'relevance'
}

function sortResults(list: SearchResult[], sort: Exclude<ResultSort, 'relevance'>): SearchResult[] {
  return [...list].sort((a, b) => {
    // People have no rating or date; keep them after the titles.
    if (a.media_type === 'person' || b.media_type === 'person') {
      return Number(a.media_type === 'person') - Number(b.media_type === 'person')
    }
    if (sort === 'rating') return (ratingOf(b) ?? 0) - (ratingOf(a) ?? 0)
    return compareByDate(a, b, sort)
  })
}

export default function SearchPage() {
  const [params, update] = useUrlParams()
  const q = params.get('q') ?? ''
  const type = parseType(params.get('type'))
  const titlesOnly = type === 'movie' || type === 'tv'
  const year = type === 'person' ? undefined : intParam(params.get('year'))
  const genre = titlesOnly ? intParam(params.get('genre')) : undefined
  const minRating = type === 'person' ? undefined : intParam(params.get('rating'))
  const sort = parseSort(params.get('sort'))

  // The input updates the URL after a pause. `pushed` remembers what we wrote so the
  // URL catching up doesn't clobber characters typed in the meantime; any other change
  // to `q` (Back/Forward) resets the input.
  const [text, setText] = useState(q)
  const [syncedQ, setSyncedQ] = useState(q)
  const [pushed, setPushed] = useState<string | null>(null)
  if (q !== syncedQ) {
    setSyncedQ(q)
    if (q !== pushed) setText(q)
  }

  function commit(value: string) {
    setPushed(value)
    update({ q: value || null })
  }
  const commitLater = useEffectEvent(commit)

  useEffect(() => {
    if (text === q) return
    const handle = setTimeout(() => commitLater(text), 350)
    return () => clearTimeout(handle)
  }, [text, q])

  const inputRef = useRef<HTMLInputElement>(null)
  useSearchShortcut(() => inputRef.current?.focus())

  const parsed = parseQuery(q)
  // TMDB filters movie/TV searches by year itself; on "All" we filter what comes back.
  const serverYear = titlesOnly ? year : undefined
  const key =
    TMDB_KEY_PRESENT && parsed.text.length >= MIN_QUERY_LENGTH
      ? ['search', type, parsed.imdbId ?? parsed.text, serverYear ?? ''].join('|')
      : null

  const results = usePaged<SearchResult>(key, async (page, signal) => {
    if (parsed.imdbId) {
      const found = await findByImdbId(parsed.imdbId, signal)
      return { page: 1, total_pages: 1, total_results: found.length, results: found }
    }
    return searchPage(type, parsed.text, page, serverYear, signal)
  })

  const [genreList, setGenreList] = useState<{ type: MediaType; genres: Genre[] } | null>(null)
  useEffect(() => {
    if (type !== 'movie' && type !== 'tv') return
    let cancelled = false
    getGenres(type)
      .then((genres) => {
        if (!cancelled) setGenreList({ type, genres })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [type])
  const genres = genreList?.type === type ? genreList.genres : []

  // Genre, rating and (on "All") year can't be sent to TMDB search, so they narrow
  // the results loaded so far.
  const clientFiltering = genre !== undefined || minRating !== undefined || (year !== undefined && !titlesOnly)
  let visible = results.items
  if (parsed.imdbId && type !== 'all') visible = visible.filter((r) => r.media_type === type)
  if (year && !titlesOnly) visible = visible.filter((r) => r.media_type !== 'person' && yearOf(r) === String(year))
  if (genre) visible = visible.filter((r) => r.media_type !== 'person' && !!r.genre_ids?.includes(genre))
  if (minRating) visible = visible.filter((r) => r.media_type !== 'person' && (ratingOf(r) ?? 0) >= minRating)
  visible = sort === 'relevance' || type === 'person' ? preferYear(visible, parsed.year) : sortResults(visible, sort)

  const trimmed = q.trim()
  let status: string
  if (!TMDB_KEY_PRESENT) status = 'Search is unavailable: VITE_TMDB_API_KEY is not set.'
  else if (trimmed.length < MIN_QUERY_LENGTH) status = 'Type at least two characters to search films, series and people.'
  else if (results.initialLoading) status = 'Searching…'
  else if (results.error && results.items.length === 0) status = ''
  else if (results.items.length === 0) status = `No results for “${trimmed}”.`
  else if (clientFiltering)
    status =
      visible.length === 0
        ? `None of the first ${plural(results.items.length, 'result')} match these filters.`
        : `${visible.length} of the first ${plural(results.items.length, 'result')} match these filters.`
  else status = `${plural(results.totalResults, 'result')} for “${trimmed}”`

  return (
    <div className="min-h-svh bg-bg animate-fade-in">
      <Topbar hideSearch />
      <div className="px-12 pt-[100px] pb-15 max-[600px]:px-5 max-[600px]:pt-[80px]">
        <h1 className="font-heading text-[40px] font-normal tracking-[-0.01em] text-fg mb-6 max-[600px]:text-3xl">
          Search
        </h1>

        <div className="relative max-w-[680px] mb-6">
          <div className="absolute left-[18px] top-1/2 -translate-y-1/2 text-fg-muted flex items-center pointer-events-none">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M6.5 1a5.5 5.5 0 100 11 5.5 5.5 0 000-11zm-7 5.5a7 7 0 1112.53 4.394l3.538 3.539a1 1 0 11-1.414 1.414l-3.539-3.538A7 7 0 01-.5 6.5z"/>
            </svg>
          </div>
          <input
            ref={inputRef}
            type="search"
            enterKeyHint="search"
            value={text}
            autoFocus={!q}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit(text)
            }}
            placeholder="Titles, people, or an IMDb link…"
            aria-label="Search films, series and people"
            autoComplete="off"
            className="w-full bg-white/5 border border-white/10 rounded-[3px] text-fg font-sans font-light text-sm tracking-[0.02em] py-3.5 pl-12 pr-5 outline-none transition-[border-color,background,box-shadow] duration-300 placeholder:text-fg-muted focus:border-accent/40 focus:bg-white/8 focus:shadow-[0_0_0_1px_rgba(200,170,100,0.12),0_8px_32px_rgba(0,0,0,0.4)] [&::-webkit-search-cancel-button]:appearance-none"
          />
        </div>

        <div className="flex flex-wrap items-end gap-x-6 gap-y-4 mb-6">
          <SegmentedTabs
            label="Result type"
            tabs={TYPES}
            active={type}
            // Movie and TV genre ids differ, so a genre never carries across tabs.
            onChange={(t) => update({ type: t === 'all' ? null : t, genre: null })}
          />
          {type !== 'person' && (
            <div className="flex flex-wrap items-end gap-3 max-[600px]:grid max-[600px]:grid-cols-2 max-[600px]:w-full">
              <FilterSelect label="Year" value={String(year ?? '')} onChange={(v) => update({ year: v })} className="w-[110px] max-[600px]:w-auto">
                <option value="">Any</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </FilterSelect>
              {titlesOnly && (
                <FilterSelect label="Genre" value={String(genre ?? '')} onChange={(v) => update({ genre: v })} className="w-[150px] max-[600px]:w-auto">
                  <option value="">Any</option>
                  {genres.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </FilterSelect>
              )}
              <FilterSelect label="Rating" value={String(minRating ?? '')} onChange={(v) => update({ rating: v })} className="w-[110px] max-[600px]:w-auto">
                <option value="">Any</option>
                {MIN_RATINGS.map((r) => (
                  <option key={r} value={r}>{r}+</option>
                ))}
              </FilterSelect>
              <FilterSelect label="Sort" value={sort} onChange={(v) => update({ sort: v === 'relevance' ? null : v })} className="w-[130px] max-[600px]:w-auto">
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </FilterSelect>
            </div>
          )}
        </div>

        <p role="status" className="text-[11px] tracking-[0.06em] text-fg-muted mb-5 min-h-[1lh]">
          {status}
        </p>

        {visible.length > 0 && (
          <PosterGrid>
            {visible.map((item) => (
              <ResultCard key={resultKey(item)} item={item} />
            ))}
          </PosterGrid>
        )}

        {key !== null && (
          <ResultsFooter
            loading={results.loading && !results.initialLoading}
            error={results.error}
            hasMore={results.hasMore}
            onLoadMore={results.loadMore}
            onRetry={results.retry}
          />
        )}
      </div>
    </div>
  )
}
