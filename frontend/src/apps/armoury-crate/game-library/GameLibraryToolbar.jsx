import { ChevronDown, Grid2x2, List, MoreVertical, Search } from 'lucide-react'

export default function GameLibraryToolbar({
  categories,
  activeCategory,
  onCategoryChange,
  sortOptions,
  activeSort,
  onSortChange,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onToggleMenu
}) {
  return (
    <div className="armoury-crate-game-library-toolbar">
      <div className="armoury-crate-game-library-filter-group">
        <span>Category</span>
        <label className="armoury-crate-game-library-select">
          <select value={activeCategory} onChange={(event) => onCategoryChange(event.target.value)} aria-label="Game category">
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
          <ChevronDown size={18} strokeWidth={1.8} />
        </label>
      </div>

      <div className="armoury-crate-game-library-filter-group sort-group">
        <span>Sort by</span>
        <label className="armoury-crate-game-library-select">
          <select value={activeSort} onChange={(event) => onSortChange(event.target.value)} aria-label="Sort games">
            {sortOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown size={18} strokeWidth={1.8} />
        </label>
      </div>

      <label className="armoury-crate-game-library-search">
        <input type="search" value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search" />
        <Search size={22} strokeWidth={1.75} />
      </label>

      <div className="armoury-crate-game-library-view-toggle" role="tablist" aria-label="Game library view mode">
        <button
          type="button"
          className={viewMode === 'grid' ? 'active' : ''}
          aria-label="Grid view"
          aria-selected={viewMode === 'grid'}
          onClick={() => onViewModeChange('grid')}
        >
          <Grid2x2 size={22} strokeWidth={1.9} />
        </button>
        <button
          type="button"
          className={viewMode === 'list' ? 'active' : ''}
          aria-label="List view"
          aria-selected={viewMode === 'list'}
          onClick={() => onViewModeChange('list')}
        >
          <List size={22} strokeWidth={1.9} />
        </button>
      </div>

      <button type="button" className="armoury-crate-game-library-menu-button" aria-label="More options" onClick={onToggleMenu}>
        <MoreVertical size={28} strokeWidth={2} />
      </button>
    </div>
  )
}
