import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTVShow, getSeason, IMG } from '../api'
import SearchBar from '../components/SearchBar'
import SourceSelector from '../components/SourceSelector'
import { SOURCES, DEFAULT_SOURCE } from '../sources'

export default function TVPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [show, setShow] = useState(null)
  const [seasons, setSeasons] = useState([])
  const [activeSeason, setActiveSeason] = useState(1)
  const [episodes, setEpisodes] = useState([])
  const [activeEp, setActiveEp] = useState(null)
  const [loadingEps, setLoadingEps] = useState(false)
  const [sourceId, setSourceId] = useState(DEFAULT_SOURCE)

  useEffect(() => {
    setActiveEp(null)
    getTVShow(id)
      .then((data) => {
        setShow(data)
        const real = (data.seasons || []).filter(s => s.season_number > 0)
        setSeasons(real)
        if (real.length > 0) setActiveSeason(real[0].season_number)
      })
      .catch(() => navigate('/'))
  }, [id])

  useEffect(() => {
    if (!activeSeason) return
    setLoadingEps(true)
    getSeason(id, activeSeason)
      .then(data => setEpisodes(data.episodes || []))
      .catch(() => setEpisodes([]))
      .finally(() => setLoadingEps(false))
  }, [id, activeSeason])

  function playEpisode(ep) {
    setActiveEp({ season: activeSeason, episode: ep.episode_number, name: ep.name })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!show) return <div className="loading">Loading...</div>

  const year = (show.first_air_date || '').slice(0, 4)
  const rating = show.vote_average ? show.vote_average.toFixed(1) : null
  const source = SOURCES.find(s => s.id === sourceId)
  const embedUrl = activeEp ? source?.tv(id, activeEp.season, activeEp.episode) : null

  return (
    <div className="detail-page">
      <nav className="topbar">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        <SearchBar />
      </nav>

      {show.backdrop_path && !activeEp && (
        <div
          className="backdrop"
          style={{ backgroundImage: `url(${IMG.backdrop(show.backdrop_path)})` }}
        />
      )}

      {activeEp && (
        <>
          <div className="player-wrapper">
            <iframe
              key={`${id}-${activeEp.season}-${activeEp.episode}-${sourceId}`}
              src={embedUrl}
              allowFullScreen
              referrerPolicy="origin"
              scrolling="no"
              title={`${show.name} S${activeEp.season}E${activeEp.episode}`}
            />
          </div>
          <SourceSelector active={sourceId} onChange={setSourceId} />
        </>
      )}

      <div className="detail-body">
        <div className="detail-poster-col">
          {IMG.poster(show.poster_path) && (
            <img className="detail-poster" src={IMG.poster(show.poster_path)} alt={show.name} />
          )}
        </div>
        <div className="detail-info-col">
          <h1 className="detail-title">{show.name}</h1>
          <div className="detail-meta">
            {year && <span>{year}</span>}
            {show.number_of_seasons && <span>{show.number_of_seasons} Seasons</span>}
            {rating && <span className="rating">★ {rating}</span>}
            {show.genres?.map(g => <span key={g.id} className="genre-tag">{g.name}</span>)}
          </div>
          {show.overview && <p className="detail-overview">{show.overview}</p>}
          {activeEp && (
            <p className="now-playing-label">
              ▶ Playing S{activeEp.season} E{activeEp.episode} — {activeEp.name}
            </p>
          )}
        </div>
      </div>

      <div className="episodes-section">
        <div className="season-tabs">
          {seasons.map(s => (
            <button
              key={s.season_number}
              className={activeSeason === s.season_number ? 'active' : ''}
              onClick={() => setActiveSeason(s.season_number)}
            >
              Season {s.season_number}
            </button>
          ))}
        </div>

        {loadingEps ? (
          <div className="loading-eps">Loading episodes...</div>
        ) : (
          <div className="episode-grid">
            {episodes.map(ep => (
              <div
                key={ep.id}
                className={`episode-card ${activeEp?.season === activeSeason && activeEp?.episode === ep.episode_number ? 'active' : ''}`}
                onClick={() => playEpisode(ep)}
              >
                <div className="ep-still">
                  {IMG.still(ep.still_path)
                    ? <img src={IMG.still(ep.still_path)} alt={ep.name} />
                    : <div className="ep-still-placeholder" />
                  }
                  <span className="ep-play-icon">▶</span>
                </div>
                <div className="ep-info">
                  <span className="ep-number">E{ep.episode_number}</span>
                  <span className="ep-name">{ep.name}</span>
                  {ep.runtime && <span className="ep-runtime">{ep.runtime} min</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
