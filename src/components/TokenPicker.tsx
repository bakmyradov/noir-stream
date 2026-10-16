import { useEffect, useEffectEvent, useId, useRef, useState } from 'react'
import type { NamedEntity } from '../types'
import { filterLabelClasses } from './FilterControls'

const MIN_QUERY_LENGTH = 2

interface TokenPickerProps {
  label: string
  placeholder: string
  selected: NamedEntity[]
  onAdd: (entity: NamedEntity) => void
  onRemove: (id: number) => void
  search: (query: string, signal: AbortSignal) => Promise<NamedEntity[]>
  className?: string
}

/** A typeahead that collects several picks as removable chips (keywords, studios). */
export default function TokenPicker({
  label,
  placeholder,
  selected,
  onAdd,
  onRemove,
  search,
  className = '',
}: TokenPickerProps) {
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState<NamedEntity[]>([])
  const [open, setOpen] = useState(false)
  const [searched, setSearched] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const uid = useId()
  const inputId = `${uid}-input`
  const listboxId = `${uid}-listbox`
  const runSearch = useEffectEvent(search)

  useEffect(() => {
    const q = query.trim()
    if (q.length < MIN_QUERY_LENGTH) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOptions([])
      setSearched(false)
      return
    }
    const controller = new AbortController()
    const handle = setTimeout(() => {
      runSearch(q, controller.signal)
        .then((found) => {
          setOptions(found)
          setSearched(true)
          setHighlight(0)
          setOpen(true)
        })
        .catch(() => {})
    }, 300)
    return () => {
      clearTimeout(handle)
      controller.abort()
    }
  }, [query])

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const available = options.filter((o) => !selected.some((s) => s.id === o.id))
  const showList = open && searched && query.trim().length >= MIN_QUERY_LENGTH
  const active = showList ? available[highlight] : undefined

  function choose(entity: NamedEntity) {
    onAdd(entity)
    setQuery('')
    setOpen(false)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && query === '' && selected.length > 0) {
      const last = selected[selected.length - 1]
      if (last) onRemove(last.id)
      return
    }
    if (e.key === 'Escape') {
      setOpen(false)
      return
    }
    if (!showList || available.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => (h + 1) % available.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => (h - 1 + available.length) % available.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (active) choose(active)
    }
  }

  return (
    <div ref={wrapperRef} className={`relative flex flex-col gap-1.5 min-w-0 ${className}`}>
      <label htmlFor={inputId} className={filterLabelClasses}>
        {label}
      </label>
      <div className="flex flex-wrap items-center gap-1.5 min-h-[34px] bg-white/5 border border-white/10 rounded-[2px] px-2 py-1 transition-[border-color] duration-200 hover:border-white/22 focus-within:border-accent/40">
        {selected.map((s) => (
          <span
            key={s.id}
            className="inline-flex items-center gap-1 pl-2 pr-0.5 py-px rounded-[2px] bg-accent/10 border border-accent2/60 text-[11px] text-accent"
          >
            {s.name}
            <button
              type="button"
              aria-label={`Remove ${s.name}`}
              onClick={() => onRemove(s.id)}
              className="flex items-center justify-center size-4 bg-transparent border-none text-accent/70 hover:text-fg cursor-pointer"
            >
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
        <input
          id={inputId}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={selected.length ? '' : placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={active ? `${uid}-opt-${active.id}` : undefined}
          className="flex-1 min-w-[80px] bg-transparent border-none outline-none font-sans text-xs text-fg placeholder:text-fg-muted py-1"
        />
      </div>
      {showList && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-30 bg-[#12121d] border border-white/8 rounded-[3px] shadow-[0_24px_60px_rgba(0,0,0,0.7)] overflow-hidden">
          {available.length === 0 ? (
            <p className="px-3 py-2.5 text-xs text-fg-muted">No matches.</p>
          ) : (
            <ul id={listboxId} role="listbox" aria-label={`${label} suggestions`} className="list-none max-h-64 overflow-y-auto">
              {available.map((o, i) => (
                <li
                  key={o.id}
                  id={`${uid}-opt-${o.id}`}
                  role="option"
                  aria-selected={i === highlight}
                  onMouseEnter={() => setHighlight(i)}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    choose(o)
                  }}
                  className={`flex items-center justify-between gap-3 px-3 py-2 text-xs cursor-pointer ${
                    i === highlight ? 'bg-white/5 text-fg' : 'text-fg-muted'
                  }`}
                >
                  <span className="truncate">{o.name}</span>
                  {o.hint && <span className="shrink-0 text-[10px] tracking-[0.08em] text-fg-dim">{o.hint}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
