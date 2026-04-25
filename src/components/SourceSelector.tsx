import { SOURCES } from '../sources'

interface SourceSelectorProps {
  active: string
  onChange: (id: string) => void
}

export default function SourceSelector({ active, onChange }: SourceSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 px-12 py-2.5 bg-bg2 border-b border-white/5 max-[600px]:px-5">
      <span className="text-[9px] uppercase tracking-[0.15em] text-fg-muted mr-1.5 shrink-0">
        Source
      </span>
      {SOURCES.map((s) => {
        const isActive = active === s.id
        return (
          <button
            key={s.id}
            onClick={() => onChange(s.id)}
            title={s.badge}
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-[2px] border text-[11px] tracking-[0.04em] cursor-pointer transition-all duration-150 ${
              isActive
                ? 'bg-accent/10 border-accent2 text-accent'
                : 'bg-transparent border-white/10 text-fg-muted hover:border-white/20 hover:text-fg'
            }`}
          >
            {s.name}
            <span
              className={`text-[0.68rem] font-semibold px-[5px] py-px rounded-[2px] ${
                s.badge === '4K' ? 'text-accent' : ''
              } ${isActive ? 'bg-accent/15' : 'bg-white/8'}`}
            >
              {s.badge}
            </span>
          </button>
        )
      })}
    </div>
  )
}
