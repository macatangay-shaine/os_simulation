import { Gamepad2, RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CONTENT_PLATFORM_ITEMS_BY_ID, CONTENT_PLATFORM_STORAGE_KEY } from '../content-platform/contentPlatformData.js'
import GameLibraryCard from './GameLibraryCard.jsx'
import {
  formatGameLibraryTime,
  GAME_LIBRARY_METADATA_BY_ID,
  GAME_LIBRARY_SORT_OPTIONS,
  GAME_LIBRARY_STORAGE_KEY
} from './gameLibraryData.js'
import GameLibraryEmptyState from './GameLibraryEmptyState.jsx'
import GameLibraryToolbar from './GameLibraryToolbar.jsx'

const DEFAULT_GAME_LIBRARY_STATE = {
  activeCategory: 'all',
  sortBy: 'recently-played',
  searchQuery: '',
  viewMode: 'grid',
  trackedGames: {}
}
const INSTALLED_LIBRARY_STATUSES = new Set(['added', 'installed'])

function loadContentPlatformState() {
  if (typeof window === 'undefined') return { library: {} }

  try {
    const rawValue = window.localStorage.getItem(CONTENT_PLATFORM_STORAGE_KEY)
    if (!rawValue) return { library: {} }

    const parsed = JSON.parse(rawValue)
    return {
      library: parsed?.library && typeof parsed.library === 'object' ? parsed.library : {}
    }
  } catch (error) {
    return { library: {} }
  }
}

function loadGameLibraryState() {
  if (typeof window === 'undefined') return DEFAULT_GAME_LIBRARY_STATE

  try {
    const rawValue = window.localStorage.getItem(GAME_LIBRARY_STORAGE_KEY)
    if (!rawValue) return DEFAULT_GAME_LIBRARY_STATE

    const parsed = JSON.parse(rawValue)
    return {
      ...DEFAULT_GAME_LIBRARY_STATE,
      ...parsed,
      trackedGames: parsed?.trackedGames && typeof parsed.trackedGames === 'object' ? parsed.trackedGames : {}
    }
  } catch (error) {
    return DEFAULT_GAME_LIBRARY_STATE
  }
}

function finalizeSession(trackedGame, endedAt = new Date().toISOString()) {
  const activeSession = trackedGame?.activeSession
  if (!activeSession?.startedAt) return trackedGame

  const sessionStartedAt = new Date(activeSession.startedAt)
  const sessionEndedAt = new Date(endedAt)
  const totalMinutes = Math.max(1, Math.round((sessionEndedAt - sessionStartedAt) / (1000 * 60)))

  return {
    ...trackedGame,
    totalPlayMinutes: (Number(trackedGame?.totalPlayMinutes) || 0) + totalMinutes,
    activeSession: null
  }
}

function getGameLibraryMetadata(item) {
  return GAME_LIBRARY_METADATA_BY_ID[item.id] || {
    category: 'Game',
    installSizeLabel: '22.0 GB',
    memoryMb: 96,
    launchTag: 'Installed from Content Platform'
  }
}

