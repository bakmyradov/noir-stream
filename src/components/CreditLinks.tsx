import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import type { Genre, MediaType } from '../types'

const chipClasses =
  'text-[10px] tracking-[0.12em] uppercase border border-white/15 px-2.5 py-0.5 rounded-[2px] text-fg-muted font-normal transition-[color,border-color] duration-200 hover:text-accent hover:border-accent2'

/** Genre chips on a detail page; each opens Discover with that genre picked. */
export function GenreLinks({ genres, type }: { genres: Genre[] | undefined; type: MediaType }) {
  return (
    <>
      {genres?.map((g) => (
        <Link key={g.id} to={`/discover?type=${type}&genres=${g.id}`} className={chipClasses}>
          {g.name}
        </Link>
      ))}
    </>
  )
}

/** "Directed by A, B" with each name linking to their person page. */
export function PeopleLine({ label, people }: { label: string; people: { id: number; name: string }[] }) {
  if (people.length === 0) return null
  return (
    <p className="text-xs text-fg-muted tracking-[0.04em] mt-4">
      {label}{' '}
      {people.map((p, i) => (
        <Fragment key={p.id}>
          {i > 0 && ', '}
          <Link to={`/person/${p.id}`} className="text-fg hover:text-accent transition-colors duration-200">
            {p.name}
          </Link>
        </Fragment>
      ))}
    </p>
  )
}
