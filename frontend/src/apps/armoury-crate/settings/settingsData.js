import { isArmouryNavVisible, loadArmouryFeatureLibraryState } from '../feature-library/featureLibraryData.js'

export const ARMOURY_APP_SETTINGS_STORAGE_KEY = 'jezos_armoury_app_settings_state'

export const ARMOURY_SETTINGS_TABS = [
  { id: 'general', label: 'General' },
  { id: 'update-center', label: 'Update Center' },
  { id: 'about', label: 'About' }
]

export const ARMOURY_LAUNCH_PAGE_OPTIONS = [
  { id: 'home', label: 'Home' },
  { id: 'devices', label: 'Devices' },
  { id: 'aura-sync', label: 'Aura Sync' },
  { id: 'game-library', label: 'Game Library' },
  { id: 'content-platform', label: 'Content Platform' },
  { id: 'feature-library', label: 'Feature Library' },
  { id: 'user-center', label: 'User Center' },
  { id: 'settings', label: 'Settings' }
]

export const ARMOURY_THEME_GROUPS = [
  {
    id: 'dark-theme',
    label: 'Dark theme',
    options: [
      { id: 'dark-tuf', label: 'TUF GAMING', tone: 'tuf' },
      { id: 'dark-rog', label: 'ROG', tone: 'rog' },
      { id: 'dark-prime', label: 'ASUS PRIME', tone: 'prime' },
      { id: 'dark-proart', label: 'ProArt', tone: 'proart' }
    ]
  },
  {
    id: 'light-theme',
    label: 'Light theme',
    options: [{ id: 'light-rog', label: 'ROG', tone: 'light-rog' }]
  },
  {
    id: 'align-system',
    label: 'Align with system theme',
    options: [{ id: 'system-rog', label: 'ROG', tone: 'system-rog' }]
  }
]

export const ARMOURY_DEVICE_IMAGE_STYLE_OPTIONS = [
  {
    id: 'photographic',
    label: 'Photographic',
    description: 'Use the simulated product photo on the Armoury Crate home page.'
  },
  {
    id: 'sketch',
    label: 'Sketch',
    description: 'Use a wireframe-style preview instead of the product photo.'
  }
]

export const DEFAULT_ARMOURY_APP_SETTINGS_STATE = {
  activeTab: 'general',
  launchPage: 'home',
  themeId: 'dark-tuf',
  themePanelExpanded: true,
  deviceImagePanelExpanded: true,
  deviceImageStyle: 'photographic',
  deviceImageReloadToken: 0,
  lastCheckedAt: null,
  updates: [
    {
      id: 'armoury-crate-uwp',
      title: 'Armoury Crate UWP App',
      category: 'Application',
      currentVersion: '6.1.8.0',
      availableVersion: '6.2.0.0',
      status: 'available'
    },
    {
      id: 'armoury-service',
      title: 'Armoury Crate Service',
      category: 'Service',
      currentVersion: '5.7.11',
      availableVersion: '5.7.11',
      status: 'latest'
    },
    {
      id: 'aura-sdk',
      title: 'AURA SDK',
      category: 'Device Kit',
      currentVersion: '3.04.52',
      availableVersion: '3.05.00',
      status: 'available'
    },
    {
      id: 'asus-framework',
      title: 'ASUS System Control Interface',
      category: 'Driver',
      currentVersion: '3.1.33.0',
      availableVersion: '3.1.33.0',
      status: 'latest'
    }
  ],
  diagnosticsRecording: false,
  lastLogGeneratedAt: null
}

function sanitizeUpdates(value) {
  if (!Array.isArray(value)) return DEFAULT_ARMOURY_APP_SETTINGS_STATE.updates

  return value.map((item, index) => ({
    ...DEFAULT_ARMOURY_APP_SETTINGS_STATE.updates[index % DEFAULT_ARMOURY_APP_SETTINGS_STATE.updates.length],
    ...item
  }))
}

export function loadArmouryAppSettingsState() {
  if (typeof window === 'undefined') return DEFAULT_ARMOURY_APP_SETTINGS_STATE

  try {
    const rawValue = window.localStorage.getItem(ARMOURY_APP_SETTINGS_STORAGE_KEY)
    if (!rawValue) return DEFAULT_ARMOURY_APP_SETTINGS_STATE

    const parsed = JSON.parse(rawValue)
    return {
      ...DEFAULT_ARMOURY_APP_SETTINGS_STATE,
      ...parsed,
      activeTab: ARMOURY_SETTINGS_TABS.some((tab) => tab.id === parsed?.activeTab) ? parsed.activeTab : DEFAULT_ARMOURY_APP_SETTINGS_STATE.activeTab,
      launchPage: ARMOURY_LAUNCH_PAGE_OPTIONS.some((option) => option.id === parsed?.launchPage) ? parsed.launchPage : DEFAULT_ARMOURY_APP_SETTINGS_STATE.launchPage,
      themeId: ARMOURY_THEME_GROUPS.flatMap((group) => group.options).some((option) => option.id === parsed?.themeId) ? parsed.themeId : DEFAULT_ARMOURY_APP_SETTINGS_STATE.themeId,
      deviceImageStyle: ARMOURY_DEVICE_IMAGE_STYLE_OPTIONS.some((option) => option.id === parsed?.deviceImageStyle)
        ? parsed.deviceImageStyle
        : DEFAULT_ARMOURY_APP_SETTINGS_STATE.deviceImageStyle,
      updates: sanitizeUpdates(parsed?.updates)
    }
  } catch (error) {
    return DEFAULT_ARMOURY_APP_SETTINGS_STATE
  }
}

export function getInitialArmouryLaunchPage() {
  const featureLibraryState = loadArmouryFeatureLibraryState()
  const appSettingsState = loadArmouryAppSettingsState()
  return isArmouryNavVisible(appSettingsState.launchPage, featureLibraryState) ? appSettingsState.launchPage : 'home'
}

export function getResolvedArmouryThemeId(themeId) {
  if (themeId !== 'system-rog') return themeId

  if (typeof window === 'undefined') return 'dark-rog'

  const prefersLight = window.matchMedia?.('(prefers-color-scheme: light)')?.matches ?? false
  return prefersLight ? 'light-rog' : 'dark-rog'
}

export function formatUpdateCheckTime(value) {
  if (!value) return 'Never checked'

  try {
    return new Date(value).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  } catch (error) {
    return 'Never checked'
  }
}
