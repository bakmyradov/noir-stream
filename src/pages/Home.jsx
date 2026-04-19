import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SearchBar from '../components/SearchBar'
import LogoMark from '../components/LogoMark'
import { getTrending, IMG } from '../api'

export default function Home() {
  const [featured, setFeatured] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    getTrending().then(setFeatured).catch(() => {})
  }, [])

  function openItem(item) {
    navigate(`/${item.media_type}/${item.id}`)
  }

  return (
    <div className="home">
      <div className="home-hero">
        <div className="logo-lockup">
          <div className="logo-mark-wrap">
            <LogoMark style="aperture" size={52} />
          </div>
          <div className="logo-wordmark">
            <span className="logo-text">NOIR</span>
            <div className="logo-rule" />
            <span className="logo-tagline">Cinema Streaming</span>
          </div>
        </div>

        <p className="home-subtitle">Search for any film or series to begin</p>

        <SearchBar autoFocus />

        {featured.length > 0 && (
          <div className="home-featured">
            <p className="home-featured-label">Featured</p>
            <div className="home-featured-row">
              {featured.map(item => (
                <div
                  key={item.id}
                  className="home-featured-card"
                  onClick={() => openItem(item)}
                  title={item.title || item.name}
                >
                  {IMG.poster(item.poster_path)
                    ? <img src={IMG.poster(item.poster_path)} alt={item.title || item.name} />
                    : <div className="home-featured-placeholder">{(item.title || item.name || '?')[0]}</div>
                  }
                  <div className="home-featured-card-title">{item.title || item.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
