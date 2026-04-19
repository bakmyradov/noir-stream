import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTVShow, getSeason, IMG } from '../api'
import SearchBar from '../components/SearchBar'
import SourceSelector from '../components/SourceSelector'
import LogoMark from '../components/LogoMark'
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

  if (!show) return <div className="loading">Loading…</div>

  const year = (show.first_air_date || '').slice(0, 4)
  const rating = show.vote_average ? show.vote_average.toFixed(1) : null
  const source = SOURCES.find(s => s.id === sourceId)
  const embedUrl = activeEp ? source?.tv(id, activeEp.season, activeEp.episode) : null

  return (
    <div className={`detail-page${activeEp ? ' playing' : ''}`}>
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

      {!activeEp && (
        <div className="show-hero">
          <div className="hero-backdrop">
            {show.backdrop_path && (
              <img className="hero-backdrop-img" src={IMG.backdrop(show.backdrop_path)} alt="" />
            )}
          </div>
          <div className="hero-gradient-left" />
          <div className="hero-gradient" />
        </div>
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
            {rating && (
              <span className="rating">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/>
                </svg>
                {rating}
              </span>
            )}
            {show.genres?.map(g => <span key={g.id} className="genre-tag">{g.name}</span>)}
          </div>
          {show.overview && <p className="detail-overview">{show.overview}</p>}
          {activeEp && (
            <p className="now-playing-label">
              ▶ S{activeEp.season} E{activeEp.episode} — {activeEp.name}
            </p>
          )}
        </div>
      </div>

      <div className="episodes-section">
        <div className="section-rule" />
        <p className="seasons-label">Episodes</p>
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
          <div className="loading-eps">Loading episodes…</div>
        ) : (
          <div className="episode-grid">
            {episodes.map(ep => (
              <div
                key={ep.id}
                className={`episode-card${activeEp?.season === activeSeason && activeEp?.episode === ep.episode_number ? ' active' : ''}`}
                onClick={() => playEpisode(ep)}
              >
                <div className="ep-still">
                  {IMG.still(ep.still_path)
                    ? <img src={IMG.still(ep.still_path)} alt={ep.name} />
                    : <div className="ep-still-placeholder" />
                  }
                  <span className="ep-play-icon" />
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
