import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchMulti, IMG } from '../api'
import type { MediaSummary } from '../types'

interface SearchBarProps {
  autoFocus?: boolean
  /** When rendered inside the topbar the input + icon get tighter spacing. */
  variant?: 'hero' | 'topbar'
}

export default function SearchBar({ autoFocus = false, variant = 'hero' }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MediaSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setResults([])
      setOpen(false)
      setError(false)
      return
    }

    const controller = new AbortController()
    const handle = setTimeout(async () => {
      setLoading(true)
      setError(false)
      try {
        const items = await searchMulti(q, controller.signal)
        setResults(items)
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

  function select(item: MediaSummary) {
    setQuery('')
    setOpen(false)
    navigate(`/${item.media_type}/${item.id}`)
  }

  const isTopbar = variant === 'topbar'
  const wrapperClasses = isTopbar
    ? 'relative w-full max-w-[360px] flex-1 z-[100]'
    : 'relative w-full z-[100] animate-fade-up [animation-delay:0.75s]'

  const iconLeft = isTopbar ? 'left-2.5' : 'left-[18px]'
  const inputPad = isTopbar ? 'py-2 pl-9 pr-3.5 text-[13px]' : 'py-3.5 pl-12 pr-5 text-sm'

  return (
    <div className={wrapperClasses} ref={wrapperRef}>
      <div className={`absolute ${iconLeft} top-1/2 -translate-y-1/2 text-fg-muted flex items-center pointer-events-none z-10`}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M6.5 1a5.5 5.5 0 100 11 5.5 5.5 0 000-11zm-7 5.5a7 7 0 1112.53 4.394l3.538 3.539a1 1 0 11-1.414 1.414l-3.539-3.538A7 7 0 01-.5 6.5z"/>
        </svg>
      </div>
      <input
        type="text"
        value={query}
        autoFocus={autoFocus}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search films & series..."
        autoComplete="off"
        className={`w-full bg-white/5 border border-white/10 rounded-[3px] text-fg font-sans font-light tracking-[0.02em] outline-none transition-[border-color,background,box-shadow] duration-300 placeholder:text-fg-muted focus:border-accent/40 focus:bg-white/8 focus:shadow-[0_0_0_1px_rgba(200,170,100,0.12),0_8px_32px_rgba(0,0,0,0.4)] ${inputPad}`}
      />
      {loading && (
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 size-3.5 rounded-full border-[1.5px] border-white/10 border-t-accent pointer-events-none animate-spin-slow" />
      )}

      {open && (
        <ul className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#12121d] border border-white/8 rounded-[3px] z-200 shadow-[0_24px_60px_rgba(0,0,0,0.7)] overflow-hidden animate-fade-up [animation-duration:0.2s] list-none">
          {error ? (
            <li className="px-4 py-3 text-[13px] text-fg-muted">Search failed — try again.</li>
          ) : results.length === 0 ? (
            !loading && <li className="px-4 py-3 text-[13px] text-fg-muted">No results.</li>
          ) : (
            results.map((item) => (
              <li
                key={item.id}
                onMouseDown={() => select(item)}
                className="flex items-center gap-3.5 px-4 py-3 cursor-pointer transition-colors duration-150 border-b border-white/5 last:border-b-0 hover:bg-white/5"
              >
                {IMG.thumb(item.poster_path) ? (
                  <img
                    src={IMG.thumb(item.poster_path) ?? undefined}
                    alt=""
                    className="w-[38px] h-[54px] rounded-[2px] object-cover shrink-0 bg-bg3"
                  />
                ) : (
                  <div className="w-[38px] h-[54px] rounded-[2px] shrink-0 bg-bg3" />
                )}
                <div className="flex flex-col gap-[3px] text-left flex-1">
                  <span className="text-sm font-normal text-fg">
                    {item.media_type === 'movie' ? item.title : item.name}
                  </span>
                  <span className="text-[11px] text-fg-muted tracking-[0.03em]">
                    {item.media_type === 'tv' ? 'TV Show' : 'Movie'}
                    {' · '}
                    {((item.media_type === 'movie' ? item.release_date : item.first_air_date) || '').slice(0, 4)}
                  </span>
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
