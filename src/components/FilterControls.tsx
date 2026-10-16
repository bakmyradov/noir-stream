export const filterLabelClasses = 'text-[9px] tracking-[0.25em] uppercase text-fg-muted'

interface FilterSelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  /** `<option>` / `<optgroup>` elements. */
  children: React.ReactNode
  className?: string
}

export function FilterSelect({ label, value, onChange, children, className = '' }: FilterSelectProps) {
  return (
    <label className={`flex flex-col gap-1.5 min-w-0 ${className}`}>
      <span className={filterLabelClasses}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-[2px] text-fg font-sans text-xs px-2.5 py-2 outline-none cursor-pointer transition-[border-color] duration-200 hover:border-white/22 focus:border-accent/40"
      >
        {children}
      </select>
    </label>
  )
}

interface Tab<T extends string> {
  id: T
  label: string
}

interface SegmentedTabsProps<T extends string> {
  tabs: Tab<T>[]
  active: T
  onChange: (id: T) => void
  label: string
}

/** A row of mutually exclusive toggle buttons (Movies / TV, Acting / Directing…). */
export function SegmentedTabs<T extends string>({ tabs, active, onChange, label }: SegmentedTabsProps<T>) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
      {tabs.map((t) => {
        const isActive = t.id === active
        return (
          <button
            key={t.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(t.id)}
            className={`px-4 py-1.5 rounded-[2px] border font-sans text-[11px] tracking-[0.18em] uppercase cursor-pointer transition-all duration-200 ${
              isActive
                ? 'bg-accent/10 border-accent2 text-accent'
                : 'border-white/10 text-fg-muted hover:border-white/22 hover:text-fg'
            }`}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

interface ResultsFooterProps {
  loading: boolean
  error: boolean
  hasMore: boolean
  onLoadMore: () => void
  onRetry: () => void
}

/** "Load more" / spinner / retry under a paged results grid. */
export function ResultsFooter({ loading, error, hasMore, onLoadMore, onRetry }: ResultsFooterProps) {
  const button =
    'px-6 py-2.5 rounded-[2px] border border-white/12 font-sans text-[11px] tracking-[0.18em] uppercase text-fg-muted cursor-pointer transition-all duration-200 hover:border-white/25 hover:text-fg disabled:cursor-default disabled:opacity-60'
  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-[13px] text-fg-muted">
        Couldn’t load results.
        <button type="button" onClick={onRetry} className={button}>
          Try again
        </button>
      </div>
    )
  }
  if (!hasMore && !loading) return null
  return (
    <div className="flex justify-center py-10">
      <button type="button" onClick={onLoadMore} disabled={loading} className={button}>
        {loading ? 'Loading…' : 'Load more'}
      </button>
    </div>
  )
}
