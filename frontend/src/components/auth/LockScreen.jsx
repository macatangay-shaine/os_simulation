import { useEffect, useState } from 'react'
import { UserCircle } from 'lucide-react'

export default function LockScreen({ user, onUnlock }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [time, setTime] = useState(new Date())
  const [timeFormat, setTimeFormat] = useState(localStorage.getItem('jezos_time_format') || '12h')
  const [showLogin, setShowLogin] = useState(false)

  const sanitizePinInput = (value) => value.replace(/\D/g, '').slice(0, 4)

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleSettingsUpdate = (event) => {
      if (event.detail?.key === 'timeFormat') {
        setTimeFormat(event.detail.value)
      }
    }
    window.addEventListener('jezos_settings_updated', handleSettingsUpdate)
    return () => window.removeEventListener('jezos_settings_updated', handleSettingsUpdate)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('http://localhost:8000/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, password })
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('session_token', data.session_token)
        onUnlock()
      } else {
        setError('Incorrect password')
      }
    } catch (err) {
      setError('Unable to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const revealLogin = () => {
    setShowLogin(true)
  }

  return (
    <div className={`lock-screen${showLogin ? ' lock-screen-revealed' : ''}`} onPointerDown={revealLogin}>
      <div className="lock-center">
        <div className="lock-clock">
          <div className="lock-time">
            {timeFormat === '24h' 
              ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
              : time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
            }
          </div>
          {showLogin ? (
            <div className="lock-date">
              {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          ) : null}
        </div>

        {showLogin ? (
          <div className="lock-panel lock-panel-enter">
            <div className="lock-avatar">
              <UserCircle className="lock-avatar-icon" />
            </div>
            <div className="lock-username">{user.username}</div>
            
            <form className="lock-form" onSubmit={handleSubmit}>
              <input
                type="password"
                className="lock-input"
                value={password}
                onChange={(e) => setPassword(sanitizePinInput(e.target.value))}
                placeholder="Enter 4-digit PIN"
                autoFocus
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
                autoComplete="one-time-code"
                required
              />

              {error ? <div className="lock-error">{error}</div> : null}

              <button type="submit" className="lock-button" disabled={loading}>
                {loading ? 'Unlocking...' : 'Unlock'}
              </button>
            </form>

            <button type="button" className="lock-switch" onClick={() => window.location.reload()}>
              Switch User
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
