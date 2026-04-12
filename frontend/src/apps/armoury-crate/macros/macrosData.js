export const ARMOURY_MACROS_STORAGE_KEY = 'jezos_armoury_macros_state'
export const MACRO_ACTION_LIMIT = 100

export const MACRO_COMPATIBLE_DEVICES = [
  {
    id: 'rog-strix-scope-ii-96',
    label: 'ROG Strix Scope II 96 Wireless',
    type: 'Keyboard'
  },
  {
    id: 'rog-harpe-ace',
    label: 'ROG Harpe Ace Aim Lab Edition',
    type: 'Mouse'
  }
]

export const MACRO_PLAYBACK_MODES = [
  { id: 'once', label: 'Play Once' },
  { id: 'loop', label: 'Toggle Loop' },
  { id: 'hold', label: 'Hold To Repeat' }
]

export const MACRO_INSERT_OPTIONS = [
  { id: 'keystroke', label: 'Keystroke' },
  { id: 'text', label: 'Text Input' },
  { id: 'mouse', label: 'Mouse Click' },
  { id: 'delay', label: 'Delay' }
]

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function createMacroProfile(name = 'Macro01') {
  return {
    id: createId('macro'),
    name,
    deviceId: MACRO_COMPATIBLE_DEVICES[0].id,
    triggerKey: 'F9',
    playbackMode: 'once',
    stopOnRelease: false,
    actions: []
  }
}

export function createMacroAction(type) {
  if (type === 'text') {
    return {
      id: createId('macro-action'),
      type: 'text',
      label: 'Text Input',
      text: 'GG WP',
      delayMs: 120,
      typingDelayMs: 32
    }
  }

  if (type === 'mouse') {
    return {
      id: createId('macro-action'),
      type: 'mouse',
      label: 'Mouse Click',
      button: 'Left Click',
      delayMs: 80,
      holdMs: 40
    }
  }

  if (type === 'delay') {
    return {
      id: createId('macro-action'),
      type: 'delay',
      label: 'Delay',
      durationMs: 500
    }
  }

  return {
    id: createId('macro-action'),
    type: 'keystroke',
    label: 'Keystroke',
    combo: 'Ctrl + Shift + M',
    delayMs: 120,
    holdMs: 70
  }
}

export function createRecordedKeystrokeAction(combo, delayMs = 60) {
  return {
    id: createId('macro-action'),
    type: 'keystroke',
    label: 'Recorded Key',
    combo,
    delayMs,
    holdMs: 60
  }
}

export function cloneMacroDraft(draft) {
  return JSON.parse(JSON.stringify(draft))
}

function normalizeAction(action, index) {
  const baseAction = createMacroAction(action?.type || 'keystroke')
  return {
    ...baseAction,
    ...action,
    id: action?.id || `${baseAction.id}-${index}`
  }
}

function normalizeProfile(profile, index) {
  const fallbackProfile = createMacroProfile(`Macro${String(index + 1).padStart(2, '0')}`)
  return {
    ...fallbackProfile,
    ...profile,
    id: profile?.id || fallbackProfile.id,
    name: profile?.name?.trim() || fallbackProfile.name,
    actions: Array.isArray(profile?.actions) ? profile.actions.map(normalizeAction) : []
  }
}

export function createDefaultMacrosState() {
  const profile = createMacroProfile('Macro01')
  return {
    selectedProfileId: profile.id,
    profiles: [profile]
  }
}

export function loadMacrosState() {
  if (typeof window === 'undefined') return createDefaultMacrosState()

  try {
    const rawValue = window.localStorage.getItem(ARMOURY_MACROS_STORAGE_KEY)
    if (!rawValue) return createDefaultMacrosState()

    const parsed = JSON.parse(rawValue)
    const profiles = Array.isArray(parsed?.profiles) ? parsed.profiles.map(normalizeProfile) : []
    if (profiles.length === 0) return createDefaultMacrosState()

    const selectedProfileId = profiles.some((profile) => profile.id === parsed?.selectedProfileId)
      ? parsed.selectedProfileId
      : profiles[0].id

    return {
      selectedProfileId,
      profiles
    }
  } catch (error) {
    return createDefaultMacrosState()
  }
}

export function calculateMacroActionDuration(action) {
  if (!action) return 0
  if (action.type === 'delay') return Math.max(0, Number(action.durationMs) || 0)
  if (action.type === 'text') {
    return Math.max(0, Number(action.delayMs) || 0) + Math.max(0, (action.text || '').length * (Number(action.typingDelayMs) || 0))
  }
  return Math.max(0, Number(action.delayMs) || 0) + Math.max(0, Number(action.holdMs) || 0)
}

export function formatMacroDuration(milliseconds = 0) {
  const safeValue = Math.max(0, Number(milliseconds) || 0)
  return `${(safeValue / 1000).toFixed(3)} sec`
}

export function describeMacroAction(action) {
  if (!action) return 'Action'

  if (action.type === 'text') {
    return `Type "${action.text || ''}"`
  }

  if (action.type === 'mouse') {
    return action.button || 'Mouse Click'
  }

  if (action.type === 'delay') {
    return `Wait ${formatMacroDuration(action.durationMs)}`
  }

  return `Press ${action.combo || 'Key'}`
}

export function summarizeMacroProfile(profile) {
  if (!profile) return 'No profile selected'
  if (!profile.actions.length) return 'Ready to record or insert actions'
  return `${profile.actions.length}/${MACRO_ACTION_LIMIT} actions`
}

export function getNextMacroProfileName(profiles = []) {
  const nextNumber = profiles.length + 1
  return `Macro${String(nextNumber).padStart(2, '0')}`
}

export function normalizeMacroNumber(value, fallback = 0) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.max(0, Math.round(parsed))
}

