import { useEffect, useState } from 'react'

export default function SleepScreen({ onWake }) {
  const [time, setTime] = useState(new Date())
  const [wallpaper, setWallpaper] = useState('')
  const [isWaking, setIsWaking] = useState(false)
  const [timeFormat, setTimeFormat] = useState(localStorage.getItem('jezos_time_format') || '12h')

  useEffect(() => {
    const handleWake = () => {
      if (isWaking) return
      setIsWaking(true)
      setTimeout(() => onWake?.(), 420)
    }

    const wallpapers = [
      '/wallpapers/sleep-mountain-1.svg',
      '/wallpapers/sleep-mountain-2.svg',
      '/wallpapers/sleep-mountain-3.svg'
    ]
    const random = wallpapers[Math.floor(Math.random() * wallpapers.length)]
    setWallpaper(random)

    const interval = setInterval(() => setTime(new Date()), 1000)

    const handleSettingsUpdate = (event) => {
      if (event.detail?.key === 'timeFormat') {
        setTimeFormat(event.detail.value)
      }
    }

    window.addEventListener('keydown', handleWake)
    window.addEventListener('mousedown', handleWake)
    window.addEventListener('touchstart', handleWake)
    window.addEventListener('jezos_settings_updated', handleSettingsUpdate)

    return () => {
      clearInterval(interval)
      window.removeEventListener('keydown', handleWake)
      window.removeEventListener('mousedown', handleWake)
      window.removeEventListener('touchstart', handleWake)
      window.removeEventListener('jezos_settings_updated', handleSettingsUpdate)
    }
  }, [onWake, isWaking])

  return (
    <div
      className={`sleep-screen${isWaking ? ' waking' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => {
        if (isWaking) return
        setIsWaking(true)
        setTimeout(() => onWake?.(), 420)
      }}
      style={{ backgroundImage: wallpaper ? `url(${wallpaper})` : undefined }}
    >
      <div className="sleep-clock">
        <div className="sleep-time">
          {timeFormat === '24h'
            ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
            : time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
          }
        </div>
        <div className="sleep-date">
          {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>
      <div className="sleep-hint">Press any key or click to wake</div>
    </div>
  )
}
