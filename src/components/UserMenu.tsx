import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

function initialsFor(user: { email?: string; user_metadata?: { display_name?: string } }) {
  const name = user.user_metadata?.display_name?.trim()
  if (name) {
    const parts = name.split(/\s+/)
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?'
  }
  return (user.email?.[0] ?? '?').toUpperCase()
}

export default function UserMenu() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search)
    return (
      <Link
        to={`/auth?redirect=${redirect}`}
        className="ml-auto shrink-0 inline-flex items-center bg-transparent border border-white/12 text-fg-muted font-sans text-xs font-normal tracking-[0.06em] uppercase px-3.5 py-1.5 rounded-[2px] cursor-pointer transition-[color,border-color,background] duration-200 hover:text-fg hover:border-white/25 hover:bg-white/5"
      >
        Sign in
      </Link>
    )
  }

  const display =
    (user.user_metadata as { display_name?: string } | undefined)?.display_name ?? user.email

  return (
    <div className="ml-auto shrink-0 relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 bg-transparent border border-white/12 px-2 py-1.5 rounded-[2px] cursor-pointer transition-[border-color,background] duration-200 hover:border-white/25 hover:bg-white/5"
      >
        <span className="size-7 rounded-full bg-accent/15 border border-accent2 text-accent flex items-center justify-center text-[10px] tracking-widest uppercase font-medium">
          {initialsFor(user)}
        </span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] w-56 bg-[rgba(12,12,20,0.98)] border border-white/10 rounded-[2px] shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-md py-1.5 z-50"
        >
          <div className="px-3.5 py-2 text-[11px] tracking-[0.04em] text-fg-muted truncate border-b border-white/6">
            {display}
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              navigate('/library')
            }}
            className="w-full text-left px-3.5 py-2 text-xs tracking-[0.06em] uppercase text-fg-muted hover:text-fg hover:bg-white/5 cursor-pointer bg-transparent border-none font-sans"
          >
            Library
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              setOpen(false)
              await signOut()
              navigate('/')
            }}
            className="w-full text-left px-3.5 py-2 text-xs tracking-[0.06em] uppercase text-fg-muted hover:text-fg hover:bg-white/5 cursor-pointer bg-transparent border-none font-sans"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
