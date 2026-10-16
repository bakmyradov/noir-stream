import { Link } from 'react-router-dom'
import { IMG } from '../api'
import type { CastMember } from '../types'

const MAX_CAST = 15

export default function CastRow({ cast }: { cast: CastMember[] }) {
  return (
    <ul aria-label="Cast" className="flex gap-4 overflow-x-auto pt-1 pb-3 -mx-1 px-1 snap-x list-none max-[600px]:gap-3">
      {cast.slice(0, MAX_CAST).map((member) => {
        const photo = IMG.profile(member.profile_path)
        return (
          <li key={member.id} className="w-[112px] shrink-0 snap-start max-[600px]:w-[96px]">
            <Link
              to={`/person/${member.id}`}
              title={member.name}
              className="group flex flex-col gap-2 outline-none"
            >
              <div className="aspect-[2/3] rounded-[2px] overflow-hidden bg-bg3 border border-white/6 transition-[transform,border-color] duration-200 group-hover:-translate-y-1 group-hover:border-white/15 group-focus-visible:border-accent">
                {photo ? (
                  <img src={photo} alt="" loading="lazy" className="size-full object-cover saturate-[0.75] group-hover:saturate-100 transition-[filter] duration-300" />
                ) : (
                  <div className="size-full flex items-center justify-center font-heading text-3xl text-fg-muted">
                    {member.name[0] ?? '?'}
                  </div>
                )}
              </div>
              <div className="flex flex-col px-0.5">
                <span className="text-[12px] text-fg leading-tight line-clamp-2">{member.name}</span>
                {member.character && (
                  <span className="text-[11px] text-fg-muted leading-tight mt-0.5 line-clamp-2">{member.character}</span>
                )}
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
