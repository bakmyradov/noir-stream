import { useEffect, useState } from 'react'
import Topbar from '../components/Topbar'
import { PosterGrid, ResultCard } from '../components/PosterCard'
import { FilterSelect, ResultsFooter, SegmentedTabs, filterLabelClasses } from '../components/FilterControls'
import TokenPicker from '../components/TokenPicker'
import { discover, getGenres, rememberName, searchCompanies, searchKeywords, TMDB_KEY_PRESENT } from '../api'
import {
  DISCOVER_SORTS,
  LANGUAGES,
  MIN_RATINGS,
  NETWORKS,
  RUNTIMES,
  YEARS,
  readDiscoverFilters,
} from '../filters'
import { useEntityNames } from '../hooks/useEntityNames'
import { usePaged } from '../hooks/usePaged'
import { useUrlParams } from '../hooks/useUrlParams'
import { plural, resultKey } from '../media'
import type { Genre, MediaSummary, MediaType } from '../types'

const TYPE_TABS: { id: MediaType; label: string }[] = [
  { id: 'movie', label: 'Movies' },
  { id: 'tv', label: 'TV' },
]

// Everything Clear filters resets; type and sort are choices, not filters.
const FILTER_PARAMS = ['genres', 'from', 'to', 'rating', 'runtime', 'lang', 'keywords', 'studios', 'network']

