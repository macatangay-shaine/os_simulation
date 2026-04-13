import { FolderPlus, Gamepad2 } from 'lucide-react'

export default function GameLibraryEmptyState({ onOpenGameDeals, hasActiveFilters }) {
  return (
    <section className="armoury-crate-game-library-empty">
      <div className="armoury-crate-game-library-empty-icon-shell" aria-hidden="true">
        <div className="armoury-crate-game-library-empty-icon-ring">
          <FolderPlus size={74} strokeWidth={1.6} />
          <div className="armoury-crate-game-library-empty-gamepad">
            <Gamepad2 size={22} strokeWidth={1.7} />
          </div>
        </div>
      </div>

      <div className="armoury-crate-game-library-empty-copy">
        <h2>{hasActiveFilters ? 'No matching games found' : 'Notice'}</h2>
        {hasActiveFilters ? (
          <p>Adjust the category, sort, or search filters to bring your installed library back into view.</p>
        ) : (
          <>
            <p>If you have installed the game but it does not appear, please go to Settings to add the game manually.</p>
            <p>
              If you have not installed the game, Check out from{' '}
              <button type="button" onClick={onOpenGameDeals}>
                Game Deals !
              </button>
            </p>
          </>
        )}
      </div>
    </section>
  )
}
