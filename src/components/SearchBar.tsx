import { useState, useEffect, useId, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { findByImdbId, searchMulti, IMG, TMDB_KEY_PRESENT } from '../api'
import { useSearchShortcut } from '../hooks/useSearchShortcut'
import { hrefOf, mediaSubtitle, parseQuery, plural, preferYear, ratingOf, resultKey, titleOf } from '../media'
import type { MediaSummary, PersonSummary, SearchResult } from '../types'

const MIN_QUERY_LENGTH = 2
const MAX_TITLES = 6
const MAX_PEOPLE = 3

interface SearchBarProps {
  autoFocus?: boolean
  /** Stretch to fill the row instead of capping at 360px (expanded topbar mode). */
  fullWidth?: boolean
  /** When rendered inside the topbar the input + icon get tighter spacing. */
  variant?: 'hero' | 'topbar'
  /** Focus the input on `/` or ⌘K. */
  shortcut?: boolean
}

type Option = { kind: 'result'; item: SearchResult } | { kind: 'all' }

interface Section {
  label: string
  items: SearchResult[]
}

function buildSections(results: SearchResult[], year: number | undefined): Section[] {
  const titles = preferYear(
    results.filter((r): r is MediaSummary => r.media_type !== 'person'),
    year,
  ).slice(0, MAX_TITLES)
  const people = results
    .filter((r): r is PersonSummary => r.media_type === 'person')
    .slice(0, MAX_PEOPLE)
  const sections = [
    { label: 'Titles', items: titles },
    { label: 'People', items: people },
  ]
  // "tom hanks" should list Tom Hanks before his films
  if (results[0]?.media_type === 'person' && !year) sections.reverse()
  return sections.filter((s) => s.items.length > 0)
}

function personSubtitle(p: PersonSummary): string {
  const knownFor = (p.known_for ?? []).slice(0, 2).map(titleOf).join(', ')
  return [p.known_for_department, knownFor].filter(Boolean).join(' · ')
}

export default function SearchBar({
  autoFocus = false,
  fullWidth = false,
  variant = 'hero',
  shortcut = false,
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [year, setYear] = useState<number | undefined>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const uid = useId()
  const listboxId = `${uid}-listbox`

  useSearchShortcut(() => inputRef.current?.focus(), shortcut)

  useEffect(() => {
    const q = query.trim()
    if (q.length < MIN_QUERY_LENGTH) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([])
      setOpen(false)
      setError(false)
      setLoading(false)
      return
    }

    if (!TMDB_KEY_PRESENT) {
      setResults([])
      setError(true)
      setOpen(true)
      return
    }

    const parsed = parseQuery(q)
    const controller = new AbortController()
    const handle = setTimeout(async () => {
      setLoading(true)
      setError(false)
      try {
        const items = parsed.imdbId
          ? await findByImdbId(parsed.imdbId, controller.signal)
          : await searchMulti(parsed.text, controller.signal)
        setResults(items)
        setYear(parsed.year)
        // A pasted IMDb id is an exact match, so Enter should open it directly.
        setHighlight(parsed.imdbId && items.length > 0 ? 0 : -1)
        setOpen(true)
      } catch (e) {
        if ((e as Error).name === 'AbortError') return
        setResults([])
        setError(true)
        setOpen(true)
      } finally {
        setLoading(false)
      }
    }, 350)

    return () => {
      clearTimeout(handle)
      controller.abort()
    }
  }, [query])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const sections = buildSections(results, year)
  const options: Option[] = [
    ...sections.flatMap((s) => s.items.map((item): Option => ({ kind: 'result', item }))),
    ...(sections.length > 0 ? [{ kind: 'all' } as const] : []),
  ]
  const optionId = (o: Option) =>
    o.kind === 'all' ? `${uid}-opt-all` : `${uid}-opt-${resultKey(o.item)}`

  function reset() {
    setQuery('')
    setOpen(false)
    setHighlight(-1)
  }

  function openSearchPage() {
    const q = query.trim()
    if (q.length < MIN_QUERY_LENGTH) return
    reset()
    navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  function choose(option: Option) {
    if (option.kind === 'all') {
      openSearchPage()
      return
    }
    reset()
    navigate(hrefOf(option.item))
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      const option = open ? options[highlight] : undefined
      if (option) choose(option)
      else openSearchPage()
      return
    }
    if (!open || options.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => (h + 1) % options.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => (h <= 0 ? options.length - 1 : h - 1))
    }
  }

  const titleCount = sections.find((s) => s.label === 'Titles')?.items.length ?? 0
  const peopleCount = sections.find((s) => s.label === 'People')?.items.length ?? 0
  const status =
    query.trim().length < MIN_QUERY_LENGTH
      ? ''
      : loading
        ? 'Searching…'
        : error
          ? 'Search failed.'
          : !open
            ? ''
            : options.length === 0
              ? 'No results.'
              : `${plural(titleCount, 'title')}, ${peopleCount === 1 ? '1 person' : `${peopleCount} people`}. Use the arrow keys to browse, Enter to open.`

  const isTopbar = variant === 'topbar'
  const wrapperClasses = isTopbar
    ? `relative w-full flex-1 z-[100] ${fullWidth ? '' : 'max-w-[360px]'}`
    : 'relative w-full z-[100] animate-fade-up [animation-delay:0.75s]'

  const iconLeft = isTopbar ? 'left-2.5' : 'left-[18px]'
  const inputPad = isTopbar ? 'py-2 pl-9 pr-3.5 text-[13px]' : 'py-3.5 pl-12 pr-5 text-sm'
  const activeOption = open ? options[highlight] : undefined
  const sectionStarts = sections.map((_, i) =>
    sections.slice(0, i).reduce((n, s) => n + s.items.length, 0),
  )
  const seeAllIndex = options.length - 1

  return (
    <div className={wrapperClasses} ref={wrapperRef}>
      <div className={`absolute ${iconLeft} top-1/2 -translate-y-1/2 text-fg-muted flex items-center pointer-events-none z-10`}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M6.5 1a5.5 5.5 0 100 11 5.5 5.5 0 000-11zm-7 5.5a7 7 0 1112.53 4.394l3.538 3.539a1 1 0 11-1.414 1.414l-3.539-3.538A7 7 0 01-.5 6.5z"/>
        </svg>
      </div>
      <input
        ref={inputRef}
        type="search"
        enterKeyHint="search"
        value={query}
        autoFocus={autoFocus}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => {
          if (results.length > 0 || error) setOpen(true)
        }}
        placeholder="Search films, series & people..."
        aria-label="Search films, series and people"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={activeOption ? optionId(activeOption) : undefined}
        className={`w-full bg-white/5 border border-white/10 rounded-[3px] text-fg font-sans font-light tracking-[0.02em] outline-none transition-[border-color,background,box-shadow] duration-300 placeholder:text-fg-muted focus:border-accent/40 focus:bg-white/8 focus:shadow-[0_0_0_1px_rgba(200,170,100,0.12),0_8px_32px_rgba(0,0,0,0.4)] [&::-webkit-search-cancel-button]:appearance-none ${inputPad}`}
      />
      {loading && (
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 size-3.5 rounded-full border-[1.5px] border-white/10 border-t-accent pointer-events-none animate-spin-slow" />
      )}
      <div role="status" aria-live="polite" className="sr-only">
        {status}
      </div>

      {open && (
        <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#12121d] border border-white/8 rounded-[3px] z-200 shadow-[0_24px_60px_rgba(0,0,0,0.7)] overflow-hidden animate-fade-up [animation-duration:0.2s] text-left">
          {error ? (
            <p className="px-4 py-3 text-[13px] text-fg-muted">Search failed — try again.</p>
          ) : options.length === 0 ? (
            !loading && <p className="px-4 py-3 text-[13px] text-fg-muted">No results.</p>
          ) : (
            <div id={listboxId} role="listbox" aria-label="Search suggestions">
              {sections.map((section, s) => (
                <div key={section.label} role="group" aria-label={section.label}>
                  <div
                    aria-hidden="true"
                    className="px-4 pt-3 pb-1.5 text-[9px] tracking-[0.25em] uppercase text-fg-dim"
                  >
                    {section.label}
                  </div>
                  {section.items.map((item, i) => {
                    const idx = (sectionStarts[s] ?? 0) + i
                    return (
                      <ResultOption
                        key={resultKey(item)}
                        id={optionId({ kind: 'result', item })}
                        item={item}
                        active={idx === highlight}
                        onHover={() => setHighlight(idx)}
                        onChoose={() => choose({ kind: 'result', item })}
                      />
                    )
                  })}
                </div>
              ))}
              <div
                id={optionId({ kind: 'all' })}
                role="option"
                aria-selected={seeAllIndex === highlight}
                onMouseEnter={() => setHighlight(seeAllIndex)}
                onMouseDown={() => choose({ kind: 'all' })}
                className={`flex items-center justify-between gap-3 px-4 py-3 cursor-pointer border-t border-white/5 text-[12px] tracking-[0.04em] text-accent transition-colors duration-150 ${
                  seeAllIndex === highlight ? 'bg-white/5' : ''
                }`}
              >
                <span className="truncate">See all results for “{query.trim()}”</span>
                <span aria-hidden="true">→</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface ResultOptionProps {
  id: string
  item: SearchResult
  active: boolean
  onHover: () => void
  onChoose: () => void
}

function ResultOption({ id, item, active, onHover, onChoose }: ResultOptionProps) {
  const isPerson = item.media_type === 'person'
  const image = IMG.thumb(isPerson ? item.profile_path : item.poster_path)
  const name = isPerson ? item.name : titleOf(item)
  const rating = isPerson ? undefined : ratingOf(item)
  const subtitle = isPerson ? personSubtitle(item) : mediaSubtitle(item)
  const shape = isPerson ? 'size-[44px] rounded-full' : 'w-[38px] h-[54px] rounded-[2px]'

  return (
    <div
      id={id}
      role="option"
      aria-selected={active}
      onMouseEnter={onHover}
      onMouseDown={onChoose}
      className={`flex items-center gap-3.5 px-4 py-2.5 cursor-pointer transition-colors duration-150 ${
        active ? 'bg-white/5' : ''
      }`}
    >
      {image ? (
        <img src={image} alt="" className={`${shape} object-cover shrink-0 bg-bg3`} />
      ) : (
        <div className={`${shape} shrink-0 bg-bg3 flex items-center justify-center font-heading text-lg text-fg-muted`}>
          {(name || '?')[0]}
        </div>
      )}
      <div className="flex flex-col gap-[3px] flex-1 min-w-0">
        <span className="text-sm font-normal text-fg truncate">{name}</span>
        <span className="text-[11px] text-fg-muted tracking-[0.03em] truncate">
          {subtitle}
          {rating && <span className="text-accent"> · ★ {rating.toFixed(1)}</span>}
        </span>
      </div>
    </div>
  )
}
