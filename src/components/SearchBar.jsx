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
      <input
        type="text"
        className="searchbar-input"
        value={query}
        autoFocus={autoFocus}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search movies or TV shows..."
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
