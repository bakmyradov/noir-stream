import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchMulti, IMG } from '../api'

export default function SearchBar({ autoFocus = false }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const items = await searchMulti(query)
        setResults(items)
        setOpen(true)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 350)
  }, [query])

  useEffect(() => {
    function handler(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function select(item) {
    setQuery('')
    setOpen(false)
    navigate(`/${item.media_type}/${item.id}`)
  }

  return (
    <div className="searchbar-wrapper" ref={wrapperRef}>
      <div className="search-icon">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M6.5 1a5.5 5.5 0 100 11 5.5 5.5 0 000-11zm-7 5.5a7 7 0 1112.53 4.394l3.538 3.539a1 1 0 11-1.414 1.414l-3.539-3.538A7 7 0 01-.5 6.5z"/>
        </svg>
      </div>
      <input
        type="text"
        className="searchbar-input"
        value={query}
        autoFocus={autoFocus}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search films &amp; series..."
        autoComplete="off"
      />
      {loading && <span className="search-spinner" />}

      {open && results.length > 0 && (
        <ul className="dropdown">
          {results.map((item) => (
            <li key={item.id} onMouseDown={() => select(item)}>
              {IMG.thumb(item.poster_path)
                ? <img src={IMG.thumb(item.poster_path)} alt="" />
                : <div className="no-poster" />
              }
              <div className="result-info">
                <span className="result-title">{item.title || item.name}</span>
                <span className="result-meta">
                  {item.media_type === 'tv' ? 'TV Show' : 'Movie'}
                  {' · '}
                  {(item.release_date || item.first_air_date || '').slice(0, 4)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
