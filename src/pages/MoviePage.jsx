import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getMovie, IMG } from '../api'
import SearchBar from '../components/SearchBar'
import SourceSelector from '../components/SourceSelector'
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

  if (!movie) return <div className="loading">Loading...</div>

  const year = (movie.release_date || '').slice(0, 4)
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null
  const source = SOURCES.find(s => s.id === sourceId)
  const embedUrl = source?.movie(id)

  return (
    <div className="detail-page">
      <nav className="topbar">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        <SearchBar />
      </nav>

      {movie.backdrop_path && !playing && (
        <div
          className="backdrop"
          style={{ backgroundImage: `url(${IMG.backdrop(movie.backdrop_path)})` }}
        />
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
            {rating && <span className="rating">★ {rating}</span>}
            {movie.genres?.map(g => <span key={g.id} className="genre-tag">{g.name}</span>)}
          </div>
          {movie.overview && <p className="detail-overview">{movie.overview}</p>}
          <button className="watch-btn big" onClick={() => setPlaying(true)}>
            {playing ? '▶ Now Playing' : '▶ Watch Now'}
          </button>
        </div>
      </div>
    </div>
  )
}
