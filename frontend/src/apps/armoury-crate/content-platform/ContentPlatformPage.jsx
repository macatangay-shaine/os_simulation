import { useEffect, useRef, useState } from 'react'
import ContentHeroCarousel from './ContentHeroCarousel.jsx'
import ContentSection from './ContentSection.jsx'
import ContentTabs from './ContentTabs.jsx'
import ContentToolbar from './ContentToolbar.jsx'
import {
  CONTENT_PLATFORM_FILTER_OPTIONS,
  CONTENT_PLATFORM_HEROES,
  CONTENT_PLATFORM_ITEMS_BY_ID,
  CONTENT_PLATFORM_SECTIONS,
  CONTENT_PLATFORM_SORT_OPTIONS,
  CONTENT_PLATFORM_STORAGE_KEY,
  CONTENT_PLATFORM_TABS
} from './contentPlatformData.js'

const DEFAULT_STATE = {
  activeTab: 'home',
  searchQuery: '',
  sortOrder: 'newest',
  typeFilter: 'all',
  favoritesOnly: false,
  libraryOnly: false,
  favorites: {},
  library: {}
}

function loadContentPlatformState() {
  if (typeof window === 'undefined') return DEFAULT_STATE

  try {
    const rawValue = window.localStorage.getItem(CONTENT_PLATFORM_STORAGE_KEY)
    if (!rawValue) return DEFAULT_STATE

    const parsed = JSON.parse(rawValue)
    return {
      ...DEFAULT_STATE,
      ...parsed,
      favorites: parsed?.favorites && typeof parsed.favorites === 'object' ? parsed.favorites : {},
      library: parsed?.library && typeof parsed.library === 'object' ? parsed.library : {}
    }
  } catch (error) {
    return DEFAULT_STATE
  }
}

function sortItems(items, sortOrder) {
  const sorted = [...items]

  if (sortOrder === 'oldest') {
    sorted.sort((left, right) => new Date(left.sortDate) - new Date(right.sortDate))
    return sorted
  }

  if (sortOrder === 'az') {
    sorted.sort((left, right) => left.title.localeCompare(right.title))
    return sorted
  }

  sorted.sort((left, right) => new Date(right.sortDate) - new Date(left.sortDate))
  return sorted
}

function itemMatchesSearch(item, searchQuery) {
  if (!searchQuery.trim()) return true

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const haystack = `${item.title} ${(item.tags || []).join(' ')}`.toLowerCase()
  return haystack.includes(normalizedQuery)
}

function itemMatchesFilters(item, state) {
  if (state.typeFilter !== 'all' && item.type !== state.typeFilter) return false
  if (state.favoritesOnly && !state.favorites[item.id]) return false
  if (state.libraryOnly && !state.library[item.id]) return false
  return itemMatchesSearch(item, state.searchQuery)
}

