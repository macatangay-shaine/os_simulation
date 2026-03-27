import { useEffect, useMemo, useRef, useState } from 'react'
import { Accessibility, Power, UserCircle, Wifi, WifiOff, RefreshCcw, Moon } from 'lucide-react'

export default function LoginScreen({ onLogin, onRestart, onShutdown, onSleep }) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showWifiMenu, setShowWifiMenu] = useState(false)
  const [showPowerMenu, setShowPowerMenu] = useState(false)
  const [showAccessibilityMenu, setShowAccessibilityMenu] = useState(false)
  const [selectedNetwork, setSelectedNetwork] = useState('JezOS WiFi')
  const [accessibility, setAccessibility] = useState({ highContrast: false, largeText: false })
  const systemMenuRef = useRef(null)

  const accounts = useMemo(
    () => [
      { id: 'admin', label: 'Admin' },
      { id: 'user', label: 'User' },
      { id: 'other', label: 'Other user' }
    ],
    []
  )

  const activeAccount = accounts.find((account) => account.id === username) || accounts[2]
  const displayName = username ? activeAccount?.label || username : '_______'

  const networks = useMemo(
    () => [
      { id: 'jezos', name: 'JezOS WiFi', strength: 4 },
      { id: 'studio', name: 'Studio Network', strength: 3 },
      { id: 'guest', name: 'Guest', strength: 2 },
      { id: 'mobile', name: 'Mobile Hotspot', strength: 1 }
    ],
    []
  )

  useEffect(() => {
    const handleClick = (event) => {
      if (!systemMenuRef.current?.contains(event.target)) {
        setShowWifiMenu(false)
        setShowPowerMenu(false)
        setShowAccessibilityMenu(false)
      }
    }

    window.addEventListener('mousedown', handleClick)
    return () => window.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('http://localhost:8000/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('session_token', data.session_token)
        localStorage.setItem('user', JSON.stringify(data.user))
        onLogin(data.user)
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Login failed')
      }
    } catch (err) {
      setError('Unable to connect to server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`login-screen${accessibility.highContrast ? ' login-contrast' : ''}${
        accessibility.largeText ? ' login-large-text' : ''
      }`}
    >
      <div className="login-center">
        <div className="login-panel">
          <div className="login-avatar">
            <UserCircle className="login-avatar-icon" />
          </div>
          <div className="login-account-name">{displayName}</div>
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label className="login-label">PIN</label>
              <input
                type="password"
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter PIN"
                autoFocus
                required
              />
            </div>

            {error ? <div className="login-error">{error}</div> : null}

            <div className="login-links">
              <button type="button" className="login-link">
                I forgot my PIN
              </button>
              <button type="button" className="login-link">
                Sign-in options
              </button>
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>

      <div className="login-accounts">
        {accounts.map((account) => (
          <button
            key={account.id}
            type="button"
            className={`login-account ${username === account.id ? 'active' : ''}`}
            onClick={() => {
              setUsername(account.id === 'other' ? '' : account.id)
              setPassword('')
              setError('')
            }}
          >
            <span className="login-account-avatar">
              <UserCircle className="login-account-icon" />
            </span>
            <span className="login-account-label">{account.label}</span>
          </button>
        ))}
      </div>

      <div className="login-system-icons" ref={systemMenuRef}>
        <button
          type="button"
          className="login-system-button"
          title="Network"
          onClick={() => {
            setShowWifiMenu((prev) => !prev)
            setShowPowerMenu(false)
            setShowAccessibilityMenu(false)
          }}
        >
          <Wifi className="login-system-icon" />
        </button>
        <button
          type="button"
          className="login-system-button"
          title="Accessibility"
          onClick={() => {
            setShowAccessibilityMenu((prev) => !prev)
            setShowWifiMenu(false)
            setShowPowerMenu(false)
          }}
        >
          <Accessibility className="login-system-icon" />
        </button>
        <button
          type="button"
          className="login-system-button"
          title="Power"
          onClick={() => {
            setShowPowerMenu((prev) => !prev)
            setShowWifiMenu(false)
            setShowAccessibilityMenu(false)
          }}
        >
          <Power className="login-system-icon" />
        </button>

        {showWifiMenu ? (
          <div className="login-system-menu">
            <div className="login-system-menu-title">Network</div>
            <div className="login-network-list">
              {networks.map((network) => (
                <button
                  key={network.id}
                  type="button"
                  className={`login-network-item ${
                    selectedNetwork === network.name ? 'active' : ''
                  }`}
                  onClick={() => setSelectedNetwork(network.name)}
                >
                  <span className="login-network-name">{network.name}</span>
                  <span className={`login-network-signal signal-${network.strength}`}>
                    <Wifi className="login-network-icon" />
                  </span>
                </button>
              ))}
              <button type="button" className="login-network-item">
                <span className="login-network-name">Not connected</span>
                <span className="login-network-signal signal-0">
                  <WifiOff className="login-network-icon" />
                </span>
              </button>
            </div>
          </div>
        ) : null}

        {showAccessibilityMenu ? (
          <div className="login-system-menu">
            <div className="login-system-menu-title">Accessibility</div>
            <div className="login-toggle-list">
              <button
                type="button"
                className={`login-toggle ${accessibility.highContrast ? 'active' : ''}`}
                onClick={() =>
                  setAccessibility((prev) => ({ ...prev, highContrast: !prev.highContrast }))
                }
              >
                High contrast
              </button>
              <button
                type="button"
                className={`login-toggle ${accessibility.largeText ? 'active' : ''}`}
                onClick={() =>
                  setAccessibility((prev) => ({ ...prev, largeText: !prev.largeText }))
                }
              >
                Larger text
              </button>
            </div>
          </div>
        ) : null}

        {showPowerMenu ? (
          <div className="login-system-menu">
            <div className="login-system-menu-title">Power</div>
            <div className="login-toggle-list">
              <button
                type="button"
                className="login-toggle"
                onClick={() => onSleep?.()}
              >
                <Moon className="login-toggle-icon" />
                Sleep
              </button>
              <button
                type="button"
                className="login-toggle"
                onClick={() => onRestart?.({ update: false })}
              >
                <RefreshCcw className="login-toggle-icon" />
                Restart
              </button>
              <button
                type="button"
                className="login-toggle"
                onClick={() => onShutdown?.({ update: false })}
              >
                <Power className="login-toggle-icon" />
                Shut down
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
