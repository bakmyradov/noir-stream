import SearchBar from '../components/SearchBar'

export default function Home() {
  return (
    <div className="home">
      <div className="home-hero">
        <img src="/noir-wordmark.svg" alt="Noir" className="home-wordmark" />
        <p>Search for any movie or TV show to start watching</p>
        <SearchBar autoFocus />
      </div>
    </div>
  )
}
