export const ARMOURY_FEATURE_LIBRARY_STORAGE_KEY = 'jezos_armoury_feature_library_state'

export const DEFAULT_ARMOURY_FEATURE_LIBRARY_STATE = {
  modules: {
    'playground-core': 'installed',
    'aura-wallpaper': 'available',
    assistant: 'installed',
    'content-service': 'installed'
  }
}

export const FEATURE_LIBRARY_SELECT_OPTIONS = [
  { id: 'all', label: 'All Features' },
  { id: 'installed', label: 'Installed' },
  { id: 'available', label: 'Available To Install' }
]

export const FEATURE_LIBRARY_CARDS = [
  {
    id: 'playground',
    title: 'Playground',
    summary:
      'Discover limitless creativity with our extensive RGB lighting effects. To unlock and enjoy these features, install the required feature libraries first.',
    featureList: ['Aura Sync', 'AniMe Vision'],
    rows: [
      {
        id: 'playground-core',
        title: 'Playground Core',
        description: 'Install the Playground core components to activate a vibrant RGB lighting experience.'
      },
      {
        id: 'aura-wallpaper',
        title: 'Aura Wallpaper',
        description:
          'Download the vivid, dynamic Aura Wallpaper to create the ultimate immersive experience and showcase your personal style.',
        requires: 'playground-core'
      }
    ]
  },
  {
    id: 'assistant',
    title: 'Assistant',
    summary: 'Provides a wide range of personalized app/game/data management features for a more productive lifestyle.',
    featureList: ['Scenario Profiles', 'Game Library', 'Game Visual', 'Macro', 'Tools', 'Fan Xpert'],
    bundleModuleId: 'assistant'
  },
  {
    id: 'content-service',
    title: 'Content Service',
    summary: 'Tons of rich content for your exploration!',
    featureList: ['Content Platform', 'Promotion'],
    bundleModuleId: 'content-service'
  }
]

function sanitizeModuleState(modules) {
  const normalizedModules = {
    ...DEFAULT_ARMOURY_FEATURE_LIBRARY_STATE.modules,
    ...(modules && typeof modules === 'object' ? modules : {})
  }

  if (!['installed', 'available'].includes(normalizedModules['playground-core'])) {
    normalizedModules['playground-core'] = DEFAULT_ARMOURY_FEATURE_LIBRARY_STATE.modules['playground-core']
  }

  if (!['installed', 'available'].includes(normalizedModules['aura-wallpaper'])) {
    normalizedModules['aura-wallpaper'] = DEFAULT_ARMOURY_FEATURE_LIBRARY_STATE.modules['aura-wallpaper']
  }

  if (!['installed', 'available'].includes(normalizedModules.assistant)) {
    normalizedModules.assistant = DEFAULT_ARMOURY_FEATURE_LIBRARY_STATE.modules.assistant
  }

  if (!['installed', 'available'].includes(normalizedModules['content-service'])) {
    normalizedModules['content-service'] = DEFAULT_ARMOURY_FEATURE_LIBRARY_STATE.modules['content-service']
  }

  if (normalizedModules['playground-core'] !== 'installed') {
    normalizedModules['aura-wallpaper'] = 'available'
  }

  return normalizedModules
}

export function loadArmouryFeatureLibraryState() {
  if (typeof window === 'undefined') return DEFAULT_ARMOURY_FEATURE_LIBRARY_STATE

  try {
    const rawValue = window.localStorage.getItem(ARMOURY_FEATURE_LIBRARY_STORAGE_KEY)
    if (!rawValue) return DEFAULT_ARMOURY_FEATURE_LIBRARY_STATE

    const parsed = JSON.parse(rawValue)
    return {
      modules: sanitizeModuleState(parsed?.modules)
    }
  } catch (error) {
    return DEFAULT_ARMOURY_FEATURE_LIBRARY_STATE
  }
}

export function isFeatureModuleInstalled(featureLibraryState, moduleId) {
  return featureLibraryState?.modules?.[moduleId] === 'installed'
}

export function isArmouryNavVisible(navId, featureLibraryState) {
  if (['home', 'devices', 'feature-library', 'user-center', 'settings'].includes(navId)) return true
  if (navId === 'aura-sync') return isFeatureModuleInstalled(featureLibraryState, 'playground-core')
  if (['macros', 'scenario-profiles', 'game-library', 'display-settings'].includes(navId)) {
    return isFeatureModuleInstalled(featureLibraryState, 'assistant')
  }
  if (['content-platform', 'promotion'].includes(navId)) {
    return isFeatureModuleInstalled(featureLibraryState, 'content-service')
  }

  return false
}