export default function ContentPlatformPage() {
  const [uiState, setUiState] = useState(() => loadContentPlatformState())
  const [heroIndex, setHeroIndex] = useState(0)
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false)
  const filterMenuRef = useRef(null)
  const acquisitionTimeoutsRef = useRef(new Map())

  const heroSlides = CONTENT_PLATFORM_HEROES[uiState.activeTab] || []
  const activeSections = CONTENT_PLATFORM_SECTIONS[uiState.activeTab] || []
  const visibleSections = activeSections
    .map((section) => {
      const items = sortItems(
        section.itemIds
          .map((itemId) => CONTENT_PLATFORM_ITEMS_BY_ID[itemId])
          .filter(Boolean)
          .filter((item) => itemMatchesFilters(item, uiState)),
        uiState.sortOrder
      )

      return {
        ...section,
        items
      }
    })
    .filter((section) => section.items.length > 0)

  useEffect(() => {
    if (typeof window === 'undefined') return

    window.localStorage.setItem(CONTENT_PLATFORM_STORAGE_KEY, JSON.stringify(uiState))
  }, [uiState])

  useEffect(() => {
    if (uiState.activeTab !== 'home' || heroSlides.length < 2) {
      setHeroIndex(0)
      return undefined
    }

    const intervalId = window.setInterval(() => {
      setHeroIndex((previous) => (previous + 1) % heroSlides.length)
    }, 5600)

    return () => window.clearInterval(intervalId)
  }, [uiState.activeTab, heroSlides.length])

  useEffect(() => {
    function handleWindowClick(event) {
      if (!filterMenuRef.current?.contains(event.target)) {
        setIsFilterMenuOpen(false)
      }
    }

    window.addEventListener('mousedown', handleWindowClick)
    return () => window.removeEventListener('mousedown', handleWindowClick)
  }, [])

  useEffect(
    () => () => {
      acquisitionTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
      acquisitionTimeoutsRef.current.clear()
    },
    []
  )

  function updateUiState(partialState) {
    setUiState((previous) => ({
      ...previous,
      ...(typeof partialState === 'function' ? partialState(previous) : partialState)
    }))
  }

  function handleTabSelect(tabId) {
    updateUiState({ activeTab: tabId, typeFilter: 'all' })
    setIsFilterMenuOpen(false)
    setHeroIndex(0)
  }

  function handleTypeFilterChange(filterId) {
    updateUiState({ typeFilter: filterId })
    setIsFilterMenuOpen(false)
  }

  function handleToggleFavorite(itemId) {
    updateUiState((previous) => ({
      favorites: {
        ...previous.favorites,
        [itemId]: !previous.favorites[itemId]
      }
    }))
  }

  function handleAcquire(itemId) {
    const currentStatus = uiState.library[itemId] || 'available'
    if (currentStatus === 'downloading') return

    const existingTimeout = acquisitionTimeoutsRef.current.get(itemId)
    if (existingTimeout) {
      window.clearTimeout(existingTimeout)
      acquisitionTimeoutsRef.current.delete(itemId)
    }

    if (currentStatus === 'added') {
      updateUiState((previous) => ({
        library: {
          ...previous.library,
          [itemId]: 'added'
        }
      }))
      return
    }

    updateUiState((previous) => ({
      library: {
        ...previous.library,
        [itemId]: 'downloading'
      }
    }))

    const timeoutId = window.setTimeout(() => {
      setUiState((previous) => ({
        ...previous,
        library: {
          ...previous.library,
          [itemId]: 'added'
        }
      }))
      acquisitionTimeoutsRef.current.delete(itemId)
    }, 1300)

    acquisitionTimeoutsRef.current.set(itemId, timeoutId)
  }

  return (
    <section className="armoury-crate-content-page">
      <header className="armoury-crate-content-header">
        <div className="armoury-crate-content-header-copy">
          <h1>Content Platform</h1>
        </div>

        <div className="armoury-crate-device-header-tools armoury-crate-content-header-tools" aria-hidden="true">
          <ContentPlatformHeaderIcon />
        </div>
      </header>

      <ContentTabs tabs={CONTENT_PLATFORM_TABS} activeTab={uiState.activeTab} onSelect={handleTabSelect} />

      <ContentToolbar
        searchValue={uiState.searchQuery}
        onSearchChange={(searchQuery) => updateUiState({ searchQuery })}
        sortValue={uiState.sortOrder}
        sortOptions={CONTENT_PLATFORM_SORT_OPTIONS}
        onSortChange={(sortOrder) => updateUiState({ sortOrder })}
        filterOptions={CONTENT_PLATFORM_FILTER_OPTIONS}
        activeTypeFilter={uiState.typeFilter}
        onTypeFilterChange={handleTypeFilterChange}
        isFilterMenuOpen={isFilterMenuOpen}
        onToggleFilterMenu={() => setIsFilterMenuOpen((previous) => !previous)}
        filterMenuRef={filterMenuRef}
        favoritesOnly={uiState.favoritesOnly}
        onToggleFavoritesOnly={() => updateUiState((previous) => ({ favoritesOnly: !previous.favoritesOnly }))}
        libraryOnly={uiState.libraryOnly}
        onToggleLibraryOnly={() => updateUiState((previous) => ({ libraryOnly: !previous.libraryOnly }))}
      />

      {uiState.activeTab === 'home' && heroSlides.length > 0 ? (
        <ContentHeroCarousel
          slides={heroSlides}
          activeIndex={heroIndex}
          onSelect={setHeroIndex}
          onPrevious={() => setHeroIndex((previous) => (previous - 1 + heroSlides.length) % heroSlides.length)}
          onNext={() => setHeroIndex((previous) => (previous + 1) % heroSlides.length)}
        />
      ) : null}

      <div className="armoury-crate-content-sections">
        {visibleSections.length > 0 ? (
          visibleSections.map((section) => (
            <ContentSection
              key={section.id}
              section={section}
              items={section.items}
              favorites={uiState.favorites}
              library={uiState.library}
              onToggleFavorite={handleToggleFavorite}
              onAcquire={handleAcquire}
            />
          ))
        ) : (
          <section className="armoury-crate-content-empty-state">
            <div className="armoury-crate-content-empty-state-inner">
              <div className="armoury-crate-section-heading">
                <span className="armoury-crate-section-accent" aria-hidden="true" />
                <span>No Results</span>
              </div>
              <p>Adjust the search, filter, or library view to see more content in this tab.</p>
            </div>
          </section>
        )}
      </div>
    </section>
  )
}

function ContentPlatformHeaderIcon() {
  return (
    <svg viewBox="0 0 112 74" role="img">
      <g fill="none" stroke="#f2f2f2" strokeWidth="2.2" strokeLinecap="square" strokeLinejoin="miter">
        <path d="M27 14H49V55H27Z" />
        <path d="M51 57H25" />
        <path d="M61 20V51" />
        <path d="M69 14V57" opacity="0.45" />
        <path d="M77 24V48" opacity="0.65" />
        <path d="M85 18V53" opacity="0.3" />
      </g>
    </svg>
  )
}
