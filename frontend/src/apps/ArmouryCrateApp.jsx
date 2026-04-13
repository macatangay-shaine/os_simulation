import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  AudioLines,
  BadgeHelp,
  BookOpenText,
  FolderKanban,
  Gamepad2,
  Grid2x2,
  House,
  LayoutGrid,
  Menu,
  MonitorCog,
  NotebookPen,
  PanelsTopLeft,
  Plus,
  Settings,
  Smartphone,
  Sparkles,
  SquareLibrary,
  UserRound,
  Volume2
} from 'lucide-react'
import ContentPlatformPage from './armoury-crate/content-platform/ContentPlatformPage.jsx'
import FeatureLibraryPage from './armoury-crate/feature-library/FeatureLibraryPage.jsx'
import {
  ARMOURY_FEATURE_LIBRARY_STORAGE_KEY,
  isArmouryNavVisible,
  loadArmouryFeatureLibraryState
} from './armoury-crate/feature-library/featureLibraryData.js'
import GameLibraryPage from './armoury-crate/game-library/GameLibraryPage.jsx'
import MacrosPage from './armoury-crate/macros/MacrosPage.jsx'
import PromotionPage from './armoury-crate/promotion/PromotionPage.jsx'
import SettingsPage from './armoury-crate/settings/SettingsPage.jsx'
import {
  ARMOURY_APP_SETTINGS_STORAGE_KEY,
  getInitialArmouryLaunchPage,
  getResolvedArmouryThemeId,
  loadArmouryAppSettingsState
} from './armoury-crate/settings/settingsData.js'
import UserCenterPage from './armoury-crate/user-center/UserCenterPage.jsx'
import { useSharedSystemMonitorData } from '../hooks/useSharedSystemMonitorData'
import '../styles/apps/armoury-crate.css'

const SIDEBAR_SECTIONS = [
  {
    label: null,
    items: [
      { id: 'home', label: 'Home', icon: House },
      { id: 'devices', label: 'Devices', icon: MonitorCog }
    ]
  },
  {
    label: 'Playground',
    items: [{ id: 'aura-sync', label: 'Aura Sync', icon: Sparkles }]
  },
  {
    label: 'Assistant',
    items: [
      { id: 'macros', label: 'Macros', icon: NotebookPen },
      { id: 'scenario-profiles', label: 'Scenario Profiles', icon: PanelsTopLeft },
      { id: 'game-library', label: 'Game Library', icon: Gamepad2 },
      { id: 'display-settings', label: 'Display Settings', icon: MonitorCog }
    ]
  },
  {
    label: 'Contents',
    items: [
      { id: 'content-platform', label: 'Content Platform', icon: SquareLibrary, hasAlert: true },
      { id: 'promotion', label: 'Promotion', icon: BadgeHelp }
    ]
  },
  {
    label: null,
    items: [
      { id: 'feature-library', label: 'Feature Library', icon: Grid2x2 },
      { id: 'user-center', label: 'User Center', icon: UserRound },
      { id: 'settings', label: 'Settings', icon: Settings, hasAlert: true }
    ],
    footer: true
  }
]

const MODE_ORDER = ['windows', 'silent', 'performance', 'turbo']
const HERO_IMAGE_PUBLIC_PATH = '/laptop_shadow_soft.png'
const ARMOURY_CRATE_LOGO_PUBLIC_PATH = '/armoury-crate-icon.png'
const DEVICE_TAB_DEFAULT = 'system-configuration'
const ARMOURY_DEVICE_SETTINGS_STORAGE_KEY = 'jezos_armoury_device_settings'
const ARMOURY_LIGHTING_STATE_STORAGE_KEY = 'jezos_armoury_lighting_state'
const ARMOURY_AUDIO_STATE_STORAGE_KEY = 'jezos_armoury_audio_state'
const ARMOURY_RESOURCE_MONITOR_STATE_STORAGE_KEY = 'jezos_armoury_resource_monitor_state'
const ARMOURY_AURA_SYNC_STATE_STORAGE_KEY = 'jezos_armoury_aura_sync_state'
const ARMOURY_SCENARIO_PROFILES_STORAGE_KEY = 'jezos_armoury_scenario_profiles_state'
const ARMOURY_DISPLAY_SETTINGS_STORAGE_KEY = 'jezos_armoury_display_settings_state'

const DEVICE_TABS = [
  { id: 'system-configuration', label: 'System Configuration' },
  { id: 'memory', label: 'Memory' },
  { id: 'gpu-performance', label: 'GPU Performance' },
  { id: 'lighting', label: 'Lighting' },
  { id: 'audio', label: 'Audio' },
  { id: 'resource-monitor', label: 'Resource Monitor' }
]

const AURA_SYNC_TABS = [
  { id: 'sync-devices', label: 'Sync devices' },
  { id: 'aura-effects', label: 'Aura Effects' },
  { id: 'ai-aura-lighting', label: 'AI Aura Lighting' }
]

const DEVICE_TAB_PLACEHOLDERS = {
  memory: {
    eyebrow: 'Memory',
    title: 'Memory settings will appear here.',
    body: 'This section keeps the same Armoury Crate shell and can adopt the current simulation architecture later.'
  },
  'gpu-performance': {
    eyebrow: 'GPU Performance',
    title: 'GPU performance controls will appear here.',
    body: 'The tab is wired and visually consistent without introducing a new backend path.'
  },
  lighting: {
    eyebrow: 'Lighting',
    title: 'Lighting controls will appear here.',
    body: 'Aura-related behavior stays untouched while this Devices page preserves the screenshot-driven layout.'
  },
  audio: {
    eyebrow: 'Audio',
    title: 'Audio settings will appear here.',
    body: 'The page structure is ready for the current project patterns if simulation state is needed later.'
  },
  'resource-monitor': {
    eyebrow: 'Resource Monitor',
    title: 'Resource monitoring tools will appear here.',
    body: 'This placeholder keeps the layout stable without changing routes or existing contracts.'
  }
}

const SYSTEM_CONFIGURATION_TILES = [
  { id: 'win-key', title: 'Win Key', icon: DeviceWinKeyIcon, accent: true },
  { id: 'touch-pad', title: 'Touch Pad', icon: DeviceTouchPadIcon, accent: true },
  {
    id: 'modern-standby',
    title: 'Modern Standby Assistant',
    description:
      'ASUS helps your system enter hibernate mode to save battery power. To avoid excessive battery drain, we will put the',
    icon: DeviceStandbyIcon,
    accent: true
  },
  {
    id: 'panel-power-saver',
    title: 'Panel Power Saver',
    description: 'Switch to a lower refresh rate to save power when your computer is on battery mode.',
    icon: DevicePanelPowerSaverIcon,
    accent: true
  }
]

const DEFAULT_DEVICE_SETTINGS = {
  'win-key': true,
  'touch-pad': true,
  'modern-standby': true,
  'panel-power-saver': true
}

const MODE_PRESETS = {
  windows: {
    label: 'Windows',
    icon: LayoutGrid,
    cpuFrequency: { value: 2864, min: 2710, max: 3010, unit: 'MHz', barMax: 4700 },
    cpuUsage: { value: 38, min: 31, max: 46, unit: '%', barMax: 100 },
    memoryFrequency: { value: 3200, unit: 'MT/s' },
    cpuTemperature: { value: 71, min: 68, max: 74, unit: 'deg C' },
    cpuVoltage: { value: 892, min: 865, max: 925, unit: 'mV' },
    gpuFrequency: { value: 965, min: 890, max: 1035, unit: 'MHz', barMax: 1600 },
    gpuUsage: { value: 24, min: 18, max: 33, unit: '%', barMax: 100 },
    gpuMemoryFrequency: { value: 7000, unit: 'MHz' },
    gpuTemperature: { value: 61, min: 58, max: 64, unit: 'deg C' },
    gpuVoltage: { value: 712, min: 690, max: 740, unit: 'mV' },
    cpuFan: { value: 2980, min: 2860, max: 3180, unit: 'RPM', barMax: 5600 },
    gpuFan: { value: 2890, min: 2760, max: 3090, unit: 'RPM', barMax: 5600 },
    fanAcoustics: { value: 25.8, min: 25.0, max: 26.6, unit: 'dBA' },
    storageUsed: { value: 291.9, unit: 'GB' },
    storageTotal: { value: 475.3, unit: 'GB' },
    ramUsed: { value: 6.8, min: 6.5, max: 7.1, unit: 'GB' },
    ramTotal: { value: 7.7, unit: 'GB' }
  },
  silent: {
    label: 'Silent',
    icon: AudioLines,
    cpuFrequency: { value: 2729, min: 2630, max: 2815, unit: 'MHz', barMax: 4700 },
    cpuUsage: { value: 31, min: 26, max: 35, unit: '%', barMax: 100 },
    memoryFrequency: { value: 3200, unit: 'MT/s' },
    cpuTemperature: { value: 69, min: 66, max: 71, unit: 'deg C' },
    cpuVoltage: { value: 842, min: 826, max: 856, unit: 'mV' },
    gpuFrequency: { label: 'Extreme Power Saving', barPercent: 0 },
    gpuUsage: { label: 'Extreme Power Saving', barPercent: 0 },
    gpuMemoryFrequency: { label: 'Extreme Power Saving' },
    gpuTemperature: { label: 'Extreme Power Saving' },
    gpuVoltage: { label: 'Extreme Power Saving' },
    cpuFan: { value: 2800, min: 2700, max: 2880, unit: 'RPM', barMax: 5600 },
    gpuFan: { value: 2700, min: 2590, max: 2780, unit: 'RPM', barMax: 5600 },
    fanAcoustics: { value: 24.1, min: 23.6, max: 24.7, unit: 'dBA' },
    storageUsed: { value: 291.9, unit: 'GB' },
    storageTotal: { value: 475.3, unit: 'GB' },
    ramUsed: { value: 7.0, min: 6.8, max: 7.2, unit: 'GB' },
    ramTotal: { value: 7.7, unit: 'GB' }
  },
  performance: {
    label: 'Performance',
    icon: Volume2,
    cpuFrequency: { value: 3520, min: 3380, max: 3650, unit: 'MHz', barMax: 4700 },
    cpuUsage: { value: 56, min: 49, max: 62, unit: '%', barMax: 100 },
    memoryFrequency: { value: 3200, unit: 'MT/s' },
    cpuTemperature: { value: 80, min: 77, max: 84, unit: 'deg C' },
    cpuVoltage: { value: 948, min: 930, max: 972, unit: 'mV' },
    gpuFrequency: { value: 1225, min: 1150, max: 1300, unit: 'MHz', barMax: 1600 },
    gpuUsage: { value: 49, min: 40, max: 58, unit: '%', barMax: 100 },
    gpuMemoryFrequency: { value: 7000, unit: 'MHz' },
    gpuTemperature: { value: 74, min: 71, max: 78, unit: 'deg C' },
    gpuVoltage: { value: 804, min: 780, max: 830, unit: 'mV' },
    cpuFan: { value: 3620, min: 3480, max: 3800, unit: 'RPM', barMax: 5600 },
    gpuFan: { value: 3470, min: 3320, max: 3620, unit: 'RPM', barMax: 5600 },
    fanAcoustics: { value: 30.8, min: 29.8, max: 31.8, unit: 'dBA' },
    storageUsed: { value: 291.9, unit: 'GB' },
    storageTotal: { value: 475.3, unit: 'GB' },
    ramUsed: { value: 7.2, min: 7.0, max: 7.4, unit: 'GB' },
    ramTotal: { value: 7.7, unit: 'GB' }
  },
  turbo: {
    label: 'Turbo',
    icon: Sparkles,
    cpuFrequency: { value: 4140, min: 4010, max: 4290, unit: 'MHz', barMax: 4700 },
    cpuUsage: { value: 78, min: 70, max: 88, unit: '%', barMax: 100 },
    memoryFrequency: { value: 3200, unit: 'MT/s' },
    cpuTemperature: { value: 91, min: 88, max: 95, unit: 'deg C' },
    cpuVoltage: { value: 1016, min: 992, max: 1045, unit: 'mV' },
    gpuFrequency: { value: 1515, min: 1450, max: 1585, unit: 'MHz', barMax: 1600 },
    gpuUsage: { value: 82, min: 72, max: 91, unit: '%', barMax: 100 },
    gpuMemoryFrequency: { value: 7000, unit: 'MHz' },
    gpuTemperature: { value: 83, min: 80, max: 87, unit: 'deg C' },
    gpuVoltage: { value: 892, min: 870, max: 920, unit: 'mV' },
    cpuFan: { value: 4580, min: 4380, max: 4780, unit: 'RPM', barMax: 5600 },
    gpuFan: { value: 4430, min: 4240, max: 4630, unit: 'RPM', barMax: 5600 },
    fanAcoustics: { value: 36.3, min: 35.0, max: 37.5, unit: 'dBA' },
    storageUsed: { value: 291.9, unit: 'GB' },
    storageTotal: { value: 475.3, unit: 'GB' },
    ramUsed: { value: 7.5, min: 7.3, max: 7.7, unit: 'GB' },
    ramTotal: { value: 7.7, unit: 'GB' }
  }
}

const STATIC_VALUE_KEYS = new Set(['memoryFrequency', 'gpuMemoryFrequency', 'storageUsed', 'storageTotal', 'ramTotal'])
const PLACEHOLDER_ROWS = ['--', '--', '--']
const DEFAULT_GPU_PERFORMANCE_STATE = {
  mode: 'eco',
  reminderNotificationsEnabled: true,
  statusMessage: 'The system is currently running in GPU-Eco mode.',
  modes: [
    {
      id: 'standard',
      title: 'Standard',
      summary:
        '[Windows Default] Also known as MSHybrid. Automatically switches to the discrete GPU for demanding applications, and the integrated graphics for everyday tasks.'
    },
    {
      id: 'eco',
      title: 'Eco Mode',
      summary:
        'The discrete GPU is completely disabled for maximum energy savings, lower temperatures, and less noise. You can still use essential apps through the integrated graphics simulation.'
    },
    {
      id: 'optimized',
      title: 'Optimized',
      summary:
        '[Recommended] Automatically switches to the discrete GPU for demanding applications, and the integrated graphics for lighter workloads.'
    }
  ],
  processes: [],
  updatedAt: null
}

const LIGHTING_EFFECTS = [
  { id: 'static', label: 'Static', icon: LightingStaticIcon },
  { id: 'breathing', label: 'Breathing', icon: LightingBreathingIcon },
  { id: 'strobing', label: 'Strobing', icon: LightingStrobingIcon },
  { id: 'color-cycle', label: 'Color Cycle', icon: LightingColorCycleIcon }
]

const AURA_BASIC_EFFECTS = [
  { id: 'static', label: 'Static', icon: AuraEffectStaticIcon, lightingEffect: 'static' },
  { id: 'breathing', label: 'Breathing', icon: AuraEffectBreathingIcon, lightingEffect: 'breathing' },
  { id: 'strobing', label: 'Strobing', icon: AuraEffectStrobingIcon, lightingEffect: 'strobing' },
  { id: 'color-cycle', label: 'Color Cycle', icon: AuraEffectColorCycleIcon, lightingEffect: 'color-cycle' },
  { id: 'rainbow', label: 'Rainbow', icon: AuraEffectRainbowIcon, lightingEffect: 'color-cycle' },
  { id: 'starry-night', label: 'Starry night', icon: AuraEffectStarryNightIcon, lightingEffect: 'breathing' },
  { id: 'music', label: 'Music', icon: AuraEffectMusicIcon, lightingEffect: 'strobing' },
  { id: 'smart', label: 'Smart', icon: AuraEffectSmartIcon, lightingEffect: 'breathing' },
  { id: 'adaptive-color', label: 'Adaptive Color', icon: AuraEffectAdaptiveColorIcon, lightingEffect: 'color-cycle' },
  { id: 'dark', label: 'Dark (Off)', icon: AuraEffectDarkIcon, lightingEffect: 'static' },
  { id: 'ai-aura-lighting', label: 'AI Aura Lighting', icon: AuraEffectAiLightingIcon, lightingEffect: 'color-cycle' }
]

const LIGHTING_COLOR_PRESETS = ['#f5f5f5', '#ffab1f', '#ff5757', '#68d4ff', '#7fe08d', '#c084fc']
const AURA_GRADIENT_COLOR_PRESETS = [
  ['#ff1a1a', '#1f1cff'],
  ['#ff8b1f', '#ffd966'],
  ['#68d4ff', '#7fe08d'],
  ['#a335ff', '#ff4d8d']
]
const AURA_GRADIENT_DIRECTIONS = [
  { id: 'horizontal', label: 'Horizontal' },
  { id: 'vertical', label: 'Vertical' },
  { id: 'diagonal', label: 'Diagonal' }
]
const AURA_ADVANCED_EFFECT_OPTIONS = ['Comet', 'Flash and Dash', 'Laser', 'Ripple', 'Meteor', 'Voltage']
const SCENARIO_PROFILE_MODE_OPTIONS = [
  { id: 'windows', label: 'Windows®' },
  { id: 'silent', label: 'Silent' },
  { id: 'performance', label: 'Performance' },
  { id: 'turbo', label: 'Turbo' }
]
const SCENARIO_GAME_VISUAL_OPTIONS = ['Default', 'Racing', 'Scenery', 'FPS', 'Cinema']
const DISPLAY_VISUAL_PRESETS = [
  {
    id: 'default',
    title: 'Default',
    description: 'Provides the best viewing experience for browsing photos and websites.',
    accent: '#f5a623'
  },
  {
    id: 'racing',
    title: 'Racing',
    description: 'Fine-tuned for fast-paced games.',
    accent: '#b7bcc7'
  },
  {
    id: 'scenery',
    title: 'Scenery',
    description: 'Fine-tunes brightness, contrast and saturation for more vibrant hues.',
    accent: '#9fb3c6'
  },
  {
    id: 'rts-rpg',
    title: 'RTS/RPG',
    description: 'Best for viewing gaming graphics with enhanced sharpness and color performance.',
    accent: '#b0a79d'
  },
  {
    id: 'fps',
    title: 'FPS',
    description: 'Enhances the visibility in dark scenes and makes it easier to spot your enemies.',
    accent: '#d3d7df'
  },
  {
    id: 'cinema',
    title: 'Cinema',
    description: 'Enhances contrast and color saturation to deliver livelier and more vivid visuals.',
    accent: '#a0a6ad'
  },
  {
    id: 'eyecare',
    title: 'Eyecare',
    description: 'Adjusts gamma, saturation and hue to reduce blue light during longer sessions.',
    accent: '#d8dadf'
  },
  {
    id: 'vivid',
    title: 'Vivid',
    description: 'Enhances color saturation and image brightness for punchier visuals.',
    accent: '#beb7b0'
  },
  {
    id: 'e-reading',
    title: 'E-Reading',
    description: 'Switches the display toward a softer reading profile to reduce eye strain.',
    accent: '#d9dde2'
  }
]

const DEFAULT_LIGHTING_STATE = {
  effect: 'static',
  color: '#f5f5f5',
  brightness: 33,
  settingsOpen: false
}

const AUDIO_MICROPHONE_MODES = [
  {
    id: 'directional',
    title: 'Directional Recording Mode',
    description:
      'Capture sound from one direction, while minimizing sound at the back. Ideal for streaming and gaming.'
  },
  {
    id: 'stereo',
    title: 'Stereo-enhanced Mode',
    description:
      'Record a wider soundscape using the left and right channels. Good for live music and other immersive experiences.'
  },
  {
    id: '360',
    title: '360° Recording Mode',
    description: 'Picks up sound from all directions equally. The best choice for general scenarios.'
  }
]

const AUDIO_CONFERENCE_MODES = [
  {
    id: 'single',
    title: 'Single-presenter Mode',
    description:
      'AI noise canceling that filters ambient noise and other voices, allowing only the voice of the person in front of the PC to be heard clearly.'
  },
  {
    id: 'multi',
    title: 'Multi-presenter Mode',
    description:
      'AI Noise Cancelation that filters ambient noise while identifying and clarifying multiple voices from varying directions and distances.'
  }
]

const DEFAULT_AUDIO_STATE = {
  microphoneEnabled: true,
  microphoneMode: 'directional',
  conferenceMode: 'single',
  conferenceLevel: 50,
  speakerEnabled: true,
  speakerLevel: 48
}

const RESOURCE_MONITOR_VIEW_OPTIONS = ['1 minute', '3 minutes', '5 minutes']
const RESOURCE_MONITOR_LEVEL_OPTIONS = ['Level 1', 'Level 2', 'Level 3']
const RESOURCE_MONITOR_DEFAULT_HISTORY = Array.from({ length: 60 }, () => 0)
const RESOURCE_MONITOR_FPS_APP_WEIGHTS = {
  'Web Browser': 1.15,
  Camera: 0.95,
  'App Store': 0.42,
  'System Monitor': 0.35,
  'Local Files': 0.28,
  Files: 0.24
}

const DEFAULT_RESOURCE_MONITOR_STATE = {
  monitorLevel: 'Level 1',
  gradientEffect: true,
  realtimeEnabled: true,
  view: '1 minute',
  logStorageLocation: 'C:\\Users\\Princess Shaira\\Desktop',
  recording: false
}

const DEFAULT_AURA_SYNC_STATE = {
  activeTab: 'sync-devices',
  performanceModeEnabled: false,
  performanceExpanded: false,
  performanceSmoothness: 1,
  hueBridgeConnected: false,
  lastHueScanAt: null,
  selectedEffect: 'static',
  colorMode: 'gradient',
  singleColor: '#5a575d',
  gradientColors: ['#ff1a1a', '#1f1cff'],
  gradientDirection: 'horizontal',
  advancedEffect: 'Comet',
  inGameLightingEnabled: false,
  inGameLightingCollapsed: true,
  aiProfile: 'adaptive',
  aiLoggedIn: false
}

const DEFAULT_SCENARIO_PROFILE_STATE = {
  profileName: 'Profile 1',
  linkedApps: [],
  appSelectorOpen: false,
  touchPadEnabled: true,
  batteryMode: 'windows',
  pluggedMode: 'performance',
  auraEffect: 'static',
  hostBrightness: 67,
  gameVisual: 'Default',
  clearCacheEnabled: true,
  lastSavedDraft: null,
  lastAppliedAt: null
}

const DEFAULT_DISPLAY_SETTINGS_STATE = {
  gameVisualEnabled: true,
  selectedPreset: 'default',
  colorTemperature: 50,
  osdEnabled: true,
  lastUserSelectionAt: null
}