export default function DiscoverPage() {
  const [params, update] = useUrlParams()
  const type: MediaType = params.get('type') === 'tv' ? 'tv' : 'movie'
  const filters = readDiscoverFilters(params, type)
  const [showMore, setShowMore] = useState(false)

  const results = usePaged<MediaSummary>(
    TMDB_KEY_PRESENT ? `discover|${type}|${JSON.stringify(filters)}` : null,
    (page, signal) => discover(type, filters, page, signal),
  )

  const [genreList, setGenreList] = useState<{ type: MediaType; genres: Genre[] } | null>(null)
  useEffect(() => {
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

  const keywords = useEntityNames('keyword', filters.keywords)
  const studios = useEntityNames('company', filters.studios)

  const setIds = (param: 'genres' | 'keywords' | 'studios', ids: number[]) =>
    update({ [param]: ids.length ? ids.join(',') : null })

  function toggleGenre(id: number) {
    const on = filters.genres.includes(id)
    setIds('genres', on ? filters.genres.filter((g) => g !== id) : [...filters.genres, id])
  }

  function switchType(next: MediaType) {
    if (next === type) return
    // Genre ids, runtime presets and networks all differ between movies and TV.
    update({ type: next === 'movie' ? null : next, genres: null, runtime: null, network: null })
  }

  const activeFilters = FILTER_PARAMS.filter((p) => params.has(p)).length
  // Genres stay visible on phones; this counts what's hidden behind "More filters".
  const hiddenFilters = activeFilters - (params.has('genres') ? 1 : 0)

  let status: string
  if (!TMDB_KEY_PRESENT) status = 'Discover is unavailable: VITE_TMDB_API_KEY is not set.'
  else if (results.initialLoading) status = 'Loading…'
  else if (results.error && results.items.length === 0) status = ''
  else if (results.items.length === 0) status = 'Nothing matches these filters.'
  else status = plural(results.totalResults, type === 'movie' ? 'movie' : 'show')

  return (
    <div className="min-h-svh bg-bg animate-fade-in">
      <Topbar />
      <div className="px-12 pt-[100px] pb-15 max-[600px]:px-5 max-[600px]:pt-[80px]">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <h1 className="font-heading text-[40px] font-normal tracking-[-0.01em] text-fg leading-none max-[600px]:text-3xl">
            Discover
          </h1>
          <div className="flex flex-wrap items-end gap-3">
            <SegmentedTabs label="Media type" tabs={TYPE_TABS} active={type} onChange={switchType} />
            <FilterSelect
              label="Sort"
              value={filters.sort}
              onChange={(v) => update({ sort: v === 'popular' ? null : v })}
              className="w-[140px]"
            >
              {DISCOVER_SORTS.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </FilterSelect>
          </div>
        </div>

        <fieldset className="mb-5">
          <legend className={`${filterLabelClasses} mb-2`}>Genres · titles match all picked</legend>
          <div className="flex flex-wrap gap-1.5">
            {genres.map((g) => {
              const on = filters.genres.includes(g.id)
              return (
                <button
                  key={g.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleGenre(g.id)}
                  className={`text-[10px] tracking-[0.12em] uppercase border px-3 py-1 rounded-[2px] font-sans font-normal cursor-pointer transition-all duration-200 ${
                    on
                      ? 'bg-accent/10 border-accent2 text-accent'
                      : 'border-white/12 text-fg-muted hover:border-white/25 hover:text-fg'
                  }`}
                >
                  {g.name}
                </button>
              )
            })}
          </div>
        </fieldset>

        <button
          type="button"
          aria-expanded={showMore}
          aria-controls="discover-filters"
          onClick={() => setShowMore((v) => !v)}
          className="min-[601px]:hidden mb-4 px-4 py-1.5 rounded-[2px] border border-white/12 font-sans text-[11px] tracking-[0.18em] uppercase text-fg-muted cursor-pointer"
        >
          {showMore ? 'Fewer filters' : 'More filters'}
          {hiddenFilters > 0 && ` (${hiddenFilters})`}
        </button>

        <div
          id="discover-filters"
          className={`${showMore ? 'grid' : 'hidden min-[601px]:grid'} grid-cols-[repeat(auto-fill,minmax(150px,1fr))] items-end gap-3 mb-6`}
        >
          <FilterSelect
            label="From year"
            value={String(filters.yearFrom ?? '')}
            onChange={(v) =>
              update({ from: v, ...(filters.yearTo && Number(v) > filters.yearTo ? { to: v } : {}) })
            }
          >
            <option value="">Any</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </FilterSelect>
          <FilterSelect
            label="To year"
            value={String(filters.yearTo ?? '')}
            onChange={(v) =>
              update({ to: v, ...(v && filters.yearFrom && Number(v) < filters.yearFrom ? { from: v } : {}) })
            }
          >
            <option value="">Any</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </FilterSelect>
          <FilterSelect label="Rating" value={String(filters.minRating ?? '')} onChange={(v) => update({ rating: v })}>
            <option value="">Any</option>
            {MIN_RATINGS.map((r) => (
              <option key={r} value={r}>{r}+</option>
            ))}
          </FilterSelect>
          <FilterSelect
            label={type === 'movie' ? 'Runtime' : 'Episode length'}
            value={RUNTIMES[type].find((r) => r.value === params.get('runtime'))?.value ?? ''}
            onChange={(v) => update({ runtime: v })}
          >
            <option value="">Any</option>
            {RUNTIMES[type].map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </FilterSelect>
          <FilterSelect label="Language" value={filters.language ?? ''} onChange={(v) => update({ lang: v })}>
            <option value="">Any</option>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.name}</option>
            ))}
          </FilterSelect>
          {type === 'tv' && (
            <FilterSelect label="Network" value={String(filters.network ?? '')} onChange={(v) => update({ network: v })}>
              <option value="">Any</option>
              {NETWORKS.map((g) => (
                <optgroup key={g.group} label={g.group}>
                  {g.items.map((n) => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </optgroup>
              ))}
            </FilterSelect>
          )}
          <TokenPicker
            label="Keywords · any"
            placeholder="heist, time travel…"
            selected={keywords}
            search={searchKeywords}
            onAdd={(k) => {
              rememberName('keyword', k)
              setIds('keywords', [...filters.keywords, k.id])
            }}
            onRemove={(id) => setIds('keywords', filters.keywords.filter((k) => k !== id))}
            className="col-span-2"
          />
          <TokenPicker
            label="Studios · any"
            placeholder="A24, Ghibli…"
            selected={studios}
            search={searchCompanies}
            onAdd={(c) => {
              rememberName('company', c)
              setIds('studios', [...filters.studios, c.id])
            }}
            onRemove={(id) => setIds('studios', filters.studios.filter((s) => s !== id))}
            className="col-span-2"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <p role="status" className="text-[11px] tracking-[0.06em] text-fg-muted min-h-[1lh]">
            {status}
          </p>
          {activeFilters > 0 && (
            <button
              type="button"
              onClick={() => update(Object.fromEntries(FILTER_PARAMS.map((p) => [p, null])))}
              className="bg-transparent border-none p-0 text-[11px] tracking-[0.12em] uppercase text-accent cursor-pointer hover:underline underline-offset-2"
            >
              Clear filters
            </button>
          )}
        </div>

        {results.items.length > 0 && (
          <PosterGrid>
            {results.items.map((item) => (
              <ResultCard key={resultKey(item)} item={item} />
            ))}
          </PosterGrid>
        )}

        {TMDB_KEY_PRESENT && (
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
