import { useNavigate } from 'react-router-dom'
import LogoMark from './LogoMark'
import SearchBar from './SearchBar'

export default function Topbar() {
  const navigate = useNavigate()
  return (
    <nav className="fixed inset-x-0 top-0 z-50 flex items-center gap-3.5 px-8 h-[60px] bg-linear-to-b from-[rgba(8,8,16,0.98)] to-[rgba(8,8,16,0)] max-[600px]:px-4 max-[600px]:h-[52px]">
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
      <SearchBar variant="topbar" />
    </nav>
  )
}
