export const ARMOURY_USER_CENTER_STORAGE_KEY = 'jezos_armoury_user_center_state'

export const USER_CENTER_TABS = [
  { id: 'my-products', label: 'My Products' },
  { id: 'redemption', label: 'Redemption' },
  { id: 'registered-events', label: 'Registered Events' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'rog-elite', label: 'ROG Elite' }
]

export const DEFAULT_USER_CENTER_STATE = {
  activeTab: 'my-products',
  account: null,
  products: [],
  redemptions: [
    {
      id: 'alan-wake-2',
      title: 'Alan Wake 2 Deluxe Upgrade',
      status: 'available',
      serialRequired: true,
      expiresAt: '2026-05-30',
      summary: 'Eligible ASUS and ROG devices can unlock a limited-time Deluxe Upgrade bundle.'
    },
    {
      id: 'adobe-cc',
      title: 'Adobe Creative Cloud Trial',
      status: 'claimed',
      serialRequired: false,
      expiresAt: '2026-06-12',
      summary: 'Creative workflow bundle for ASUS creator and gaming notebooks.'
    }
  ],
  events: [
    {
      id: 'rog-launch-night',
      title: 'ROG Launch Night',
      startsAt: '2026-04-25T19:00:00+08:00',
      location: 'Online Livestream',
      status: 'registered'
    },
    {
      id: 'asus-community-session',
      title: 'ASUS Community Q&A',
      startsAt: '2026-05-03T20:30:00+08:00',
      location: 'ASUS Forum Live',
      status: 'registered'
    }
  ],
  notifications: [
    {
      id: 'notif-redemption',
      title: 'Your Adobe Creative Cloud redemption is ready.',
      body: 'Open Redemption to review the claimed offer and the linked ASUS account.',
      createdAt: '2026-04-11T09:45:00+08:00',
      read: false
    },
    {
      id: 'notif-elite',
      title: 'ROG Elite weekly missions were refreshed.',
      body: 'Earn more points by checking in, browsing new products, and registering your device.',
      createdAt: '2026-04-10T14:20:00+08:00',
      read: true
    }
  ],
  elite: {
    tier: 'Explorer',
    points: 1240,
    nextTierLabel: 'Challenger',
    pointsToNextTier: 260,
    missions: [
      { id: 'mission-check-in', title: 'Daily Check-in', reward: 20, completed: true },
      { id: 'mission-register', title: 'Register a New Product', reward: 120, completed: false },
      { id: 'mission-news', title: 'Read 3 News Stories', reward: 35, completed: false }
    ]
  }
}

function sanitizeArray(value, fallback) {
  return Array.isArray(value) ? value : fallback
}

export function loadArmouryUserCenterState() {
  if (typeof window === 'undefined') return DEFAULT_USER_CENTER_STATE

  try {
    const rawValue = window.localStorage.getItem(ARMOURY_USER_CENTER_STORAGE_KEY)
    if (!rawValue) return DEFAULT_USER_CENTER_STATE

    const parsed = JSON.parse(rawValue)
    return {
      ...DEFAULT_USER_CENTER_STATE,
      ...parsed,
      activeTab: USER_CENTER_TABS.some((tab) => tab.id === parsed?.activeTab) ? parsed.activeTab : DEFAULT_USER_CENTER_STATE.activeTab,
      products: sanitizeArray(parsed?.products, DEFAULT_USER_CENTER_STATE.products),
      redemptions: sanitizeArray(parsed?.redemptions, DEFAULT_USER_CENTER_STATE.redemptions),
      events: sanitizeArray(parsed?.events, DEFAULT_USER_CENTER_STATE.events),
      notifications: sanitizeArray(parsed?.notifications, DEFAULT_USER_CENTER_STATE.notifications),
      elite: {
        ...DEFAULT_USER_CENTER_STATE.elite,
        ...(parsed?.elite && typeof parsed.elite === 'object' ? parsed.elite : {}),
        missions: sanitizeArray(parsed?.elite?.missions, DEFAULT_USER_CENTER_STATE.elite.missions)
      }
    }
  } catch (error) {
    return DEFAULT_USER_CENTER_STATE
  }
}

export function formatUserCenterDate(value, options = {}) {
  if (!value) return '--'

  try {
    return new Date(value).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      ...options
    })
  } catch (error) {
    return '--'
  }
}

export function formatUserCenterTime(value) {
  if (!value) return 'Never'

  try {
    return new Date(value).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  } catch (error) {
    return 'Never'
  }
}
