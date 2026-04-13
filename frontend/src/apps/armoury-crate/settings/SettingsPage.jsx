import {
  ChevronDown,
  ChevronUp,
  FileText,
  Info,
  SearchCheck,
  ShieldCheck
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { isArmouryNavVisible } from '../feature-library/featureLibraryData.js'
import {
  ARMOURY_LAUNCH_PAGE_OPTIONS,
  ARMOURY_SETTINGS_TABS,
  ARMOURY_THEME_GROUPS,
  ARMOURY_DEVICE_IMAGE_STYLE_OPTIONS,
  formatUpdateCheckTime
} from './settingsData.js'
import '../../../styles/apps/armoury-crate-settings.css'

function getUpdateButtonLabel(status, inProgress) {
  if (inProgress) return 'Updating...'
  if (status === 'latest') return 'Latest'
  return 'Update'
}

export default function SettingsPage({ settingsState, featureLibraryState, onChange }) {
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false)
  const [updateOperations, setUpdateOperations] = useState({})
  const availableLaunchOptions = useMemo(
    () => ARMOURY_LAUNCH_PAGE_OPTIONS.filter((option) => isArmouryNavVisible(option.id, featureLibraryState)),
    [featureLibraryState]
  )

  function handleCheckUpdates() {
    if (isCheckingUpdates) return

    setIsCheckingUpdates(true)
    window.setTimeout(() => {
      onChange({ lastCheckedAt: new Date().toISOString() })
      setIsCheckingUpdates(false)
    }, 1150)
  }

  function handleUpdateItem(updateId) {
    const updateItem = settingsState.updates.find((item) => item.id === updateId)
    if (!updateItem || updateItem.status === 'latest' || updateOperations[updateId]) return

    setUpdateOperations((previous) => ({
      ...previous,
      [updateId]: true
    }))

    window.setTimeout(() => {
      onChange((previous) => ({
        updates: previous.updates.map((item) =>
          item.id === updateId
            ? {
                ...item,
                status: 'latest',
                currentVersion: item.availableVersion
              }
            : item
        ),
        lastCheckedAt: new Date().toISOString()
      }))

      setUpdateOperations((previous) => {
        const nextState = { ...previous }
        delete nextState[updateId]
        return nextState
      })
    }, 980)
  }

  function handleUpdateAll() {
    settingsState.updates
      .filter((item) => item.status !== 'latest')
      .forEach((item, index) => {
        window.setTimeout(() => handleUpdateItem(item.id), index * 120)
      })
  }

  function renderGeneralTab() {
    return (
      <>
        <section className="armoury-crate-settings-section compact">
          <div className="armoury-crate-settings-section-copy">
            <h2>Launch With</h2>
            <p>Choose your Armoury Crate landing page.</p>
          </div>

          <label className="armoury-crate-settings-select-shell">
            <select
              value={availableLaunchOptions.some((option) => option.id === settingsState.launchPage) ? settingsState.launchPage : 'home'}
              onChange={(event) => onChange({ launchPage: event.target.value })}
            >
              {availableLaunchOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="armoury-crate-settings-select-arrow" aria-hidden="true">
              <ChevronDown size={18} strokeWidth={1.9} />
            </span>
          </label>
        </section>

        <section className="armoury-crate-settings-section">
          <div className="armoury-crate-settings-section-head">
            <div className="armoury-crate-settings-section-copy">
              <h2>Customize theme</h2>
            </div>

            <button
              type="button"
              className="armoury-crate-settings-section-toggle"
              onClick={() => onChange({ themePanelExpanded: !settingsState.themePanelExpanded })}
              aria-expanded={settingsState.themePanelExpanded}
            >
              {settingsState.themePanelExpanded ? <ChevronUp size={24} strokeWidth={1.9} /> : <ChevronDown size={24} strokeWidth={1.9} />}
            </button>
          </div>

          {settingsState.themePanelExpanded ? (
            <div className="armoury-crate-settings-preview-shell">
              {ARMOURY_THEME_GROUPS.map((group) => (
                <div key={group.id} className="armoury-crate-settings-theme-group">
                  <div className="armoury-crate-settings-theme-group-title">{group.label}</div>
                  <div className="armoury-crate-settings-theme-row">
                    {group.options.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className={`armoury-crate-settings-choice ${settingsState.themeId === option.id ? 'active' : ''}`}
                        onClick={() => onChange({ themeId: option.id })}
                      >
                        <span className="armoury-crate-settings-choice-radio" aria-hidden="true" />
                        <ThemePreviewCard option={option} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <section className="armoury-crate-settings-section">
          <div className="armoury-crate-settings-section-head">
            <div className="armoury-crate-settings-section-copy">
              <h2>Device Image Style</h2>
              <p>Choose a display style. If the photographic style cannot be loaded, a sketch-style image will be shown instead.</p>
            </div>

            <div className="armoury-crate-settings-section-actions">
              <button
                type="button"
                className="armoury-crate-settings-action-button"
                onClick={() => onChange((previous) => ({ deviceImageReloadToken: previous.deviceImageReloadToken + 1 }))}
              >
                Reload Device Image
              </button>
              <button
                type="button"
                className="armoury-crate-settings-section-toggle"
                onClick={() => onChange({ deviceImagePanelExpanded: !settingsState.deviceImagePanelExpanded })}
                aria-expanded={settingsState.deviceImagePanelExpanded}
              >
                {settingsState.deviceImagePanelExpanded ? <ChevronUp size={24} strokeWidth={1.9} /> : <ChevronDown size={24} strokeWidth={1.9} />}
              </button>
            </div>
          </div>

          {settingsState.deviceImagePanelExpanded ? (
            <div className="armoury-crate-settings-preview-shell">
              <div className="armoury-crate-settings-theme-row device-style-row">
                {ARMOURY_DEVICE_IMAGE_STYLE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`armoury-crate-settings-choice ${settingsState.deviceImageStyle === option.id ? 'active' : ''}`}
                    onClick={() => onChange({ deviceImageStyle: option.id })}
                  >
                    <span className="armoury-crate-settings-choice-radio" aria-hidden="true" />
                    <DeviceImagePreview option={option} />
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </>
    )
  }

  function renderUpdateCenterTab() {
    const availableUpdates = settingsState.updates.filter((item) => item.status !== 'latest')

    return (
      <section className="armoury-crate-settings-panel-page">
        <div className="armoury-crate-settings-toolbar">
          <div className="armoury-crate-settings-toolbar-copy">
            <strong>Last checked: {formatUpdateCheckTime(settingsState.lastCheckedAt)}</strong>
            <span>{availableUpdates.length} update(s) available</span>
          </div>

          <div className="armoury-crate-settings-toolbar-actions">
            <button type="button" className="armoury-crate-settings-action-button" onClick={handleCheckUpdates}>
              {isCheckingUpdates ? 'Checking...' : 'Check for Updates'}
            </button>
            <button
              type="button"
              className="armoury-crate-settings-action-button secondary"
              disabled={availableUpdates.length === 0}
              onClick={handleUpdateAll}
            >
              Update All
            </button>
          </div>
        </div>

        <div className="armoury-crate-settings-update-list">
          {settingsState.updates.map((item) => (
            <article key={item.id} className="armoury-crate-settings-update-card">
              <div className="armoury-crate-settings-update-copy">
                <h3>{item.title}</h3>
                <p>{item.category}</p>
                <div className="armoury-crate-settings-update-meta">
                  <span>Current {item.currentVersion}</span>
                  <span>Available {item.availableVersion}</span>
                </div>
              </div>

              <button
                type="button"
                className={`armoury-crate-settings-action-button ${item.status === 'latest' ? 'secondary' : ''}`}
                disabled={item.status === 'latest' || updateOperations[item.id]}
                onClick={() => handleUpdateItem(item.id)}
              >
                {getUpdateButtonLabel(item.status, updateOperations[item.id])}
              </button>
            </article>
          ))}
        </div>
      </section>
    )
  }

  function renderAboutTab() {
    return (
      <section className="armoury-crate-settings-panel-page">
        <div className="armoury-crate-settings-about-grid">
          <article className="armoury-crate-settings-about-card">
            <div className="armoury-crate-settings-about-title">
              <Info size={18} strokeWidth={1.8} />
              <strong>Version</strong>
            </div>
            <dl>
              <div>
                <dt>Armoury Crate</dt>
                <dd>6.2.0.0</dd>
              </div>
              <div>
                <dt>Service Version</dt>
                <dd>5.7.11</dd>
              </div>
              <div>
                <dt>Device Kit</dt>
                <dd>2026.04.13</dd>
              </div>
            </dl>
          </article>

          <article className="armoury-crate-settings-about-card">
            <div className="armoury-crate-settings-about-title">
              <SearchCheck size={18} strokeWidth={1.8} />
              <strong>App Diagnostics</strong>
            </div>
            <p>Collect Armoury Crate diagnostics before generating a support log package.</p>
            <div className="armoury-crate-settings-about-actions">
              <button
                type="button"
                className="armoury-crate-settings-action-button"
                onClick={() => onChange({ diagnosticsRecording: !settingsState.diagnosticsRecording })}
              >
                {settingsState.diagnosticsRecording ? 'Stop Recording' : 'Record Log'}
              </button>
              <button
                type="button"
                className="armoury-crate-settings-action-button secondary"
                onClick={() =>
                  onChange({
                    diagnosticsRecording: false,
                    lastLogGeneratedAt: new Date().toISOString()
                  })
                }
              >
                Generate Log Data
              </button>
            </div>
            <div className="armoury-crate-settings-about-status">
              {settingsState.lastLogGeneratedAt
                ? `Last generated ${formatUpdateCheckTime(settingsState.lastLogGeneratedAt)}`
                : 'No diagnostic package generated yet'}
            </div>
          </article>

          <article className="armoury-crate-settings-about-card">
            <div className="armoury-crate-settings-about-title">
              <FileText size={18} strokeWidth={1.8} />
              <strong>Privacy Policy & FAQ</strong>
            </div>
            <p>Review ASUS support resources and the built-in privacy disclosure used by Armoury Crate services.</p>
            <div className="armoury-crate-settings-about-links">
              <button type="button" className="armoury-crate-settings-action-button secondary">
                Privacy Policy
              </button>
              <button type="button" className="armoury-crate-settings-action-button secondary">
                FAQ
              </button>
            </div>
          </article>

          <article className="armoury-crate-settings-about-card">
            <div className="armoury-crate-settings-about-title">
              <ShieldCheck size={18} strokeWidth={1.8} />
              <strong>Status</strong>
            </div>
            <div className="armoury-crate-settings-status-list">
              <div>
                <span>Diagnostics</span>
                <strong>{settingsState.diagnosticsRecording ? 'Recording' : 'Idle'}</strong>
              </div>
              <div>
                <span>Update Center</span>
                <strong>{settingsState.updates.some((item) => item.status !== 'latest') ? 'Action Needed' : 'Up to Date'}</strong>
              </div>
              <div>
                <span>Landing Page</span>
                <strong>{availableLaunchOptions.find((option) => option.id === settingsState.launchPage)?.label || 'Home'}</strong>
              </div>
            </div>
          </article>
        </div>
      </section>
    )
  }

  return (
    <section className="armoury-crate-settings-page">
      <header className="armoury-crate-device-header armoury-crate-settings-header">
        <div className="armoury-crate-device-header-copy">
          <h1>Settings</h1>
        </div>

        <div className="armoury-crate-device-header-tools armoury-crate-settings-header-tools" aria-hidden="true">
          <SettingsHeaderIcon />
        </div>
      </header>

      <div className="armoury-crate-settings-tabs" role="tablist" aria-label="Armoury Crate settings tabs">
        {ARMOURY_SETTINGS_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={settingsState.activeTab === tab.id}
            className={`armoury-crate-settings-tab ${settingsState.activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onChange({ activeTab: tab.id })}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="armoury-crate-settings-scroll">
        {settingsState.activeTab === 'general' ? renderGeneralTab() : null}
        {settingsState.activeTab === 'update-center' ? renderUpdateCenterTab() : null}
        {settingsState.activeTab === 'about' ? renderAboutTab() : null}
      </div>
    </section>
  )
}

function ThemePreviewCard({ option }) {
  return (
    <div className={`armoury-crate-settings-theme-card tone-${option.tone}`}>
      <span>{option.label}</span>
    </div>
  )
}

function DeviceImagePreview({ option }) {
  return (
    <div className={`armoury-crate-settings-device-card ${option.id}`}>
      <div className="screen" />
      <div className="keyboard" />
      <div className="mouse" />
    </div>
  )
}

function SettingsHeaderIcon() {
  return (
    <svg viewBox="0 0 112 74" role="img">
      <g fill="none" stroke="#f2f2f2" strokeWidth="2.2" strokeLinecap="square" strokeLinejoin="miter">
        <path d="M28 14H50V56H28Z" />
        <path d="M38 21v28" />
        <path d="M64 18V52" opacity="0.94" />
        <path d="M74 26V46" opacity="0.7" />
        <path d="M84 14V58" opacity="0.46" />
        <path d="M94 22V50" opacity="0.24" />
      </g>
    </svg>
  )
}
