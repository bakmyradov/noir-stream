import { SOURCES } from '../sources'

export default function SourceSelector({ active, onChange }) {
  return (
    <div className="source-selector">
      <span className="source-label">Source</span>
      {SOURCES.map((s) => (
        <button
          key={s.id}
          className={active === s.id ? 'active' : ''}
          onClick={() => onChange(s.id)}
          title={s.badge}
        >
          {s.name}
          <span className={`source-badge ${s.badge === '4K' ? 'hd' : ''}`}>{s.badge}</span>
        </button>
      ))}
    </div>
  )
}
