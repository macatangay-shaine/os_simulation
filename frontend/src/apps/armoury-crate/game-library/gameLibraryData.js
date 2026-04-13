export const GAME_LIBRARY_STORAGE_KEY = 'jezos_armoury_game_library_state'

export const GAME_LIBRARY_SORT_OPTIONS = [
  { id: 'recently-played', label: 'Recently Played' },
  { id: 'recently-added', label: 'Recently Added' },
  { id: 'alphabetical', label: 'Alphabetical' },
  { id: 'running', label: 'Running First' }
]

export const GAME_LIBRARY_METADATA_BY_ID = {
  'chromagun-2': {
    category: 'Puzzle Shooter',
    installSizeLabel: '17.3 GB',
    memoryMb: 92,
    launchTag: 'Installed from Content Platform'
  },
  'code-vein-ii': {
    category: 'Action RPG',
    installSizeLabel: '38.6 GB',
    memoryMb: 108,
    launchTag: 'Installed from Content Platform'
  },
  'romeo-dead-man-v01': {
    category: 'Action',
    installSizeLabel: '29.1 GB',
    memoryMb: 104,
    launchTag: 'Installed from Content Platform'
  },
  'romeo-dead-man-v02': {
    category: 'Action',
    installSizeLabel: '29.1 GB',
    memoryMb: 104,
    launchTag: 'Installed from Content Platform'
  },
  'crisol-theater-of-idols': {
    category: 'Horror Action',
    installSizeLabel: '41.8 GB',
    memoryMb: 110,
    launchTag: 'ROG Recommendation'
  },
  'nrg-rog-visual-1': {
    category: 'Collaboration',
    installSizeLabel: '2.4 GB',
    memoryMb: 64,
    launchTag: 'ROG Recommendation'
  },
  'vampire-bloodlines-2': {
    category: 'RPG',
    installSizeLabel: '46.2 GB',
    memoryMb: 112,
    launchTag: 'ROG Recommendation'
  },
  'silent-hill-f': {
    category: 'Horror',
    installSizeLabel: '51.4 GB',
    memoryMb: 118,
    launchTag: 'ROG Recommendation'
  }
}

export function formatGameLibraryTime(timestamp) {
  if (!timestamp) return 'Never played'

  try {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMinutes = Math.round((now - date) / (1000 * 60))

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes} min ago`

    const diffHours = Math.round(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours} hr ago`

    const diffDays = Math.round(diffHours / 24)
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  } catch (error) {
    return 'Never played'
  }
}

export function formatGameLibraryPlaytime(totalMinutes = 0) {
  const safeMinutes = Math.max(0, Math.round(Number(totalMinutes) || 0))
  if (safeMinutes < 60) return `${safeMinutes}m played`

  const hours = Math.floor(safeMinutes / 60)
  const minutes = safeMinutes % 60
  if (minutes === 0) return `${hours}h played`
  return `${hours}h ${minutes}m played`
}
