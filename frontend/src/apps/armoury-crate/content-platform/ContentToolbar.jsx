import { ChevronDown, Filter, FolderOpen, Heart, Search } from 'lucide-react'

export default function ContentToolbar({
  searchValue,
  onSearchChange,
  sortValue,
  sortOptions,
  onSortChange,
  filterOptions,
  activeTypeFilter,
  onTypeFilterChange,
  isFilterMenuOpen,
  onToggleFilterMenu,
  filterMenuRef,
  favoritesOnly,
  onToggleFavoritesOnly,
  libraryOnly,
  onToggleLibraryOnly
}) {
  return (
    <div className="armoury-crate-content-toolbar">
      <label className="armoury-crate-content-search">
        <input
          type="search"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search"
          aria-label="Search content"
        />
        <Search size={21} strokeWidth={1.75} />
      </label>

      <label className="armoury-crate-content-sort">
        <select value={sortValue} onChange={(event) => onSortChange(event.target.value)} aria-label="Sort content">
          {sortOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown size={19} strokeWidth={1.8} />
      </label>

      <div className="armoury-crate-content-toolbar-actions">
        <div className="armoury-crate-content-filter-shell" ref={filterMenuRef}>
          <button
            type="button"
            className={`armoury-crate-content-toolbar-icon ${isFilterMenuOpen || activeTypeFilter !== 'all' ? 'active' : ''}`}
            aria-label="Filter content type"
            aria-expanded={isFilterMenuOpen}
            onClick={onToggleFilterMenu}
          >
            <Filter size={20} strokeWidth={1.85} />
          </button>

          {isFilterMenuOpen ? (
            <div className="armoury-crate-content-filter-menu" role="menu" aria-label="Content type filters">
              {filterOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={activeTypeFilter === option.id}
                  className={`armoury-crate-content-filter-option ${activeTypeFilter === option.id ? 'active' : ''}`}
                  onClick={() => onTypeFilterChange(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          className={`armoury-crate-content-toolbar-icon ${favoritesOnly ? 'active' : ''}`}
          aria-pressed={favoritesOnly}
          aria-label="Show favorites only"
          onClick={onToggleFavoritesOnly}
        >
          <Heart size={20} strokeWidth={1.85} />
        </button>

        <button
          type="button"
          className={`armoury-crate-content-toolbar-icon ${libraryOnly ? 'active' : ''}`}
          aria-pressed={libraryOnly}
          aria-label="Show library only"
          onClick={onToggleLibraryOnly}
        >
          <FolderOpen size={20} strokeWidth={1.85} />
        </button>
      </div>
    </div>
  )
}