export default function GameLibraryPage({ runningProcesses = [], onRefreshProcesses, onOpenGameDeals }) {
  const [contentState, setContentState] = useState(() => loadContentPlatformState())
  const [libraryState, setLibraryState] = useState(() => loadGameLibraryState())
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [busyGameId, setBusyGameId] = useState(null)
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const menuRef = useRef(null)

  const runningProcessMap = useMemo(() => {
    const map = new Map()
    runningProcesses.forEach((process) => {
      if (process.state !== 'running') return
      const current = map.get(process.app) || []
      current.push(process)
      map.set(process.app, current)
    })
    return map
  }, [runningProcesses])

  const downloadedGames = useMemo(() => {
    return Object.entries(contentState.library || {})
      .map(([itemId, status]) => {
        if (!INSTALLED_LIBRARY_STATUSES.has(status)) return null

        const item = CONTENT_PLATFORM_ITEMS_BY_ID[itemId]
        if (!item || item.type !== 'game') return null

        const trackedGame = libraryState.trackedGames[itemId] || {}
        const metadata = getGameLibraryMetadata(item)
        const runningEntries = runningProcessMap.get(item.title) || []

        return {
          ...item,
          ...metadata,
          contentStatus: status,
          isRunning: runningEntries.length > 0,
          runningPids: runningEntries.map((entry) => entry.pid),
          addedAt: trackedGame.addedAt || item.sortDate,
          lastPlayedAt: trackedGame.lastPlayedAt || null,
          playCount: Number(trackedGame.playCount) || 0,
          totalPlayMinutes: Number(trackedGame.totalPlayMinutes) || 0,
          activeSession: trackedGame.activeSession || null
        }
      })
      .filter(Boolean)
  }, [contentState.library, libraryState.trackedGames, runningProcessMap])

  const categoryOptions = useMemo(() => {
    const categories = [...new Set(downloadedGames.map((game) => game.category))].sort((left, right) => left.localeCompare(right))
    return [{ id: 'all', label: 'All' }, ...categories.map((category) => ({ id: category, label: category }))]
  }, [downloadedGames])

  const visibleGames = useMemo(() => {
    const normalizedQuery = libraryState.searchQuery.trim().toLowerCase()

    const filtered = downloadedGames.filter((game) => {
      if (libraryState.activeCategory !== 'all' && game.category !== libraryState.activeCategory) return false

      if (!normalizedQuery) return true
      const haystack = `${game.title} ${game.category} ${game.launchTag}`.toLowerCase()
      return haystack.includes(normalizedQuery)
    })

    const sorted = [...filtered]
    if (libraryState.sortBy === 'alphabetical') {
      sorted.sort((left, right) => left.title.localeCompare(right.title))
      return sorted
    }

    if (libraryState.sortBy === 'recently-added') {
      sorted.sort((left, right) => new Date(right.addedAt) - new Date(left.addedAt))
      return sorted
    }

    if (libraryState.sortBy === 'running') {
      sorted.sort((left, right) => {
        if (left.isRunning !== right.isRunning) return left.isRunning ? -1 : 1
        return left.title.localeCompare(right.title)
      })
      return sorted
    }

    sorted.sort((left, right) => {
      const leftPlayed = left.lastPlayedAt ? new Date(left.lastPlayedAt).getTime() : 0
      const rightPlayed = right.lastPlayedAt ? new Date(right.lastPlayedAt).getTime() : 0
      if (leftPlayed !== rightPlayed) return rightPlayed - leftPlayed
      return new Date(right.addedAt) - new Date(left.addedAt)
    })
    return sorted
  }, [downloadedGames, libraryState.activeCategory, libraryState.searchQuery, libraryState.sortBy])

  useEffect(() => {
    setContentState(loadContentPlatformState())
  }, [])

  useEffect(() => {
    onRefreshProcesses?.()
  }, [onRefreshProcesses])

  useEffect(() => {
    window.localStorage.setItem(GAME_LIBRARY_STORAGE_KEY, JSON.stringify(libraryState))
  }, [libraryState])

  useEffect(() => {
    function handleMouseDown(event) {
      if (!menuRef.current?.contains(event.target)) {
        setIsMenuOpen(false)
      }
    }

    window.addEventListener('mousedown', handleMouseDown)
    return () => window.removeEventListener('mousedown', handleMouseDown)
  }, [])

  useEffect(() => {
    const installedIds = new Set(downloadedGames.map((game) => game.id))
    setLibraryState((previous) => {
      let changed = false
      const nextTrackedGames = { ...previous.trackedGames }

      downloadedGames.forEach((game) => {
        if (!nextTrackedGames[game.id]) {
          nextTrackedGames[game.id] = {
            addedAt: new Date().toISOString(),
            lastPlayedAt: null,
            playCount: 0,
            totalPlayMinutes: 0,
            activeSession: null
          }
          changed = true
        }
      })

      Object.keys(nextTrackedGames).forEach((gameId) => {
        if (!installedIds.has(gameId)) {
          delete nextTrackedGames[gameId]
          changed = true
        }
      })

      if (!changed) return previous
      return {
        ...previous,
        trackedGames: nextTrackedGames
      }
    })
  }, [downloadedGames])

  useEffect(() => {
    setLibraryState((previous) => {
      let changed = false
      const nextTrackedGames = { ...previous.trackedGames }

      downloadedGames.forEach((game) => {
        const trackedGame = nextTrackedGames[game.id]
        if (!trackedGame?.activeSession) return
        if (game.isRunning) return

        nextTrackedGames[game.id] = finalizeSession(trackedGame)
        changed = true
      })

      if (!changed) return previous
      return {
        ...previous,
        trackedGames: nextTrackedGames
      }
    })
  }, [downloadedGames])

  async function handleLaunchGame(game) {
    if (busyGameId) return

    setBusyGameId(game.id)
    setFeedbackMessage('')

    try {
      const response = await fetch('http://localhost:8000/process/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app: game.title,
          memory: game.memoryMb
        })
      })

      const payload = await response.json()
      if (!response.ok) {
        setFeedbackMessage(payload?.detail || `Failed to launch ${game.title}.`)
        return
      }

      const startedAt = new Date().toISOString()
      setLibraryState((previous) => ({
        ...previous,
        trackedGames: {
          ...previous.trackedGames,
          [game.id]: {
            ...(previous.trackedGames[game.id] || {}),
            addedAt: previous.trackedGames[game.id]?.addedAt || startedAt,
            lastPlayedAt: startedAt,
            playCount: (Number(previous.trackedGames[game.id]?.playCount) || 0) + 1,
            totalPlayMinutes: Number(previous.trackedGames[game.id]?.totalPlayMinutes) || 0,
            activeSession: {
              pid: payload.pid,
              startedAt
            }
          }
        }
      }))

      if (Array.isArray(payload.killed_processes) && payload.killed_processes.length > 0) {
        setFeedbackMessage(`${game.title} launched. Background apps were closed to free memory.`)
      } else {
        setFeedbackMessage(`${game.title} launched successfully.`)
      }

      await onRefreshProcesses?.()
    } catch (error) {
      setFeedbackMessage(`Failed to launch ${game.title}.`)
    } finally {
      setBusyGameId(null)
    }
  }

  async function handleStopGame(game) {
    if (busyGameId) return
    setBusyGameId(game.id)
    setFeedbackMessage('')

    try {
      await Promise.all(
        game.runningPids.map((pid) => fetch(`http://localhost:8000/process/kill?pid=${pid}`, { method: 'POST' }))
      )

      setLibraryState((previous) => ({
        ...previous,
        trackedGames: {
          ...previous.trackedGames,
          [game.id]: finalizeSession(previous.trackedGames[game.id], new Date().toISOString())
        }
      }))
      setFeedbackMessage(`${game.title} stopped.`)
      await onRefreshProcesses?.()
    } catch (error) {
      setFeedbackMessage(`Failed to stop ${game.title}.`)
    } finally {
      setBusyGameId(null)
    }
  }

  const hasInstalledGames = downloadedGames.length > 0
  const hasActiveFilters = libraryState.activeCategory !== 'all' || libraryState.searchQuery.trim().length > 0

  return (
    <section className="armoury-crate-game-library-page">
      <header className="armoury-crate-game-library-header">
        <div className="armoury-crate-game-library-header-copy">
          <h1>Game Library</h1>
          {hasInstalledGames ? (
            <div className="armoury-crate-game-library-statusline">
              <span>{downloadedGames.length} installed</span>
              <span>{downloadedGames.filter((game) => game.isRunning).length} running</span>
              <span>Synced {formatGameLibraryTime(new Date().toISOString())}</span>
            </div>
          ) : null}
        </div>

        <div className="armoury-crate-device-header-tools armoury-crate-game-library-header-tools" aria-hidden="true">
          <GameLibraryHeaderIcon />
        </div>
      </header>

      <div className="armoury-crate-game-library-toolbar-shell" ref={menuRef}>
        <GameLibraryToolbar
          categories={categoryOptions}
          activeCategory={libraryState.activeCategory}
          onCategoryChange={(activeCategory) => setLibraryState((previous) => ({ ...previous, activeCategory }))}
          sortOptions={GAME_LIBRARY_SORT_OPTIONS}
          activeSort={libraryState.sortBy}
          onSortChange={(sortBy) => setLibraryState((previous) => ({ ...previous, sortBy }))}
          searchQuery={libraryState.searchQuery}
          onSearchChange={(searchQuery) => setLibraryState((previous) => ({ ...previous, searchQuery }))}
          viewMode={libraryState.viewMode}
          onViewModeChange={(viewMode) => setLibraryState((previous) => ({ ...previous, viewMode }))}
          onToggleMenu={() => setIsMenuOpen((previous) => !previous)}
        />

        {isMenuOpen ? (
          <div className="armoury-crate-game-library-menu">
            <button
              type="button"
              onClick={async () => {
                setIsMenuOpen(false)
                await onRefreshProcesses?.()
                setContentState(loadContentPlatformState())
                setFeedbackMessage('Game Library refreshed.')
              }}
            >
              <RefreshCw size={15} strokeWidth={2} />
              <span>Refresh Library</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false)
                onOpenGameDeals?.()
              }}
            >
              <Gamepad2 size={15} strokeWidth={2} />
              <span>Open Game Deals</span>
            </button>
          </div>
        ) : null}
      </div>

      {feedbackMessage ? <div className="armoury-crate-game-library-feedback">{feedbackMessage}</div> : null}

      {!hasInstalledGames || visibleGames.length === 0 ? (
        <GameLibraryEmptyState onOpenGameDeals={onOpenGameDeals} hasActiveFilters={hasInstalledGames && visibleGames.length === 0 && hasActiveFilters} />
      ) : libraryState.viewMode === 'grid' ? (
        <div className="armoury-crate-game-library-grid">
          {visibleGames.map((game) => (
            <GameLibraryCard
              key={game.id}
              game={game}
              viewMode="grid"
              isLaunching={busyGameId === game.id}
              onLaunch={handleLaunchGame}
              onStop={handleStopGame}
            />
          ))}
        </div>
      ) : (
        <div className="armoury-crate-game-library-list">
          {visibleGames.map((game) => (
            <GameLibraryCard
              key={game.id}
              game={game}
              viewMode="list"
              isLaunching={busyGameId === game.id}
              onLaunch={handleLaunchGame}
              onStop={handleStopGame}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function GameLibraryHeaderIcon() {
  return (
    <svg viewBox="0 0 112 74" role="img">
      <g fill="none" stroke="#f2f2f2" strokeWidth="2.2" strokeLinecap="square" strokeLinejoin="miter">
        <path d="M26 18H60L72 30V56H26Z" />
        <path d="M38 36H48" />
        <path d="M43 31V41" />
        <circle cx="64" cy="40" r="3.5" />
        <circle cx="74" cy="33" r="3.5" opacity="0.5" />
        <circle cx="82" cy="46" r="3.5" opacity="0.32" />
      </g>
    </svg>
  )
}
