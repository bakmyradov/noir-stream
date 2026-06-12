import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import LogoMark from './LogoMark'
import SearchBar from './SearchBar'
import UserMenu from './UserMenu'

interface TopbarProps {
  /** Collapse the search bar into an icon button; expanding it takes over the whole bar. */
  collapsibleSearch?: boolean
}

const iconButtonClasses =
  'flex items-center justify-center size-9 shrink-0 bg-transparent border border-white/12 text-fg-muted rounded-[2px] cursor-pointer transition-[color,border-color,background] duration-200 hover:text-fg hover:border-white/25 hover:bg-white/5'

export default function Topbar({ collapsibleSearch = false }: TopbarProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)

  // Collapse once a search result navigates away
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchOpen(false)
  }, [pathname])

  const expanded = collapsibleSearch && searchOpen

  return (
    <nav
      onKeyDown={(e) => {
        if (e.key === 'Escape') setSearchOpen(false)
      }}
      className="fixed inset-x-0 top-0 z-50 flex items-center gap-3.5 px-8 h-[60px] bg-linear-to-b from-[rgba(8,8,16,0.98)] to-[rgba(8,8,16,0)] max-[600px]:px-4 max-[600px]:h-[52px]"
    >
      {expanded ? (
        <div className="flex items-center gap-3.5 w-full animate-fade-in [animation-duration:0.2s]">
          <SearchBar variant="topbar" autoFocus fullWidth />
          <button
            onClick={() => setSearchOpen(false)}
            aria-label="Close search"
            className={iconButtonClasses}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 bg-transparent border border-white/12 text-fg-muted font-sans text-xs font-normal tracking-[0.06em] uppercase whitespace-nowrap shrink-0 px-3.5 py-1.5 rounded-[2px] cursor-pointer transition-[color,border-color,background] duration-200 hover:text-fg hover:border-white/25 hover:bg-white/5"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
              <path d="M6.5 1L2.5 5l4 4" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
          <div className="w-px h-5 bg-white/12 shrink-0" />
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 cursor-pointer transition-opacity duration-200 hover:opacity-80 bg-transparent border-none p-0"
          >
            <span className="text-accent flex">
              <LogoMark style="aperture" size={20} />
            </span>
            <span className="font-heading font-light text-[22px] tracking-[0.22em] pr-[0.22em] text-fg">
              NOIR
            </span>
          </button>
          {collapsibleSearch ? (
            <>
              <div className="flex-1" />
              <button
                onClick={() => setSearchOpen(true)}
                aria-label="Open search"
                className={iconButtonClasses}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M6.5 1a5.5 5.5 0 100 11 5.5 5.5 0 000-11zm-7 5.5a7 7 0 1112.53 4.394l3.538 3.539a1 1 0 11-1.414 1.414l-3.539-3.538A7 7 0 01-.5 6.5z"/>
                </svg>
              </button>
            </>
          ) : (
            <SearchBar variant="topbar" />
          )}
          <UserMenu />
        </>
      )}
    </nav>
  )
}
