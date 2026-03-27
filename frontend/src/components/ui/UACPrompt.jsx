import { Shield, AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function UACPrompt({ action, resource, onAllow, onDeny }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onDeny?.()
      }
    }
    
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onDeny])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Get current user
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const sessionToken = localStorage.getItem('session_token')

      // Verify admin credentials
      const loginResponse = await fetch('http://localhost:8000/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          password: password
        })
      })

      if (loginResponse.ok) {
        const data = await loginResponse.json()
        
        // Check if user is admin
        if (data.user.role === 'admin') {
          onAllow?.()
        } else {
          setError('Administrator privileges required')
        }
      } else {
        setError('Incorrect password')
      }
    } catch (err) {
      setError('Unable to verify credentials')
    } finally {
      setLoading(false)
    }
  }

  const getActionDescription = () => {
    const descriptions = {
      delete_system_file: 'Delete system file',
      modify_system: 'Modify system settings',
      install_app: 'Install application',
      change_permissions: 'Change permissions',
      access_system_path: 'Access system directory'
    }
    return descriptions[action] || action
  }

  return (
    <div className="uac-overlay">
      <div className="uac-prompt">
        <div className="uac-header">
          <div className="uac-icon">
            <Shield size={32} />
          </div>
          <div className="uac-title">
            <AlertTriangle className="uac-warning" size={16} />
            User Account Control
          </div>
        </div>

        <div className="uac-body">
          <div className="uac-message">
            Do you want to allow this app to make changes to your system?
          </div>

          <div className="uac-details">
            <div className="uac-detail-row">
              <span className="uac-label">Action:</span>
              <span className="uac-value">{getActionDescription()}</span>
            </div>
            {resource && (
              <div className="uac-detail-row">
                <span className="uac-label">Resource:</span>
                <span className="uac-value">{resource}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="uac-form">
            <div className="uac-input-group">
              <label htmlFor="uac-password">Enter administrator password:</label>
              <input
                id="uac-password"
                type="password"
                className="uac-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoFocus
                disabled={loading}
              />
            </div>

            {error && <div className="uac-error">{error}</div>}

            <div className="uac-actions">
              <button
                type="button"
                className="uac-button uac-button-secondary"
                onClick={onDeny}
                disabled={loading}
              >
                No
              </button>
              <button
                type="submit"
                className="uac-button uac-button-primary"
                disabled={loading || !password}
              >
                {loading ? 'Verifying...' : 'Yes'}
              </button>
            </div>
          </form>
        </div>

        <div className="uac-footer">
          <Shield size={12} />
          <span>To continue, type an administrator password.</span>
        </div>
      </div>
    </div>
  )
}
