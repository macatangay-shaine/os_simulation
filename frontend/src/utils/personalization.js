export const DEFAULT_WALLPAPER_VALUE =
  'radial-gradient(circle at 20% 20%, #dbeafe, #bfdbfe 35%, #93c5fd 65%, #60a5fa)'

export const BUILTIN_WALLPAPER_OPTIONS = [
  {
    id: 'default',
    label: 'Blue Glow',
    value: DEFAULT_WALLPAPER_VALUE
  },
  {
    id: 'mountain-1',
    label: 'Mountain Dawn',
    value: "url('/wallpapers/sleep-mountain-1.svg')"
  },
  {
    id: 'mountain-2',
    label: 'Midnight Peaks',
    value: "url('/wallpapers/sleep-mountain-2.svg')"
  },
  {
    id: 'mountain-3',
    label: 'Blue Ridge',
    value: "url('/wallpapers/sleep-mountain-3.svg')"
  },
  {
    id: 'bloom-dark',
    label: 'Bloom Dark',
    value: "url('/wallpapers/windows-11-bloom-dark.jpg')",
    size: 'contain',
    position: 'center center',
    color: '#08111f'
  },
  {
    id: 'bloom-light',
    label: 'Bloom Light',
    value: "url('/wallpapers/windows-11-bloom-light.jpg')",
    size: 'contain',
    wideViewportSize: 'cover',
    wideViewportMinRatio: 1.95,
    position: 'center center',
    color: '#dce8f4'
  }
]

function getViewportRatio() {
  if (typeof window === 'undefined' || !window.innerWidth || !window.innerHeight) {
    return 16 / 9
  }

  return window.innerWidth / window.innerHeight
}

export function loadLocalUiSettingsBase() {
  return {
    theme: localStorage.getItem('jezos_theme') || 'light',
    accentColor: localStorage.getItem('jezos_accent') || '#2563eb',
    fontSize: localStorage.getItem('jezos_font_size') || 'medium',
    highContrast: localStorage.getItem('jezos_high_contrast') === 'true',
    wallpaperId: localStorage.getItem('jezos_wallpaper') || 'default'
  }
}

export function resolveWallpaperValue(wallpaperId) {
  const match = BUILTIN_WALLPAPER_OPTIONS.find((option) => option.id === wallpaperId)
  return match?.value || DEFAULT_WALLPAPER_VALUE
}

export function resolveWallpaperPresentation(wallpaperId) {
  const match = BUILTIN_WALLPAPER_OPTIONS.find((option) => option.id === wallpaperId)
  const viewportRatio = getViewportRatio()
  let size = match?.size || 'cover'

  if (match?.wideViewportSize && viewportRatio >= (match.wideViewportMinRatio || Infinity)) {
    size = match.wideViewportSize
  }

  return {
    size,
    position: match?.position || 'center',
    color: match?.color || 'transparent'
  }
}

export function loadResolvedUiSettings() {
  const baseSettings = loadLocalUiSettingsBase()
  const wallpaperPresentation = resolveWallpaperPresentation(baseSettings.wallpaperId)

  return {
    ...baseSettings,
    wallpaper: resolveWallpaperValue(baseSettings.wallpaperId),
    wallpaperSize: wallpaperPresentation.size,
    wallpaperPosition: wallpaperPresentation.position,
    wallpaperColor: wallpaperPresentation.color
  }
}
