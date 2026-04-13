import { useEffect, useId, useState } from 'react'
import { Battery, ChevronUp, Lock, LogOut, Moon, Search, SunMedium, Volume2, Wifi, Zap } from 'lucide-react'

export default function Taskbar({
  windows,
  onToggleMinimize,
  onFocusWindow,
  user,
  onLogout,
  onLock,
  onSleep,
  onStartClick,
  onNotificationClick,
  onActionCenterClick,
  onCalendarClick,
  pinnedApps,
  onTogglePin,
  onLaunchPinned,
  isPinned,
  searchQuery,
  onSearchChange,
  isSleeping = false
}) {
  const [time, setTime] = useState(new Date())
  const [timeFormat, setTimeFormat] = useState(localStorage.getItem('jezos_time_format') || '12h')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [wifiSignal, setWifiSignal] = useState(3)
  const [battery, setBattery] = useState({ level: 80, charging: false })
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const [volume, setVolume] = useState(() => {
    try {
      const saved = localStorage.getItem('jez_os_volume')
      return saved ? parseInt(saved, 10) : 75
    } catch {
      return 75
    }
  })
  const [batterySupported, setBatterySupported] = useState(true)

  const normalizeBatteryState = (value, fallbackLevel = 80) => {
    const levelNumber = Number(value?.level)
    const safeLevel = Number.isFinite(levelNumber)
      ? Math.min(100, Math.max(0, Math.round(levelNumber)))
      : fallbackLevel

    return {
      level: safeLevel,
      charging: Boolean(value?.charging)
    }
  }

  useEffect(() => {
    if (isSleeping) return undefined
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [isSleeping])

  useEffect(() => {
    const handleSettingsUpdate = (event) => {
      if (event.detail?.key === 'timeFormat') {
        setTimeFormat(event.detail.value)
      }
    }

    window.addEventListener('jezos_settings_updated', handleSettingsUpdate)
    return () => window.removeEventListener('jezos_settings_updated', handleSettingsUpdate)
  }, [])

  useEffect(() => {
    const loadBattery = () => {
      try {
        const saved = localStorage.getItem('jez_os_battery')
        if (saved) {
          setBattery(normalizeBatteryState(JSON.parse(saved)))
        }
      } catch (error) {
        console.warn('Failed to load battery state:', error)
      }
    }

    const handleBatteryUpdate = (event) => {
      if (event.detail) {
        setBattery(normalizeBatteryState(event.detail))
      }
    }

    loadBattery()
    window.addEventListener('batteryUpdate', handleBatteryUpdate)
    window.addEventListener('storage', loadBattery)

    return () => {
      window.removeEventListener('batteryUpdate', handleBatteryUpdate)
      window.removeEventListener('storage', loadBattery)
    }
  }, [])

  useEffect(() => {
    let batteryObj = null
    let updateBattery = null

    const initBattery = async () => {
      try {
        if ('getBattery' in navigator) {
          setBatterySupported(true)
          batteryObj = await navigator.getBattery()
          updateBattery = () => {
            const normalized = normalizeBatteryState({
              level: Math.round(batteryObj.level * 100),
              charging: batteryObj.charging
            })
            setBattery(normalized)
            localStorage.setItem('jez_os_battery', JSON.stringify(normalized))
          }
          updateBattery()
          batteryObj.addEventListener('levelchange', updateBattery)
          batteryObj.addEventListener('chargingchange', updateBattery)
        } else {
          setBatterySupported(false)
        }
      } catch (error) {
        setBatterySupported(false)
        console.warn('Battery API not available in taskbar:', error)
      }
    }

    initBattery()

    return () => {
      if (batteryObj && updateBattery) {
        batteryObj.removeEventListener('levelchange', updateBattery)
        batteryObj.removeEventListener('chargingchange', updateBattery)
      }
    }
  }, [])

  const displayBattery = normalizeBatteryState(battery, 80)
  const batteryIconSrc = getTaskbarBatteryIconSrc(displayBattery, batterySupported)

  useEffect(() => {
    try {
      localStorage.setItem('jez_os_volume', volume.toString())
    } catch (error) {
      console.warn('Failed to save volume:', error)
    }
  }, [volume])

  useEffect(() => {
    if (isSleeping) return undefined

    let cancelled = false

    const loadNotificationCount = async () => {
      try {
        const response = await fetch('http://localhost:8000/notification/list')
        if (!response.ok) return

        const items = await response.json()
        if (!cancelled && Array.isArray(items)) {
          setUnreadNotificationCount(items.filter((item) => !item.read).length)
        }
      } catch {
        if (!cancelled) {
          setUnreadNotificationCount(0)
        }
      }
    }

    loadNotificationCount()
    const interval = setInterval(loadNotificationCount, 5000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [isSleeping])

  useEffect(() => {
    if (isSleeping) return undefined

    const updateWiFi = async () => {
      try {
        if (!navigator.onLine) {
          setWifiSignal(0)
          return
        }

        if (navigator.connection) {
          const effectiveType = navigator.connection.effectiveType
          let signal = 3
          if (effectiveType === '4g') signal = 4
          else if (effectiveType === '3g') signal = 3
          else if (effectiveType === '2g') signal = 2
          else if (effectiveType === 'slow-2g') signal = 1
          setWifiSignal(signal)
        } else {
          setWifiSignal(3)
        }
      } catch (error) {
        console.error('Failed to get connection info:', error)
      }
    }

    const handleOnline = () => setWifiSignal(3)
    const handleOffline = () => setWifiSignal(0)

    updateWiFi()
    const interval = setInterval(updateWiFi, 5000)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [isSleeping])

  const handleWindowPreviewClick = (windowId) => {
    if (onFocusWindow) {
      onFocusWindow(windowId)
    }

    const windowEntry = windows.find((entry) => entry.id === windowId)
    if (windowEntry?.minimized) {
      onToggleMinimize(windowId)
    }
  }

  const renderTaskbarIcon = (entry, imageClassName = 'taskbar-app-image') => {
    const iconSrc = entry.iconSrc || entry.desktopIconSrc

    if (iconSrc) {
      return <img src={iconSrc} alt="" className={imageClassName} />
    }

    return entry.icon ? <entry.icon className="taskbar-app-icon" /> : null
  }

  const renderPreviewIcon = (entry) => {
    const iconSrc = entry.iconSrc || entry.desktopIconSrc

    if (iconSrc) {
      return <img src={iconSrc} alt="" className="taskbar-preview-image" />
    }

    return entry.icon ? <entry.icon size={16} /> : null
  }

  const weatherSnapshot = getTaskbarWeatherSnapshot(time)
  const WeatherIcon = weatherSnapshot.icon
  const weatherIconSrc = weatherSnapshot.iconSrc || null
  return (
    <div className="taskbar">
      <button
        type="button"
        className="taskbar-weather"
        title={unreadNotificationCount > 0 ? `Notifications (${unreadNotificationCount} unread)` : 'Desktop weather and notifications'}
        onClick={(event) => {
          event.stopPropagation()
          onNotificationClick?.()
        }}
      >
        <span className="taskbar-weather-badge-shell">
          <span className={`taskbar-weather-badge ${weatherSnapshot.tone} ${weatherIconSrc ? 'image' : ''}`}>
            {weatherIconSrc ? (
              <img src={weatherIconSrc} alt="" className="taskbar-weather-image" />
            ) : (
              <WeatherIcon className="taskbar-weather-icon" />
            )}
          </span>
          {unreadNotificationCount > 0 ? (
            <span className="taskbar-weather-alert" aria-label={`${unreadNotificationCount} unread notifications`}>
              {Math.min(unreadNotificationCount, 9)}
            </span>
          ) : null}
        </span>
        <span className="taskbar-weather-copy">
          <strong>{formatTaskbarTemperature(weatherSnapshot.temperature)}</strong>
          <small>{weatherSnapshot.label}</small>
        </span>
      </button>

      <div className="taskbar-center">
        <div className="taskbar-center-shell">
          <button
            type="button"
            className="taskbar-left"
            onClick={(event) => {
              event.stopPropagation()
              onStartClick()
            }}
          >
            <WindowsStartIcon className="taskbar-start-icon" />
          </button>

          <div className="taskbar-search">
            <Search className="taskbar-search-icon" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(event) => onSearchChange?.(event.target.value)}
              aria-label="Search"
            />
          </div>

          <div className="taskbar-apps">
            {pinnedApps.map((app) => {
              const appWindows = windows.filter((entry) => entry.appId === app.id)
              const hasWindows = appWindows.length > 0
              const hasVisibleWindow = appWindows.some((entry) => !entry.minimized)
              const hasMinimized = appWindows.some((entry) => entry.minimized)

              return (
                <div key={app.id} className="taskbar-app-group">
                  <button
                    type="button"
                    className={`taskbar-app pinned ${hasWindows ? 'running' : ''} ${hasVisibleWindow ? 'active' : ''} ${hasMinimized ? 'has-minimized' : ''}`}
                    data-app={app.id}
                    title={!hasWindows ? `Open ${app.title}` : undefined}
                    onClick={(event) => {
                      event.stopPropagation()
                      if (hasWindows) {
                        if (appWindows.length === 1) {
                          onToggleMinimize(appWindows[0].id)
                        } else {
                          handleWindowPreviewClick(appWindows[0].id)
                        }
                      } else {
                        onLaunchPinned(app.id)
                      }
                    }}
                    onContextMenu={(event) => {
                      event.preventDefault()
                      onTogglePin(app.id)
                    }}
                  >
                    {renderTaskbarIcon(app)}
                    {hasWindows && appWindows.length > 1 ? (
                      <span className="taskbar-app-badge">{appWindows.length}</span>
                    ) : null}
                  </button>

                  {hasWindows ? (
                    <div className="taskbar-window-previews">
                      {appWindows.map((win, index) => (
                        <button
                          key={win.id}
                          className={`taskbar-preview-item ${win.minimized ? 'minimized' : ''}`}
                          onClick={(event) => {
                            event.stopPropagation()
                            handleWindowPreviewClick(win.id)
                          }}
                        >
                          {renderPreviewIcon(win)}
                          <span>{win.title} ({index + 1})</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              )
            })}

            {(() => {
              const windowsByApp = {}
              windows.forEach((win) => {
                if (win.appId && !isPinned(win.appId)) {
                  if (!windowsByApp[win.appId]) {
                    windowsByApp[win.appId] = []
                  }
                  windowsByApp[win.appId].push(win)
                }
              })

              return Object.entries(windowsByApp).map(([appId, appWindows]) => {
                const firstWindow = appWindows[0]
                const hasVisibleWindow = appWindows.some((entry) => !entry.minimized)
                const hasMinimized = appWindows.some((entry) => entry.minimized)

                return (
                  <div key={appId} className="taskbar-app-group">
                    <button
                      type="button"
                      className={`taskbar-app running ${hasVisibleWindow ? 'active' : ''} ${hasMinimized ? 'has-minimized' : ''}`}
                      data-app={appId}
                      onClick={(event) => {
                        event.stopPropagation()
                        if (appWindows.length === 1) {
                          onToggleMinimize(firstWindow.id)
                        } else {
                          handleWindowPreviewClick(firstWindow.id)
                        }
                      }}
                      onContextMenu={(event) => {
                        event.preventDefault()
                        onTogglePin(appId)
                      }}
                    >
                      {renderTaskbarIcon(firstWindow)}
                      {appWindows.length > 1 ? (
                        <span className="taskbar-app-badge">{appWindows.length}</span>
                      ) : null}
                    </button>

                    <div className="taskbar-window-previews">
                      {appWindows.map((win, index) => (
                        <button
                          key={win.id}
                          className={`taskbar-preview-item ${win.minimized ? 'minimized' : ''}`}
                          onClick={(event) => {
                            event.stopPropagation()
                            handleWindowPreviewClick(win.id)
                          }}
                        >
                          {renderPreviewIcon(win)}
                          <span>{win.title} ({index + 1})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        </div>
      </div>

      <div className="taskbar-right">
        <button
          type="button"
          className="taskbar-systray-item taskbar-tray-chevron"
          title="Hidden icons"
        >
          <ChevronUp className="taskbar-systray-icon" />
        </button>

        <div className="taskbar-locale" title="Keyboard layout">
          <span>ENG</span>
          <small>US</small>
        </div>

        <button
          type="button"
          className="taskbar-quick-settings"
          onClick={(event) => {
            event.stopPropagation()
            onActionCenterClick()
          }}
          title={`Quick settings · Wi-Fi ${wifiSignal}/4 · Volume ${volume}%${batterySupported ? ` · Battery ${displayBattery.level}%` : ''}`}
        >
          <Wifi className={`taskbar-systray-icon wifi-signal-${wifiSignal}`} />
          <Volume2 className="taskbar-systray-icon volume-icon" />
          <span className="taskbar-battery-shell">
            {batteryIconSrc ? (
              <img src={batteryIconSrc} alt="" className="taskbar-battery-image" />
            ) : (
              <>
                <Battery
                  className={`taskbar-systray-icon battery-icon ${displayBattery.charging ? 'charging' : ''} ${displayBattery.level <= 20 ? 'low' : ''}`}
                  style={{ color: batterySupported ? (displayBattery.charging ? '#fbbf24' : displayBattery.level <= 20 ? '#ef4444' : 'currentColor') : '#94a3b8' }}
                />
                {displayBattery.charging ? (
                  <Zap className="taskbar-battery-bolt" />
                ) : null}
              </>
            )}
          </span>
        </button>

        <button
          type="button"
          className="taskbar-clock"
          onClick={(event) => {
            event.stopPropagation()
            onCalendarClick()
          }}
          title={time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        >
          <div className="taskbar-time">
            {timeFormat === '24h'
              ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
              : time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
          </div>
          <div className="taskbar-date">
            {time.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: 'numeric' })}
          </div>
        </button>

        <button
          type="button"
          className={`taskbar-user ${showUserMenu ? 'open' : ''}`}
          title={user?.username || 'Account'}
          aria-label={user?.username || 'Account'}
          aria-haspopup="menu"
          aria-expanded={showUserMenu}
          onClick={(event) => {
            event.stopPropagation()
            setShowUserMenu(!showUserMenu)
          }}
        >
          <span className="taskbar-user-avatar" aria-hidden="true">
            <img src="/taskbar-icons/profile-person-regular.svg" alt="" className="taskbar-user-avatar-image" />
          </span>
          <span className="taskbar-user-label">{user?.username || 'Account'}</span>
        </button>

        {showUserMenu ? (
          <div className="taskbar-user-menu">
            <button type="button" className="taskbar-user-menu-item" onClick={() => { onLock(); setShowUserMenu(false) }}>
              <Lock className="taskbar-menu-icon" />
              Lock
            </button>
            <button type="button" className="taskbar-user-menu-item" onClick={() => { onSleep?.(); setShowUserMenu(false) }}>
              <Moon className="taskbar-menu-icon" />
              Sleep
            </button>
            <button type="button" className="taskbar-user-menu-item" onClick={() => { onLogout(); setShowUserMenu(false) }}>
              <LogOut className="taskbar-menu-icon" />
              Sign out
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function getTaskbarWeatherSnapshot(time) {
  const hour = time.getHours()
  if (hour >= 6 && hour < 17) {
    return {
      icon: SunMedium,
      iconSrc: '/weather-icons/sun-behind-cloud.png',
      temperature: 25,
      label: 'Mostly cloudy',
      tone: 'day'
    }
  }

  return {
    icon: Moon,
    iconSrc: '/weather-icons/crescent-moon.png',
    temperature: 24,
    label: 'Clear',
    tone: 'night'
  }
}

function formatTaskbarTemperature(value) {
  return `${value}\u00B0C`
}

function getTaskbarBatteryIconSrc(batteryState, isSupported) {
  if (!isSupported) return null
  if (batteryState.level <= 20) return null

  return batteryState.charging
    ? '/taskbar-icons/battery-charging-good.svg'
    : '/taskbar-icons/battery-not-charging.svg'
}

function WindowsStartIcon({ className }) {
  const iconId = useId()

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={`${iconId}-pane-tl`} x1="3" y1="3" x2="11.6" y2="11.6" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8BE3FF" />
          <stop offset="0.42" stopColor="#4DBFFF" />
          <stop offset="1" stopColor="#117DEE" />
        </linearGradient>
        <linearGradient id={`${iconId}-pane-tr`} x1="12.4" y1="3" x2="21" y2="11.6" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#7AD9FF" />
          <stop offset="0.48" stopColor="#34AFFF" />
          <stop offset="1" stopColor="#0A6FE3" />
        </linearGradient>
        <linearGradient id={`${iconId}-pane-bl`} x1="3" y1="12.4" x2="11.6" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#59C7FF" />
          <stop offset="0.46" stopColor="#2099FF" />
          <stop offset="1" stopColor="#085FD5" />
        </linearGradient>
        <linearGradient id={`${iconId}-pane-br`} x1="12.4" y1="12.4" x2="21" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#46BCFF" />
          <stop offset="0.46" stopColor="#128CFA" />
          <stop offset="1" stopColor="#0455C7" />
        </linearGradient>
      </defs>
      <path d="M3 4.25C3 3.56 3.56 3 4.25 3h6.1c.69 0 1.25.56 1.25 1.25v6.1c0 .69-.56 1.25-1.25 1.25h-6.1C3.56 11.6 3 11.04 3 10.35v-6.1Z" fill={`url(#${iconId}-pane-tl)`} />
      <path d="M12.4 4.25C12.4 3.56 12.96 3 13.65 3h6.1C20.44 3 21 3.56 21 4.25v6.1c0 .69-.56 1.25-1.25 1.25h-6.1c-.69 0-1.25-.56-1.25-1.25v-6.1Z" fill={`url(#${iconId}-pane-tr)`} />
      <path d="M3 13.65c0-.69.56-1.25 1.25-1.25h6.1c.69 0 1.25.56 1.25 1.25v6.1c0 .69-.56 1.25-1.25 1.25h-6.1C3.56 21 3 20.44 3 19.75v-6.1Z" fill={`url(#${iconId}-pane-bl)`} />
      <path d="M12.4 13.65c0-.69.56-1.25 1.25-1.25h6.1c.69 0 1.25.56 1.25 1.25v6.1c0 .69-.56 1.25-1.25 1.25h-6.1c-.69 0-1.25-.56-1.25-1.25v-6.1Z" fill={`url(#${iconId}-pane-br)`} />
    </svg>
  )
}
