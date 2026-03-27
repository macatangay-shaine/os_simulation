import { useState, useEffect } from 'react'
import { Download, Trash2, X, AlertCircle } from 'lucide-react'

export default function AppStore() {
  const [installedApps, setInstalledApps] = useState([])
  const [availableApps, setAvailableApps] = useState([])
  const [activeTab, setActiveTab] = useState('installed')
  const [loading, setLoading] = useState(true)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadApps()
  }, [])

  const loadApps = async () => {
    try {
      const [installed, available] = await Promise.all([
        fetch('http://localhost:8000/app/list').then(r => r.json()),
        fetch('http://localhost:8000/app/store').then(r => r.json())
      ])
      setInstalledApps(installed)
      setAvailableApps(available)
    } catch (error) {
      setMessage('Failed to load apps')
    } finally {
      setLoading(false)
    }
  }

  const handleInstallClick = (app) => {
    setInstallPrompt({
      ...app,
      permissionsText: app.permissions?.length > 0 
        ? app.permissions.join(', ')
        : 'No special permissions required'
    })
  }

  const confirmInstall = async (app) => {
    try {
      const response = await fetch('http://localhost:8000/app/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: app.id,
          name: app.name,
          version: app.version,
          description: app.description,
          icon: app.icon,
          category: app.category,
          permissions: app.permissions || []
        })
      })

      if (response.ok) {
        setMessage(`${app.name} installed successfully!`)
        setInstallPrompt(null)
        loadApps()
      } else {
        setMessage('Installation failed')
      }
    } catch (error) {
      setMessage('Installation error: ' + error.message)
    }
  }

  const handleUninstall = async (appId, appName) => {
    if (!confirm(`Uninstall ${appName}?`)) return

    try {
      const response = await fetch(`http://localhost:8000/app/uninstall?app_id=${appId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMessage(`${appName} uninstalled successfully`)
        loadApps()
      } else {
        const error = await response.json()
        setMessage(`Error: ${error.detail || 'Uninstall failed'}`)
      }
    } catch (error) {
      setMessage('Uninstall error: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="app-store">
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--win-muted)' }}>
          Loading apps...
        </div>
      </div>
    )
  }

  return (
    <div className="app-store">
      {message && (
        <div className="app-store-message">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="app-store-message-close">
            ✕
          </button>
        </div>
      )}

      <div className="app-store-tabs">
        <button
          className={`app-store-tab ${activeTab === 'installed' ? 'active' : ''}`}
          onClick={() => setActiveTab('installed')}
        >
          Installed ({installedApps.length})
        </button>
        <button
          className={`app-store-tab ${activeTab === 'available' ? 'active' : ''}`}
          onClick={() => setActiveTab('available')}
        >
          App Store ({availableApps.length})
        </button>
      </div>

      <div className="app-store-content">
        {activeTab === 'installed' ? (
          <div className="app-store-grid">
            {installedApps.length === 0 ? (
              <div className="app-store-empty">No apps installed</div>
            ) : (
              installedApps.map(app => (
                <div key={app.id} className="app-store-item installed">
                  <div className="app-store-icon">📦</div>
                  <div className="app-store-info">
                    <div className="app-store-name">{app.name}</div>
                    <div className="app-store-version">v{app.version}</div>
                    <div className="app-store-description">{app.description}</div>
                    {app.storage_size_mb && (
                      <div className="app-store-storage">💾 {app.storage_size_mb} MB</div>
                    )}
                    {app.builtin && (
                      <div className="app-store-badge">Built-in</div>
                    )}
                  </div>
                  {!app.builtin && (
                    <button
                      className="app-store-uninstall"
                      onClick={() => handleUninstall(app.id, app.name)}
                      title="Uninstall"
                    >
                      <Trash2 size={16} />
                      Uninstall
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="app-store-grid">
            {availableApps.length === 0 ? (
              <div className="app-store-empty">All apps are already installed</div>
            ) : (
              availableApps.map(app => (
                <div key={app.id} className="app-store-item available">
                  <div className="app-store-icon">📦</div>
                  <div className="app-store-info">
                    <div className="app-store-name">{app.name}</div>
                    <div className="app-store-version">v{app.version}</div>
                    <div className="app-store-description">{app.description}</div>
                    <div className="app-store-category">{app.category}</div>
                  </div>
                  <button
                    className="app-store-install"
                    onClick={() => handleInstallClick(app)}
                  >
                    <Download size={16} />
                    Install
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {installPrompt && (
        <div className="app-store-prompt-overlay">
          <div className="app-store-prompt">
            <button
              className="app-store-prompt-close"
              onClick={() => setInstallPrompt(null)}
            >
              <X size={20} />
            </button>

            <div className="app-store-prompt-icon">📦</div>
            <h2 className="app-store-prompt-title">Install {installPrompt.name}?</h2>
            <p className="app-store-prompt-description">{installPrompt.description}</p>

            <div className="app-store-prompt-section">
              <h3 className="app-store-prompt-label">Permissions Required:</h3>
              <div className="app-store-permissions">
                {installPrompt.permissions?.length > 0 ? (
                  <ul>
                    {installPrompt.permissions.map(perm => (
                      <li key={perm}>• {perm}</li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: 'var(--win-muted)' }}>No special permissions required</p>
                )}
              </div>
            </div>

            <div className="app-store-prompt-actions">
              <button
                className="app-store-prompt-cancel"
                onClick={() => setInstallPrompt(null)}
              >
                Cancel
              </button>
              <button
                className="app-store-prompt-confirm"
                onClick={() => confirmInstall(installPrompt)}
              >
                Install
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
