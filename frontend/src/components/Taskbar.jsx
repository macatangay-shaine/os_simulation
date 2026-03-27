import { useEffect, useState } from 'react'
import { LayoutGrid, Lock, LogOut, Moon, UserCircle, Bell, Wifi, Volume2, Settings, Battery, Zap } from 'lucide-react'

export default function Taskbar({ windows, onToggleMinimize, onFocusWindow, user, onLogout, onLock, onSleep, onStartClick, onNotificationClick, onActionCenterClick, onCalendarClick, pinnedApps, onTogglePin, onLaunchPinned, isPinned, searchQuery, onSearchChange, isSleeping = false }) {
  const [time, setTime] = useState(new Date())
  const [timeFormat, setTimeFormat] = useState(localStorage.getItem('jezos_time_format') || '12h')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [wifiSignal, setWifiSignal] = useState(3)
  const [battery, setBattery] = useState({ level: 80, charging: false })
  const [volume, setVolume] = useState(() => {
    try {
      const saved = localStorage.getItem('jez_os_volume')
      return saved ? parseInt(saved) : 75
    } catch {
      return 75
    }
  })
  const [showVolumeControl, setShowVolumeControl] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
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

  // Listen for time format changes
  useEffect(() => {
    const handleSettingsUpdate = (event) => {
      if (event.detail?.key === 'timeFormat') {
        setTimeFormat(event.detail.value)
      }
    }
    window.addEventListener('jezos_settings_updated', handleSettingsUpdate)
    return () => window.removeEventListener('jezos_settings_updated', handleSettingsUpdate)
  }, [])

  // Sync battery state from ActionCenter via custom event and localStorage
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

    loadBattery()
    
    // Listen for custom battery update events from ActionCenter (same tab)
    const handleBatteryUpdate = (event) => {
      if (event.detail) {
        setBattery(normalizeBatteryState(event.detail))
      }
    }
    
    // Also listen for storage changes from other tabs
    const handleStorageChange = () => {
      loadBattery()
    }
    
    window.addEventListener('batteryUpdate', handleBatteryUpdate)
    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('batteryUpdate', handleBatteryUpdate)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  // Keep taskbar battery aligned with real device battery when available.
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

  // Save volume to localStorage when changed
  useEffect(() => {
    try {
      localStorage.setItem('jez_os_volume', volume.toString())
    } catch (error) {
      console.warn('Failed to save volume:', error)
    }
  }, [volume])

  // Detect Wi-Fi signal strength
  useEffect(() => {
    if (isSleeping) return undefined
    const updateWiFi = async () => {
      try {
        // Check if online first
        if (!navigator.onLine) {
          setWifiSignal(0)
          return
        }

        // Try to get connection info from navigator
        if (navigator.connection) {
          const effectiveType = navigator.connection.effectiveType
          
          // Map connection type to signal strength
          let signal = 3
          if (effectiveType === '4g') signal = 4
          else if (effectiveType === '3g') signal = 3
          else if (effectiveType === '2g') signal = 2
          else if (effectiveType === 'slow-2g') signal = 1
          
          setWifiSignal(signal)
        } else if (navigator.onLine) {
          setWifiSignal(3)
        }
      } catch (error) {
        console.error('Failed to get connection info:', error)
      }
    }

    updateWiFi()
    const interval = setInterval(updateWiFi, 5000)
    
    const handleOnline = () => {
      setIsOnline(true)
      setWifiSignal(3)
    }
    
    const handleOffline = () => {
      setIsOnline(false)
      setWifiSignal(0)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [isSleeping])

  const handleWindowPreviewClick = (windowId) => {
    // Focus the window (brings it to front)
    if (onFocusWindow) {
      onFocusWindow(windowId)
    }
    
    // If the window is minimized, restore it
    const window = windows.find(w => w.id === windowId)
    if (window && window.minimized) {
      onToggleMinimize(windowId)
    }
  }

  return (
    <div className="taskbar">
      <div className="taskbar-start-area">
        <button type="button" className="taskbar-left" onClick={(e) => {
          e.stopPropagation()
          onStartClick()
        }}>
          <LayoutGrid className="taskbar-start-icon" />
        </button>
        <div className="taskbar-search">
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            aria-label="Search"
          />
        </div>
        <div className="taskbar-apps">
          {/* Show pinned apps and merge with running windows */}
          {pinnedApps.map((app) => {
            const appWindows = windows.filter(w => w.appId === app.id)
            const hasWindows = appWindows.length > 0
            const hasMinimized = appWindows.some(w => w.minimized)
            
            return (
              <div key={app.id} className="taskbar-app-group">
                <button
                  type="button"
                  className={`taskbar-app pinned ${hasWindows ? 'running' : ''} ${hasMinimized ? 'has-minimized' : ''}`}
                  data-app={app.id}
                  title={!hasWindows ? `Open ${app.title}` : undefined}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (hasWindows) {
                      // If only one window, toggle minimize
                      if (appWindows.length === 1) {
                        onToggleMinimize(appWindows[0].id)
                      } else {
                        // If multiple windows, just focus the first one
                        handleWindowPreviewClick(appWindows[0].id)
                      }
                    } else {
                      onLaunchPinned(app.id)
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    onTogglePin(app.id)
                  }}
                >
                  {app.icon ? <app.icon className="taskbar-app-icon" /> : null}
                  {hasWindows && appWindows.length > 1 && (
                    <span className="taskbar-app-badge">{appWindows.length}</span>
                  )}
                </button>
                {/* Show window previews on hover - only if there are windows */}
                {hasWindows && (
                  <div className="taskbar-window-previews">
                    {appWindows.map((win, index) => (
                      <button
                        key={win.id}
                        className={`taskbar-preview-item ${win.minimized ? 'minimized' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleWindowPreviewClick(win.id)
                        }}
                      >
                        {win.icon && <win.icon size={16} />}
                        <span>{win.title} ({index + 1})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          
          {/* Show unpinned running apps */}
          {(() => {
            // Group windows by appId
            const windowsByApp = {}
            windows.forEach(win => {
              if (win.appId && !isPinned(win.appId)) {
                if (!windowsByApp[win.appId]) {
                  windowsByApp[win.appId] = []
                }
                windowsByApp[win.appId].push(win)
              }
            })
            
            return Object.entries(windowsByApp).map(([appId, appWindows]) => {
              const firstWindow = appWindows[0]
              const hasMinimized = appWindows.some(w => w.minimized)
              
              return (
                <div key={appId} className="taskbar-app-group">
                  <button
                    type="button"
                    className={`taskbar-app running ${hasMinimized ? 'has-minimized' : ''}`}
                    data-app={appId}
                    title={undefined}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (appWindows.length === 1) {
                        onToggleMinimize(firstWindow.id)
                      } else {
                        handleWindowPreviewClick(firstWindow.id)
                      }
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      onTogglePin(appId)
                    }}
                  >
                    {firstWindow.icon ? <firstWindow.icon className="taskbar-app-icon" /> : null}
                    {appWindows.length > 1 && (
                      <span className="taskbar-app-badge">{appWindows.length}</span>
                    )}
                  </button>
                  {/* Show window previews on hover */}
                  <div className="taskbar-window-previews">
                    {appWindows.map((win, index) => (
                      <button
                        key={win.id}
                        className={`taskbar-preview-item ${win.minimized ? 'minimized' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleWindowPreviewClick(win.id)
                        }}
                      >
                        {win.icon && <win.icon size={16} />}
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
      <div className="taskbar-center" />
      <div className="taskbar-right">
        <div className="taskbar-systray">
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
              onClick={(e) => {
                e.stopPropagation()
                setShowVolumeControl(!showVolumeControl)
              }}
              title={`Volume: ${volume}%`}
            >
              <Volume2 className="taskbar-systray-icon volume-icon" style={{ color: '#8b5cf6' }} />
            </button>
            {showVolumeControl && (
              <div className="volume-slider-container">
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={volume} 
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="volume-slider"
                />
                <span className="volume-value">{volume}%</span>
              </div>
            )}
          </div>

          <button 
            type="button" 
            className="taskbar-systray-item"
            title={batterySupported ? `Battery: ${displayBattery.level}%${displayBattery.charging ? ' (Charging)' : ''}` : 'Battery: Not available on this browser/device'}
          >
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              <Battery 
                className={`taskbar-systray-icon battery-icon ${displayBattery.charging ? 'charging' : ''} ${displayBattery.level <= 20 ? 'low' : ''}`} 
                style={{ color: batterySupported ? (displayBattery.charging ? '#fbbf24' : displayBattery.level <= 20 ? '#ef4444' : '#10b981') : '#94a3b8' }}
              />
              {displayBattery.charging && (
                <Zap 
                  size={12} 
                  style={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    right: -2,
                    color: '#3b82f6',
                    fill: '#3b82f6'
                  }} 
                />
              )}
            </div>
          </button>
        </div>
        
        <button 
          type="button" 
          className="taskbar-action-center"
          onClick={(e) => {
            e.stopPropagation()
            onActionCenterClick()
          }}
          title="Action Center"
        >
          <Settings className="taskbar-action-center-icon" />
        </button>
        
        <button 
          type="button" 
          className="taskbar-notification"
          onClick={(e) => {
            e.stopPropagation()
            onNotificationClick()
          }}
          title="Notifications"
        >
          <Bell className="taskbar-notification-icon" />
        </button>

        <button
          type="button"
          className="taskbar-clock"
          onClick={(e) => {
            e.stopPropagation()
            onCalendarClick()
          }}
          title={time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        >
          <div className="taskbar-time">
            {timeFormat === '24h'
              ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
              : time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
            }
          </div>
          <div className="taskbar-date">{time.toLocaleDateString([], { month: '2-digit', day: '2-digit', year: 'numeric' })}</div>
        </button>
        
        <button 
          type="button" 
          className="taskbar-user"
          onClick={(e) => {
            e.stopPropagation()
            setShowUserMenu(!showUserMenu)
          }}
        >
          <UserCircle className="taskbar-user-icon" />
          {user.username}
        </button>
        {showUserMenu ? (
          <div className="taskbar-user-menu">
            <button type="button" className="taskbar-user-menu-item" onClick={() => { onLock(); setShowUserMenu(false); }}>
              <Lock className="taskbar-menu-icon" />
              Lock
            </button>
            <button type="button" className="taskbar-user-menu-item" onClick={() => { onSleep?.(); setShowUserMenu(false); }}>
              <Moon className="taskbar-menu-icon" />
              Sleep
            </button>
            <button type="button" className="taskbar-user-menu-item" onClick={() => { onLogout(); setShowUserMenu(false); }}>
              <LogOut className="taskbar-menu-icon" />
              Sign out
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}