const AURA_AI_LIGHTING_PROFILES = [
  {
    id: 'adaptive',
    title: 'Adaptive',
    description: 'Matches the current Armoury Crate operating mode and keeps the synced device in step with system mood.'
  },
  {
    id: 'focus',
    title: 'Focus',
    description: 'Keeps lighting stable and bright for clear visibility during work and study sessions.'
  },
  {
    id: 'pulse',
    title: 'Pulse',
    description: 'Adds stronger contrast and motion for gameplay, streaming, and higher activity workloads.'
  }
]

const DEFAULT_RESOURCE_MONITOR_RUNTIME = {
  fps: 0,
  history: RESOURCE_MONITOR_DEFAULT_HISTORY,
  timestamp: null,
  importedAt: null
}

function formatValue(metric) {
  if (metric.label) return metric.label
  if (typeof metric.value === 'number') {
    if (metric.unit === 'dBA') return `${metric.value.toFixed(1)} ${metric.unit}`
    return `${Math.round(metric.value)} ${metric.unit}`
  }
  return '--'
}

function formatStorage(used, total) {
  return `${used.value.toFixed(1)} / ${total.value.toFixed(1)} ${total.unit}`
}

function formatRam(used, total) {
  return `${used.value.toFixed(1)} / ${total.value.toFixed(1)} ${total.unit}`
}

function jitterMetric(metric) {
  if (metric.label || STATIC_VALUE_KEYS.has(metric.key) || metric.min == null || metric.max == null) return metric.value
  return metric.min + Math.random() * (metric.max - metric.min)
}

function createTelemetrySnapshot(mode) {
  const preset = MODE_PRESETS[mode]
  const buildMetric = (name, metric) =>
    metric.label ? { ...metric, key: name } : { ...metric, key: name, value: jitterMetric({ ...metric, key: name }) }

  return {
    cpuFrequency: buildMetric('cpuFrequency', preset.cpuFrequency),
    cpuUsage: buildMetric('cpuUsage', preset.cpuUsage),
    memoryFrequency: { ...preset.memoryFrequency, key: 'memoryFrequency' },
    cpuTemperature: buildMetric('cpuTemperature', preset.cpuTemperature),
    cpuVoltage: buildMetric('cpuVoltage', preset.cpuVoltage),
    gpuFrequency: buildMetric('gpuFrequency', preset.gpuFrequency),
    gpuUsage: buildMetric('gpuUsage', preset.gpuUsage),
    gpuMemoryFrequency: { ...preset.gpuMemoryFrequency, key: 'gpuMemoryFrequency' },
    gpuTemperature: buildMetric('gpuTemperature', preset.gpuTemperature),
    gpuVoltage: buildMetric('gpuVoltage', preset.gpuVoltage),
    cpuFan: buildMetric('cpuFan', preset.cpuFan),
    gpuFan: buildMetric('gpuFan', preset.gpuFan),
    fanAcoustics: buildMetric('fanAcoustics', preset.fanAcoustics),
    storageUsed: { ...preset.storageUsed, key: 'storageUsed' },
    storageTotal: { ...preset.storageTotal, key: 'storageTotal' },
    ramUsed: buildMetric('ramUsed', preset.ramUsed),
    ramTotal: { ...preset.ramTotal, key: 'ramTotal' }
  }
}

function getBarPercent(metric) {
  if (typeof metric.barPercent === 'number') return metric.barPercent
  if (metric.label) return 0
  if (typeof metric.value !== 'number' || typeof metric.barMax !== 'number' || metric.barMax <= 0) return 0
  return Math.max(0, Math.min(100, (metric.value / metric.barMax) * 100))
}

function clampValue(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value))
}

function computeResourceMonitorWorkload(processes) {
  return processes.reduce((total, process) => total + (RESOURCE_MONITOR_FPS_APP_WEIGHTS[process.app] || 0), 0)
}

function deriveResourceMonitorFps({ cpuUsage = 0, memoryPercent = 0, processCount = 0, workload = 0, monitorLevel = 'Level 1' }) {
  if (workload < 1.1) return 0

  const levelBonusMap = {
    'Level 1': 0,
    'Level 2': 2,
    'Level 3': 4
  }

  const rawEstimate =
    workload * 7 -
    cpuUsage * 0.08 -
    memoryPercent * 0.04 -
    processCount * 0.3 +
    (Math.random() * 2 - 1) +
    (levelBonusMap[monitorLevel] || 0)

  return Math.round(clampValue(rawEstimate, 0, 18))
}

function deriveResourceMonitorGraphValue({
  cpuUsage = 0,
  memoryPercent = 0,
  processCount = 0,
  workload = 0,
  monitorLevel = 'Level 1',
  previousCpuUsage = cpuUsage,
  previousValue = 0
}) {
  const levelMultiplierMap = {
    'Level 1': 1,
    'Level 2': 1.14,
    'Level 3': 1.28
  }

  const deltaCpu = Math.abs(cpuUsage - previousCpuUsage)
  const levelMultiplier = levelMultiplierMap[monitorLevel] || 1
  const baseActivity = workload * 0.95 + cpuUsage * 0.035 + memoryPercent * 0.012 + processCount * 0.045
  const decay = previousValue > 0.2 ? previousValue * (previousValue > 8 ? 0.58 : previousValue > 4 ? 0.68 : 0.78) : 0
  const floor = baseActivity > 1.2 ? 0.2 + Math.random() * 0.5 : 0
  const spikeChance = clampValue(0.08 + workload * 0.05 + deltaCpu * 0.018, 0.08, 0.42)
  const spikeHeight =
    Math.random() < spikeChance
      ? 1.6 + Math.random() * 7.4 + Math.min(deltaCpu * 0.4, 4.4)
      : 0

  const nextValue = Math.max(decay, floor) + spikeHeight
  return Number(clampValue(nextValue * levelMultiplier, 0, 14).toFixed(2))
}

function createResourceMonitorSeries(history, maxValue = 14, amplitudePercent = 94) {
  const points = (history || []).map((value, index) => {
    const x = history.length <= 1 ? 0 : (index / (history.length - 1)) * 100
    const safeValue = clampValue(value || 0, 0, maxValue)
    const y = 100 - (safeValue / maxValue) * amplitudePercent
    return `${x},${y}`
  })

  return points.join(' ')
}

