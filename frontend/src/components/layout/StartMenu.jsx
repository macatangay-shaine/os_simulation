import { useState, useEffect, useRef } from 'react'
import { Lock, Power, Moon, RefreshCcw, Search } from 'lucide-react'

export default function StartMenu({ visible, onClose, apps, onLaunch, onLock, onLogout, onRestart, onShutdown, onSleep, updateStatus, recentApps = [], searchQuery: externalQuery = '', onSearchQueryChange }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isClosing, setIsClosing] = useState(false)
  const searchInputRef = useRef(null)

  useEffect(() => {
    if (visible && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [visible])

  useEffect(() => {
    if (externalQuery !== searchQuery) {
      setSearchQuery(externalQuery)
    }
  }, [externalQuery])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, 200)
  }

  if (!visible) return null

  const activeQuery = onSearchQueryChange ? externalQuery : searchQuery

  const filteredApps = activeQuery.trim()
    ? apps.filter((app) =>
        app.title.toLowerCase().includes(activeQuery.toLowerCase()) ||
        app.id.toLowerCase().includes(activeQuery.toLowerCase())
      )
    : apps

  const handleAppClick = (app) => {
    onLaunch(app)
    setSearchQuery('')
    onSearchQueryChange?.('')
    handleClose()
  }

  return (
    <>
      <div className="start-menu-overlay" onClick={handleClose} />
      <div className={`start-menu ${isClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="start-menu-search">
          <Search className="start-menu-search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search apps..."
            className="start-menu-search-input"
            value={activeQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              onSearchQueryChange?.(e.target.value)
            }}
          />
        </div>

        {recentApps.length > 0 && !activeQuery && (
          <>
            <div className="start-menu-section-title">Recent</div>
            <div className="start-menu-recent">
              {recentApps.map((app) => (
                <button
                  key={app.id}
                  type="button"
                  className="start-menu-recent-item"
                  data-app={app.id}
                  onClick={() => handleAppClick(app)}
                >
                  <span className="start-menu-recent-icon">
                    {app.icon ? <app.icon className="start-menu-icon" /> : null}
                  </span>
                  <span className="start-menu-recent-name">{app.title}</span>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="start-menu-section-title">
          {activeQuery ? 'Search Results' : 'All Apps'}
        </div>
        <div className="start-menu-apps">
          {filteredApps.length > 0 ? (
            filteredApps.map((app) => (
              <button
                key={app.id}
                type="button"
                className="start-menu-app"
                data-app={app.id}
                onClick={() => handleAppClick(app)}
              >
                <span className="start-menu-app-icon">
                  {app.icon ? <app.icon className="start-menu-icon" /> : null}
                </span>
                <span className="start-menu-app-name">{app.title}</span>
              </button>
            ))
          ) : (
            <div className="start-menu-no-results">No apps found</div>
          )}
        </div>

        <div className="start-menu-footer">
          <button type="button" className="start-menu-power" onClick={onLock} title="Lock the system">
            <Lock className="start-menu-power-icon" />
            Lock
          </button>
          <button
            type="button"
            className="start-menu-power"
            onClick={() => {
              onClose()
              onSleep?.()
            }}
            title="Sleep"
          >
            <Moon className="start-menu-power-icon" />
            Sleep
          </button>
          <button
            type="button"
            className="start-menu-power"
            onClick={() => {
              onClose()
              onRestart?.({ update: Boolean(updateStatus?.restart_required) })
            }}
            title={updateStatus?.restart_required ? 'Restart and finish updates' : 'Restart the system'}
          >
            <RefreshCcw className="start-menu-power-icon" />
            {updateStatus?.restart_required ? 'Restart and update' : 'Restart'}
          </button>
          <button
            type="button"
            className="start-menu-power"
            onClick={() => {
              onClose()
              onShutdown?.({ update: Boolean(updateStatus?.restart_required) })
            }}
            title={updateStatus?.restart_required ? 'Shut down and finish updates' : 'Shut down the system'}
          >
            <Power className="start-menu-power-icon" />
            {updateStatus?.restart_required ? 'Shutdown and update' : 'Shutdown'}
          </button>
        </div>
      </div>
    </>
  )
}
