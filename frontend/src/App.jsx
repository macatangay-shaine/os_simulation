import { useEffect, useState } from 'react'
import BootScreen from './components/BootScreen.jsx'
import PowerScreen from './components/PowerScreen.jsx'
import ShutdownScreen from './components/ShutdownScreen.jsx'
import LoginScreen from './components/LoginScreen.jsx'
import LockScreen from './components/LockScreen.jsx'
import Desktop from './components/Desktop.jsx'
import SleepScreen from './components/SleepScreen.jsx'
import ErrorDialog from './components/ErrorDialog.jsx'

export default function App() {
  // Initialize bootComplete from localStorage to skip boot on browser refresh
  const [bootComplete, setBootComplete] = useState(() => {
    return localStorage.getItem('jez_os_boot_complete') === 'true'
  })
  const [user, setUser] = useState(null)
  const [locked, setLocked] = useState(false)
  const [powerMode, setPowerMode] = useState(null)
  const [sleeping, setSleeping] = useState(false)
  const [shutdownComplete, setShutdownComplete] = useState(false)
  const [loggingIn, setLoggingIn] = useState(false)
  const [unlocking, setUnlocking] = useState(false)
  const [globalError, setGlobalError] = useState(null)

  const hexToRgba = (hex, alpha) => {
    const sanitized = hex.replace('#', '')
    if (sanitized.length !== 6) return `rgba(0, 103, 192, ${alpha})`
    const r = parseInt(sanitized.slice(0, 2), 16)
    const g = parseInt(sanitized.slice(2, 4), 16)
    const b = parseInt(sanitized.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  const applyUiSettings = (values) => {
    const root = document.documentElement
    root.setAttribute('data-theme', values.theme)
    root.setAttribute('data-font', values.fontSize)
    root.setAttribute('data-contrast', values.highContrast ? 'high' : 'normal')
    root.style.setProperty('--win-accent', values.accentColor)
    root.style.setProperty('--win-accent-soft', hexToRgba(values.accentColor, 0.16))
    root.style.setProperty('--desktop-wallpaper', values.wallpaper)
  }

  const loadUiSettings = () => {
    const wallpaperId = localStorage.getItem('jezos_wallpaper') || 'default'
    const wallpaperMap = {
      default: 'radial-gradient(circle at 20% 20%, #dbeafe, #bfdbfe 35%, #93c5fd 65%, #60a5fa)',
      'mountain-1': "url('/wallpapers/sleep-mountain-1.svg')",
      'mountain-2': "url('/wallpapers/sleep-mountain-2.svg')",
      'mountain-3': "url('/wallpapers/sleep-mountain-3.svg')"
    }

    return {
      theme: localStorage.getItem('jezos_theme') || 'light',
      accentColor: localStorage.getItem('jezos_accent') || '#2563eb',
      fontSize: localStorage.getItem('jezos_font_size') || 'medium',
      highContrast: localStorage.getItem('jezos_high_contrast') === 'true',
      wallpaper: wallpaperMap[wallpaperId] || wallpaperMap.default
    }
  }

  useEffect(() => {
    const applyFromStorage = () => applyUiSettings(loadUiSettings())
    applyFromStorage()
    window.addEventListener('jezos_settings_updated', applyFromStorage)

    return () => {
      window.removeEventListener('jezos_settings_updated', applyFromStorage)
    }
  }, [])

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('user')
    const sessionToken = localStorage.getItem('session_token')
    if (savedUser && sessionToken) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (err) {
        localStorage.removeItem('user')
        localStorage.removeItem('session_token')
      }
    }
  }, [])

  useEffect(() => {
    const handleExternalRestart = (event) => {
      const shouldUpdate = Boolean(event?.detail?.update)
      handleRestart({ update: shouldUpdate })
    }

    window.addEventListener('jez_os_restart', handleExternalRestart)
    return () => {
      window.removeEventListener('jez_os_restart', handleExternalRestart)
    }
  }, [])

  // Persist bootComplete to localStorage
  useEffect(() => {
    if (bootComplete) {
      localStorage.setItem('jez_os_boot_complete', 'true')
    }
  }, [bootComplete])

  const handleLogin = (userData) => {
    setLoggingIn(true)
    setTimeout(() => {
      setUser(userData)
      setLocked(false)
      setLoggingIn(false)
    }, 1300)
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('session_token')
    setUser(null)
    setLocked(false)
  }

  const handleRestart = (options = {}) => {
    setPowerMode({ action: 'restart', update: Boolean(options.update) })
    setLocked(false)
    setSleeping(false)
  }

  const handleShutdown = (options = {}) => {
    setPowerMode({ action: 'shutdown', update: Boolean(options.update) })
    setLocked(false)
    setSleeping(false)
  }

  const handleSleep = () => {
    if (!user) return
    setSleeping(true)
    try {
      localStorage.setItem('jez_os_sleeping', 'true')
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent('jez_os_sleep', { detail: { sleeping: true } }))
  }

  const handleWake = () => {
    setSleeping(false)
    setLocked(true)
    try {
      localStorage.removeItem('jez_os_sleeping')
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent('jez_os_sleep', { detail: { sleeping: false } }))
  }

  const handleLock = () => {
    setLocked(true)
  }

  const handleUnlock = () => {
    setUnlocking(true)
    setTimeout(() => {
      setLocked(false)
      setUnlocking(false)
    }, 1300)
  }

  const handleTurnOn = () => {
    setShutdownComplete(false)
    setBootComplete(false)
    setPowerMode(null)
  }

  if (powerMode) {
    return (
      <PowerScreen
        mode={powerMode.action}
        update={powerMode.update}
        onComplete={async () => {
          if (powerMode.update) {
            try {
              await fetch('http://localhost:8000/update/restart', { method: 'POST' })
            } catch {
              // ignore
            }
          }

          if (powerMode.action === 'restart') {
            localStorage.removeItem('user')
            localStorage.removeItem('session_token')
            setUser(null)
            setLocked(false)
            setBootComplete(false)
            setPowerMode(null)
          } else {
            // Shutdown: show black screen with "press any key to turn on"
            localStorage.removeItem('user')
            localStorage.removeItem('session_token')
            setUser(null)
            setLocked(false)
            setShutdownComplete(true)
            setPowerMode(null)
          }
        }}
      />
    )
  }

  if (shutdownComplete) {
    return <ShutdownScreen onTurnOn={handleTurnOn} />
  }

  if (!bootComplete) {
    return <BootScreen onComplete={() => setBootComplete(true)} />
  }

  if (loggingIn || unlocking) {
    return (
      <div className="login-transition">
        <div className="login-transition-content">
          <div className="login-transition-loader" />
          <div className="login-transition-text">Welcome</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        onRestart={handleRestart}
        onShutdown={handleShutdown}
        onSleep={handleSleep}
      />
    )
  }

  if (locked) {
    return <LockScreen user={user} onUnlock={handleUnlock} />
  }

  return (
    <>
      <Desktop
        user={user}
        onLogout={handleLogout}
        onLock={handleLock}
        onRestart={handleRestart}
        onShutdown={handleShutdown}
        onSleep={handleSleep}
        isSleeping={sleeping}
        onError={setGlobalError}
      />
      {sleeping ? <SleepScreen onWake={handleWake} /> : null}
      {globalError && (
        <ErrorDialog
          error={globalError}
          onClose={() => setGlobalError(null)}
          onReport={async (error) => {
            console.log('Error reported:', error);
          }}
        />
      )}
    </>
  )
}
