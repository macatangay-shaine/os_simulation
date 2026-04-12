import { ChevronDown, GripVertical, Trash2 } from 'lucide-react'
import { MACRO_COMPATIBLE_DEVICES, MACRO_PLAYBACK_MODES, normalizeMacroNumber } from './macrosData.js'

function MacroSelect({ value, onChange, options, ariaLabel }) {
  return (
    <label className="armoury-crate-macros-select-field">
      <select value={value} onChange={(event) => onChange(event.target.value)} aria-label={ariaLabel}>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown size={16} strokeWidth={1.7} />
    </label>
  )
}

function MacroPropertiesPlaceholder() {
  return (
    <div className="armoury-crate-macros-properties-placeholder">
      <div className="armoury-crate-macros-properties-placeholder-glyph" aria-hidden="true">
        <div className="armoury-crate-macros-properties-placeholder-chip">
          <span>M</span>
        </div>
      </div>
      <p>Select an item to adjust its properties.</p>
    </div>
  )
}

function MacroActionProperties({ action, onChange, onDelete, onMove }) {
  if (!action) return <MacroPropertiesPlaceholder />

  return (
    <>
      <div className="armoury-crate-macros-properties-title">
        <h2>Properties</h2>
        <span>{action.label}</span>
      </div>

      <div className="armoury-crate-macros-field">
        <label>Action type</label>
        <input
          value={
            action.type === 'text'
              ? 'Text Input'
              : action.type === 'mouse'
                ? 'Mouse Click'
                : action.type === 'delay'
                  ? 'Delay'
                  : 'Keystroke'
          }
          readOnly
        />
      </div>

      <div className="armoury-crate-macros-field">
        <label>Display name</label>
        <input value={action.label} onChange={(event) => onChange({ label: event.target.value || action.label })} />
      </div>

      {action.type === 'keystroke' ? (
        <>
          <div className="armoury-crate-macros-field">
            <label>Keystroke</label>
            <input value={action.combo} onChange={(event) => onChange({ combo: event.target.value })} />
          </div>
          <div className="armoury-crate-macros-field two-up">
            <div>
              <label>Delay before (ms)</label>
              <input
                type="number"
                min="0"
                value={action.delayMs}
                onChange={(event) => onChange({ delayMs: normalizeMacroNumber(event.target.value, 0) })}
              />
            </div>
            <div>
              <label>Key hold (ms)</label>
              <input
                type="number"
                min="0"
                value={action.holdMs}
                onChange={(event) => onChange({ holdMs: normalizeMacroNumber(event.target.value, 0) })}
              />
            </div>
          </div>
        </>
      ) : null}

      {action.type === 'text' ? (
        <>
          <div className="armoury-crate-macros-field">
            <label>Text to type</label>
            <textarea value={action.text} rows={4} onChange={(event) => onChange({ text: event.target.value })} />
          </div>
          <div className="armoury-crate-macros-field two-up">
            <div>
              <label>Delay before (ms)</label>
              <input
                type="number"
                min="0"
                value={action.delayMs}
                onChange={(event) => onChange({ delayMs: normalizeMacroNumber(event.target.value, 0) })}
              />
            </div>
            <div>
              <label>Typing delay (ms)</label>
              <input
                type="number"
                min="0"
                value={action.typingDelayMs}
                onChange={(event) => onChange({ typingDelayMs: normalizeMacroNumber(event.target.value, 0) })}
              />
            </div>
          </div>
        </>
      ) : null}

      {action.type === 'mouse' ? (
        <>
          <div className="armoury-crate-macros-field">
            <label>Mouse button</label>
            <MacroSelect
              value={action.button}
              onChange={(button) => onChange({ button })}
              ariaLabel="Mouse button"
              options={[
                { id: 'Left Click', label: 'Left Click' },
                { id: 'Right Click', label: 'Right Click' },
                { id: 'Middle Click', label: 'Middle Click' }
              ]}
            />
          </div>
          <div className="armoury-crate-macros-field two-up">
            <div>
              <label>Delay before (ms)</label>
              <input
                type="number"
                min="0"
                value={action.delayMs}
                onChange={(event) => onChange({ delayMs: normalizeMacroNumber(event.target.value, 0) })}
              />
            </div>
            <div>
              <label>Click hold (ms)</label>
              <input
                type="number"
                min="0"
                value={action.holdMs}
                onChange={(event) => onChange({ holdMs: normalizeMacroNumber(event.target.value, 0) })}
              />
            </div>
          </div>
        </>
      ) : null}

      {action.type === 'delay' ? (
        <div className="armoury-crate-macros-field">
          <label>Pause duration (ms)</label>
          <input
            type="number"
            min="0"
            value={action.durationMs}
            onChange={(event) => onChange({ durationMs: normalizeMacroNumber(event.target.value, 0) })}
          />
        </div>
      ) : null}

      <div className="armoury-crate-macros-property-actions">
        <button type="button" onClick={() => onMove('up')}>
          <GripVertical size={15} strokeWidth={1.8} />
          <span>Move up</span>
        </button>
        <button type="button" onClick={() => onMove('down')}>
          <GripVertical size={15} strokeWidth={1.8} />
          <span>Move down</span>
        </button>
        <button type="button" className="danger" onClick={onDelete}>
          <Trash2 size={15} strokeWidth={1.8} />
          <span>Delete</span>
        </button>
      </div>
    </>
  )
}

