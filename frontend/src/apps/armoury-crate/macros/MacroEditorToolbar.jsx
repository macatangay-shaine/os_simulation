import {
  ChevronDown,
  Circle,
  MoreVertical,
  Plus,
  Redo2,
  Settings2,
  Undo2
} from 'lucide-react'
import { MACRO_INSERT_OPTIONS } from './macrosData.js'

export default function MacroEditorToolbar({
  profiles,
  selectedProfileId,
  isRecording,
  isInsertMenuOpen,
  isProfileMenuOpen,
  canUndo,
  canRedo,
  canClear,
  onSelectProfile,
  onToggleRecord,
  onToggleInsertMenu,
  onInsertAction,
  onUndo,
  onRedo,
  onOpenProfileSettings,
  onClearAll,
  onToggleProfileMenu,
  onCreateProfile,
  onDuplicateProfile,
  onDeleteProfile
}) {
  return (
    <>
      <div className="armoury-crate-macros-topbar">
        <div className="armoury-crate-macros-command-group">
          <button type="button" className={`armoury-crate-macros-command-button ${isRecording ? 'recording' : ''}`} onClick={onToggleRecord}>
            <Circle size={11} strokeWidth={2.6} fill="currentColor" />
            <span>{isRecording ? 'Stop' : 'Record'}</span>
          </button>

          <div className="armoury-crate-macros-inline-menu-shell">
            <button type="button" className="armoury-crate-macros-command-button" onClick={onToggleInsertMenu}>
              <Plus size={14} strokeWidth={2.1} />
              <span>Insert</span>
            </button>

            {isInsertMenuOpen ? (
              <div className="armoury-crate-macros-dropdown-menu insert-menu">
                {MACRO_INSERT_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onInsertAction(option.id)}
                  >
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="armoury-crate-macros-profile-cluster">
          <label className="armoury-crate-macros-select">
            <select value={selectedProfileId} onChange={(event) => onSelectProfile(event.target.value)} aria-label="Macro profile">
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
            <ChevronDown size={17} strokeWidth={1.8} />
          </label>

          <div className="armoury-crate-macros-inline-menu-shell">
            <button type="button" className="armoury-crate-macros-menu-button" aria-label="Macro profile options" onClick={onToggleProfileMenu}>
              <MoreVertical size={28} strokeWidth={2} />
            </button>

            {isProfileMenuOpen ? (
              <div className="armoury-crate-macros-dropdown-menu profile-menu">
                <button type="button" onClick={onCreateProfile}>
                  <span>New macro profile</span>
                </button>
                <button type="button" onClick={onDuplicateProfile}>
                  <span>Duplicate current profile</span>
                </button>
                <button type="button" onClick={onOpenProfileSettings}>
                  <span>Edit profile settings</span>
                </button>
                <button type="button" className="danger" onClick={onDeleteProfile}>
                  <span>Delete current profile</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="armoury-crate-macros-editor-toolbar">
        <div className="armoury-crate-macros-editor-actions">
          <button type="button" className="armoury-crate-macros-ghost-button" onClick={onUndo} disabled={!canUndo}>
            <Undo2 size={20} strokeWidth={1.9} />
          </button>
          <button type="button" className="armoury-crate-macros-ghost-button" onClick={onRedo} disabled={!canRedo}>
            <Redo2 size={20} strokeWidth={1.9} />
          </button>
          <button type="button" className="armoury-crate-macros-ghost-button" onClick={onOpenProfileSettings} aria-label="Open macro settings">
            <Settings2 size={20} strokeWidth={1.9} />
          </button>
        </div>

        <button type="button" className="armoury-crate-macros-clear-button" onClick={onClearAll} disabled={!canClear}>
          Clear all
        </button>
      </div>
    </>
  )
}

