import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getMovie, IMG } from '../api'
import SearchBar from '../components/SearchBar'
import SourceSelector from '../components/SourceSelector'
import LogoMark from '../components/LogoMark'
import { SOURCES, DEFAULT_SOURCE } from '../sources'

export default function MoviePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [movie, setMovie] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [sourceId, setSourceId] = useState(DEFAULT_SOURCE)

  useEffect(() => {
    setPlaying(false)
    getMovie(id).then(setMovie).catch(() => navigate('/'))
  }, [id])

  if (!movie) return <div className="loading">Loading…</div>

  const year = (movie.release_date || '').slice(0, 4)
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null
  const source = SOURCES.find(s => s.id === sourceId)
  const embedUrl = source?.movie(id)

  return (
    <div className={`detail-page${playing ? ' playing' : ''}`}>
      <nav className="topbar">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <path d="M6.5 1L2.5 5l4 4" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
        <div className="nav-divider" />
        <button className="nav-logo" onClick={() => navigate('/')}>
          <span style={{ color: 'var(--accent)', display: 'flex' }}>
            <LogoMark style="aperture" size={20} />
          </span>
          <span className="nav-logo-text">NOIR</span>
        </button>
        <SearchBar />
      </nav>

      {!playing && (
        <div className="show-hero">
          <div className="hero-backdrop">
            {movie.backdrop_path && (
              <img className="hero-backdrop-img" src={IMG.backdrop(movie.backdrop_path)} alt="" />
            )}
          </div>
          <div className="hero-gradient-left" />
          <div className="hero-gradient" />
        </div>
      )}

      {playing && (
        <>
          <div className="player-wrapper">
            <iframe
              key={`${id}-${sourceId}`}
              src={embedUrl}
              allowFullScreen
              referrerPolicy="origin"
              scrolling="no"
              title={movie.title}
            />
          </div>
          <SourceSelector active={sourceId} onChange={setSourceId} />
        </>
      )}

      <div className="detail-body">
        <div className="detail-poster-col">
          {IMG.poster(movie.poster_path) && (
            <img className="detail-poster" src={IMG.poster(movie.poster_path)} alt={movie.title} />
          )}
        </div>
        <div className="detail-info-col">
          <h1 className="detail-title">{movie.title}</h1>
          <div className="detail-meta">
            {year && <span>{year}</span>}
            {movie.runtime && <span>{movie.runtime} min</span>}
            {rating && (
              <span className="rating">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/>
                </svg>
                {rating}
              </span>
            )}
            {movie.genres?.map(g => <span key={g.id} className="genre-tag">{g.name}</span>)}
          </div>
          {movie.overview && <p className="detail-overview">{movie.overview}</p>}
          <button className="watch-btn big" onClick={() => setPlaying(true)}>
            <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor">
              <path d="M1 1l8 5L1 11V1z"/>
            </svg>
            {playing ? 'Now Playing' : 'Play Now'}
          </button>
        </div>
      </div>
    </div>
  )
}
