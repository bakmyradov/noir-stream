import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getPerson, IMG } from '../api'
import DetailHero from '../components/DetailHero'
import DetailSection from '../components/DetailSection'
import { FilterSelect, SegmentedTabs } from '../components/FilterControls'
import { PosterGrid, PosterRow, ResultCard } from '../components/PosterCard'
import Topbar from '../components/Topbar'
import { useUrlParams } from '../hooks/useUrlParams'
import { compareByDate, resultKey, yearOf } from '../media'
import type { MediaSummary, PersonCredit, PersonDetails } from '../types'

// Talk shows and news are mostly "Self" appearances that bury an actor's real roles.
const TALK_GENRE = 10767
const NEWS_GENRE = 10763
const KNOWN_FOR_COUNT = 10
const LONG_BIO = 600

type MediaFilter = 'all' | 'movie' | 'tv'
type CreditSort = 'popular' | 'newest' | 'oldest'

const MEDIA_TABS: { id: MediaFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'movie', label: 'Movies' },
  { id: 'tv', label: 'TV' },
]

const SORTS: { id: CreditSort; label: string }[] = [
  { id: 'popular', label: 'Most popular' },
  { id: 'newest', label: 'Newest' },
  { id: 'oldest', label: 'Oldest' },
]

interface Credit {
  item: PersonCredit
  /** Character(s) or job(s) on this title, comma-joined. */
  role: string
}

/** Filmography by department ("Acting", "Directing"…), one entry per title. */
function groupCredits(person: PersonDetails): [string, Credit[]][] {
  const departments = new Map<string, Map<string, Credit>>()
  function add(department: string, item: PersonCredit, role: string | undefined) {
    let titles = departments.get(department)
    if (!titles) {
      titles = new Map()
      departments.set(department, titles)
    }
    const key = resultKey(item)
    const existing = titles.get(key)
    if (!existing) titles.set(key, { item, role: role ?? '' })
    else if (role && !existing.role.split(', ').includes(role)) {
      existing.role = existing.role ? `${existing.role}, ${role}` : role
    }
  }
  for (const c of person.combined_credits?.cast ?? []) {
    if (c.genre_ids?.some((g) => g === TALK_GENRE || g === NEWS_GENRE)) continue
    add('Acting', c, c.character || undefined)
  }
  for (const c of person.combined_credits?.crew ?? []) add(c.department || 'Crew', c, c.job)

  const known = person.known_for_department
  return [...departments.entries()]
    .map(([d, titles]): [string, Credit[]] => [d, [...titles.values()]])
    .sort((a, b) => Number(b[0] === known) - Number(a[0] === known) || b[1].length - a[1].length)
}

function popularity(item: MediaSummary): number {
  return item.vote_count ?? 0
}

function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
}