export default function ArmouryCrateApp({ onWindowTitleChange }) {
  const [activeNav, setActiveNav] = useState(() => getInitialArmouryLaunchPage())
  const [activeMode, setActiveMode] = useState('silent')
  const [startupStage, setStartupStage] = useState('trace')
  const [telemetry, setTelemetry] = useState(() => createTelemetrySnapshot('silent'))
  const [activeDeviceTab, setActiveDeviceTab] = useState(DEVICE_TAB_DEFAULT)
  const [selectedMemoryPids, setSelectedMemoryPids] = useState([])
  const [isMemoryFreeingUp, setIsMemoryFreeingUp] = useState(false)
  const [gpuPerformanceState, setGpuPerformanceState] = useState(DEFAULT_GPU_PERFORMANCE_STATE)
  const [isGpuPerformanceLoading, setIsGpuPerformanceLoading] = useState(false)
  const [isGpuPerformanceSaving, setIsGpuPerformanceSaving] = useState(false)
  const [isGpuStoppingAll, setIsGpuStoppingAll] = useState(false)
  const [isGpuProcessCollapsed, setIsGpuProcessCollapsed] = useState(false)
  const [homeStorageInfo, setHomeStorageInfo] = useState(null)
  const [deviceSettings, setDeviceSettings] = useState(() => loadArmouryDeviceSettings())
  const [lightingState, setLightingState] = useState(() => loadArmouryLightingState())
  const [audioState, setAudioState] = useState(() => loadArmouryAudioState())
  const [resourceMonitorState, setResourceMonitorState] = useState(() => loadArmouryResourceMonitorState())
  const [featureLibraryState, setFeatureLibraryState] = useState(() => loadArmouryFeatureLibraryState())
  const [featureLibraryOperations, setFeatureLibraryOperations] = useState({})
  const [appSettingsState, setAppSettingsState] = useState(() => loadArmouryAppSettingsState())
  const [auraSyncState, setAuraSyncState] = useState(() => loadArmouryAuraSyncState())
  const [scenarioProfileState, setScenarioProfileState] = useState(() => loadArmouryScenarioProfileState())
  const [displaySettingsState, setDisplaySettingsState] = useState(() => loadArmouryDisplaySettingsState())
  const [scenarioAvailableApps, setScenarioAvailableApps] = useState([])
  const [isScenarioAppsLoading, setIsScenarioAppsLoading] = useState(false)
  const [isScenarioSaving, setIsScenarioSaving] = useState(false)
  const [resourceMonitorRuntime, setResourceMonitorRuntime] = useState(DEFAULT_RESOURCE_MONITOR_RUNTIME)
  const featureLibraryTimeoutsRef = useRef(new Map())
  const visibleSidebarSections = SIDEBAR_SECTIONS
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => isArmouryNavVisible(item.id, featureLibraryState))
    }))
    .filter((section) => section.items.length > 0)
  const shouldUseSharedSystemData =
    activeNav === 'home' ||
    activeNav === 'game-library' ||
    activeNav === 'display-settings' ||
    (activeNav === 'devices' && ['memory', 'resource-monitor'].includes(activeDeviceTab))
  const sharedSystemPollInterval = activeNav === 'devices' && activeDeviceTab === 'resource-monitor' ? 950 : 2000
  const {
    processes: sharedProcesses,
    systemStats,
    performanceHistory,
    hasLoaded: hasSharedSystemData,
    isLoading: isSharedSystemDataLoading,
    refresh: refreshSharedSystemData
  } = useSharedSystemMonitorData({
    enabled: shouldUseSharedSystemData,
    intervalMs: sharedSystemPollInterval
  })
  const runningProcesses = sharedProcesses.filter((process) => process.state === 'running')
  const memoryProcesses = runningProcesses
  const memoryResources = {
    maxMemory: systemStats.totalMemory,
    usedMemory: systemStats.usedMemory,
    availableMemory: systemStats.availableMemory,
    memoryUsagePercent: systemStats.memoryUsagePercent,
    processCount: systemStats.processCount
  }
  const isMemoryLoading = activeNav === 'devices' && activeDeviceTab === 'memory' && !hasSharedSystemData && isSharedSystemDataLoading
  const isResourceMonitorLoading =
    activeNav === 'devices' && activeDeviceTab === 'resource-monitor' && !hasSharedSystemData && isSharedSystemDataLoading

  useEffect(() => {
    onWindowTitleChange?.('Armoury Crate')
  }, [onWindowTitleChange])

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
    const revealDelay = prefersReducedMotion ? 60 : 1220
    const fadeDelay = prefersReducedMotion ? 380 : 2040
    const doneDelay = prefersReducedMotion ? 620 : 2320

    const revealTimer = window.setTimeout(() => setStartupStage('reveal'), revealDelay)
    const fadeTimer = window.setTimeout(() => setStartupStage('fade'), fadeDelay)
    const doneTimer = window.setTimeout(() => setStartupStage('done'), doneDelay)

    return () => {
      window.clearTimeout(revealTimer)
      window.clearTimeout(fadeTimer)
      window.clearTimeout(doneTimer)
    }
  }, [])

  useEffect(() => {
    setTelemetry(createTelemetrySnapshot(activeMode))
    const intervalId = window.setInterval(() => setTelemetry(createTelemetrySnapshot(activeMode)), 1800)
    return () => window.clearInterval(intervalId)
  }, [activeMode])

  useEffect(() => {
    localStorage.setItem(ARMOURY_DEVICE_SETTINGS_STORAGE_KEY, JSON.stringify(deviceSettings))
    window.dispatchEvent(new CustomEvent('jezos_armoury_device_settings_updated', { detail: deviceSettings }))
  }, [deviceSettings])

  useEffect(() => {
    localStorage.setItem(ARMOURY_LIGHTING_STATE_STORAGE_KEY, JSON.stringify(lightingState))
  }, [lightingState])

  useEffect(() => {
    localStorage.setItem(ARMOURY_AUDIO_STATE_STORAGE_KEY, JSON.stringify(audioState))
  }, [audioState])

  useEffect(() => {
    localStorage.setItem(ARMOURY_RESOURCE_MONITOR_STATE_STORAGE_KEY, JSON.stringify(resourceMonitorState))
  }, [resourceMonitorState])

  useEffect(() => {
    localStorage.setItem(ARMOURY_FEATURE_LIBRARY_STORAGE_KEY, JSON.stringify(featureLibraryState))
    window.dispatchEvent(new CustomEvent('jezos_armoury_feature_library_updated', { detail: featureLibraryState }))
  }, [featureLibraryState])

  useEffect(() => {
    localStorage.setItem(ARMOURY_APP_SETTINGS_STORAGE_KEY, JSON.stringify(appSettingsState))
    window.dispatchEvent(new CustomEvent('jezos_armoury_app_settings_updated', { detail: appSettingsState }))
  }, [appSettingsState])

  useEffect(() => {
    localStorage.setItem(ARMOURY_AURA_SYNC_STATE_STORAGE_KEY, JSON.stringify(auraSyncState))
  }, [auraSyncState])

  useEffect(() => {
    localStorage.setItem(ARMOURY_SCENARIO_PROFILES_STORAGE_KEY, JSON.stringify(scenarioProfileState))
  }, [scenarioProfileState])

  useEffect(() => {
    localStorage.setItem(ARMOURY_DISPLAY_SETTINGS_STORAGE_KEY, JSON.stringify(displaySettingsState))
    window.dispatchEvent(new CustomEvent('jezos_armoury_display_settings_updated', { detail: displaySettingsState }))
  }, [displaySettingsState])

  useEffect(() => {
    setSelectedMemoryPids((previous) =>
      previous.filter((pid) => runningProcesses.some((process) => process.pid === pid))
    )
  }, [sharedProcesses])

  useEffect(
    () => () => {
      featureLibraryTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
      featureLibraryTimeoutsRef.current.clear()
    },
    []
  )

  useEffect(() => {
    if (isArmouryNavVisible(activeNav, featureLibraryState)) return
    setActiveNav('feature-library')
  }, [activeNav, featureLibraryState])

  useEffect(() => {
    if (activeNav !== 'home') return undefined

    let cancelled = false

    const loadStorageInfo = async () => {
      try {
        const response = await fetch('http://localhost:8000/system/storage')
        if (!response.ok) return

        const data = await response.json()
        if (cancelled) return

        setHomeStorageInfo({
          totalMb: Math.round((Number(data.total_capacity_bytes) || 0) / (1024 * 1024)),
          usedMb: Math.round((Number(data.used_bytes) || 0) / (1024 * 1024)),
          usagePercent: Number(data.usage_percent) || 0
        })
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load Armoury Crate storage data:', error)
        }
      }
    }

    loadStorageInfo()
    const intervalId = window.setInterval(loadStorageInfo, 10000)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [activeNav])

  useEffect(() => {
    const shouldLoadGpuState =
      activeNav === 'home' || activeNav === 'display-settings' || (activeNav === 'devices' && activeDeviceTab === 'gpu-performance')
    if (!shouldLoadGpuState) return undefined

    let cancelled = false

    const loadGpuPerformanceState = async (showLoadingState) => {
      if (showLoadingState) setIsGpuPerformanceLoading(true)

      try {
        const response = await fetch('http://localhost:8000/system/gpu-performance')
        if (!response.ok) return

        const data = await response.json()
        if (!cancelled) {
          setGpuPerformanceState({
            ...DEFAULT_GPU_PERFORMANCE_STATE,
            ...data
          })
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load Armoury Crate GPU performance data:', error)
        }
      } finally {
        if (!cancelled) setIsGpuPerformanceLoading(false)
      }
    }

    loadGpuPerformanceState(gpuPerformanceState.updatedAt == null)
    const intervalId = window.setInterval(() => loadGpuPerformanceState(false), 3000)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [activeNav, activeDeviceTab])

  useEffect(() => {
    if (activeNav !== 'devices' || activeDeviceTab !== 'resource-monitor') return undefined
    if (!hasSharedSystemData) return undefined

    const workload = computeResourceMonitorWorkload(runningProcesses)

    setResourceMonitorRuntime((previous) => ({
      ...previous,
      fps: resourceMonitorState.realtimeEnabled
        ? deriveResourceMonitorFps({
            cpuUsage: systemStats.cpuUsage,
            memoryPercent: systemStats.memoryUsagePercent,
            processCount: systemStats.processCount,
            workload,
            monitorLevel: resourceMonitorState.monitorLevel
          })
        : previous.fps,
      history:
        previous.timestamp == null && performanceHistory.length > 0
          ? [
              ...RESOURCE_MONITOR_DEFAULT_HISTORY,
              ...performanceHistory.slice(-18).reduce((values, snapshot, index, items) => {
                values.push(
                  deriveResourceMonitorGraphValue({
                    cpuUsage: snapshot.cpu_usage,
                    previousCpuUsage: items[Math.max(index - 1, 0)]?.cpu_usage ?? snapshot.cpu_usage,
                    memoryPercent: snapshot.memory_percent,
                    processCount: snapshot.process_count,
                    workload,
                    monitorLevel: resourceMonitorState.monitorLevel,
                    previousValue: values.at(-1) ?? 0
                  })
                )
                return values
              }, [])
            ].slice(-60)
          : [
              ...previous.history.slice(1),
              deriveResourceMonitorGraphValue({
                cpuUsage: systemStats.cpuUsage,
                previousCpuUsage: performanceHistory.at(-2)?.cpu_usage ?? systemStats.cpuUsage,
                memoryPercent: systemStats.memoryUsagePercent,
                processCount: systemStats.processCount,
                workload,
                monitorLevel: resourceMonitorState.monitorLevel,
                previousValue: previous.history.at(-1) ?? 0
              })
            ],
      timestamp: systemStats.timestamp || new Date().toISOString()
    }))

    return undefined
  }, [
    activeNav,
    activeDeviceTab,
    hasSharedSystemData,
    performanceHistory,
    resourceMonitorState.monitorLevel,
    resourceMonitorState.realtimeEnabled,
    sharedProcesses,
    systemStats.cpuUsage,
    systemStats.memoryUsagePercent,
    systemStats.processCount,
    systemStats.timestamp
  ])

  useEffect(() => {
    if (activeNav !== 'scenario-profiles') return undefined

    let cancelled = false

    const loadScenarioApps = async (showLoadingState) => {
      if (showLoadingState) setIsScenarioAppsLoading(true)

      try {
        const response = await fetch('http://localhost:8000/process/list')
        if (!response.ok) return

        const processData = await response.json()
        if (cancelled) return

        const linkedApps = [...new Set(
          processData
            .filter((process) => process.state === 'running' && process.app)
            .map((process) => process.app)
        )].sort((left, right) => left.localeCompare(right))

        setScenarioAvailableApps(linkedApps)
        setScenarioProfileState((previous) => ({
          ...previous,
          linkedApps: previous.linkedApps.filter((app) => linkedApps.includes(app))
        }))
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load Armoury Crate scenario profile apps:', error)
        }
      } finally {
        if (!cancelled) setIsScenarioAppsLoading(false)
      }
    }

    loadScenarioApps(scenarioAvailableApps.length === 0)
    const intervalId = window.setInterval(() => loadScenarioApps(false), 4000)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [activeNav])

  function handleNavSelect(itemId) {
    if (!isArmouryNavVisible(itemId, featureLibraryState)) return
    setActiveNav(itemId)
    if (itemId === 'devices') setActiveDeviceTab(DEVICE_TAB_DEFAULT)
  }

  function toggleFeatureLibraryModule(moduleId) {
    if (featureLibraryOperations[moduleId]) return
    if (moduleId === 'aura-wallpaper' && featureLibraryState.modules['playground-core'] !== 'installed') return

    const isInstalling = featureLibraryState.modules[moduleId] !== 'installed'
    const nextOperations = {
      [moduleId]: isInstalling ? 'installing' : 'removing'
    }

    if (!isInstalling && moduleId === 'playground-core' && featureLibraryState.modules['aura-wallpaper'] === 'installed') {
      nextOperations['aura-wallpaper'] = 'removing'
    }

    setFeatureLibraryOperations((previous) => ({
      ...previous,
      ...nextOperations
    }))

    const timeoutId = window.setTimeout(() => {
      setFeatureLibraryState((previous) => {
        const nextModules = { ...previous.modules }

        if (isInstalling) {
          nextModules[moduleId] = 'installed'
        } else {
          nextModules[moduleId] = 'available'

          if (moduleId === 'playground-core') {
            nextModules['aura-wallpaper'] = 'available'
          }
        }

        return {
          ...previous,
          modules: nextModules
        }
      })

      setFeatureLibraryOperations((previous) => {
        const nextState = { ...previous }
        Object.keys(nextOperations).forEach((operationKey) => {
          delete nextState[operationKey]
        })
        return nextState
      })

      featureLibraryTimeoutsRef.current.delete(moduleId)
    }, isInstalling ? 1180 : 980)

    featureLibraryTimeoutsRef.current.set(moduleId, timeoutId)
  }

  function updateAppSettingsState(updater) {
    setAppSettingsState((previous) => ({
      ...previous,
      ...(typeof updater === 'function' ? updater(previous) : updater)
    }))
  }

  async function refreshMemoryProcesses() {
    if (activeNav !== 'devices' || activeDeviceTab !== 'memory') return

    try {
      await refreshSharedSystemData()
    } catch (error) {
      console.error('Failed to refresh Armoury Crate memory data:', error)
    }
  }

  function toggleMemoryProcessGroup(pids) {
    setSelectedMemoryPids((previous) => {
      const everySelected = pids.every((pid) => previous.includes(pid))
      if (everySelected) {
        return previous.filter((pid) => !pids.includes(pid))
      }

      const next = new Set(previous)
      pids.forEach((pid) => next.add(pid))
      return [...next]
    })
  }

  function toggleAllMemoryProcesses() {
    const visiblePids = memoryProcesses.map((process) => process.pid)

    setSelectedMemoryPids((previous) =>
      previous.length === visiblePids.length ? [] : visiblePids
    )
  }

  async function freeUpMemoryProcesses() {
    if (selectedMemoryPids.length === 0 || isMemoryFreeingUp) return

    setIsMemoryFreeingUp(true)
    try {
      const results = await Promise.allSettled(
        selectedMemoryPids.map(async (pid) => {
          const response = await fetch(`http://localhost:8000/process/kill?pid=${pid}`, { method: 'POST' })
          if (!response.ok) throw new Error(`Failed to terminate PID ${pid}`)
          return pid
        })
      )

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          window.dispatchEvent(new CustomEvent('process-terminated', { detail: { pid: result.value } }))
        }
      })

      setSelectedMemoryPids([])
      await refreshMemoryProcesses()
    } catch (error) {
      console.error('Failed to free up selected Armoury Crate processes:', error)
    } finally {
      setIsMemoryFreeingUp(false)
    }
  }

  async function refreshGpuPerformanceState(showLoadingState = true) {
    if (activeNav !== 'devices' || activeDeviceTab !== 'gpu-performance') return

    if (showLoadingState) setIsGpuPerformanceLoading(true)
    try {
      const response = await fetch('http://localhost:8000/system/gpu-performance')
      if (!response.ok) return

      const data = await response.json()
      setGpuPerformanceState({
        ...DEFAULT_GPU_PERFORMANCE_STATE,
        ...data
      })
    } catch (error) {
      console.error('Failed to refresh Armoury Crate GPU performance data:', error)
    } finally {
      if (showLoadingState) setIsGpuPerformanceLoading(false)
    }
  }

  async function updateGpuPerformanceMode(modeId) {
    if (modeId === gpuPerformanceState.mode || isGpuPerformanceSaving) return

    setIsGpuPerformanceSaving(true)
    try {
      const response = await fetch('http://localhost:8000/system/gpu-performance/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: modeId })
      })

      if (!response.ok) return

      const data = await response.json()
      setGpuPerformanceState({
        ...DEFAULT_GPU_PERFORMANCE_STATE,
        ...data
      })
    } catch (error) {
      console.error('Failed to update Armoury Crate GPU mode:', error)
    } finally {
      setIsGpuPerformanceSaving(false)
    }
  }

  async function toggleGpuReminderNotifications() {
    if (isGpuPerformanceSaving) return

    setIsGpuPerformanceSaving(true)
    try {
      const response = await fetch('http://localhost:8000/system/gpu-performance/reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !gpuPerformanceState.reminderNotificationsEnabled })
      })

      if (!response.ok) return

      const data = await response.json()
      setGpuPerformanceState({
        ...DEFAULT_GPU_PERFORMANCE_STATE,
        ...data
      })
    } catch (error) {
      console.error('Failed to update Armoury Crate GPU reminder setting:', error)
    } finally {
      setIsGpuPerformanceSaving(false)
    }
  }

  async function stopAllGpuProcesses() {
    if (isGpuStoppingAll) return

    setIsGpuStoppingAll(true)
    try {
      const response = await fetch('http://localhost:8000/system/gpu-performance/stop-all', {
        method: 'POST'
      })

      if (!response.ok) return

      const data = await response.json()
      const nextState = {
        ...DEFAULT_GPU_PERFORMANCE_STATE,
        ...(data.state || {})
      }

      setGpuPerformanceState(nextState)

      if (Array.isArray(data.stoppedPids)) {
        data.stoppedPids.forEach((pid) => {
          window.dispatchEvent(new CustomEvent('process-terminated', { detail: { pid } }))
        })
      }

      await refreshSharedSystemData()
    } catch (error) {
      console.error('Failed to stop Armoury Crate GPU processes:', error)
    } finally {
      setIsGpuStoppingAll(false)
    }
  }

  function toggleDeviceSetting(settingId) {
    setDeviceSettings((previous) => ({
      ...previous,
      [settingId]: !previous[settingId]
    }))
  }

  function updateLightingState(updater) {
    setLightingState((previous) => ({
      ...previous,
      ...(typeof updater === 'function' ? updater(previous) : updater)
    }))
  }

  function updateAudioState(updater) {
    setAudioState((previous) => ({
      ...previous,
      ...(typeof updater === 'function' ? updater(previous) : updater)
    }))
  }

  function updateAuraSyncState(updater) {
    setAuraSyncState((previous) => ({
      ...previous,
      ...(typeof updater === 'function' ? updater(previous) : updater)
    }))
  }

  function updateScenarioProfileState(updater) {
    setScenarioProfileState((previous) => ({
      ...previous,
      ...(typeof updater === 'function' ? updater(previous) : updater)
    }))
  }

  function markScenarioProfileSaved() {
    setScenarioProfileState((previous) => ({
      ...previous,
      lastSavedDraft: createScenarioProfileDraft(previous)
    }))
  }

  async function saveScenarioProfile({ apply = false } = {}) {
    if (isScenarioSaving) return

    setIsScenarioSaving(true)
    try {
      if (apply) {
        setDeviceSettings((previous) => ({
          ...previous,
          'touch-pad': scenarioProfileState.touchPadEnabled
        }))
        setDisplaySettingsState((previous) => ({
          ...previous,
          gameVisualEnabled: true,
          selectedPreset: mapScenarioGameVisualToDisplayPreset(scenarioProfileState.gameVisual),
          lastUserSelectionAt: new Date().toISOString()
        }))
        setActiveMode(scenarioProfileState.pluggedMode)
        setLightingState((previous) => ({
          ...previous,
          effect: mapScenarioAuraEffectToLightingEffect(scenarioProfileState.auraEffect),
          brightness: scenarioProfileState.hostBrightness
        }))
        setAuraSyncState((previous) => ({
          ...previous,
          selectedEffect: scenarioProfileState.auraEffect === 'color cycle' ? 'color-cycle' : scenarioProfileState.auraEffect
        }))
        setScenarioProfileState((previous) => ({
          ...previous,
          lastAppliedAt: new Date().toISOString()
        }))
      }

      markScenarioProfileSaved()
    } finally {
      window.setTimeout(() => setIsScenarioSaving(false), 260)
    }
  }

  function updateResourceMonitorState(updater) {
    setResourceMonitorState((previous) => ({
      ...previous,
      ...(typeof updater === 'function' ? updater(previous) : updater)
    }))
  }

  function updateDisplaySettingsState(updater) {
    setDisplaySettingsState((previous) => ({
      ...previous,
      ...(typeof updater === 'function' ? updater(previous) : updater)
    }))
  }

  return (
    <div
      className={`armoury-crate-app ${startupStage !== 'done' ? 'startup-active' : ''} armoury-theme-${getResolvedArmouryThemeId(appSettingsState.themeId)}`}
    >
      <aside className="armoury-crate-sidebar">
        <div className="armoury-crate-sidebar-top">
          <div className="armoury-crate-brand">
            <div className="armoury-crate-brand-mark" aria-hidden="true">
              <span />
            </div>
            <span>Armoury Crate</span>
          </div>

          <button type="button" className="armoury-crate-menu-button" aria-label="Open menu">
            <Menu size={22} strokeWidth={1.75} />
          </button>
        </div>

        <nav className="armoury-crate-nav" aria-label="Armoury Crate navigation">
          {visibleSidebarSections.map((section, sectionIndex) => (
            <div key={`section-${sectionIndex}`} className={`armoury-crate-nav-section ${section.footer ? 'footer-section' : ''}`}>
              {section.label ? <div className="armoury-crate-nav-label">{section.label}</div> : null}
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive = activeNav === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`armoury-crate-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleNavSelect(item.id)}
                  >
                    <span className="armoury-crate-nav-icon">
                      <Icon size={19} strokeWidth={1.6} />
                    </span>
                    <span>{item.label}</span>
                    {item.hasAlert ? <span className="armoury-crate-nav-alert" aria-hidden="true" /> : null}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>
      </aside>

      <section className={`armoury-crate-home ${['devices', 'aura-sync', 'scenario-profiles', 'display-settings'].includes(activeNav) ? 'devices-page-active' : ''}`}>
        {activeNav === 'devices' ? (
          <ArmouryCrateDevicesPage
            activeTab={activeDeviceTab}
            onBack={() => setActiveNav('home')}
            onTabChange={setActiveDeviceTab}
            memoryProcesses={memoryProcesses}
            memoryResources={memoryResources}
            selectedMemoryPids={selectedMemoryPids}
            isMemoryLoading={isMemoryLoading}
            isMemoryFreeingUp={isMemoryFreeingUp}
            onRefreshMemory={refreshMemoryProcesses}
            onToggleMemoryProcess={toggleMemoryProcessGroup}
            onToggleAllMemoryProcesses={toggleAllMemoryProcesses}
            onFreeUpMemory={freeUpMemoryProcesses}
            gpuPerformanceState={gpuPerformanceState}
            isGpuPerformanceLoading={isGpuPerformanceLoading}
            isGpuPerformanceSaving={isGpuPerformanceSaving}
            isGpuStoppingAll={isGpuStoppingAll}
            isGpuProcessCollapsed={isGpuProcessCollapsed}
            onRefreshGpuPerformance={() => refreshGpuPerformanceState(true)}
            onUpdateGpuMode={updateGpuPerformanceMode}
            onToggleGpuReminder={toggleGpuReminderNotifications}
            onStopAllGpuProcesses={stopAllGpuProcesses}
            onToggleGpuProcessCollapse={() => setIsGpuProcessCollapsed((previous) => !previous)}
            lightingState={lightingState}
            onLightingEffectChange={(effectId) => updateLightingState({ effect: effectId })}
            onLightingColorChange={(color) => updateLightingState({ color })}
            onLightingBrightnessChange={(brightness) => updateLightingState({ brightness })}
            onToggleLightingSettings={() => updateLightingState((previous) => ({ settingsOpen: !previous.settingsOpen }))}
            onResetLighting={() => setLightingState(DEFAULT_LIGHTING_STATE)}
            audioState={audioState}
            onAudioStateChange={updateAudioState}
            onResetAudio={() => setAudioState(DEFAULT_AUDIO_STATE)}
            resourceMonitorState={resourceMonitorState}
            resourceMonitorRuntime={resourceMonitorRuntime}
            isResourceMonitorLoading={isResourceMonitorLoading}
            onResourceMonitorStateChange={updateResourceMonitorState}
            deviceSettings={deviceSettings}
            onToggleDeviceSetting={toggleDeviceSetting}
          />
        ) : activeNav === 'aura-sync' ? (
          <ArmouryCrateAuraSyncSimulationPage
            auraSyncState={auraSyncState}
            lightingState={lightingState}
            activeMode={activeMode}
            onChange={updateAuraSyncState}
            onLightingStateChange={updateLightingState}
            onOpenDeviceLighting={() => {
              setActiveNav('devices')
              setActiveDeviceTab('lighting')
            }}
          />
        ) : activeNav === 'feature-library' ? (
          <FeatureLibraryPage
            featureState={featureLibraryState}
            operations={featureLibraryOperations}
            onToggleModule={toggleFeatureLibraryModule}
          />
        ) : activeNav === 'user-center' ? (
          <UserCenterPage />
        ) : activeNav === 'settings' ? (
          <SettingsPage
            settingsState={appSettingsState}
            featureLibraryState={featureLibraryState}
            onChange={updateAppSettingsState}
          />
        ) : activeNav === 'macros' ? (
          <MacrosPage />
        ) : activeNav === 'scenario-profiles' ? (
          <ArmouryCrateScenarioProfilesPage
            profileState={scenarioProfileState}
            availableApps={scenarioAvailableApps}
            isAppsLoading={isScenarioAppsLoading}
            isSaving={isScenarioSaving}
            onChange={updateScenarioProfileState}
            onSave={() => saveScenarioProfile({ apply: false })}
            onApplyAndSave={() => saveScenarioProfile({ apply: true })}
          />
        ) : activeNav === 'display-settings' ? (
          <ArmouryCrateDisplaySettingsPage
            displayState={displaySettingsState}
            systemStats={systemStats}
            performanceHistory={performanceHistory}
            runningProcesses={runningProcesses}
            gpuState={gpuPerformanceState}
            activeMode={activeMode}
            panelPowerSaverEnabled={deviceSettings['panel-power-saver']}
            onChange={updateDisplaySettingsState}
          />
        ) : activeNav === 'game-library' ? (
          <GameLibraryPage
            runningProcesses={runningProcesses}
            onRefreshProcesses={refreshSharedSystemData}
            onOpenGameDeals={() => setActiveNav(isArmouryNavVisible('promotion', featureLibraryState) ? 'promotion' : 'feature-library')}
          />
        ) : activeNav === 'content-platform' ? (
          <ContentPlatformPage />
        ) : activeNav === 'promotion' ? (
          <PromotionPage />
        ) : (
          <ArmouryCrateHomePage
            telemetry={telemetry}
            activeMode={activeMode}
            onModeChange={setActiveMode}
            appSettingsState={appSettingsState}
            systemStats={systemStats}
            performanceHistory={performanceHistory}
            runningProcesses={runningProcesses}
            gpuState={gpuPerformanceState}
            storageInfo={homeStorageInfo}
            isSystemDataReady={hasSharedSystemData}
          />
        )}
      </section>

      {startupStage !== 'done' ? <ArmouryCrateStartupSplash stage={startupStage} /> : null}
    </div>
  )
}

function ArmouryCrateStartupSplash({ stage }) {
  return (
    <div className={`armoury-crate-startup stage-${stage}`} aria-hidden="true">
      <div className="armoury-crate-startup-center">
        <div className="armoury-crate-startup-outline-shell">
          <ArmouryCrateStartupTrace />
        </div>
        <div className="armoury-crate-startup-logo-shell">
          <img
            className="armoury-crate-startup-logo"
            src={ARMOURY_CRATE_LOGO_PUBLIC_PATH}
            alt=""
            draggable="false"
          />
        </div>
      </div>
    </div>
  )
}

function ArmouryCrateStartupTrace() {
  return (
    <svg viewBox="0 0 220 220" className="armoury-crate-startup-trace" aria-hidden="true">
      <path
        className="armoury-crate-startup-trace-line"
        style={{ '--trace-delay': '0ms' }}
        pathLength="100"
        d="M110 26 L177 64 L177 142 L110 180 L43 142 L43 64 Z"
      />
      <path
        className="armoury-crate-startup-trace-line"
        style={{ '--trace-delay': '120ms' }}
        pathLength="100"
        d="M57 76 L110 45 L163 76"
      />
      <path
        className="armoury-crate-startup-trace-line"
        style={{ '--trace-delay': '260ms' }}
        pathLength="100"
        d="M67 145 L110 170 L153 145"
      />
      <path
        className="armoury-crate-startup-trace-line"
        style={{ '--trace-delay': '360ms' }}
        pathLength="100"
        d="M70 80 L70 132"
      />
      <path
        className="armoury-crate-startup-trace-line"
        style={{ '--trace-delay': '470ms' }}
        pathLength="100"
        d="M150 80 L150 132"
      />
      <path
        className="armoury-crate-startup-trace-line"
        style={{ '--trace-delay': '560ms' }}
        pathLength="100"
        d="M82 112 L112 67"
      />
      <path
        className="armoury-crate-startup-trace-line"
        style={{ '--trace-delay': '660ms' }}
        pathLength="100"
        d="M112 67 L141 128"
      />
      <path
        className="armoury-crate-startup-trace-line"
        style={{ '--trace-delay': '760ms' }}
        pathLength="100"
        d="M82 112 L126 136"
      />
    </svg>
  )
}

function getAverageHistoryValue(history, key) {
  const samples = history
    .slice(-18)
    .map((entry) => Number(entry?.[key]))
    .filter((value) => Number.isFinite(value))

  if (samples.length === 0) return 0
  return samples.reduce((total, value) => total + value, 0) / samples.length
}

function getPeakHistoryValue(history, key) {
  const samples = history
    .slice(-18)
    .map((entry) => Number(entry?.[key]))
    .filter((value) => Number.isFinite(value))

  if (samples.length === 0) return 0
  return Math.max(...samples)
}

function getTopProcessByMetric(processes, key) {
  return processes.reduce((topProcess, process) => {
    const nextValue = Number(process?.[key]) || 0
    const currentTopValue = Number(topProcess?.[key]) || 0
    return nextValue > currentTopValue ? process : topProcess
  }, null)
}

function formatPercent(value, digits = 1) {
  if (!Number.isFinite(value)) return '--'
  return `${Math.max(0, value).toFixed(digits)}%`
}

function formatCompactMegabytes(value) {
  if (!Number.isFinite(value)) return '--'
  if (value >= 1024) return `${(value / 1024).toFixed(1)} GB`
  return `${Math.max(0, Math.round(value))} MB`
}

function formatStorageSummary(storageInfo) {
  if (!storageInfo) return '--'
  return `${formatCompactMegabytes(storageInfo.usedMb)} / ${formatCompactMegabytes(storageInfo.totalMb)}`
}

function formatTopProcessValue(process, key, formatter) {
  if (!process?.app) return 'No active workload'
  return `${process.app} · ${formatter(Number(process[key]) || 0)}`
}

function deriveGpuUsagePercent(gpuState) {
  const processes = gpuState?.processes || []
  if (gpuState?.mode === 'eco' || processes.length === 0) return 0

  const totalDemand = processes.reduce((total, process) => total + (Number(process.gpu_score) || 0), 0)
  const averageDemand = totalDemand / processes.length
  return clampValue((averageDemand / 1.95) * 100 + Math.min(processes.length * 6, 18), 0, 100)
}

function ArmouryCrateHomePage({
  telemetry,
  activeMode,
  onModeChange,
  appSettingsState,
  systemStats,
  performanceHistory,
  runningProcesses,
  gpuState,
  storageInfo,
  isSystemDataReady
}) {
  const cpuAverage = getAverageHistoryValue(performanceHistory, 'cpu_usage')
  const cpuPeak = getPeakHistoryValue(performanceHistory, 'cpu_usage')
  const topCpuProcess = getTopProcessByMetric(runningProcesses, 'cpu_usage')
  const topMemoryProcess = getTopProcessByMetric(runningProcesses, 'memory')
  const gpuMode = gpuState.modes.find((mode) => mode.id === gpuState.mode) || gpuState.modes[0]
  const gpuTopProcess = gpuState.processes?.[0] || null
  const gpuUsagePercent = deriveGpuUsagePercent(gpuState)

  return (
    <>
      <header className="armoury-crate-home-header">
        <h1>Home</h1>
        <div className="armoury-crate-home-tools" aria-label="App tools">
          <BookOpenText size={20} strokeWidth={1.7} />
          <FolderKanban size={20} strokeWidth={1.7} />
          <Volume2 size={20} strokeWidth={1.7} />
          <Smartphone size={22} strokeWidth={1.7} />
        </div>
      </header>

      <div className="armoury-crate-home-grid">
        <div className="armoury-crate-left-column">
          <div className="armoury-crate-hero">
            <LaptopHero
              deviceImageStyle={appSettingsState.deviceImageStyle}
              reloadToken={appSettingsState.deviceImageReloadToken}
            />
            <div className="armoury-crate-device-name">ASUS TUF GAMING F15</div>
            <div className="armoury-crate-device-spec">11th Gen Intel(R) Core(TM) i5-11400H @ 2.70GHz</div>
          </div>

          <section className="armoury-crate-devices">
            <div className="armoury-crate-section-heading">
              <span className="armoury-crate-section-accent" aria-hidden="true" />
              <span>Devices (0)</span>
              <button type="button" className="armoury-crate-link-button">
                View All
              </button>
              <span className="armoury-crate-chevron-up" aria-hidden="true" />
            </div>

            <div className="armoury-crate-empty-device">
              <div className="armoury-crate-empty-plus">
                <Plus size={54} strokeWidth={1.6} />
              </div>
              <div className="armoury-crate-empty-copy">
                <strong>No Devices Connected</strong>
                <p>
                  Ensure that the devices are connected properly. For the latest ASUS products, visit
                  <span> [ASUS official].</span>
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="armoury-crate-right-column">
          <div className="armoury-crate-section-heading usage-heading">
            <span className="armoury-crate-section-accent" aria-hidden="true" />
            <span>System Usage</span>
          </div>

          <div className="armoury-crate-telemetry-grid">
            <TelemetryPanel
              title="CPU"
              rows={[
                {
                  label: 'Usage',
                  value: isSystemDataReady ? formatPercent(systemStats.cpuUsage) : 'Loading...',
                  barPercent: isSystemDataReady ? systemStats.cpuUsage : undefined
                },
                {
                  label: 'Average',
                  value: isSystemDataReady ? formatPercent(cpuAverage) : 'Loading...',
                  barPercent: isSystemDataReady ? cpuAverage : undefined
                },
                {
                  label: 'Peak',
                  value: isSystemDataReady ? formatPercent(cpuPeak) : 'Loading...',
                  barPercent: isSystemDataReady ? cpuPeak : undefined
                },
                { label: 'Running Apps', value: isSystemDataReady ? `${systemStats.processCount}` : 'Loading...' },
                {
                  label: 'Top App',
                  value: isSystemDataReady ? formatTopProcessValue(topCpuProcess, 'cpu_usage', (value) => formatPercent(value)) : 'Loading...'
                }
              ]}
            />

            <TelemetryPanel
              title="GPU"
              rows={[
                { label: 'Mode', value: gpuState.updatedAt ? gpuMode?.title || 'GPU Mode' : 'Loading...' },
                {
                  label: 'Usage',
                  value: gpuState.updatedAt ? formatPercent(gpuUsagePercent) : 'Loading...',
                  barPercent: gpuState.updatedAt ? gpuUsagePercent : undefined
                },
                { label: 'Apps Engaged', value: gpuState.updatedAt ? `${gpuState.processes.length}` : 'Loading...' },
                { label: 'Top App', value: gpuState.updatedAt ? gpuTopProcess?.app || 'No active workload' : 'Loading...' },
                {
                  label: 'Process Memory',
                  value: gpuState.updatedAt
                    ? gpuTopProcess
                      ? formatCompactMegabytes(gpuTopProcess.memory)
                      : '0 MB'
                    : 'Loading...'
                }
              ]}
            />

            <TelemetryPanel
              title="Fan"
              rows={[
                { label: 'CPU Fan', value: formatValue(telemetry.cpuFan), barPercent: getBarPercent(telemetry.cpuFan) },
                { label: 'GPU Fan', value: formatValue(telemetry.gpuFan), barPercent: getBarPercent(telemetry.gpuFan) },
                { label: 'Fan Acoustics', value: formatValue(telemetry.fanAcoustics) },
                ...PLACEHOLDER_ROWS.map((row, index) => ({ label: row, value: row, key: `fan-placeholder-${index}` }))
              ]}
            />

            <TelemetryPanel
              title="Memory"
              rows={[
                {
                  label: 'Storage',
                  value: storageInfo ? formatStorageSummary(storageInfo) : 'Loading...',
                  barPercent: storageInfo ? storageInfo.usagePercent : undefined
                },
                {
                  label: 'RAM',
                  value: isSystemDataReady ? `${systemStats.usedMemory} / ${systemStats.totalMemory} MB` : 'Loading...',
                  barPercent: isSystemDataReady ? systemStats.memoryUsagePercent : undefined
                },
                {
                  label: 'Available',
                  value: isSystemDataReady ? formatCompactMegabytes(systemStats.availableMemory) : 'Loading...'
                },
                {
                  label: 'Usage',
                  value: isSystemDataReady ? formatPercent(systemStats.memoryUsagePercent) : 'Loading...',
                  barPercent: isSystemDataReady ? systemStats.memoryUsagePercent : undefined
                },
                {
                  label: 'Top App',
                  value: isSystemDataReady
                    ? formatTopProcessValue(topMemoryProcess, 'memory', (value) => formatCompactMegabytes(value))
                    : 'Loading...'
                }
              ]}
            />
          </div>

          <section className="armoury-crate-operating-mode">
            <div className="armoury-crate-section-heading">
              <span className="armoury-crate-section-accent" aria-hidden="true" />
              <span>Operating Mode</span>
            </div>

            <div className="armoury-crate-mode-strip" role="radiogroup" aria-label="Operating mode">
              {MODE_ORDER.map((mode) => {
                const modeConfig = MODE_PRESETS[mode]
                const Icon = modeConfig.icon
                const isSelected = activeMode === mode
                return (
                  <button
                    key={mode}
                    type="button"
                    className={`armoury-crate-mode-button ${isSelected ? 'selected' : ''}`}
                    onClick={() => onModeChange(mode)}
                    role="radio"
                    aria-checked={isSelected}
                  >
                    <span className="armoury-crate-mode-icon">
                      <Icon size={25} strokeWidth={1.8} />
                    </span>
                    <span>{modeConfig.label}</span>
                  </button>
                )
              })}
            </div>
          </section>
        </div>
      </div>
    </>
  )
}

function ArmouryCrateAuraSyncPage({
  auraSyncState,
  lightingState,
  activeMode,
  onChange,
  onLightingStateChange,
  onOpenDeviceLighting
}) {
  const [isSearchingHue, setIsSearchingHue] = useState(false)
  const activeEffect = LIGHTING_EFFECTS.find((effect) => effect.id === lightingState.effect) || LIGHTING_EFFECTS[0]
  const aiPreset = getAuraAiLightingPreset(auraSyncState.aiProfile, activeMode)

  useEffect(() => {
    if (!isSearchingHue) return undefined

    const timeoutId = window.setTimeout(() => {
      setIsSearchingHue(false)
      onChange({
        hueBridgeConnected: true,
        lastHueScanAt: new Date().toISOString()
      })
    }, 1400)

    return () => window.clearTimeout(timeoutId)
  }, [isSearchingHue, onChange])

  function handleHueSearch() {
    if (isSearchingHue) return
    setIsSearchingHue(true)
  }

  function handleApplyAiProfile(profileId) {
    const preset = getAuraAiLightingPreset(profileId, activeMode)
    onChange({ aiProfile: profileId })
    onLightingStateChange({
      effect: preset.effect,
      color: preset.color,
      brightness: preset.brightness
    })
  }

  return (
    <section className="armoury-crate-aura-page">
      <header className="armoury-crate-aura-header">
        <h1>Aura Sync</h1>
        <div className="armoury-crate-device-header-tools" aria-hidden="true">
          <DeviceHeaderIcon />
        </div>
      </header>

      <div className="armoury-crate-aura-tab-row" role="tablist" aria-label="Aura Sync tabs">
        {AURA_SYNC_TABS.map((tab) => {
          const isActive = auraSyncState.activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`armoury-crate-aura-tab ${isActive ? 'active' : ''}`}
              onClick={() => onChange({ activeTab: tab.id })}
            >
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      <div className="armoury-crate-aura-content">
        {auraSyncState.activeTab === 'sync-devices' ? (
          <>
            <div className="armoury-crate-aura-device-zone">
              <article className="armoury-crate-aura-device-card">
                <span
                  className={`armoury-crate-aura-device-status ${lightingState.brightness > 0 ? 'active' : ''}`}
                  aria-hidden="true"
                >
                  <span />
                </span>
                <div className="armoury-crate-aura-device-icon">
                  <AuraSyncLaptopIcon />
                </div>
                <div className="armoury-crate-aura-device-name">FX506HE</div>
                <div className="armoury-crate-aura-device-copy">
                  {activeEffect.label} · {lightingState.brightness}% brightness
                </div>
                <button type="button" className="armoury-crate-aura-device-link" onClick={onOpenDeviceLighting}>
                  Set device lighting
                </button>
              </article>
            </div>

            <section className={`armoury-crate-aura-panel ${auraSyncState.performanceExpanded ? 'expanded' : ''}`}>
              <div className="armoury-crate-aura-panel-row">
                <div className="armoury-crate-aura-panel-copy">
                  <h2>Aura Performance Mode</h2>
                  <p>
                    If the lighting effects on Aura Sync devices are laggy, enable Aura Performance Mode and select a
                    Lighting Effect Smoothness level that optimizes the current simulation.
                  </p>
                </div>

                <div className="armoury-crate-aura-panel-actions">
                  <span className="armoury-crate-audio-info-mark aura-info" aria-hidden="true">
                    i
                  </span>
                  <button
                    type="button"
                    className={`armoury-crate-audio-toggle ${auraSyncState.performanceModeEnabled ? 'enabled' : ''}`}
                    onClick={() => onChange((previous) => ({ performanceModeEnabled: !previous.performanceModeEnabled }))}
                  >
                    <span className="armoury-crate-audio-toggle-label">
                      {auraSyncState.performanceModeEnabled ? 'ON' : 'OFF'}
                    </span>
                    <span className="armoury-crate-audio-toggle-track">
                      <span className="armoury-crate-audio-toggle-thumb" />
                    </span>
                  </button>
                  <button
                    type="button"
                    className={`armoury-crate-aura-collapse-button ${auraSyncState.performanceExpanded ? 'expanded' : ''}`}
                    onClick={() => onChange((previous) => ({ performanceExpanded: !previous.performanceExpanded }))}
                    aria-label={auraSyncState.performanceExpanded ? 'Collapse Aura Performance Mode' : 'Expand Aura Performance Mode'}
                  >
                    <span />
                  </button>
                </div>
              </div>

              {auraSyncState.performanceExpanded ? (
                <div className="armoury-crate-aura-performance-body">
                  <div className="armoury-crate-aura-performance-levels">
                    {['Low', 'Mid', 'High'].map((label, index) => (
                      <button
                        key={label}
                        type="button"
                        className={`armoury-crate-aura-level-chip ${auraSyncState.performanceSmoothness === index ? 'active' : ''}`}
                        onClick={() => onChange({ performanceSmoothness: index })}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="armoury-crate-aura-performance-note">
                    {auraSyncState.performanceModeEnabled
                      ? `Performance Mode is reducing animation overhead while keeping ${activeEffect.label.toLowerCase()} synced.`
                      : 'Performance Mode is off. Lighting continues with the current Aura Sync simulation.'}
                  </div>
                </div>
              ) : null}
            </section>

            <section className="armoury-crate-aura-panel">
              <div className="armoury-crate-aura-panel-row">
                <div className="armoury-crate-aura-panel-copy">
                  <h2>Hue Connection</h2>
                  <p>
                    Ensure the Hue Bridge and your system are connected to the same network. Also, check the firmware
                    version of the Hue Bridge in the Hue app to match the desktop simulation flow.
                  </p>
                  {auraSyncState.hueBridgeConnected ? (
                    <div className="armoury-crate-aura-panel-status">
                      Hue Bridge detected. Last scan:{' '}
                      {auraSyncState.lastHueScanAt ? new Date(auraSyncState.lastHueScanAt).toLocaleTimeString() : 'just now'}
                    </div>
                  ) : (
                    <div className="armoury-crate-aura-panel-status">No Hue Bridge detected in the current simulation.</div>
                  )}
                </div>

                <button
                  type="button"
                  className="armoury-crate-aura-action-button"
                  onClick={handleHueSearch}
                  disabled={isSearchingHue}
                >
                  {isSearchingHue ? 'Searching...' : 'Search for devices'}
                </button>
              </div>
            </section>
          </>
        ) : auraSyncState.activeTab === 'aura-effects' ? (
          <div className="armoury-crate-aura-effects-layout">
            <div className="armoury-crate-aura-effects-grid">
              {LIGHTING_EFFECTS.map((effect) => {
                const Icon = effect.icon
                const isActive = lightingState.effect === effect.id
                return (
                  <button
                    key={effect.id}
                    type="button"
                    className={`armoury-crate-aura-effect-card ${isActive ? 'active' : ''}`}
                    onClick={() => onLightingStateChange({ effect: effect.id })}
                  >
                    <span className="armoury-crate-aura-effect-icon" aria-hidden="true">
                      <Icon active={isActive} />
                    </span>
                    <span className="armoury-crate-aura-effect-title">{effect.label}</span>
                  </button>
                )
              })}
            </div>

            <aside className="armoury-crate-aura-side-panel">
              <h2>{activeEffect.label}</h2>
              <p>Apply the same Aura effect to the synced laptop device using the existing lighting simulation state.</p>

              <div className="armoury-crate-aura-color-row">
                {LIGHTING_COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`armoury-crate-aura-color-swatch ${lightingState.color === color ? 'active' : ''}`}
                    style={{ '--lighting-preview': color }}
                    onClick={() => onLightingStateChange({ color })}
                    aria-label={`Set Aura Sync color to ${color}`}
                  />
                ))}
              </div>

              <div className="armoury-crate-aura-brightness">
                <div className="armoury-crate-aura-brightness-head">
                  <span>BRIGHTNESS</span>
                  <strong>{lightingState.brightness}%</strong>
                </div>
                <div className="armoury-crate-lighting-slider-shell">
                  <div className="armoury-crate-lighting-slider-fill" style={{ width: `${lightingState.brightness}%` }} />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={lightingState.brightness}
                    onChange={(event) => onLightingStateChange({ brightness: Number(event.target.value) })}
                    aria-label="Aura Sync brightness"
                  />
                </div>
              </div>

              <button type="button" className="armoury-crate-aura-action-button wide" onClick={onOpenDeviceLighting}>
                Open device lighting
              </button>
            </aside>
          </div>
        ) : (
          <div className="armoury-crate-aura-ai-layout">
            <div className="armoury-crate-aura-ai-grid">
              {AURA_AI_LIGHTING_PROFILES.map((profile) => {
                const isActive = auraSyncState.aiProfile === profile.id
                return (
                  <button
                    key={profile.id}
                    type="button"
                    className={`armoury-crate-aura-ai-card ${isActive ? 'active' : ''}`}
                    onClick={() => handleApplyAiProfile(profile.id)}
                  >
                    <strong>{profile.title}</strong>
                    <span>{profile.description}</span>
                  </button>
                )
              })}
            </div>

            <aside className="armoury-crate-aura-side-panel ai-panel">
              <h2>{aiPreset.title}</h2>
              <p>
                Recommended for the current <span>{MODE_PRESETS[activeMode].label}</span> operating mode.
              </p>

              <div className="armoury-crate-aura-ai-preview">
                <div>
                  <span>Effect</span>
                  <strong>{LIGHTING_EFFECTS.find((effect) => effect.id === aiPreset.effect)?.label || activeEffect.label}</strong>
                </div>
                <div>
                  <span>Color</span>
                  <strong>{aiPreset.color}</strong>
                </div>
                <div>
                  <span>Brightness</span>
                  <strong>{aiPreset.brightness}%</strong>
                </div>
              </div>

              <button type="button" className="armoury-crate-aura-action-button wide" onClick={() => handleApplyAiProfile(auraSyncState.aiProfile)}>
                Apply AI lighting
              </button>
            </aside>
          </div>
        )}
      </div>
    </section>
  )
}

function ArmouryCrateAuraSyncSimulationPage({
  auraSyncState,
  lightingState,
  activeMode,
  onChange,
  onLightingStateChange,
  onOpenDeviceLighting
}) {
  const [isSearchingHue, setIsSearchingHue] = useState(false)
  const activeEffect =
    AURA_BASIC_EFFECTS.find((effect) => effect.id === auraSyncState.selectedEffect) ||
    AURA_BASIC_EFFECTS[0]
  const aiPreset = getAuraAiLightingPreset(auraSyncState.aiProfile, activeMode)
  const gradientDirectionLabel =
    AURA_GRADIENT_DIRECTIONS.find((direction) => direction.id === auraSyncState.gradientDirection)?.label || 'Horizontal'
  const isGradientMode = auraSyncState.colorMode === 'gradient'
  const heroGradientColors =
    auraSyncState.colorMode === 'gradient'
      ? auraSyncState.gradientColors
      : [aiPreset.color, activeMode === 'turbo' ? '#671ddf' : '#1f1cff']

  useEffect(() => {
    if (!isSearchingHue) return undefined

    const timeoutId = window.setTimeout(() => {
      setIsSearchingHue(false)
      onChange({
        hueBridgeConnected: true,
        lastHueScanAt: new Date().toISOString()
      })
    }, 1400)

    return () => window.clearTimeout(timeoutId)
  }, [isSearchingHue, onChange])

  function handleHueSearch() {
    if (isSearchingHue) return
    setIsSearchingHue(true)
  }

  function handleSelectAuraEffect(effectId) {
    const selectedEffect = AURA_BASIC_EFFECTS.find((effect) => effect.id === effectId) || AURA_BASIC_EFFECTS[0]
    const nextState = { selectedEffect: effectId }

    if (effectId === 'dark') {
      onLightingStateChange({ effect: 'static', brightness: 0 })
      onChange({
        ...nextState,
        colorMode: 'single'
      })
      return
    }

    if (['rainbow', 'adaptive-color', 'ai-aura-lighting'].includes(effectId)) {
      nextState.colorMode = 'gradient'
    }

    onLightingStateChange({
      effect: selectedEffect.lightingEffect,
      brightness: lightingState.brightness === 0 ? DEFAULT_LIGHTING_STATE.brightness : lightingState.brightness
    })
    onChange(nextState)
  }

  function handleApplyAiProfile(profileId) {
    const preset = getAuraAiLightingPreset(profileId, activeMode)
    onChange({
      aiProfile: profileId,
      selectedEffect: 'ai-aura-lighting',
      colorMode: 'gradient',
      gradientColors: preset.gradientColors || [preset.color, '#4d2cff']
    })
    onLightingStateChange({
      effect: preset.effect,
      color: preset.color,
      brightness: preset.brightness
    })
  }

  function handleResetAuraEffects() {
    onChange({
      selectedEffect: 'static',
      colorMode: 'gradient',
      singleColor: '#5a575d',
      gradientColors: ['#ff1a1a', '#1f1cff'],
      gradientDirection: 'horizontal',
      advancedEffect: 'Comet',
      inGameLightingEnabled: false
    })
    onLightingStateChange({
      effect: DEFAULT_LIGHTING_STATE.effect,
      color: DEFAULT_LIGHTING_STATE.color,
      brightness: DEFAULT_LIGHTING_STATE.brightness
    })
  }

  return (
    <section className="armoury-crate-aura-page">
      <header className="armoury-crate-aura-header">
        <h1>Aura Sync</h1>
        <div className="armoury-crate-device-header-tools" aria-hidden="true">
          <DeviceHeaderIcon />
        </div>
      </header>

      <div className="armoury-crate-aura-tab-row" role="tablist" aria-label="Aura Sync tabs">
        {AURA_SYNC_TABS.map((tab) => {
          const isActive = auraSyncState.activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`armoury-crate-aura-tab ${isActive ? 'active' : ''}`}
              onClick={() => onChange({ activeTab: tab.id })}
            >
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      <div className="armoury-crate-aura-content">
        {auraSyncState.activeTab === 'sync-devices' ? (
          <>
            <div className="armoury-crate-aura-device-zone">
              <article className="armoury-crate-aura-device-card">
                <span
                  className={`armoury-crate-aura-device-status ${lightingState.brightness > 0 ? 'active' : ''}`}
                  aria-hidden="true"
                >
                  <span />
                </span>
                <div className="armoury-crate-aura-device-icon">
                  <AuraSyncLaptopIcon />
                </div>
                <div className="armoury-crate-aura-device-name">FX506HE</div>
                <div className="armoury-crate-aura-device-copy">
                  {activeEffect.label} · {Math.max(lightingState.brightness, 0)}% brightness
                </div>
                <button type="button" className="armoury-crate-aura-device-link" onClick={onOpenDeviceLighting}>
                  Set device lighting
                </button>
              </article>
            </div>

            <section className={`armoury-crate-aura-panel ${auraSyncState.performanceExpanded ? 'expanded' : ''}`}>
              <div className="armoury-crate-aura-panel-row">
                <div className="armoury-crate-aura-panel-copy">
                  <h2>Aura Performance Mode</h2>
                  <p>
                    If the lighting effects on Aura Sync devices are laggy, enable Aura Performance Mode and select a
                    Lighting Effect Smoothness level that optimizes the current simulation.
                  </p>
                </div>

                <div className="armoury-crate-aura-panel-actions">
                  <span className="armoury-crate-audio-info-mark aura-info" aria-hidden="true">
                    i
                  </span>
                  <button
                    type="button"
                    className={`armoury-crate-audio-toggle ${auraSyncState.performanceModeEnabled ? 'enabled' : ''}`}
                    onClick={() => onChange((previous) => ({ performanceModeEnabled: !previous.performanceModeEnabled }))}
                  >
                    <span className="armoury-crate-audio-toggle-label">
                      {auraSyncState.performanceModeEnabled ? 'ON' : 'OFF'}
                    </span>
                    <span className="armoury-crate-audio-toggle-track">
                      <span className="armoury-crate-audio-toggle-thumb" />
                    </span>
                  </button>
                  <button
                    type="button"
                    className={`armoury-crate-aura-collapse-button ${auraSyncState.performanceExpanded ? 'expanded' : ''}`}
                    onClick={() => onChange((previous) => ({ performanceExpanded: !previous.performanceExpanded }))}
                    aria-label={auraSyncState.performanceExpanded ? 'Collapse Aura Performance Mode' : 'Expand Aura Performance Mode'}
                  >
                    <span />
                  </button>
                </div>
              </div>

              {auraSyncState.performanceExpanded ? (
                <div className="armoury-crate-aura-performance-body">
                  <div className="armoury-crate-aura-performance-levels">
                    {['Low', 'Mid', 'High'].map((label, index) => (
                      <button
                        key={label}
                        type="button"
                        className={`armoury-crate-aura-level-chip ${auraSyncState.performanceSmoothness === index ? 'active' : ''}`}
                        onClick={() => onChange({ performanceSmoothness: index })}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="armoury-crate-aura-performance-note">
                    {auraSyncState.performanceModeEnabled
                      ? `Performance Mode is reducing animation overhead while keeping ${activeEffect.label.toLowerCase()} synced.`
                      : 'Performance Mode is off. Lighting continues with the current Aura Sync simulation.'}
                  </div>
                </div>
              ) : null}
            </section>

            <section className="armoury-crate-aura-panel">
              <div className="armoury-crate-aura-panel-row">
                <div className="armoury-crate-aura-panel-copy">
                  <h2>Hue Connection</h2>
                  <p>
                    Ensure the Hue Bridge and your system are connected to the same network. Also, check the firmware
                    version of the Hue Bridge in the Hue app to match the desktop simulation flow.
                  </p>
                  {auraSyncState.hueBridgeConnected ? (
                    <div className="armoury-crate-aura-panel-status">
                      Hue Bridge detected. Last scan:{' '}
                      {auraSyncState.lastHueScanAt ? new Date(auraSyncState.lastHueScanAt).toLocaleTimeString() : 'just now'}
                    </div>
                  ) : (
                    <div className="armoury-crate-aura-panel-status">No Hue Bridge detected in the current simulation.</div>
                  )}
                </div>

                <button
                  type="button"
                  className="armoury-crate-aura-action-button"
                  onClick={handleHueSearch}
                  disabled={isSearchingHue}
                >
                  {isSearchingHue ? 'Searching...' : 'Search for devices'}
                </button>
              </div>
            </section>
          </>
        ) : auraSyncState.activeTab === 'aura-effects' ? (
          <div className="armoury-crate-aura-effects-layout">
            <div className="armoury-crate-aura-effects-main">
              <div className="armoury-crate-lighting-topbar aura-effects-head">
                <div className="armoury-crate-gpu-heading armoury-crate-lighting-heading">
                  <span className="armoury-crate-gpu-heading-mark" aria-hidden="true" />
                  <h2>Basic Effects</h2>
                </div>

                <div className="armoury-crate-lighting-actions">
                  <button type="button" className="armoury-crate-lighting-top-button" onClick={handleResetAuraEffects}>
                    Reset to default
                  </button>
                </div>
              </div>

              <div className="armoury-crate-aura-effects-grid">
                {AURA_BASIC_EFFECTS.map((effect) => {
                  const Icon = effect.icon
                  const isActive = auraSyncState.selectedEffect === effect.id
                  return (
                    <button
                      key={effect.id}
                      type="button"
                      className={`armoury-crate-aura-effect-card ${isActive ? 'active' : ''}`}
                      onClick={() => handleSelectAuraEffect(effect.id)}
                    >
                      <span className="armoury-crate-aura-effect-icon" aria-hidden="true">
                        <Icon active={isActive} />
                      </span>
                      <span className="armoury-crate-aura-effect-title">{effect.label}</span>
                    </button>
                  )
                })}
              </div>

              <section className="armoury-crate-aura-advanced">
                <div className="armoury-crate-gpu-heading armoury-crate-lighting-heading">
                  <span className="armoury-crate-gpu-heading-mark" aria-hidden="true" />
                  <h2>Advanced Effects</h2>
                </div>

                <div className="armoury-crate-aura-advanced-row">
                  <div className="armoury-crate-aura-creator-mark" aria-hidden="true">
                    <AuraCreatorIcon />
                  </div>

                  <div className="armoury-crate-aura-advanced-copy">
                    <div className="armoury-crate-resource-select-shell">
                      <select
                        value={auraSyncState.advancedEffect}
                        onChange={(event) => onChange({ advancedEffect: event.target.value })}
                        className="armoury-crate-resource-select"
                      >
                        {AURA_ADVANCED_EFFECT_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <span className="armoury-crate-resource-select-arrow" aria-hidden="true" />
                    </div>
                    <p>Use Aura Creator to create unique lighting effects between synchronized devices.</p>
                  </div>

                  <button type="button" className="armoury-crate-aura-action-button">
                    Aura Creator
                  </button>
                </div>
              </section>

              <section className={`armoury-crate-aura-ingame ${auraSyncState.inGameLightingCollapsed ? 'collapsed' : ''}`}>
                <div className="armoury-crate-aura-panel-row">
                  <div className="armoury-crate-aura-panel-copy">
                    <h2>In-Game lighting effects</h2>
                    {!auraSyncState.inGameLightingCollapsed ? (
                      <p>Game-linked effects follow the current Aura Sync preset without requiring backend changes.</p>
                    ) : null}
                  </div>

                  <div className="armoury-crate-aura-panel-actions">
                    <button type="button" className="armoury-crate-aura-game-list-button">
                      Game list
                    </button>
                    <button
                      type="button"
                      className={`armoury-crate-audio-toggle ${auraSyncState.inGameLightingEnabled ? 'enabled' : ''}`}
                      onClick={() => onChange((previous) => ({ inGameLightingEnabled: !previous.inGameLightingEnabled }))}
                    >
                      <span className="armoury-crate-audio-toggle-label">
                        {auraSyncState.inGameLightingEnabled ? 'ON' : 'OFF'}
                      </span>
                      <span className="armoury-crate-audio-toggle-track">
                        <span className="armoury-crate-audio-toggle-thumb" />
                      </span>
                    </button>
                    <button
                      type="button"
                      className={`armoury-crate-aura-collapse-button ${!auraSyncState.inGameLightingCollapsed ? 'expanded' : ''}`}
                      onClick={() => onChange((previous) => ({ inGameLightingCollapsed: !previous.inGameLightingCollapsed }))}
                      aria-label={auraSyncState.inGameLightingCollapsed ? 'Expand in-game lighting effects' : 'Collapse in-game lighting effects'}
                    >
                      <span />
                    </button>
                  </div>
                </div>
              </section>
            </div>

            <aside className="armoury-crate-aura-side-panel aura-effects-panel">
              <h2>{activeEffect.label}</h2>
              <div className="armoury-crate-aura-panel-divider" />

              <div className="armoury-crate-aura-control-group">
                <div className="armoury-crate-aura-control-title">Color</div>

                <button
                  type="button"
                  className={`armoury-crate-aura-radio-row ${auraSyncState.colorMode === 'single' ? 'selected' : ''}`}
                  onClick={() => onChange({ colorMode: 'single' })}
                >
                  <span className="armoury-crate-aura-radio" aria-hidden="true">
                    <span />
                  </span>
                  <span>Single</span>
                </button>

                <div className="armoury-crate-aura-single-color-boxes">
                  <button
                    type="button"
                    className="armoury-crate-aura-single-color-box"
                    style={{ '--lighting-preview': auraSyncState.singleColor }}
                    onClick={() => {
                      const currentIndex = LIGHTING_COLOR_PRESETS.indexOf(auraSyncState.singleColor)
                      const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % LIGHTING_COLOR_PRESETS.length
                      const nextColor = LIGHTING_COLOR_PRESETS[nextIndex]
                      onChange({ singleColor: nextColor, colorMode: 'single' })
                      onLightingStateChange({ color: nextColor })
                    }}
                    aria-label={`Selected single color ${auraSyncState.singleColor}`}
                  />
                </div>

                <button
                  type="button"
                  className={`armoury-crate-aura-radio-row ${isGradientMode ? 'selected' : ''}`}
                  onClick={() => onChange({ colorMode: 'gradient' })}
                >
                  <span className="armoury-crate-aura-radio" aria-hidden="true">
                    <span />
                  </span>
                  <span>Gradient</span>
                </button>

                <div className="armoury-crate-aura-gradient-editor">
                  <div className="armoury-crate-aura-gradient-column">
                    <span>Color scheme</span>
                    <div className="armoury-crate-aura-gradient-color-row">
                      <button
                        type="button"
                        className="armoury-crate-aura-gradient-swatch"
                        style={{ '--lighting-preview': auraSyncState.gradientColors[0] }}
                        onClick={() => {
                          const currentIndex = AURA_GRADIENT_COLOR_PRESETS.findIndex(
                            (pair) => pair[0] === auraSyncState.gradientColors[0] && pair[1] === auraSyncState.gradientColors[1]
                          )
                          const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % AURA_GRADIENT_COLOR_PRESETS.length
                          onChange({ gradientColors: AURA_GRADIENT_COLOR_PRESETS[nextIndex], colorMode: 'gradient' })
                        }}
                        aria-label={`Gradient start color ${auraSyncState.gradientColors[0]}`}
                      />
                      <button
                        type="button"
                        className="armoury-crate-aura-gradient-swatch"
                        style={{ '--lighting-preview': auraSyncState.gradientColors[1] }}
                        onClick={() => onChange({ gradientColors: [...auraSyncState.gradientColors].reverse(), colorMode: 'gradient' })}
                        aria-label={`Gradient end color ${auraSyncState.gradientColors[1]}`}
                      />
                    </div>
                  </div>

                  <div className="armoury-crate-aura-gradient-column compact">
                    <span>Direction</span>
                    <div className="armoury-crate-resource-select-shell">
                      <select
                        value={auraSyncState.gradientDirection}
                        onChange={(event) => onChange({ gradientDirection: event.target.value, colorMode: 'gradient' })}
                        className="armoury-crate-resource-select"
                      >
                        {AURA_GRADIENT_DIRECTIONS.map((direction) => (
                          <option key={direction.id} value={direction.id}>
                            {direction.label}
                          </option>
                        ))}
                      </select>
                      <span className="armoury-crate-resource-select-arrow" aria-hidden="true" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="armoury-crate-aura-preview-block">
                <span>Preview</span>
                <div className={`armoury-crate-aura-live-preview ${isGradientMode ? 'gradient' : 'single'}`} style={getAuraPreviewStyle(auraSyncState)} />
                <small>
                  {isGradientMode ? `${auraSyncState.gradientColors[0]} to ${auraSyncState.gradientColors[1]}` : auraSyncState.singleColor}
                  {' · '}
                  {gradientDirectionLabel}
                </small>
              </div>

              <button type="button" className="armoury-crate-aura-action-button wide" onClick={onOpenDeviceLighting}>
                Open device lighting
              </button>
            </aside>
          </div>
        ) : (
          <div className="armoury-crate-aura-ai-shell">
            <div className="armoury-crate-lighting-topbar aura-ai-topbar">
              <div className="armoury-crate-gpu-heading armoury-crate-lighting-heading aura-ai-heading">
                <span className="armoury-crate-gpu-heading-mark" aria-hidden="true" />
                <h2>Lighting Generation Panel</h2>
                <span className="armoury-crate-aura-experimental-badge">Experimental</span>
              </div>

              <div className="armoury-crate-lighting-actions">
                <button type="button" className="armoury-crate-lighting-top-button" disabled={!auraSyncState.aiLoggedIn}>
                  Create new
                </button>
                <button
                  type="button"
                  className="armoury-crate-lighting-top-button"
                  onClick={() => onChange({ activeTab: 'aura-effects' })}
                >
                  Lighting Gallery
                </button>
              </div>
            </div>

            <p className="armoury-crate-aura-ai-terms">
              By using AI Aura Lighting, you accept the <span>Terms</span>. Do not share confidential or sensitive
              information.
            </p>

            <section
              className="armoury-crate-aura-ai-hero"
              style={{
                '--aura-hero-color-a': heroGradientColors[0],
                '--aura-hero-color-b': heroGradientColors[1],
                '--aura-hero-color-c': aiPreset.color,
                '--aura-hero-color-d': '#050505'
              }}
            >
              <div className="armoury-crate-aura-ai-hero-copy">
                <h2>Your Style, Shining Brightly!</h2>
                <p>Turn your inspiration into vibrant lighting effects that enhance every moment.</p>
              </div>

              <div className="armoury-crate-aura-ai-hero-actions">
                <div className="armoury-crate-aura-ai-profile-row">
                  {AURA_AI_LIGHTING_PROFILES.map((profile) => (
                    <button
                      key={profile.id}
                      type="button"
                      className={`armoury-crate-aura-ai-chip ${auraSyncState.aiProfile === profile.id ? 'active' : ''}`}
                      onClick={() => onChange({ aiProfile: profile.id })}
                    >
                      {profile.title}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="armoury-crate-aura-ai-login"
                  onClick={() => {
                    if (auraSyncState.aiLoggedIn) {
                      handleApplyAiProfile(auraSyncState.aiProfile)
                    } else {
                      onChange({ aiLoggedIn: true })
                    }
                  }}
                >
                  {auraSyncState.aiLoggedIn ? 'Apply lighting' : 'Log in'}
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </section>
  )
}

function ArmouryCrateScenarioProfilesPage({
  profileState,
  availableApps,
  isAppsLoading,
  isSaving,
  onChange,
  onSave,
  onApplyAndSave
}) {
  const currentDraft = createScenarioProfileDraft(profileState)
  const savedDraft = profileState.lastSavedDraft || createScenarioProfileDraft(DEFAULT_SCENARIO_PROFILE_STATE)
  const isDirty = JSON.stringify(currentDraft) !== JSON.stringify(savedDraft)

  return (
    <section className="armoury-crate-scenario-page">
      <header className="armoury-crate-scenario-header">
        <h1>Scenario Profiles</h1>
        <div className="armoury-crate-scenario-header-tools" aria-hidden="true">
          <ScenarioProfileBadgeIcon />
          <span className="armoury-crate-scenario-grid-corners" />
          <span className="armoury-crate-scenario-more-dots" />
        </div>
      </header>

      <div className="armoury-crate-scenario-layout">
        <div className="armoury-crate-scenario-left">
          <div className="armoury-crate-scenario-name-row">
            <div className="armoury-crate-scenario-name-icon" aria-hidden="true">
              <ScenarioProfileBadgeIcon />
            </div>

            <label className="armoury-crate-scenario-name-field">
              <span>Profile Name</span>
              <input
                type="text"
                value={profileState.profileName}
                onChange={(event) => onChange({ profileName: event.target.value })}
                placeholder="Profile name"
              />
            </label>
          </div>

          <section className="armoury-crate-scenario-apps-panel">
            <div className="armoury-crate-scenario-apps-head">
              <h2>Select Apps to Link</h2>
              <button
                type="button"
                className="armoury-crate-scenario-options-button"
                onClick={() => onChange((previous) => ({ appSelectorOpen: !previous.appSelectorOpen }))}
              >
                {profileState.appSelectorOpen ? 'Hide Options' : 'See Options'}
              </button>
            </div>

            {profileState.linkedApps.length > 0 ? (
              <div className="armoury-crate-scenario-linked-apps">
                {profileState.linkedApps.map((app) => (
                  <button
                    key={app}
                    type="button"
                    className="armoury-crate-scenario-app-chip"
                    onClick={() =>
                      onChange((previous) => ({
                        linkedApps: previous.linkedApps.filter((item) => item !== app)
                      }))
                    }
                  >
                    <span>{app}</span>
                    <strong>×</strong>
                  </button>
                ))}
              </div>
            ) : (
              <p className="armoury-crate-scenario-apps-empty">
                Click "See Options" to select apps you wish to apply this profile to.
              </p>
            )}

            {profileState.appSelectorOpen ? (
              <div className="armoury-crate-scenario-apps-options">
                {isAppsLoading && availableApps.length === 0 ? (
                  <div className="armoury-crate-scenario-apps-status">Loading running apps...</div>
                ) : availableApps.length === 0 ? (
                  <div className="armoury-crate-scenario-apps-status">No running apps available.</div>
                ) : (
                  availableApps.map((app) => {
                    const selected = profileState.linkedApps.includes(app)
                    return (
                      <button
                        key={app}
                        type="button"
                        className={`armoury-crate-scenario-app-option ${selected ? 'selected' : ''}`}
                        onClick={() =>
                          onChange((previous) => ({
                            linkedApps: previous.linkedApps.includes(app)
                              ? previous.linkedApps.filter((item) => item !== app)
                              : [...previous.linkedApps, app]
                          }))
                        }
                      >
                        <span className={`armoury-crate-scenario-app-checkbox ${selected ? 'checked' : ''}`} />
                        <span>{app}</span>
                      </button>
                    )
                  })
                )}
              </div>
            ) : null}
          </section>
        </div>

        <div className="armoury-crate-scenario-right">
          <div className="armoury-crate-scenario-section-head">
            <span className="armoury-crate-gpu-heading-mark" aria-hidden="true" />
            <h2>Configuration</h2>
            <div className="armoury-crate-scenario-config-actions" aria-hidden="true">
              <ScenarioEditIcon />
              <ScenarioRefreshIcon />
            </div>
          </div>

          <div className="armoury-crate-scenario-config-divider" />

          <div className="armoury-crate-scenario-row">
            <div className="armoury-crate-scenario-row-label">
              <ScenarioTouchPadIcon />
              <span>Touch Pad</span>
            </div>
            <button
              type="button"
              className={`armoury-crate-audio-toggle ${profileState.touchPadEnabled ? 'enabled' : ''}`}
              onClick={() => onChange((previous) => ({ touchPadEnabled: !previous.touchPadEnabled }))}
            >
              <span className="armoury-crate-audio-toggle-label">{profileState.touchPadEnabled ? 'ON' : 'OFF'}</span>
              <span className="armoury-crate-audio-toggle-track">
                <span className="armoury-crate-audio-toggle-thumb" />
              </span>
            </button>
          </div>

          <div className="armoury-crate-scenario-row alt">
            <div className="armoury-crate-scenario-row-label">
              <ScenarioBatteryIcon />
              <span>Operating Mode On Battery</span>
            </div>
            <div className="armoury-crate-resource-select-shell scenario-select">
              <select
                value={profileState.batteryMode}
                onChange={(event) => onChange({ batteryMode: event.target.value })}
                className="armoury-crate-resource-select"
              >
                {SCENARIO_PROFILE_MODE_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="armoury-crate-resource-select-arrow" aria-hidden="true" />
            </div>
          </div>

          <div className="armoury-crate-scenario-row">
            <div className="armoury-crate-scenario-row-label">
              <ScenarioPlugIcon />
              <span>Operating Mode Plugged In</span>
            </div>
            <div className="armoury-crate-resource-select-shell scenario-select">
              <select
                value={profileState.pluggedMode}
                onChange={(event) => onChange({ pluggedMode: event.target.value })}
                className="armoury-crate-resource-select"
              >
                {SCENARIO_PROFILE_MODE_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="armoury-crate-resource-select-arrow" aria-hidden="true" />
            </div>
          </div>

          <div className="armoury-crate-scenario-subhead">
            <span className="armoury-crate-scenario-app-warning" aria-hidden="true" />
            <h3>App Configuration</h3>
          </div>

          <div className="armoury-crate-scenario-row alt">
            <div className="armoury-crate-scenario-row-label">
              <ScenarioAuraIcon />
              <span>Aura Sync</span>
            </div>
            <div className="armoury-crate-resource-select-shell scenario-select">
              <select
                value={profileState.auraEffect}
                onChange={(event) => onChange({ auraEffect: event.target.value })}
                className="armoury-crate-resource-select"
              >
                {['static', 'breathing', 'strobing', 'color cycle'].map((option) => (
                  <option key={option} value={option}>
                    {toScenarioOptionLabel(option)}
                  </option>
                ))}
              </select>
              <span className="armoury-crate-resource-select-arrow" aria-hidden="true" />
            </div>
          </div>

          <div className="armoury-crate-scenario-row">
            <div className="armoury-crate-scenario-row-label">
              <ScenarioAuraIcon />
              <span>Host device lighting effect brightness</span>
            </div>
            <div className="armoury-crate-scenario-slider-wrap">
              <div className="armoury-crate-lighting-slider-shell">
                <div className="armoury-crate-lighting-slider-fill" style={{ width: `${profileState.hostBrightness}%` }} />
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={profileState.hostBrightness}
                  onChange={(event) => onChange({ hostBrightness: Number(event.target.value) })}
                  aria-label="Scenario host device brightness"
                />
              </div>
            </div>
          </div>

          <div className="armoury-crate-scenario-row alt">
            <div className="armoury-crate-scenario-row-label">
              <ScenarioGameVisualIcon />
              <span>GameVisual</span>
            </div>
            <div className="armoury-crate-resource-select-shell scenario-select">
              <select
                value={profileState.gameVisual}
                onChange={(event) => onChange({ gameVisual: event.target.value })}
                className="armoury-crate-resource-select"
              >
                {SCENARIO_GAME_VISUAL_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <span className="armoury-crate-resource-select-arrow" aria-hidden="true" />
            </div>
          </div>

          <div className="armoury-crate-scenario-row">
            <div className="armoury-crate-scenario-row-label">
              <ScenarioBroomIcon />
              <span>Clear Cache</span>
            </div>
            <button
              type="button"
              className={`armoury-crate-audio-toggle ${profileState.clearCacheEnabled ? 'enabled' : ''}`}
              onClick={() => onChange((previous) => ({ clearCacheEnabled: !previous.clearCacheEnabled }))}
            >
              <span className="armoury-crate-audio-toggle-label">{profileState.clearCacheEnabled ? 'ON' : 'OFF'}</span>
              <span className="armoury-crate-audio-toggle-track">
                <span className="armoury-crate-audio-toggle-thumb" />
              </span>
            </button>
          </div>

          <div className="armoury-crate-scenario-footer">
            <button
              type="button"
              className="armoury-crate-scenario-save-button"
              onClick={onSave}
              disabled={!isDirty || isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button type="button" className="armoury-crate-scenario-apply-button" onClick={onApplyAndSave} disabled={isSaving}>
              {isSaving ? 'Applying...' : 'Apply & Save'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function ArmouryCrateDisplaySettingsPage({
  displayState,
  systemStats,
  performanceHistory,
  runningProcesses,
  gpuState,
  activeMode,
  panelPowerSaverEnabled,
  onChange
}) {
  const selectedPreset =
    DISPLAY_VISUAL_PRESETS.find((preset) => preset.id === displayState.selectedPreset) || DISPLAY_VISUAL_PRESETS[0]
  const recommendation = deriveDisplayRecommendation({ activeMode, systemStats, gpuState, runningProcesses })
  const cpuTrend = performanceHistory.slice(-24).map((entry) => Number(entry.cpu_usage) || 0)
  const cpuTrendPoints = cpuTrend.length > 1 ? createResourceMonitorSeries(cpuTrend, 100, 84) : ''
  const groupedApps = groupMemoryProcesses(runningProcesses).slice(0, 3)
  const gpuModeTitle = getGpuModeTitle(gpuState)
  const temperatureKelvin = getDisplayTemperatureKelvin(displayState.colorTemperature)
  const temperatureLabel = getDisplayTemperatureLabel(displayState.colorTemperature)
  const previewTint = getDisplayTemperatureTint(displayState.colorTemperature)
  const previewGlow = displayState.gameVisualEnabled ? selectedPreset.accent : '#6e6a65'
  const lastSyncedAt = formatArmouryTime(systemStats.timestamp || gpuState.updatedAt)

  return (
    <section className="armoury-crate-display-page">
      <header className="armoury-crate-display-header">
        <div className="armoury-crate-display-header-copy">
          <h1>Display Settings</h1>
        </div>

        <div className="armoury-crate-device-header-tools" aria-hidden="true">
          <DisplayHeaderIcon />
        </div>
      </header>

      <div className="armoury-crate-display-tab-row" role="tablist" aria-label="Display settings tabs">
        <button type="button" role="tab" aria-selected={true} className="armoury-crate-display-tab active">
          GameVisual
        </button>
      </div>

      <div className="armoury-crate-display-content">
        <section className="armoury-crate-display-hero">
          <div className="armoury-crate-display-hero-main">
            <div className="armoury-crate-display-toggle-row">
              <button
                type="button"
                className={`armoury-crate-audio-toggle ${displayState.gameVisualEnabled ? 'enabled' : ''}`}
                onClick={() => onChange({ gameVisualEnabled: !displayState.gameVisualEnabled })}
              >
                <span className="armoury-crate-audio-toggle-label">{displayState.gameVisualEnabled ? 'ON' : 'OFF'}</span>
                <span className="armoury-crate-audio-toggle-track">
                  <span className="armoury-crate-audio-toggle-thumb" />
                </span>
              </button>

              <div className="armoury-crate-display-hero-copy">
                <h2>GameVisual effect</h2>
                <p>
                  Multiple color modes are simulated here in the Armoury Crate style. The page follows the existing
                  system workload, GPU mode and running apps without introducing a new backend path.
                </p>
              </div>
            </div>

            <div className="armoury-crate-display-grid">
              {DISPLAY_VISUAL_PRESETS.map((preset) => {
                const isSelected = displayState.selectedPreset === preset.id
                const isRecommended = recommendation.id === preset.id
                return (
                  <DisplayPresetCard
                    key={preset.id}
                    preset={preset}
                    selected={isSelected}
                    recommended={isRecommended}
                    enabled={displayState.gameVisualEnabled}
                    onSelect={() =>
                      onChange({
                        gameVisualEnabled: true,
                        selectedPreset: preset.id,
                        lastUserSelectionAt: new Date().toISOString()
                      })
                    }
                  />
                )
              })}
            </div>
          </div>

          <aside
            className={`armoury-crate-display-preview ${displayState.gameVisualEnabled ? 'enabled' : 'disabled'}`}
            style={{
              '--display-preview-accent': previewGlow,
              '--display-preview-tint': previewTint
            }}
          >
            <div className="armoury-crate-display-preview-head">
              <span className="armoury-crate-display-preview-chip">Live Sync</span>
              <span>{lastSyncedAt}</span>
            </div>

            <div className="armoury-crate-display-preview-screen">
              <div className="armoury-crate-display-preview-overlay" />
              <div className="armoury-crate-display-preview-copy">
                <strong>{displayState.gameVisualEnabled ? selectedPreset.title : 'GameVisual Off'}</strong>
                <span>{displayState.gameVisualEnabled ? selectedPreset.description : 'The panel is using a neutral base image.'}</span>
              </div>
              {cpuTrendPoints ? (
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="armoury-crate-display-preview-graph" aria-hidden="true">
                  <polyline points={cpuTrendPoints} />
                </svg>
              ) : null}
            </div>

            <div className="armoury-crate-display-preview-stats">
              <DisplayStatusTile label="Recommended" value={getDisplayPresetTitle(recommendation.id)} detail={recommendation.reason} accent />
              <DisplayStatusTile label="Operating Mode" value={MODE_PRESETS[activeMode]?.label || 'Silent'} detail={`${gpuModeTitle} active`} />
              <DisplayStatusTile
                label="System Load"
                value={`${Math.round(systemStats.cpuUsage || 0)}% CPU / ${Math.round(systemStats.memoryUsagePercent || 0)}% RAM`}
                detail={`${systemStats.processCount || runningProcesses.length} running processes`}
              />
              <DisplayStatusTile
                label="Top App Focus"
                value={groupedApps[0]?.app || 'Idle desktop'}
                detail={groupedApps.length > 1 ? groupedApps.slice(1).map((app) => app.app).join(' | ') : 'No competing foreground load'}
              />
            </div>
          </aside>
        </section>

        <section className="armoury-crate-display-control-panel">
          <div className="armoury-crate-display-control-title">Color Temperature</div>
          <div className="armoury-crate-display-temperature-shell">
            <div className="armoury-crate-display-temperature-copy">
              <strong>{temperatureKelvin} K</strong>
              <span>{temperatureLabel}</span>
            </div>
            <div className="armoury-crate-display-temperature-slider">
              <input
                type="range"
                min="0"
                max="100"
                value={displayState.colorTemperature}
                onChange={(event) => onChange({ colorTemperature: Number(event.target.value) })}
                aria-label="Adjust color temperature"
              />
              <span className="armoury-crate-display-temperature-thumb" style={{ left: `${displayState.colorTemperature}%` }} aria-hidden="true" />
            </div>
          </div>
        </section>

        <section className="armoury-crate-display-settings-group">
          <div className="armoury-crate-section-heading">
            <span className="armoury-crate-section-accent" aria-hidden="true" />
            <h2>GameVisual Control</h2>
          </div>

          <div className="armoury-crate-display-settings-grid">
            <article className="armoury-crate-display-setting-card">
              <div className="armoury-crate-display-setting-copy">
                <h3>OSD</h3>
                <p>When turned on, an OSD will show the current GameVisual mode after each simulated reboot.</p>
              </div>
              <button
                type="button"
                className={`armoury-crate-audio-toggle ${displayState.osdEnabled ? 'enabled' : ''}`}
                onClick={() => onChange({ osdEnabled: !displayState.osdEnabled })}
              >
                <span className="armoury-crate-audio-toggle-label">{displayState.osdEnabled ? 'ON' : 'OFF'}</span>
                <span className="armoury-crate-audio-toggle-track">
                  <span className="armoury-crate-audio-toggle-thumb" />
                </span>
              </button>
            </article>

            <article className="armoury-crate-display-setting-card compact">
              <div className="armoury-crate-display-setting-copy">
                <h3>Panel Power Saver</h3>
                <p>{panelPowerSaverEnabled ? 'Enabled from System Configuration and reflected here.' : 'Disabled from System Configuration.'}</p>
              </div>
              <div className={`armoury-crate-display-pill ${panelPowerSaverEnabled ? 'active' : ''}`}>
                {panelPowerSaverEnabled ? 'Enabled' : 'Disabled'}
              </div>
            </article>

            <article className="armoury-crate-display-setting-card compact">
              <div className="armoury-crate-display-setting-copy">
                <h3>Backend Follow</h3>
                <p>Recommendation logic follows the current CPU, memory, process and GPU simulation state.</p>
              </div>
              <div className="armoury-crate-display-pill active">Linked</div>
            </article>
          </div>
        </section>
      </div>
    </section>
  )
}

function DisplayPresetCard({ preset, selected, recommended, enabled, onSelect }) {
  const badgeLabel = selected && recommended ? 'Live Match' : selected ? 'Selected' : recommended ? 'Recommended' : null

  return (
    <button
      type="button"
      className={`armoury-crate-display-card ${selected ? 'selected' : ''} ${!enabled ? 'effect-disabled' : ''}`}
      onClick={onSelect}
      style={{ '--display-card-accent': preset.accent }}
      aria-pressed={selected}
    >
      {badgeLabel ? <span className={`armoury-crate-display-card-badge ${selected ? 'selected' : 'recommended'}`}>{badgeLabel}</span> : null}
      <div className="armoury-crate-display-card-icon" aria-hidden="true">
        <DisplayModeVisualIcon modeId={preset.id} active={selected && enabled} />
      </div>
      <div className="armoury-crate-display-card-copy">
        <h3>{preset.title}</h3>
        <p>{preset.description}</p>
      </div>
    </button>
  )
}

function DisplayStatusTile({ label, value, detail, accent = false }) {
  return (
    <div className={`armoury-crate-display-status-tile ${accent ? 'accent' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  )
}

function ArmouryCrateDevicesPage({
  activeTab,
  onBack,
  onTabChange,
  memoryProcesses,
  memoryResources,
  selectedMemoryPids,
  isMemoryLoading,
  isMemoryFreeingUp,
  onRefreshMemory,
  onToggleMemoryProcess,
  onToggleAllMemoryProcesses,
  onFreeUpMemory,
  gpuPerformanceState,
  isGpuPerformanceLoading,
  isGpuPerformanceSaving,
  isGpuStoppingAll,
  isGpuProcessCollapsed,
  onRefreshGpuPerformance,
  onUpdateGpuMode,
  onToggleGpuReminder,
  onStopAllGpuProcesses,
  onToggleGpuProcessCollapse,
  lightingState,
  onLightingEffectChange,
  onLightingColorChange,
  onLightingBrightnessChange,
  onToggleLightingSettings,
  onResetLighting,
  audioState,
  onAudioStateChange,
  onResetAudio,
  resourceMonitorState,
  resourceMonitorRuntime,
  isResourceMonitorLoading,
  onResourceMonitorStateChange,
  deviceSettings,
  onToggleDeviceSetting
}) {
  const placeholder = DEVICE_TAB_PLACEHOLDERS[activeTab]
  const hideDeviceScrollbar = ['gpu-performance', 'lighting', 'audio', 'resource-monitor'].includes(activeTab)

  return (
    <div className={`armoury-crate-device-page ${hideDeviceScrollbar ? 'device-scroll-hidden' : ''}`}>
      <header className="armoury-crate-device-header">
        <div className="armoury-crate-device-header-copy">
          <button
            type="button"
            className="armoury-crate-device-back-button"
            aria-label="Back to Armoury Crate home"
            onClick={onBack}
          >
            <ArrowLeft size={28} strokeWidth={2} />
          </button>
          <h1>System Settings</h1>
        </div>

        <div className="armoury-crate-device-header-tools" aria-hidden="true">
          <DeviceHeaderIcon />
        </div>
      </header>

      <div className="armoury-crate-device-tab-row" role="tablist" aria-label="Device settings tabs">
        {DEVICE_TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`armoury-crate-device-tab ${isActive ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      <div className="armoury-crate-device-content">
        {activeTab === DEVICE_TAB_DEFAULT ? (
          <div className="armoury-crate-device-tile-grid">
            {SYSTEM_CONFIGURATION_TILES.map((tile) => (
              <DeviceFeatureTile
                key={tile.id}
                tile={tile}
                enabled={deviceSettings[tile.id]}
                onToggle={() => onToggleDeviceSetting(tile.id)}
              />
            ))}
          </div>
        ) : activeTab === 'memory' ? (
          <ArmouryCrateMemoryPage
            processes={memoryProcesses}
            resources={memoryResources}
            selectedPids={selectedMemoryPids}
            isLoading={isMemoryLoading}
            isFreeingUp={isMemoryFreeingUp}
            onRefresh={onRefreshMemory}
            onToggleProcess={onToggleMemoryProcess}
            onToggleAll={onToggleAllMemoryProcesses}
            onFreeUp={onFreeUpMemory}
          />
        ) : activeTab === 'gpu-performance' ? (
          <ArmouryCrateGpuPerformancePage
            gpuState={gpuPerformanceState}
            isLoading={isGpuPerformanceLoading}
            isSaving={isGpuPerformanceSaving}
            isStoppingAll={isGpuStoppingAll}
            isCollapsed={isGpuProcessCollapsed}
            onRefresh={onRefreshGpuPerformance}
            onModeChange={onUpdateGpuMode}
            onToggleReminder={onToggleGpuReminder}
            onStopAll={onStopAllGpuProcesses}
            onToggleCollapse={onToggleGpuProcessCollapse}
          />
        ) : activeTab === 'lighting' ? (
          <ArmouryCrateLightingPage
            lightingState={lightingState}
            onEffectChange={onLightingEffectChange}
            onColorChange={onLightingColorChange}
            onBrightnessChange={onLightingBrightnessChange}
            onToggleSettings={onToggleLightingSettings}
            onReset={onResetLighting}
          />
        ) : activeTab === 'audio' ? (
          <ArmouryCrateAudioPage
            audioState={audioState}
            onChange={onAudioStateChange}
            onReset={onResetAudio}
          />
        ) : activeTab === 'resource-monitor' ? (
          <ArmouryCrateResourceMonitorPage
            monitorState={resourceMonitorState}
            runtime={resourceMonitorRuntime}
            isLoading={isResourceMonitorLoading}
            onChange={onResourceMonitorStateChange}
          />
        ) : (
          <section className="armoury-crate-device-placeholder">
            <div className="armoury-crate-device-placeholder-inner">
              <div className="armoury-crate-device-placeholder-eyebrow">{placeholder.eyebrow}</div>
              <h2>{placeholder.title}</h2>
              <p>{placeholder.body}</p>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function DeviceFeatureTile({ tile, enabled, onToggle }) {
  const Icon = tile.icon
  return (
    <button
      type="button"
      className={`armoury-crate-device-tile ${tile.accent ? 'accented' : 'muted'} ${enabled ? 'enabled' : 'disabled'}`}
      aria-pressed={enabled}
      aria-label={`${tile.title} ${enabled ? 'on' : 'off'}`}
      onClick={onToggle}
    >
      <div className="armoury-crate-device-tile-icon" aria-hidden="true">
        <Icon />
      </div>
      <div className="armoury-crate-device-tile-copy">
        <h2>{tile.title}</h2>
        {tile.description ? <p>{tile.description}</p> : null}
      </div>
    </button>
  )
}

function ArmouryCrateMemoryPage({
  processes,
  resources,
  selectedPids,
  isLoading,
  isFreeingUp,
  onRefresh,
  onToggleProcess,
  onToggleAll,
  onFreeUp
}) {
  const groupedProcesses = groupMemoryProcesses(processes)
  const allSelected =
    groupedProcesses.length > 0 &&
    groupedProcesses.every((process) => process.pids.every((pid) => selectedPids.includes(pid)))

  return (
    <section className="armoury-crate-memory-panel">
      <div className="armoury-crate-memory-panel-header">
        <p>Select processes to disable while you're gaming.</p>
        <div className="armoury-crate-memory-panel-actions">
          <button
            type="button"
            className="armoury-crate-memory-action-button"
            onClick={onFreeUp}
            disabled={selectedPids.length === 0 || isFreeingUp}
          >
            {isFreeingUp ? 'Freeing...' : 'Free Up'}
          </button>
          <button type="button" className="armoury-crate-memory-collapse-button" aria-label="Collapse memory panel">
            <span />
          </button>
        </div>
      </div>

      <div className="armoury-crate-memory-table-shell">
        <div className="armoury-crate-memory-table-tools">
          <div className="armoury-crate-memory-chip">Application(s)</div>
          <button type="button" className="armoury-crate-memory-refresh-button" onClick={onRefresh}>
            Refresh
          </button>
        </div>

        <div className="armoury-crate-memory-table-head">
          <button
            type="button"
            className={`armoury-crate-memory-checkbox ${allSelected ? 'checked' : ''}`}
            aria-label={allSelected ? 'Deselect all processes' : 'Select all processes'}
            onClick={onToggleAll}
          />
          <div className="armoury-crate-memory-col process">Process</div>
          <div className="armoury-crate-memory-col cpu">CPU</div>
          <div className="armoury-crate-memory-col memory">Memory</div>
        </div>

        <div className="armoury-crate-memory-table-body">
          {groupedProcesses.length === 0 && !isLoading ? (
            <div className="armoury-crate-memory-empty">No running processes available.</div>
          ) : (
            groupedProcesses.map((process, index) => {
              const isSelected = process.pids.every((pid) => selectedPids.includes(pid))
              return (
                <div
                  key={process.app}
                  className={`armoury-crate-memory-row ${index % 2 === 1 ? 'alt' : ''} ${isSelected ? 'selected' : ''}`}
                >
                  <button
                    type="button"
                    className={`armoury-crate-memory-checkbox ${isSelected ? 'checked' : ''}`}
                    aria-label={`${isSelected ? 'Deselect' : 'Select'} ${process.app}`}
                    onClick={() => onToggleProcess(process.pids)}
                  />
                  <div className="armoury-crate-memory-process-cell">
                    <span>{process.app}</span>
                  </div>
                  <div className="armoury-crate-memory-value">{formatProcessCpu(process.cpu_usage)}</div>
                  <div className="armoury-crate-memory-value">{formatProcessMemory(process.memory)}</div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className="armoury-crate-memory-footer">
        <span>{groupedProcesses.length} apps shown</span>
        <span>{resources.processCount || processes.length} running processes</span>
        <span>{formatProcessMemory(resources.usedMemory || 0)} in use</span>
        <span>{formatProcessMemory(resources.availableMemory || 0)} available</span>
      </div>
    </section>
  )
}

function ArmouryCrateGpuPerformancePage({
  gpuState,
  isLoading,
  isSaving,
  isStoppingAll,
  isCollapsed,
  onRefresh,
  onModeChange,
  onToggleReminder,
  onStopAll,
  onToggleCollapse
}) {
  const processes = gpuState.processes || []

  return (
    <section className="armoury-crate-gpu-page">
      <div className="armoury-crate-gpu-heading">
        <span className="armoury-crate-gpu-heading-mark" aria-hidden="true" />
        <h2>GPU Mode</h2>
      </div>

      <div className="armoury-crate-gpu-mode-grid">
        {gpuState.modes.map((mode) => (
          <GpuModeCard
            key={mode.id}
            mode={mode}
            selected={gpuState.mode === mode.id}
            disabled={isSaving}
            onSelect={() => onModeChange(mode.id)}
          />
        ))}
      </div>

      <button
        type="button"
        className={`armoury-crate-gpu-reminder ${gpuState.reminderNotificationsEnabled ? 'checked' : ''}`}
        onClick={onToggleReminder}
        disabled={isSaving}
        aria-pressed={gpuState.reminderNotificationsEnabled}
      >
        <span className="armoury-crate-gpu-reminder-box" aria-hidden="true">
          <span />
        </span>
        <span>
          Allow pop-up notifications to remind you to stop all applications and save power when you are not using an
          external display.
        </span>
      </button>

      <section className="armoury-crate-gpu-process-panel">
        <div className="armoury-crate-gpu-process-header">
          <div className="armoury-crate-gpu-process-copy">
            <h3>Process</h3>
            <p>{isLoading ? 'Refreshing GPU process state...' : gpuState.statusMessage}</p>
          </div>

          <div className="armoury-crate-gpu-process-actions">
            <button
              type="button"
              className="armoury-crate-gpu-action-button"
              onClick={onStopAll}
              disabled={isLoading || isStoppingAll || processes.length === 0}
            >
              {isStoppingAll ? 'Stopping...' : 'Stop all'}
            </button>
            <button
              type="button"
              className="armoury-crate-gpu-action-button"
              onClick={onRefresh}
              disabled={isLoading}
            >
              Refresh
            </button>
            <button
              type="button"
              className={`armoury-crate-gpu-collapse-button ${isCollapsed ? 'collapsed' : ''}`}
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? 'Expand process table' : 'Collapse process table'}
            >
              <span />
            </button>
          </div>
        </div>

        {!isCollapsed ? (
          <div className="armoury-crate-gpu-process-table-shell">
            <div className="armoury-crate-gpu-process-table-head">
              <div>Process</div>
              <div className="cpu">CPU</div>
              <div className="memory">
                <span className="armoury-crate-gpu-sort-marker" aria-hidden="true" />
                <span>Memory</span>
              </div>
            </div>

            <div className="armoury-crate-gpu-process-table-body">
              {processes.length === 0 ? (
                <div className="armoury-crate-gpu-process-empty">
                  {isLoading ? 'Loading simulated GPU usage...' : 'No applications are currently using the discrete GPU.'}
                </div>
              ) : (
                processes.map((process, index) => (
                  <div key={process.pid} className={`armoury-crate-gpu-process-row ${index % 2 === 1 ? 'alt' : ''}`}>
                    <div className="armoury-crate-gpu-process-app">{process.app}</div>
                    <div className="armoury-crate-gpu-process-value">{formatProcessCpu(process.cpu_usage)}</div>
                    <div className="armoury-crate-gpu-process-value">{formatProcessMemory(process.memory)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}
      </section>
    </section>
  )
}

function ArmouryCrateLightingPage({
  lightingState,
  onEffectChange,
  onColorChange,
  onBrightnessChange,
  onToggleSettings,
  onReset
}) {
  const activeEffect = LIGHTING_EFFECTS.find((effect) => effect.id === lightingState.effect) || LIGHTING_EFFECTS[0]

  return (
    <section className="armoury-crate-lighting-page">
      <div className="armoury-crate-lighting-topbar">
        <div className="armoury-crate-gpu-heading armoury-crate-lighting-heading">
          <span className="armoury-crate-gpu-heading-mark" aria-hidden="true" />
          <h2>Basic Effects</h2>
        </div>

        <div className="armoury-crate-lighting-actions">
          <button
            type="button"
            className={`armoury-crate-lighting-top-button ${lightingState.settingsOpen ? 'active' : ''}`}
            onClick={onToggleSettings}
          >
            Settings
          </button>
          <button type="button" className="armoury-crate-lighting-top-button" onClick={onReset}>
            Reset to default
          </button>
        </div>
      </div>

      <div className="armoury-crate-lighting-layout">
        <div className="armoury-crate-lighting-effects">
          {LIGHTING_EFFECTS.map((effect) => {
            const Icon = effect.icon
            const isActive = lightingState.effect === effect.id
            return (
              <button
                key={effect.id}
                type="button"
                className={`armoury-crate-lighting-effect ${isActive ? 'active' : ''}`}
                onClick={() => onEffectChange(effect.id)}
              >
                <span className="armoury-crate-lighting-effect-icon" aria-hidden="true">
                  <Icon active={isActive} />
                </span>
                <span className="armoury-crate-lighting-effect-label">{effect.label}</span>
              </button>
            )
          })}
        </div>

        <section className="armoury-crate-lighting-panel">
          <div className="armoury-crate-lighting-panel-header">
            <h3>{activeEffect.label}</h3>
          </div>

          <div className="armoury-crate-lighting-panel-body">
            <div className="armoury-crate-lighting-color-block">
              <div className="armoury-crate-lighting-color-label">Color</div>
              <div className="armoury-crate-lighting-color-row">
                <button
                  type="button"
                  className="armoury-crate-lighting-color-preview"
                  style={{ '--lighting-preview': lightingState.color }}
                  aria-label={`Selected lighting color ${lightingState.color}`}
                />

                {lightingState.settingsOpen ? (
                  <div className="armoury-crate-lighting-swatch-row">
                    {LIGHTING_COLOR_PRESETS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`armoury-crate-lighting-swatch ${lightingState.color === color ? 'active' : ''}`}
                        style={{ '--lighting-preview': color }}
                        onClick={() => onColorChange(color)}
                        aria-label={`Set lighting color to ${color}`}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="armoury-crate-lighting-brightness">
              <div className="armoury-crate-lighting-brightness-head">
                <span>BRIGHTNESS</span>
                <strong>{lightingState.brightness}%</strong>
              </div>

              <div className="armoury-crate-lighting-slider-dots" aria-hidden="true">
                {[0, 25, 50, 75, 100].map((value) => (
                  <span key={value} className={lightingState.brightness >= value ? 'active' : ''} />
                ))}
              </div>

              <div className="armoury-crate-lighting-slider-shell">
                <div className="armoury-crate-lighting-slider-fill" style={{ width: `${lightingState.brightness}%` }} />
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={lightingState.brightness}
                  onChange={(event) => onBrightnessChange(Number(event.target.value))}
                  aria-label="Lighting brightness"
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
  )
}

function ArmouryCrateAudioPage({ audioState, onChange, onReset }) {
  return (
    <section className="armoury-crate-audio-page">
      <AudioModeSection
        title="Microphone Modes"
        enabled={audioState.microphoneEnabled}
        onToggle={() => onChange((previous) => ({ microphoneEnabled: !previous.microphoneEnabled }))}
      >
        <div className="armoury-crate-audio-card">
          <div className="armoury-crate-audio-subheading">General Noise Canceling</div>
          <div className="armoury-crate-audio-option-list">
            {AUDIO_MICROPHONE_MODES.map((mode) => (
              <AudioRadioOption
                key={mode.id}
                selected={audioState.microphoneMode === mode.id}
                title={mode.title}
                description={mode.description}
                icon={<AudioMicModeIcon variant={mode.id} />}
                onSelect={() => onChange({ microphoneMode: mode.id })}
              />
            ))}
          </div>

          <div className="armoury-crate-audio-subheading info">
            <span>Conference AI Noise Cancelling</span>
            <span className="armoury-crate-audio-info-mark" aria-hidden="true">
              i
            </span>
          </div>

          <div className="armoury-crate-audio-option-list">
            {AUDIO_CONFERENCE_MODES.map((mode) => (
              <div key={mode.id} className="armoury-crate-audio-option-stack">
                <AudioRadioOption
                  selected={audioState.conferenceMode === mode.id}
                  title={mode.title}
                  description={mode.description}
                  icon={<AudioConferenceIcon variant={mode.id} />}
                  onSelect={() => onChange({ conferenceMode: mode.id })}
                />

                {audioState.conferenceMode === mode.id ? (
                  <AudioIntensitySlider
                    value={audioState.conferenceLevel}
                    onChange={(value) => onChange({ conferenceLevel: value })}
                  />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </AudioModeSection>

      <AudioModeSection
        title="Speaker Modes"
        enabled={audioState.speakerEnabled}
        onToggle={() => onChange((previous) => ({ speakerEnabled: !previous.speakerEnabled }))}
      >
        <div className="armoury-crate-audio-card speaker-card">
          <div className="armoury-crate-audio-speaker-row">
            <span className="armoury-crate-audio-speaker-icon" aria-hidden="true">
              <AudioSpeakerIcon />
            </span>
            <div className="armoury-crate-audio-speaker-copy">
              <div className="armoury-crate-audio-speaker-title">
                <span>AI Noise-Canceling Speaker</span>
                <span className="armoury-crate-audio-info-mark" aria-hidden="true">
                  i
                </span>
              </div>
              <p>Filter out all sounds except human voices from the laptop speaker.</p>
            </div>
          </div>

          <AudioIntensitySlider value={audioState.speakerLevel} onChange={(value) => onChange({ speakerLevel: value })} />
        </div>
      </AudioModeSection>

      <div className="armoury-crate-audio-reset-row">
        <button type="button" className="armoury-crate-audio-reset-button" onClick={onReset}>
          Reset to default
        </button>
      </div>
    </section>
  )
}

function AudioModeSection({ title, enabled, onToggle, children }) {
  return (
    <section className="armoury-crate-audio-section">
      <div className="armoury-crate-audio-section-head">
        <h2>{title}</h2>
        <button type="button" className={`armoury-crate-audio-toggle ${enabled ? 'enabled' : ''}`} onClick={onToggle}>
          <span className="armoury-crate-audio-toggle-label">{enabled ? 'ON' : 'OFF'}</span>
          <span className="armoury-crate-audio-toggle-track">
            <span className="armoury-crate-audio-toggle-thumb" />
          </span>
        </button>
      </div>
      {children}
    </section>
  )
}

function AudioRadioOption({ selected, title, description, icon, onSelect }) {
  return (
    <button type="button" className={`armoury-crate-audio-option ${selected ? 'selected' : ''}`} onClick={onSelect}>
      <span className={`armoury-crate-audio-radio ${selected ? 'selected' : ''}`} aria-hidden="true">
        <span />
      </span>
      <span className="armoury-crate-audio-option-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="armoury-crate-audio-option-copy">
        <strong>{title}</strong>
        <span>{description}</span>
      </span>
    </button>
  )
}

function AudioIntensitySlider({ value, onChange }) {
  return (
    <div className="armoury-crate-audio-intensity">
      <div className="armoury-crate-audio-intensity-labels">
        <span>Low</span>
        <span>Mid</span>
        <span>High</span>
      </div>
      <div className="armoury-crate-audio-intensity-dots" aria-hidden="true">
        {[0, 50, 100].map((dotValue) => (
          <span key={dotValue} className={value >= dotValue ? 'active' : ''} />
        ))}
      </div>
      <div className="armoury-crate-audio-intensity-slider">
        <div className="armoury-crate-audio-intensity-fill" style={{ width: `${value}%` }} />
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-label="Audio intensity"
        />
      </div>
    </div>
  )
}

function ArmouryCrateResourceMonitorPage({ monitorState, runtime, isLoading, onChange }) {
  const [importActive, setImportActive] = useState(false)
  const graphPoints = createResourceMonitorSeries(runtime.history)
  const currentFps = monitorState.realtimeEnabled ? runtime.fps : 0
  const locationOptions = [
    'C:\\Users\\Princess Shaira\\Desktop',
    'C:\\Users\\Princess Shaira\\Documents',
    'C:\\Users\\Princess Shaira\\Downloads'
  ]

  useEffect(() => {
    if (!importActive) return undefined
    const timeoutId = window.setTimeout(() => setImportActive(false), 1400)
    return () => window.clearTimeout(timeoutId)
  }, [importActive])

  function handleBrowseLocation() {
    const currentIndex = locationOptions.indexOf(monitorState.logStorageLocation)
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % locationOptions.length
    onChange({ logStorageLocation: locationOptions[nextIndex] })
  }

  return (
    <section className="armoury-crate-resource-page">
      <div className="armoury-crate-resource-toolbar">
        <button
          type="button"
          className={`armoury-crate-resource-toolbar-button ${monitorState.recording ? 'active' : ''}`}
          onClick={() => onChange((previous) => ({ recording: !previous.recording }))}
        >
          <span className="armoury-crate-resource-record-dot" aria-hidden="true" />
          <span>{monitorState.recording ? 'Recording' : 'Record'}</span>
        </button>
        <button
          type="button"
          className={`armoury-crate-resource-toolbar-button ${importActive ? 'flash' : ''}`}
          onClick={() => setImportActive(true)}
        >
          Import
        </button>
      </div>

      <div className="armoury-crate-resource-layout">
        <section className="armoury-crate-resource-graph-shell">
          <div className="armoury-crate-resource-graph-grid" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="armoury-crate-resource-graph">
            <defs>
              <linearGradient id="armoury-crate-resource-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={monitorState.gradientEffect ? 'rgba(255, 0, 0, 0.35)' : 'rgba(255, 0, 0, 0.08)'} />
                <stop offset="100%" stopColor="rgba(255, 0, 0, 0)" />
              </linearGradient>
            </defs>
            <polygon
              points={`0,100 ${graphPoints} 100,100`}
              fill={monitorState.gradientEffect ? 'url(#armoury-crate-resource-fill)' : 'transparent'}
            />
            <polyline fill="none" stroke="#ff1616" strokeWidth="0.52" points={graphPoints} />
          </svg>
        </section>

        <div className="armoury-crate-resource-side-handle" aria-hidden="true">
          <span />
        </div>

        <aside className="armoury-crate-resource-panel">
          <div className="armoury-crate-resource-panel-section">
            <label className="armoury-crate-resource-label">Monitor Level</label>
            <div className="armoury-crate-resource-select-shell">
              <select
                value={monitorState.monitorLevel}
                onChange={(event) => onChange({ monitorLevel: event.target.value })}
                className="armoury-crate-resource-select"
              >
                {RESOURCE_MONITOR_LEVEL_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <span className="armoury-crate-resource-select-arrow" aria-hidden="true" />
            </div>
          </div>

          <div className="armoury-crate-resource-panel-section compact">
            <div className="armoury-crate-resource-fps-head">
              <span>FPS</span>
              <div className="armoury-crate-resource-fps-meter" aria-hidden="true">
                <span style={{ width: `${Math.max(12, (currentFps / 165) * 100)}%` }} />
              </div>
            </div>
            <div className="armoury-crate-resource-fps-value">{isLoading ? 'Loading...' : `${currentFps} FPS`}</div>
          </div>

          <div className="armoury-crate-resource-toggle-row">
            <span>Gradient effect</span>
            <button
              type="button"
              className={`armoury-crate-audio-toggle ${monitorState.gradientEffect ? 'enabled' : ''}`}
              onClick={() => onChange((previous) => ({ gradientEffect: !previous.gradientEffect }))}
            >
              <span className="armoury-crate-audio-toggle-label">{monitorState.gradientEffect ? 'ON' : 'OFF'}</span>
              <span className="armoury-crate-audio-toggle-track">
                <span className="armoury-crate-audio-toggle-thumb" />
              </span>
            </button>
          </div>

          <div className="armoury-crate-resource-toggle-row">
            <span>Real-time Monitor</span>
            <button
              type="button"
              className={`armoury-crate-audio-toggle ${monitorState.realtimeEnabled ? 'enabled' : ''}`}
              onClick={() => onChange((previous) => ({ realtimeEnabled: !previous.realtimeEnabled }))}
            >
              <span className="armoury-crate-audio-toggle-label">{monitorState.realtimeEnabled ? 'ON' : 'OFF'}</span>
              <span className="armoury-crate-audio-toggle-track">
                <span className="armoury-crate-audio-toggle-thumb" />
              </span>
            </button>
          </div>

          <button type="button" className="armoury-crate-resource-settings-button">
            Real-time Monitor Settings
          </button>

          <div className="armoury-crate-resource-panel-section">
            <label className="armoury-crate-resource-label">View</label>
            <div className="armoury-crate-resource-select-shell">
              <select
                value={monitorState.view}
                onChange={(event) => onChange({ view: event.target.value })}
                className="armoury-crate-resource-select"
              >
                {RESOURCE_MONITOR_VIEW_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <span className="armoury-crate-resource-select-arrow" aria-hidden="true" />
            </div>
          </div>

          <div className="armoury-crate-resource-panel-section">
            <label className="armoury-crate-resource-label">Log Storage Location</label>
            <input
              type="text"
              value={monitorState.logStorageLocation}
              readOnly
              className="armoury-crate-resource-input"
            />
          </div>

          <button type="button" className="armoury-crate-resource-settings-button" onClick={handleBrowseLocation}>
            Browse
          </button>
        </aside>
      </div>
    </section>
  )
}

function GpuModeCard({ mode, selected, disabled, onSelect }) {
  return (
    <button
      type="button"
      className={`armoury-crate-gpu-card ${selected ? 'selected' : ''}`}
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
    >
      <div className="armoury-crate-gpu-card-icon" aria-hidden="true">
        {mode.id === 'standard' ? <GpuStandardIcon active={selected} /> : null}
        {mode.id === 'eco' ? <GpuEcoIcon active={selected} /> : null}
        {mode.id === 'optimized' ? <GpuOptimizedIcon active={selected} /> : null}
      </div>
      <h3>{mode.title}</h3>
      <p>{mode.summary}</p>
    </button>
  )
}

function GpuStandardIcon({ active }) {
  return (
    <svg viewBox="0 0 96 96" className={`armoury-crate-gpu-chip-icon ${active ? 'active' : ''}`}>
      <path
        d="M29 12h38l17 17v38L67 84H29L12 67V29Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      <path
        d="M24 26h8M24 35h6M24 44h6M24 53h6M24 62h8M72 26h8M74 35h6M74 44h6M74 53h6M72 62h8M36 18v6M45 18v6M54 18v6M63 18v6M36 72v6M45 72v6M54 72v6M63 72v6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <path d="M33 33h30v21H33z" fill="none" stroke="currentColor" strokeWidth="2.8" />
      <path
        d="M38 50V38h7c2.9 0 4.6 1.8 4.6 4.1 0 2.2-1.7 4.1-4.6 4.1H42M54 38v12M54 38h8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function GpuEcoIcon({ active }) {
  return (
    <svg viewBox="0 0 96 96" className={`armoury-crate-gpu-chip-icon ${active ? 'active' : ''}`}>
      <path
        d="M29 12h38l17 17v38L67 84H29L12 67V29Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      <path
        d="M24 26h8M24 35h6M24 44h6M24 53h6M24 62h8M72 26h8M74 35h6M74 44h6M74 53h6M72 62h8M36 18v6M45 18v6M54 18v6M63 18v6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <path
        d="M29 71c4-12 12-20 23-24-2 10-5 17-11 23-4 4-8 6-12 6ZM47 70c0-12 5-22 16-30 4 11 3 21-1 29-3 6-8 10-15 12ZM32 40h27v17H32z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M38 50V38h7c2.9 0 4.6 1.8 4.6 4.1 0 2.2-1.7 4.1-4.6 4.1H42M54 38v12M54 38h8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function GpuOptimizedIcon({ active }) {
  return (
    <svg viewBox="0 0 96 96" className={`armoury-crate-gpu-chip-icon ${active ? 'active' : ''}`}>
      <path
        d="M29 12h38l17 17v38L67 84H29L12 67V29Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      <path
        d="M24 26h8M24 35h6M24 44h6M24 53h6M24 62h8M72 26h8M74 35h6M74 44h6M74 53h6M72 62h8M36 18v6M45 18v6M54 18v6M63 18v6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <path d="M32 31h28v16H32z" fill="none" stroke="currentColor" strokeWidth="2.8" />
      <path
        d="M38 44V34h6.4c2.8 0 4.4 1.5 4.4 3.5S47.2 41 44.4 41H42M53 34v10M53 34h7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M48 49c-9 0-16 7-16 16v7c0 2 1.6 3 3.7 3h24.6c2.1 0 3.7-1 3.7-3v-7c0-9-7-16-16-16Zm0 3.5a7.3 7.3 0 1 1 0 14.6a7.3 7.3 0 0 1 0-14.6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LightingStaticIcon({ active }) {
  return (
    <svg viewBox="0 0 88 88" className={`armoury-crate-lighting-icon ${active ? 'active' : ''}`}>
      <circle cx="44" cy="44" r="26" fill="none" stroke="currentColor" strokeWidth="7" />
      <circle cx="44" cy="44" r="8.5" fill="currentColor" />
    </svg>
  )
}

function LightingBreathingIcon({ active }) {
  return (
    <svg viewBox="0 0 88 88" className={`armoury-crate-lighting-icon ${active ? 'active' : ''}`}>
      <path
        d="M13 48h15l10-23 14 39 8-17h15"
        fill="none"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinejoin="miter"
        strokeLinecap="square"
      />
    </svg>
  )
}

function LightingStrobingIcon({ active }) {
  return (
    <svg viewBox="0 0 88 88" className={`armoury-crate-lighting-icon ${active ? 'active' : ''}`}>
      <path d="M21 44 40 24l9 9-11 11 11 11-9 9Z" fill="none" stroke="currentColor" strokeWidth="7" strokeLinejoin="miter" />
      <path d="M56 28 72 44 56 60 40 44Z" fill="currentColor" />
    </svg>
  )
}

function LightingColorCycleIcon({ active }) {
  return (
    <svg viewBox="0 0 88 88" className={`armoury-crate-lighting-icon ${active ? 'active' : ''}`}>
      <path d="M44 18a26 26 0 0 1 22 13" fill="none" stroke="currentColor" strokeWidth="7" />
      <path d="M69 41a26 26 0 0 1-10 27" fill="none" stroke="currentColor" strokeWidth="7" />
      <path d="M50 72a26 26 0 0 1-28-8" fill="none" stroke="currentColor" strokeWidth="7" opacity="0.3" />
      <circle cx="44" cy="44" r="8.5" fill="currentColor" />
    </svg>
  )
}

function AudioMicModeIcon({ variant }) {
  return (
    <svg viewBox="0 0 96 96" className="armoury-crate-audio-mode-icon">
      <circle cx="48" cy="48" r="33" fill="rgba(255, 166, 28, 0.12)" stroke="#f29f16" strokeWidth="2" />
      <circle cx="48" cy="48" r="20" fill="#242321" stroke="#3b3935" strokeWidth="2" />
      <path d="M38 38h20v14H38zM42 42h8M42 46h11M42 50h7" fill="none" stroke="#ece8e2" strokeWidth="2.2" strokeLinecap="round" />
      {variant === 'directional' ? <path d="M48 63l-8 8h16Z" fill="#f29f16" /> : null}
      {variant === 'stereo' ? <path d="M20 48l6-6v12Zm50 0 6-6v12ZM48 70l-6 6h12Z" fill="#f29f16" opacity="0.95" /> : null}
      {variant === '360' ? <path d="M20 48l6-6v12Zm50 0 6-6v12ZM48 20l-6 6h12ZM48 76l-6-6h12Z" fill="#f29f16" opacity="0.95" /> : null}
    </svg>
  )
}

function AudioConferenceIcon({ variant }) {
  return (
    <svg viewBox="0 0 96 96" className="armoury-crate-audio-mode-icon">
      <circle cx="48" cy="48" r="33" fill="rgba(255, 166, 28, 0.12)" stroke="#f29f16" strokeWidth="2" />
      <circle cx="48" cy="48" r="20" fill="#242321" stroke="#3b3935" strokeWidth="2" />
      <path d="M38 38h20v14H38zM42 42h8M42 46h11M42 50h7" fill="none" stroke="#ece8e2" strokeWidth="2.2" strokeLinecap="round" />
      {variant === 'single' ? (
        <path d="M30 69c5-6 12-9 18-9s13 3 18 9M48 69V60" fill="none" stroke="#f29f16" strokeWidth="2.1" strokeLinecap="round" />
      ) : (
        <path d="M28 64v10M33 61v16M38 58v22M58 58v22M63 61v16M68 64v10" fill="none" stroke="#f29f16" strokeWidth="2.1" strokeLinecap="round" />
      )}
    </svg>
  )
}

function AudioSpeakerIcon() {
  return (
    <svg viewBox="0 0 142 74" className="armoury-crate-audio-speaker-svg">
      <path d="M15 36h22M6 24v24M23 16v40M31 22v28M106 22v28M115 18v36M123 25v22M132 30v12" fill="none" stroke="#f29f16" strokeWidth="3" strokeLinecap="round" />
      <path d="M55 25 39 36l16 11V25Zm6 0v22M75 28c6 4 9 10 9 19s-3 15-9 19M88 22c9 7 14 15 14 25 0 11-5 19-14 26" fill="none" stroke="#ece8e2" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

function AuraSyncLaptopIcon() {
  return (
    <svg viewBox="0 0 112 96" className="armoury-crate-aura-laptop-icon">
      <path
        d="M28 25h56v34H28zM22 64h68l-7 8H29Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="4.2"
        strokeLinejoin="round"
      />
      <path d="M37 35h38M37 47h26" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.42" />
    </svg>
  )
}

function AuraEffectStaticIcon({ active }) {
  return <LightingStaticIcon active={active} />
}

function AuraEffectBreathingIcon({ active }) {
  return <LightingBreathingIcon active={active} />
}

function AuraEffectStrobingIcon({ active }) {
  return <LightingStrobingIcon active={active} />
}

function AuraEffectColorCycleIcon({ active }) {
  return <LightingColorCycleIcon active={active} />
}

function AuraEffectRainbowIcon({ active }) {
  return (
    <svg viewBox="0 0 88 88" className={`armoury-crate-lighting-icon ${active ? 'active' : ''}`}>
      <path d="M18 56a26 26 0 0 1 52 0" fill="none" stroke="currentColor" strokeWidth="6" />
      <path d="M26 56a18 18 0 0 1 36 0" fill="none" stroke="currentColor" strokeWidth="6" />
      <path d="M34 56a10 10 0 0 1 20 0" fill="none" stroke="currentColor" strokeWidth="6" />
    </svg>
  )
}

function AuraEffectStarryNightIcon({ active }) {
  return (
    <svg viewBox="0 0 88 88" className={`armoury-crate-lighting-icon ${active ? 'active' : ''}`}>
      <path d="M44 18l6 12 13 2-9 9 2 13-12-6-12 6 2-13-9-9 13-2Z" fill="none" stroke="currentColor" strokeWidth="5" strokeLinejoin="round" />
      <circle cx="62" cy="18" r="4" fill="currentColor" />
      <circle cx="22" cy="58" r="3.5" fill="currentColor" opacity="0.9" />
    </svg>
  )
}

function AuraEffectMusicIcon({ active }) {
  return (
    <svg viewBox="0 0 88 88" className={`armoury-crate-lighting-icon ${active ? 'active' : ''}`}>
      <path d="M16 62V38M26 62V26M36 62V32M46 62V20M56 62V28M66 62V40" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="square" />
    </svg>
  )
}

function AuraEffectSmartIcon({ active }) {
  return (
    <svg viewBox="0 0 88 88" className={`armoury-crate-lighting-icon ${active ? 'active' : ''}`}>
      <path d="M44 19v20M29 35a18 18 0 1 1 30 13M33 58h22" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      <circle cx="44" cy="56" r="9" fill="none" stroke="currentColor" strokeWidth="6" />
      <circle cx="44" cy="56" r="2.8" fill="currentColor" />
    </svg>
  )
}

function AuraEffectAdaptiveColorIcon({ active }) {
  return (
    <svg viewBox="0 0 88 88" className={`armoury-crate-lighting-icon ${active ? 'active' : ''}`}>
      <path d="M22 24h18M22 24v18M66 24H48M66 24v18M22 64h18M22 64V46M66 64H48M66 64V46" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="square" />
      <path d="M52 52h14M59 45v14" fill="none" stroke="currentColor" strokeWidth="6" />
    </svg>
  )
}

function AuraEffectDarkIcon({ active }) {
  return (
    <svg viewBox="0 0 88 88" className={`armoury-crate-lighting-icon ${active ? 'active' : ''}`}>
      <circle cx="44" cy="44" r="22" fill="none" stroke="currentColor" strokeWidth="6" />
      <path d="M26 26 62 62" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
    </svg>
  )
}

function AuraEffectAiLightingIcon({ active }) {
  return (
    <svg viewBox="0 0 88 88" className={`armoury-crate-lighting-icon ${active ? 'active' : ''}`}>
      <path d="M44 18 64 38 44 58 24 38Z" fill="none" stroke="currentColor" strokeWidth="6" />
      <circle cx="44" cy="18" r="4.2" fill="currentColor" />
      <circle cx="68" cy="34" r="4.2" fill="currentColor" />
      <circle cx="20" cy="42" r="4.2" fill="currentColor" />
      <circle cx="60" cy="66" r="4.2" fill="currentColor" />
    </svg>
  )
}

function AuraCreatorIcon() {
  return (
    <svg viewBox="0 0 92 92" className="armoury-crate-aura-creator-icon">
      <defs>
        <linearGradient id="aura-creator-gradient" x1="0" x2="1" y1="1" y2="0">
          <stop offset="0%" stopColor="#ff00b8" />
          <stop offset="32%" stopColor="#0070ff" />
          <stop offset="68%" stopColor="#00f57b" />
          <stop offset="100%" stopColor="#ffe600" />
        </linearGradient>
      </defs>
      <path d="M46 12 84 78H8Z" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" />
      <path d="M46 22 72 72H20Z" fill="url(#aura-creator-gradient)" />
      <path d="M35 52 48 36l6 18-7 7Z" fill="#0b0b0b" />
    </svg>
  )
}

function ScenarioProfileBadgeIcon() {
  return (
    <svg viewBox="0 0 76 76" className="armoury-crate-scenario-badge-icon">
      <path d="M18 14h28l16 24-16 24H18Z" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinejoin="round" />
      <path d="M29 24h13l8 14-8 14H29Z" fill="none" stroke="currentColor" strokeWidth="3.1" strokeLinejoin="round" />
    </svg>
  )
}

function ScenarioEditIcon() {
  return (
    <svg viewBox="0 0 30 30" className="armoury-crate-scenario-inline-icon">
      <path d="M6 23h18M8 20l11-11 3 3-11 11H8Z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ScenarioRefreshIcon() {
  return (
    <svg viewBox="0 0 30 30" className="armoury-crate-scenario-inline-icon">
      <path d="M10 11a8 8 0 1 1-2 10M10 11V6M10 11h5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ScenarioTouchPadIcon() {
  return (
    <svg viewBox="0 0 38 30" className="armoury-crate-scenario-row-icon">
      <path d="M4 6h24v16H4zM4 18h24M16 18v4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
    </svg>
  )
}

function ScenarioBatteryIcon() {
  return (
    <svg viewBox="0 0 38 30" className="armoury-crate-scenario-row-icon">
      <path d="M6 9h22v12H6zM28 13h3M16 15h4M18 13v4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ScenarioPlugIcon() {
  return (
    <svg viewBox="0 0 38 30" className="armoury-crate-scenario-row-icon">
      <path d="M14 6v7M22 6v7M11 13h14v5l-6 6h-2l-6-6Z" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ScenarioAuraIcon() {
  return (
    <svg viewBox="0 0 38 30" className="armoury-crate-scenario-row-icon">
      <path d="M19 6 28 20H10Z" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
      <path d="M16 12h6M14 16h10M12 20h14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function ScenarioGameVisualIcon() {
  return (
    <svg viewBox="0 0 38 30" className="armoury-crate-scenario-row-icon">
      <path d="M4 6h24v15H4zM8 10h3M13 10h3M8 14h8M8 18h11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 23h8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function DisplayHeaderIcon() {
  return (
    <svg viewBox="0 0 112 74" role="img">
      <g fill="none" stroke="#f2f2f2" strokeWidth="2.2" strokeLinecap="square" strokeLinejoin="miter">
        <path d="M28 14H50V56H28Z" />
        <path d="M52 58H26" />
        <path d="M63 18V52" />
        <path d="M72 14V58" opacity="0.4" />
        <path d="M81 24V48" opacity="0.6" />
        <path d="M90 20V54" opacity="0.25" />
      </g>
    </svg>
  )
}

function DisplayModeVisualIcon({ modeId, active = false }) {
  const stroke = active ? '#f7f2e9' : '#c4c0bb'
  const fill = active ? 'rgba(245, 166, 35, 0.9)' : 'rgba(255, 255, 255, 0.16)'

  if (modeId === 'default') {
    return (
      <svg viewBox="0 0 96 96" role="img">
        <path d="M28 22h25l13 18-11 19H28Z" fill={fill} opacity="0.3" />
        <path d="M28 22h25l13 18-11 19H28Z" fill="none" stroke={stroke} strokeWidth="4.5" strokeLinejoin="round" />
        <path d="M40 34h12l7 10-6 10H40Z" fill={active ? '#f5a623' : '#8f8a84'} />
      </svg>
    )
  }

  if (modeId === 'racing') {
    return (
      <svg viewBox="0 0 96 96" role="img">
        <path d="M22 28 44 48 22 68" fill="none" stroke={stroke} strokeWidth="6" strokeLinecap="square" strokeLinejoin="miter" />
        <path d="M42 24 68 48 42 72" fill="none" stroke={stroke} strokeWidth="8" strokeLinecap="square" strokeLinejoin="miter" opacity="0.8" />
        <path d="M72 56v10" fill="none" stroke={active ? '#f5a623' : '#8f8a84'} strokeWidth="6" strokeLinecap="square" />
      </svg>
    )
  }

  if (modeId === 'scenery') {
    return (
      <svg viewBox="0 0 96 96" role="img">
        <circle cx="29" cy="24" r="6" fill={stroke} opacity="0.9" />
        <path d="M18 64 36 34 50 64Z" fill={stroke} opacity="0.92" />
        <path d="M42 64 61 24 80 64Z" fill={active ? '#f5a623' : stroke} opacity={active ? '0.86' : '0.62'} />
      </svg>
    )
  }

  if (modeId === 'rts-rpg') {
    return (
      <svg viewBox="0 0 96 96" role="img">
        <path d="M28 26h18l-18 18Z" fill={stroke} opacity="0.9" />
        <circle cx="56" cy="54" r="17" fill={active ? '#f5a623' : 'rgba(255,255,255,0.28)'} />
        <path d="M34 70h20l12-12" fill="none" stroke={stroke} strokeWidth="6" strokeLinecap="square" />
      </svg>
    )
  }

  if (modeId === 'fps') {
    return (
      <svg viewBox="0 0 96 96" role="img">
        <circle cx="48" cy="48" r="24" fill="none" stroke={stroke} strokeWidth="5" opacity="0.9" />
        <circle cx="48" cy="48" r="9" fill={active ? '#f5a623' : 'rgba(255,255,255,0.28)'} />
        <path d="M48 20v12M48 64v12M20 48h12M64 48h12" fill="none" stroke={stroke} strokeWidth="5" strokeLinecap="square" />
      </svg>
    )
  }

  if (modeId === 'cinema') {
    return (
      <svg viewBox="0 0 96 96" role="img">
        <path d="M24 36h48v28H24Z" fill={stroke} opacity="0.28" />
        <path d="M24 36h48v28H24Z" fill="none" stroke={stroke} strokeWidth="4.5" />
        <path d="M24 36 40 28M48 36l16-8M24 64l16-8M48 64l16-8" fill="none" stroke={active ? '#f5a623' : stroke} strokeWidth="4.5" strokeLinecap="square" opacity="0.85" />
      </svg>
    )
  }

  if (modeId === 'eyecare') {
    return (
      <svg viewBox="0 0 96 96" role="img">
        <path d="M18 48c9-14 18-21 30-21s21 7 30 21c-9 14-18 21-30 21S27 62 18 48Z" fill="none" stroke={stroke} strokeWidth="5" strokeLinejoin="round" />
        <circle cx="48" cy="48" r="10" fill={active ? '#f5a623' : 'rgba(255,255,255,0.28)'} />
      </svg>
    )
  }

  if (modeId === 'vivid') {
    return (
      <svg viewBox="0 0 96 96" role="img">
        <path d="M20 24 36 72h9l10-28 10 28h9l16-48" fill="none" stroke={stroke} strokeWidth="7" strokeLinecap="square" strokeLinejoin="miter" />
        <path d="M48 35 54 52" fill="none" stroke={active ? '#f5a623' : '#8f8a84'} strokeWidth="7" strokeLinecap="square" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 96 96" role="img">
      <path d="M48 22a26 26 0 1 1 0 52V22Z" fill={stroke} opacity="0.85" />
      <path d="M48 22a26 26 0 1 1 0 52V22Z" fill="none" stroke={stroke} strokeWidth="4.5" />
      <path d="M48 28V68" fill="none" stroke={active ? '#f5a623' : '#8f8a84'} strokeWidth="5" strokeLinecap="square" />
    </svg>
  )
}

function ScenarioBroomIcon() {
  return (
    <svg viewBox="0 0 38 30" className="armoury-crate-scenario-row-icon">
      <path d="M18 6v8M15 14h6l3 10H12Z" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

function groupMemoryProcesses(processes) {
  const grouped = new Map()

  processes.forEach((process) => {
    if (!grouped.has(process.app)) {
      grouped.set(process.app, {
        app: process.app,
        cpu_usage: 0,
        memory: 0,
        pids: []
      })
    }

    const entry = grouped.get(process.app)
    entry.cpu_usage += typeof process.cpu_usage === 'number' ? process.cpu_usage : 0
    entry.memory += typeof process.memory === 'number' ? process.memory : 0
    entry.pids.push(process.pid)
  })

  return [...grouped.values()].sort((left, right) => right.memory - left.memory)
}

function formatProcessCpu(value) {
  const cpuValue = typeof value === 'number' ? Math.max(0, Math.round(value)) : 0
  return `${cpuValue} %`
}

function formatProcessMemory(value) {
  return `${Math.max(0, Math.round(value || 0))} MB`
}

function getDisplayPresetTitle(presetId) {
  return DISPLAY_VISUAL_PRESETS.find((preset) => preset.id === presetId)?.title || 'Default'
}

function getGpuModeTitle(gpuState) {
  return gpuState?.modes?.find((mode) => mode.id === gpuState.mode)?.title || 'Eco Mode'
}

function getDisplayTemperatureKelvin(value) {
  const safeValue = clampValue(Number(value) || 0, 0, 100)
  if (safeValue <= 50) {
    return Math.round(3900 + (safeValue / 50) * 2600)
  }

  return Math.round(6500 + ((safeValue - 50) / 50) * 2100)
}

function getDisplayTemperatureLabel(value) {
  const safeValue = clampValue(Number(value) || 0, 0, 100)
  if (safeValue <= 28) return 'Warm'
  if (safeValue >= 72) return 'Cool'
  return 'Neutral'
}

function getDisplayTemperatureTint(value) {
  const safeValue = clampValue(Number(value) || 0, 0, 100)
  if (safeValue <= 40) return '#ff9f4a'
  if (safeValue >= 60) return '#8fdcf9'
  return '#efe9de'
}

function formatArmouryTime(timestamp) {
  if (!timestamp) return 'Waiting for sync'

  try {
    return new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  } catch (error) {
    return 'Waiting for sync'
  }
}

function deriveDisplayRecommendation({ activeMode, systemStats, gpuState, runningProcesses }) {
  const cpuUsage = Number(systemStats?.cpuUsage) || 0
  const memoryUsagePercent = Number(systemStats?.memoryUsagePercent) || 0
  const processCount = Number(systemStats?.processCount) || runningProcesses.length
  const gpuMode = gpuState?.mode || 'eco'
  const hasDesktopWorkload = runningProcesses.some((process) => ['Web Browser', 'Files', 'Local Files', 'Notes'].includes(process.app))

  if (gpuMode === 'eco' && cpuUsage < 18 && processCount <= 5) {
    return {
      id: 'e-reading',
      reason: 'Eco GPU routing and a light workload favor a softer reading profile.'
    }
  }

  if (activeMode === 'silent' && cpuUsage < 28) {
    return {
      id: 'eyecare',
      reason: 'Lower thermals and quiet mode fit longer reading or study sessions.'
    }
  }

  if (activeMode === 'turbo' || cpuUsage >= 72) {
    return {
      id: 'fps',
      reason: 'High activity matches stronger dark-scene contrast for faster response.'
    }
  }

  if (gpuMode === 'standard' && cpuUsage >= 50) {
    return {
      id: 'racing',
      reason: 'Discrete GPU availability and rising load fit motion-focused tuning.'
    }
  }

  if (memoryUsagePercent >= 65 || processCount >= 12) {
    return {
      id: 'rts-rpg',
      reason: 'Heavier multitasking benefits from sharper UI edges and stronger separation.'
    }
  }

  if (gpuMode === 'optimized' && cpuUsage >= 34) {
    return {
      id: 'vivid',
      reason: 'Balanced GPU routing supports extra saturation without overcommitting thermals.'
    }
  }

  if (hasDesktopWorkload) {
    return {
      id: 'default',
      reason: 'The current app mix looks closer to browsing and desktop use than gaming.'
    }
  }

  return {
    id: 'scenery',
    reason: 'Moderate system activity leaves room for a brighter, more vibrant image profile.'
  }
}

function mapScenarioGameVisualToDisplayPreset(value) {
  const normalizedValue = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')

  const exactMatch = DISPLAY_VISUAL_PRESETS.find((preset) => preset.id === normalizedValue)
  if (exactMatch) return exactMatch.id

  const titleMatch = DISPLAY_VISUAL_PRESETS.find((preset) => preset.title.toLowerCase() === String(value || '').trim().toLowerCase())
  return titleMatch?.id || DEFAULT_DISPLAY_SETTINGS_STATE.selectedPreset
}

function loadArmouryDeviceSettings() {
  try {
    const savedSettings = localStorage.getItem(ARMOURY_DEVICE_SETTINGS_STORAGE_KEY)
    if (!savedSettings) return DEFAULT_DEVICE_SETTINGS

    const parsed = JSON.parse(savedSettings)
    return {
      ...DEFAULT_DEVICE_SETTINGS,
      ...parsed
    }
  } catch (error) {
    console.warn('Failed to load Armoury Crate device settings:', error)
    return DEFAULT_DEVICE_SETTINGS
  }
}

function loadArmouryLightingState() {
  try {
    const savedState = localStorage.getItem(ARMOURY_LIGHTING_STATE_STORAGE_KEY)
    if (!savedState) return DEFAULT_LIGHTING_STATE

    const parsed = JSON.parse(savedState)
    return {
      ...DEFAULT_LIGHTING_STATE,
      ...parsed
    }
  } catch (error) {
    console.warn('Failed to load Armoury Crate lighting state:', error)
    return DEFAULT_LIGHTING_STATE
  }
}

function loadArmouryAudioState() {
  try {
    const savedState = localStorage.getItem(ARMOURY_AUDIO_STATE_STORAGE_KEY)
    if (!savedState) return DEFAULT_AUDIO_STATE

    const parsed = JSON.parse(savedState)
    return {
      ...DEFAULT_AUDIO_STATE,
      ...parsed
    }
  } catch (error) {
    console.warn('Failed to load Armoury Crate audio state:', error)
    return DEFAULT_AUDIO_STATE
  }
}

function loadArmouryResourceMonitorState() {
  try {
    const savedState = localStorage.getItem(ARMOURY_RESOURCE_MONITOR_STATE_STORAGE_KEY)
    if (!savedState) return DEFAULT_RESOURCE_MONITOR_STATE

    const parsed = JSON.parse(savedState)
    return {
      ...DEFAULT_RESOURCE_MONITOR_STATE,
      ...parsed
    }
  } catch (error) {
    console.warn('Failed to load Armoury Crate resource monitor state:', error)
    return DEFAULT_RESOURCE_MONITOR_STATE
  }
}

function loadArmouryAuraSyncState() {
  try {
    const savedState = localStorage.getItem(ARMOURY_AURA_SYNC_STATE_STORAGE_KEY)
    if (!savedState) return DEFAULT_AURA_SYNC_STATE

    const parsed = JSON.parse(savedState)
    return {
      ...DEFAULT_AURA_SYNC_STATE,
      ...parsed
    }
  } catch (error) {
    console.warn('Failed to load Armoury Crate Aura Sync state:', error)
    return DEFAULT_AURA_SYNC_STATE
  }
}

function loadArmouryScenarioProfileState() {
  try {
    const savedState = localStorage.getItem(ARMOURY_SCENARIO_PROFILES_STORAGE_KEY)
    if (!savedState) {
      return {
        ...DEFAULT_SCENARIO_PROFILE_STATE,
        lastSavedDraft: createScenarioProfileDraft(DEFAULT_SCENARIO_PROFILE_STATE)
      }
    }

    const parsed = JSON.parse(savedState)
    return {
      ...DEFAULT_SCENARIO_PROFILE_STATE,
      ...parsed,
      lastSavedDraft: parsed.lastSavedDraft || createScenarioProfileDraft({ ...DEFAULT_SCENARIO_PROFILE_STATE, ...parsed })
    }
  } catch (error) {
    console.warn('Failed to load Armoury Crate scenario profile state:', error)
    return {
      ...DEFAULT_SCENARIO_PROFILE_STATE,
      lastSavedDraft: createScenarioProfileDraft(DEFAULT_SCENARIO_PROFILE_STATE)
    }
  }
}

function loadArmouryDisplaySettingsState() {
  try {
    const savedState = localStorage.getItem(ARMOURY_DISPLAY_SETTINGS_STORAGE_KEY)
    if (!savedState) return DEFAULT_DISPLAY_SETTINGS_STATE

    const parsed = JSON.parse(savedState)
    return {
      ...DEFAULT_DISPLAY_SETTINGS_STATE,
      ...parsed,
      selectedPreset: mapScenarioGameVisualToDisplayPreset(parsed.selectedPreset)
    }
  } catch (error) {
    console.warn('Failed to load Armoury Crate display settings state:', error)
    return DEFAULT_DISPLAY_SETTINGS_STATE
  }
}

function getAuraAiLightingPreset(profileId, activeMode) {
  if (profileId === 'focus') {
    return {
      title: 'Focus',
      effect: 'static',
      color: '#f5f5f5',
      brightness: 68,
      gradientColors: ['#f5f5f5', '#a8c7ff']
    }
  }

  if (profileId === 'pulse') {
    return {
      title: 'Pulse',
      effect: activeMode === 'turbo' ? 'strobing' : 'breathing',
      color: activeMode === 'turbo' ? '#ff5757' : '#ffab1f',
      brightness: activeMode === 'turbo' ? 76 : 62,
      gradientColors: activeMode === 'turbo' ? ['#ff2d55', '#7a1cff'] : ['#ffab1f', '#ff2d55']
    }
  }

  const adaptiveMap = {
    silent: { color: '#68d4ff', brightness: 26, effect: 'static', title: 'Adaptive', gradientColors: ['#0f0f17', '#68d4ff'] },
    windows: { color: '#f5f5f5', brightness: 36, effect: 'static', title: 'Adaptive', gradientColors: ['#f5f5f5', '#68d4ff'] },
    performance: { color: '#ffab1f', brightness: 54, effect: 'breathing', title: 'Adaptive', gradientColors: ['#ffab1f', '#7fe08d'] },
    turbo: { color: '#ff5757', brightness: 74, effect: 'color-cycle', title: 'Adaptive', gradientColors: ['#ff5757', '#7a1cff'] }
  }

  return adaptiveMap[activeMode] || adaptiveMap.windows
}

function getAuraGradientAngle(direction) {
  if (direction === 'vertical') return '180deg'
  if (direction === 'diagonal') return '135deg'
  return '90deg'
}

function getAuraPreviewStyle(auraSyncState) {
  if (auraSyncState.colorMode !== 'gradient') {
    return {
      '--lighting-preview': auraSyncState.singleColor,
      background: auraSyncState.singleColor
    }
  }

  return {
    background: `linear-gradient(${getAuraGradientAngle(auraSyncState.gradientDirection)}, ${auraSyncState.gradientColors[0]}, ${auraSyncState.gradientColors[1]})`
  }
}

function createScenarioProfileDraft(state) {
  return {
    profileName: state.profileName,
    linkedApps: [...(state.linkedApps || [])].sort((left, right) => left.localeCompare(right)),
    touchPadEnabled: state.touchPadEnabled,
    batteryMode: state.batteryMode,
    pluggedMode: state.pluggedMode,
    auraEffect: state.auraEffect,
    hostBrightness: state.hostBrightness,
    gameVisual: state.gameVisual,
    clearCacheEnabled: state.clearCacheEnabled
  }
}

function mapScenarioAuraEffectToLightingEffect(effect) {
  if (effect === 'color cycle') return 'color-cycle'
  return effect
}

function toScenarioOptionLabel(option) {
  if (option === 'color cycle') return 'Color Cycle'
  return option.charAt(0).toUpperCase() + option.slice(1)
}

function TelemetryPanel({ title, rows }) {
  return (
    <section className="armoury-crate-panel">
      <div className="armoury-crate-panel-heading">
        <h2>{title}</h2>
        <span className="armoury-crate-panel-mark" aria-hidden="true" />
      </div>
      <div className="armoury-crate-panel-rows">
        {rows.map((row, index) => (
          <div key={row.key || `${title}-${row.label}-${index}`} className="armoury-crate-panel-row">
            <div className="armoury-crate-row-copy">
              <span>{row.label}</span>
              <strong>{row.value}</strong>
            </div>
            {typeof row.barPercent === 'number' ? (
              <div className="armoury-crate-line-bar" aria-hidden="true">
                <span style={{ width: `${Math.max(0, Math.min(100, row.barPercent))}%` }} />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  )
}

function LaptopHero({ deviceImageStyle = 'photographic', reloadToken = 0 }) {
  const [usePhoto, setUsePhoto] = useState(true)

  useEffect(() => {
    setUsePhoto(true)
  }, [reloadToken, deviceImageStyle])

  return (
    <div className="armoury-crate-laptop-shell" aria-label="Laptop preview illustration">
      {deviceImageStyle !== 'sketch' && usePhoto ? (
        <img
          src={HERO_IMAGE_PUBLIC_PATH}
          alt="ASUS TUF Gaming F15 laptop"
          className="armoury-crate-laptop-photo"
          onError={() => setUsePhoto(false)}
        />
      ) : (
        <div className="armoury-crate-laptop-fallback" aria-hidden="true" />
      )}
    </div>
  )
}

function DeviceHeaderIcon() {
  return (
    <svg viewBox="0 0 112 74" role="img">
      <g fill="none" stroke="#f2f2f2" strokeWidth="2.2" strokeLinecap="square" strokeLinejoin="miter">
        <path d="M27 14H49V55H27Z" />
        <path d="M51 57H25" />
        <path d="M61 20V51" />
        <path d="M69 14V57" opacity="0.45" />
        <path d="M77 24V48" opacity="0.65" />
        <path d="M85 18V53" opacity="0.3" />
      </g>
    </svg>
  )
}

function DeviceWinKeyIcon() {
  return (
    <svg viewBox="0 0 84 84" role="img">
      <g fill="none" stroke="#f4f4f4" strokeWidth="3.4" strokeLinejoin="miter">
        <path d="M16 18H37V39H16Z" />
        <path d="M47 18H68V39H47Z" />
        <path d="M16 47H37V68H16Z" />
        <path d="M47 47H68V68H47Z" />
      </g>
    </svg>
  )
}

function DeviceTouchPadIcon() {
  return (
    <svg viewBox="0 0 100 84" role="img">
      <g fill="none" stroke="#f4f4f4" strokeWidth="3.1" strokeLinejoin="miter">
        <path d="M20 22L28 14H78V48L66 60H20Z" />
        <path d="M20 48H66" />
        <path d="M49 48V60" />
      </g>
    </svg>
  )
}

function DeviceStandbyIcon() {
  return (
    <svg viewBox="0 0 104 84" role="img">
      <g fill="none" stroke="#f4f4f4" strokeWidth="3.1" strokeLinejoin="miter" strokeLinecap="square">
        <path d="M20 30L34 16H74V52H20Z" />
        <path d="M18 59H78" />
        <path d="M26 60L31 65H65L70 60" />
        <path d="M56 22C61 25 64 30 64 36C64 42 61 47 56 50" />
        <path d="M47 22C52 25 55 30 55 36C55 42 52 47 47 50" />
      </g>
    </svg>
  )
}

function DevicePanelPowerSaverIcon() {
  return (
    <svg viewBox="0 0 112 84" role="img">
      <g fill="none" stroke="#f4f4f4" strokeWidth="3.1" strokeLinejoin="miter" strokeLinecap="square">
        <path d="M20 30L33 16H76V48L64 60H20Z" />
        <path d="M48 60V68" />
        <path d="M34 68H58" />
      </g>
      <g fill="#f4f4f4" fontFamily="Bahnschrift, Segoe UI, sans-serif" fontWeight="700">
        <text x="47" y="32" fontSize="11">AUTO</text>
        <text x="36" y="48" fontSize="26" letterSpacing="1">HZ</text>
      </g>
    </svg>
  )
}
