import { ChevronDown, ChevronUp } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import featureLibraryReference from '../../../assets/armoury-crate/feature-library/reference-feature-library-motherboard.png'
import {
  FEATURE_LIBRARY_CARDS,
  FEATURE_LIBRARY_SELECT_OPTIONS
} from './featureLibraryData.js'
import '../../../styles/apps/armoury-crate-feature-library.css'

const FEATURE_LIBRARY_BANNER_CROPS = {
  playground: {
    backgroundImage: `url(${featureLibraryReference})`,
    backgroundSize: '1366px 768px',
    backgroundPosition: '-258px -184px'
  },
  assistant: {
    backgroundImage: `url(${featureLibraryReference})`,
    backgroundSize: '1366px 768px',
    backgroundPosition: '-258px -498px'
  },
  'content-service': {
    backgroundImage: `url(${featureLibraryReference})`,
    backgroundSize: '1366px 768px',
    backgroundPosition: '-258px -675px'
  }
}

function getModuleOperationLabel(moduleId, modules, operations) {
  if (operations[moduleId] === 'installing') return 'Installing...'
  if (operations[moduleId] === 'removing') return 'Removing...'
  return modules[moduleId] === 'installed' ? 'Uninstall' : 'Install'
}

function cardMatchesSelection(card, modules, selectionFilter) {
  if (selectionFilter === 'all') return true

  if (card.rows) {
    return card.rows.some((row) => {
      const isInstalled = modules[row.id] === 'installed'
      return selectionFilter === 'installed' ? isInstalled : !isInstalled
    })
  }

  const isInstalled = modules[card.bundleModuleId] === 'installed'
  return selectionFilter === 'installed' ? isInstalled : !isInstalled
}

function getVisibleRows(rows, modules, selectionFilter) {
  if (selectionFilter === 'all') return rows

  return rows.filter((row) => {
    const isInstalled = modules[row.id] === 'installed'
    return selectionFilter === 'installed' ? isInstalled : !isInstalled
  })
}