export default function PersonPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [person, setPerson] = useState<PersonDetails | null>(null)
  const [bioOpen, setBioOpen] = useState(false)
  const [params, update] = useUrlParams()

  useEffect(() => {
    if (!id) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPerson(null)
    setBioOpen(false)
    const controller = new AbortController()
    getPerson(id, controller.signal)
      .then(setPerson)
      .catch((e) => {
        if ((e as Error).name === 'AbortError') return
        navigate('/')
      })
    return () => controller.abort()
  }, [id, navigate])

  const departments = useMemo(() => (person ? groupCredits(person) : []), [person])

  if (!id) return null
  if (!person) {
    return (
      <div className="flex items-center justify-center min-h-svh text-fg-muted text-[13px] tracking-widest uppercase">
        Loading…
      </div>
    )
  }

  const requestedDept = params.get('dept')
  const [deptName, deptCredits] =
    departments.find(([d]) => d === requestedDept) ?? departments[0] ?? ['Acting', []]
  const media: MediaFilter = params.get('media') === 'movie' || params.get('media') === 'tv'
    ? (params.get('media') as MediaFilter)
    : 'all'
  const sort: CreditSort = SORTS.some((s) => s.id === params.get('sort'))
    ? (params.get('sort') as CreditSort)
    : 'popular'

  const filmography = deptCredits
    .filter((c) => media === 'all' || c.item.media_type === media)
    .sort((a, b) =>
      sort === 'popular' ? popularity(b.item) - popularity(a.item) : compareByDate(a.item, b.item, sort),
    )

  const knownFor = [...(departments[0]?.[1] ?? [])]
    .sort((a, b) => popularity(b.item) - popularity(a.item))
    .slice(0, KNOWN_FOR_COUNT)
    .map((c) => c.item)

  const photo = IMG.profile(person.profile_path)
  const born = formatDate(person.birthday)
  const died = formatDate(person.deathday)
  const bio = person.biography?.trim()
  const longBio = !!bio && bio.length > LONG_BIO

  return (
    <div className="min-h-svh bg-bg animate-fade-in">
      <Topbar collapsibleSearch />

      <DetailHero backdropPath={knownFor.find((k) => k.backdrop_path)?.backdrop_path ?? null} />

      <div className="relative flex items-start gap-10 px-12 pb-12 mt-[-180px] animate-fade-up [animation-delay:0.1s] max-[600px]:flex-col max-[600px]:gap-6 max-[600px]:px-5 max-[600px]:mt-[-100px]">
        <div className="shrink-0">
          {photo ? (
            <img
              src={photo}
              alt={person.name}
              className="w-40 aspect-[2/3] object-cover rounded-[2px] block shadow-[0_20px_60px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.06)] max-[600px]:w-28"
            />
          ) : (
            <div className="w-40 aspect-[2/3] rounded-[2px] bg-bg3 flex items-center justify-center font-heading text-5xl text-fg-muted max-[600px]:w-28">
              {person.name[0] ?? '?'}
            </div>
          )}
        </div>
        <div className="flex-1 flex flex-col pt-[120px] max-[600px]:pt-0">
          <h1 className="font-heading text-[52px] font-normal leading-[1.05] tracking-[-0.01em] text-fg mb-3.5 max-[600px]:text-4xl">
            {person.name}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-4 text-xs text-fg-muted tracking-[0.06em] uppercase">
            {person.known_for_department && <span className="text-accent">{person.known_for_department}</span>}
            {born && <span>Born {born}{person.place_of_birth ? ` · ${person.place_of_birth}` : ''}</span>}
            {died && <span>Died {died}</span>}
          </div>
          {bio && (
            <div className="max-w-[640px]">
              <p
                id="person-bio"
                className={`text-sm leading-[1.75] text-fg-muted font-light whitespace-pre-line ${
                  longBio && !bioOpen ? 'line-clamp-5' : ''
                }`}
              >
                {bio}
              </p>
              {longBio && (
                <button
                  type="button"
                  aria-expanded={bioOpen}
                  aria-controls="person-bio"
                  onClick={() => setBioOpen((v) => !v)}
                  className="mt-2 bg-transparent border-none p-0 text-[11px] tracking-[0.12em] uppercase text-accent cursor-pointer hover:underline underline-offset-2"
                >
                  {bioOpen ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {knownFor.length > 0 && (
        <DetailSection label="Known for">
          <PosterRow label={`${person.name} is known for`} items={knownFor} />
        </DetailSection>
      )}

      {departments.length > 0 && (
        <DetailSection
          label="Filmography"
          actions={
            <FilterSelect
              label="Sort"
              value={sort}
              onChange={(v) => update({ sort: v === 'popular' ? null : v })}
              className="w-[140px]"
            >
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </FilterSelect>
          }
        >
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-6">
            {departments.length > 1 && (
              <SegmentedTabs
                label="Department"
                tabs={departments.map(([d, list]) => ({ id: d, label: `${d} · ${list.length}` }))}
                active={deptName}
                onChange={(d) => update({ dept: d === departments[0]?.[0] ? null : d })}
              />
            )}
            <SegmentedTabs
              label="Media type"
              tabs={MEDIA_TABS}
              active={media}
              onChange={(m) => update({ media: m === 'all' ? null : m })}
            />
          </div>
          {filmography.length === 0 ? (
            <p className="text-fg-muted py-8 text-center text-[13px] tracking-[0.04em]">
              No {media === 'movie' ? 'movies' : 'TV shows'} in {deptName.toLowerCase()}.
            </p>
          ) : (
            <PosterGrid>
              {filmography.map(({ item, role }) => {
                const year = yearOf(item)
                return (
                  <ResultCard
                    key={resultKey(item)}
                    item={item}
                    subtitle={[year, role].filter(Boolean).join(' · ') || undefined}
                  />
                )
              })}
            </PosterGrid>
          )}
        </DetailSection>
      )}
    </div>
  )
}