function MacroProfileProperties({ profile, onChange }) {
  if (!profile) return <MacroPropertiesPlaceholder />

  return (
    <>
      <div className="armoury-crate-macros-properties-title">
        <h2>Properties</h2>
        <span>Macro profile</span>
      </div>

      <div className="armoury-crate-macros-field">
        <label>Macro name</label>
        <input value={profile.name} onChange={(event) => onChange({ name: event.target.value || profile.name })} />
      </div>

      <div className="armoury-crate-macros-field">
        <label>Compatible device</label>
        <MacroSelect
          value={profile.deviceId}
          onChange={(deviceId) => onChange({ deviceId })}
          ariaLabel="Compatible device"
          options={MACRO_COMPATIBLE_DEVICES.map((device) => ({
            id: device.id,
            label: `${device.label} / ${device.type}`
          }))}
        />
      </div>

      <div className="armoury-crate-macros-field two-up">
        <div>
          <label>Trigger key</label>
          <input value={profile.triggerKey} onChange={(event) => onChange({ triggerKey: event.target.value || 'F9' })} />
        </div>
        <div>
          <label>Playback mode</label>
          <MacroSelect
            value={profile.playbackMode}
            onChange={(playbackMode) => onChange({ playbackMode })}
            ariaLabel="Playback mode"
            options={MACRO_PLAYBACK_MODES}
          />
        </div>
      </div>

      <label className="armoury-crate-macros-toggle">
        <input type="checkbox" checked={profile.stopOnRelease} onChange={(event) => onChange({ stopOnRelease: event.target.checked })} />
        <span>Stop when the macro key is released</span>
      </label>
    </>
  )
}

export default function MacroPropertiesPanel({
  panelMode,
  selectedAction,
  currentProfile,
  onProfileChange,
  onActionChange,
  onDeleteAction,
  onMoveAction,
  onSave,
  onCancel,
  hasUnsavedChanges
}) {
  return (
    <aside className="armoury-crate-macros-properties">
      <div className="armoury-crate-macros-properties-card">
        {panelMode === 'profile' ? (
          <MacroProfileProperties profile={currentProfile} onChange={onProfileChange} />
        ) : (
          <MacroActionProperties action={selectedAction} onChange={onActionChange} onDelete={onDeleteAction} onMove={onMoveAction} />
        )}
      </div>

      <div className="armoury-crate-macros-properties-footer">
        <button type="button" className="armoury-crate-macros-save-button" onClick={onSave} disabled={!hasUnsavedChanges}>
          Save
        </button>
        <button type="button" className="armoury-crate-macros-cancel-button" onClick={onCancel} disabled={!hasUnsavedChanges}>
          Cancel
        </button>
      </div>
    </aside>
  )
}
