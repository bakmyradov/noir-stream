import { IMG } from '../api'

interface DetailHeroProps {
  backdropPath: string | null
}

export default function DetailHero({ backdropPath }: DetailHeroProps) {
  return (
    <div className="relative h-[520px] overflow-hidden max-[600px]:h-[340px]">
      <div className="absolute inset-0 bg-linear-to-br from-[#0d1a2a] via-[#1a0d0d] to-[#0d0d1a]">
        {backdropPath && (
          <img
            src={IMG.backdrop(backdropPath) ?? undefined}
            alt=""
            className="absolute inset-0 size-full object-cover opacity-25 saturate-[0.6]"
          />
        )}
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(8,8,16,0.85)_0%,rgba(8,8,16,0.3)_50%,transparent_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(8,8,16,0.15)_0%,rgba(8,8,16,0)_30%,rgba(8,8,16,0.6)_70%,rgba(8,8,16,1)_100%)]" />
    </div>
  )
}