export default function FeatureLibraryPage({ featureState, operations, onToggleModule }) {
  const [selectionFilter, setSelectionFilter] = useState('all')
  const [isSelectMenuOpen, setIsSelectMenuOpen] = useState(false)
  const [isPlaygroundExpanded, setIsPlaygroundExpanded] = useState(true)
  const selectMenuRef = useRef(null)
  const modules = featureState.modules

  useEffect(() => {
    function handlePointerDown(event) {
      if (!selectMenuRef.current?.contains(event.target)) {
        setIsSelectMenuOpen(false)
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    return () => window.removeEventListener('mousedown', handlePointerDown)
  }, [])

  const visibleCards = FEATURE_LIBRARY_CARDS.filter((card) => cardMatchesSelection(card, modules, selectionFilter))

  return (
    <section className="armoury-crate-feature-library-page">
      <header className="armoury-crate-device-header armoury-crate-feature-library-header">
        <div className="armoury-crate-device-header-copy armoury-crate-feature-library-header-copy">
          <h1>Feature Library</h1>
        </div>

        <div className="armoury-crate-device-header-tools armoury-crate-feature-library-header-tools" aria-hidden="true">
          <FeatureLibraryHeaderIcon />
        </div>
      </header>

      <div className="armoury-crate-feature-library-toolbar">
        <div className="armoury-crate-feature-library-tabs">
          <button type="button" className="armoury-crate-feature-library-tab active">
            Feature Highlights
          </button>
        </div>

        <div className="armoury-crate-feature-library-select-shell" ref={selectMenuRef}>
          <button
            type="button"
            className={`armoury-crate-feature-library-select-button ${isSelectMenuOpen ? 'open' : ''}`}
            onClick={() => setIsSelectMenuOpen((previous) => !previous)}
          >
            <span>Select</span>
            <ChevronDown size={16} strokeWidth={2} />
          </button>

          {isSelectMenuOpen ? (
            <div className="armoury-crate-feature-library-select-menu" role="menu" aria-label="Feature library selection filter">
              {FEATURE_LIBRARY_SELECT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selectionFilter === option.id}
                  className={`armoury-crate-feature-library-select-option ${selectionFilter === option.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectionFilter(option.id)
                    setIsSelectMenuOpen(false)
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="armoury-crate-feature-library-scroll">
        {visibleCards.length > 0 ? (
          visibleCards.map((card) => {
            if (card.rows) {
              const visibleRows = getVisibleRows(card.rows, modules, selectionFilter)
              const shouldShowRows = isPlaygroundExpanded && visibleRows.length > 0

              return (
                <article key={card.id} className={`armoury-crate-feature-card ${shouldShowRows ? 'expanded' : ''}`}>
                  <div className="armoury-crate-feature-card-top">
                    <div className="armoury-crate-feature-card-media" style={FEATURE_LIBRARY_BANNER_CROPS[card.id]} aria-hidden="true" />

                    <div className="armoury-crate-feature-card-copy">
                      <div className="armoury-crate-feature-card-heading">
                        <div>
                          <h2>{card.title}</h2>
                          <p>{card.summary}</p>
                        </div>

                        <button
                          type="button"
                          className="armoury-crate-feature-card-expander"
                          onClick={() => setIsPlaygroundExpanded((previous) => !previous)}
                          aria-expanded={shouldShowRows}
                          aria-label={shouldShowRows ? 'Collapse Playground features' : 'Expand Playground features'}
                        >
                          {shouldShowRows ? <ChevronUp size={22} strokeWidth={1.9} /> : <ChevronDown size={22} strokeWidth={1.9} />}
                        </button>
                      </div>

                      <div className="armoury-crate-feature-card-list">
                        Feature list: <span>{card.featureList.join(', ')}</span>
                      </div>
                    </div>
                  </div>

                  {shouldShowRows ? (
                    <div className="armoury-crate-feature-card-rows">
                      {visibleRows.map((row) => {
                        const requiresInstalledModule = row.requires && modules[row.requires] !== 'installed'
                        const isBusy = Boolean(operations[row.id])

                        return (
                          <div key={row.id} className="armoury-crate-feature-row">
                            <div className="armoury-crate-feature-row-copy">
                              <div className="armoury-crate-feature-row-title">
                                <span className="armoury-crate-feature-row-bullet" aria-hidden="true" />
                                <strong>{row.title}</strong>
                              </div>
                              <p>{row.description}</p>
                            </div>

                            <button
                              type="button"
                              className="armoury-crate-feature-action"
                              disabled={isBusy || requiresInstalledModule}
                              onClick={() => onToggleModule(row.id)}
                            >
                              {getModuleOperationLabel(row.id, modules, operations)}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  ) : null}
                </article>
              )
            }

            const isBusy = Boolean(operations[card.bundleModuleId])

            return (
              <article key={card.id} className="armoury-crate-feature-card compact">
                <div className="armoury-crate-feature-card-top">
                  <div className="armoury-crate-feature-card-media" style={FEATURE_LIBRARY_BANNER_CROPS[card.id]} aria-hidden="true" />

                  <div className="armoury-crate-feature-card-copy">
                    <div className="armoury-crate-feature-card-heading">
                      <div>
                        <h2>{card.title}</h2>
                        <p>{card.summary}</p>
                      </div>
                    </div>

                    <div className="armoury-crate-feature-card-footer">
                      <div className="armoury-crate-feature-card-list">
                        Feature list: <span>{card.featureList.join(', ')}</span>
                      </div>

                      <button
                        type="button"
                        className="armoury-crate-feature-action"
                        disabled={isBusy}
                        onClick={() => onToggleModule(card.bundleModuleId)}
                      >
                        {getModuleOperationLabel(card.bundleModuleId, modules, operations)}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            )
          })
        ) : (
          <section className="armoury-crate-feature-library-empty">
            <div className="armoury-crate-content-empty-state-inner">
              <div className="armoury-crate-section-heading">
                <span className="armoury-crate-section-accent" aria-hidden="true" />
                <span>No Matching Features</span>
              </div>
              <p>Adjust the selection filter to review every feature bundle available in Armoury Crate.</p>
            </div>
          </section>
        )}
      </div>
    </section>
  )
}

function FeatureLibraryHeaderIcon() {
  return (
    <svg viewBox="0 0 112 74" role="img">
      <g fill="none" stroke="#f2f2f2" strokeWidth="2.2" strokeLinecap="square" strokeLinejoin="miter">
        <path d="M28 14H50V56H28Z" />
        <path d="M36 20h6" opacity="0.5" />
        <path d="M35 50h8" />
        <path d="M64 18V52" opacity="0.96" />
        <path d="M74 26V46" opacity="0.72" />
        <path d="M84 14V58" opacity="0.48" />
        <path d="M94 22V50" opacity="0.24" />
      </g>
    </svg>
  )
}
