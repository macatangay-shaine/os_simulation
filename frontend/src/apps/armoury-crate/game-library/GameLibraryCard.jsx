import { Play, Square } from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatGameLibraryPlaytime, formatGameLibraryTime } from './gameLibraryData.js'

export default function GameLibraryCard({ game, viewMode, isLaunching, onLaunch, onStop }) {
  const [imageSrc, setImageSrc] = useState(game.image)

  useEffect(() => {
    setImageSrc(game.image)
  }, [game.id, game.image])

  function handleImageError() {
    if (game.fallbackImage && imageSrc !== game.fallbackImage) {
      setImageSrc(game.fallbackImage)
    }
  }

  const statusLabel = game.isRunning ? 'Running' : game.contentStatus === 'downloading' ? 'Syncing' : 'Installed'
  const actionLabel = game.isRunning ? 'Stop' : isLaunching ? 'Launching...' : 'Play'

  if (viewMode === 'list') {
    return (
      <article className={`armoury-crate-game-library-list-card ${game.isRunning ? 'running' : ''}`}>
        <div className="armoury-crate-game-library-list-cover">
          <img src={imageSrc} alt="" onError={handleImageError} />
        </div>

        <div className="armoury-crate-game-library-list-copy">
          <div className="armoury-crate-game-library-list-topline">
            <h3 title={game.title}>{game.title}</h3>
            <span className={`armoury-crate-game-library-status ${game.isRunning ? 'running' : ''}`}>{statusLabel}</span>
          </div>
          <div className="armoury-crate-game-library-list-meta">
            <span>{game.category}</span>
            <span>{game.installSizeLabel}</span>
            <span>{formatGameLibraryTime(game.lastPlayedAt)}</span>
            <span>{formatGameLibraryPlaytime(game.totalPlayMinutes)}</span>
          </div>
          <p>{game.launchTag}</p>
        </div>

        <button
          type="button"
          className={`armoury-crate-game-library-action ${game.isRunning ? 'stop' : ''}`}
          onClick={game.isRunning ? () => onStop(game) : () => onLaunch(game)}
          disabled={isLaunching}
        >
          {game.isRunning ? <Square size={15} strokeWidth={2} /> : <Play size={15} strokeWidth={2} />}
          <span>{actionLabel}</span>
        </button>
      </article>
    )
  }

  return (
    <article className={`armoury-crate-game-library-card ${game.isRunning ? 'running' : ''}`}>
      <div className="armoury-crate-game-library-card-cover">
        <img src={imageSrc} alt="" onError={handleImageError} />
        <div className="armoury-crate-game-library-card-overlay" />
        <span className={`armoury-crate-game-library-status ${game.isRunning ? 'running' : ''}`}>{statusLabel}</span>
      </div>

      <div className="armoury-crate-game-library-card-body">
        <div className="armoury-crate-game-library-card-heading">
          <h3 title={game.title}>{game.title}</h3>
          <span>{game.category}</span>
        </div>

        <div className="armoury-crate-game-library-card-metrics">
          <span>{game.installSizeLabel}</span>
          <span>{formatGameLibraryTime(game.lastPlayedAt)}</span>
          <span>{formatGameLibraryPlaytime(game.totalPlayMinutes)}</span>
        </div>

        <p>{game.launchTag}</p>

        <button
          type="button"
          className={`armoury-crate-game-library-action ${game.isRunning ? 'stop' : ''}`}
          onClick={game.isRunning ? () => onStop(game) : () => onLaunch(game)}
          disabled={isLaunching}
        >
          {game.isRunning ? <Square size={15} strokeWidth={2} /> : <Play size={15} strokeWidth={2} />}
          <span>{actionLabel}</span>
        </button>
      </div>
    </article>
  )
}
