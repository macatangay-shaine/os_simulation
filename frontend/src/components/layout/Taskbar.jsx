import { useEffect, useState } from 'react'
import { Accessibility, Battery, Bell, ChevronUp, Lock, LogOut, Moon, Search, SunMedium, Volume2, Wifi, Zap } from 'lucide-react'

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
  const [volume, setVolume] = useState(() => {
    try {
      const saved = localStorage.getItem('jez_os_volume')
      return saved ? parseInt(saved, 10) : 75
    } catch {
      return 75
    }
  })
  const [showVolumeControl, setShowVolumeControl] = useState(false)
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

  useEffect(() => {
    try {
      localStorage.setItem('jez_os_volume', volume.toString())
    } catch (error) {
      console.warn('Failed to save volume:', error)
    }
  }, [volume])

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
    if (entry.iconSrc) {
      return <img src={entry.iconSrc} alt="" className={imageClassName} />
    }

    return entry.icon ? <entry.icon className="taskbar-app-icon" /> : null
  }

  const renderPreviewIcon = (entry) => {
    if (entry.iconSrc) {
      return <img src={entry.iconSrc} alt="" className="taskbar-preview-image" />
    }

    return entry.icon ? <entry.icon size={16} /> : null
  }

  const weatherSnapshot = getTaskbarWeatherSnapshot(time)
  const WeatherIcon = weatherSnapshot.icon
  const userInitials = getUserInitials(user?.username)

  return (
    <div className="taskbar">
      <div className="taskbar-weather" title="Desktop weather simulation">
        <span className={`taskbar-weather-badge ${weatherSnapshot.tone}`}>
          <WeatherIcon className="taskbar-weather-icon" />
        </span>
        <span className="taskbar-weather-copy">
          <strong>{formatTaskbarTemperature(weatherSnapshot.temperature)}</strong>
          <small>{weatherSnapshot.label}</small>
        </span>
      </div>

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
        <div className="taskbar-systray">
          <button
            type="button"
            className="taskbar-systray-item"
            title="Hidden icons"
          >
            <ChevronUp className="taskbar-systray-icon" />
          </button>

          <button
            type="button"
            className="taskbar-systray-item"
            title={`Wi-Fi Signal: ${wifiSignal}/4`}
          >
            <Wifi className={`taskbar-systray-icon wifi-signal-${wifiSignal}`} />
          </button>

          <div className="taskbar-systray-item volume-control">
            <button
              type="button"
              className="taskbar-systray-button"
              onClick={(event) => {
                event.stopPropagation()
                setShowVolumeControl(!showVolumeControl)
              }}
              title={`Volume: ${volume}%`}
            >
              <Volume2 className="taskbar-systray-icon volume-icon" />
            </button>

            {showVolumeControl ? (
              <div className="volume-slider-container">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(event) => setVolume(Number(event.target.value))}
                  className="volume-slider"
                />
                <span className="volume-value">{volume}%</span>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className="taskbar-systray-item"
            title={batterySupported ? `Battery: ${displayBattery.level}%${displayBattery.charging ? ' (Charging)' : ''}` : 'Battery: Not available on this browser/device'}
          >
            <span className="taskbar-battery-shell">
              <Battery
                className={`taskbar-systray-icon battery-icon ${displayBattery.charging ? 'charging' : ''} ${displayBattery.level <= 20 ? 'low' : ''}`}
                style={{ color: batterySupported ? (displayBattery.charging ? '#fbbf24' : displayBattery.level <= 20 ? '#ef4444' : 'currentColor') : '#94a3b8' }}
              />
              {displayBattery.charging ? (
                <Zap className="taskbar-battery-bolt" />
              ) : null}
            </span>
          </button>
        </div>

        <div className="taskbar-locale" title="Keyboard layout">
          <span>ENG</span>
          <small>US</small>
        </div>

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
          className="taskbar-action-center"
          onClick={(event) => {
            event.stopPropagation()
            onActionCenterClick()
          }}
          title="Accessibility and quick settings"
        >
          <Accessibility className="taskbar-action-center-icon" />
        </button>

        <button
          type="button"
          className="taskbar-notification"
          onClick={(event) => {
            event.stopPropagation()
            onNotificationClick()
          }}
          title="Notifications"
        >
          <Bell className="taskbar-notification-icon" />
        </button>

        <button
          type="button"
          className="taskbar-user"
          title={user.username}
          onClick={(event) => {
            event.stopPropagation()
            setShowUserMenu(!showUserMenu)
          }}
        >
          <span className="taskbar-user-avatar" aria-hidden="true">{userInitials}</span>
          <span className="taskbar-user-label">{user.username}</span>
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
    return { icon: SunMedium, temperature: 29, label: 'Partly cloudy', tone: 'day' }
  }

  return { icon: Moon, temperature: 24, label: 'Clear', tone: 'night' }
}

function formatTaskbarTemperature(value) {
  return `${value}\u00B0C`
}

function getUserInitials(username) {
  if (!username) return 'U'
  return username.trim().slice(0, 1).toUpperCase()
}

function WindowsStartIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M3 4.25C3 3.56 3.56 3 4.25 3h6.1c.69 0 1.25.56 1.25 1.25v6.1c0 .69-.56 1.25-1.25 1.25h-6.1C3.56 11.6 3 11.04 3 10.35v-6.1Z" fill="currentColor" />
      <path d="M12.4 4.25C12.4 3.56 12.96 3 13.65 3h6.1C20.44 3 21 3.56 21 4.25v6.1c0 .69-.56 1.25-1.25 1.25h-6.1c-.69 0-1.25-.56-1.25-1.25v-6.1Z" fill="currentColor" />
      <path d="M3 13.65c0-.69.56-1.25 1.25-1.25h6.1c.69 0 1.25.56 1.25 1.25v6.1c0 .69-.56 1.25-1.25 1.25h-6.1C3.56 21 3 20.44 3 19.75v-6.1Z" fill="currentColor" />
      <path d="M12.4 13.65c0-.69.56-1.25 1.25-1.25h6.1c.69 0 1.25.56 1.25 1.25v6.1c0 .69-.56 1.25-1.25 1.25h-6.1c-.69 0-1.25-.56-1.25-1.25v-6.1Z" fill="currentColor" />
    </svg>
  )
}
