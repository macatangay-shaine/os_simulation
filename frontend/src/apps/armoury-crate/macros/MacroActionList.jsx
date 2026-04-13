import { Keyboard, MousePointer2, TimerReset, Trash2, Type } from 'lucide-react'
import { calculateMacroActionDuration, describeMacroAction, formatMacroDuration, MACRO_ACTION_LIMIT } from './macrosData.js'

function getActionIcon(type) {
  if (type === 'text') return Type
  if (type === 'mouse') return MousePointer2
  if (type === 'delay') return TimerReset
  return Keyboard
}

function MacroEmptyGlyph() {
  return (
    <svg viewBox="0 0 76 76" className="armoury-crate-macros-empty-glyph" aria-hidden="true">
      <path d="M16 10h30l14 14v42H16z" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M46 10v14h14" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M24 50V28l14 12 14-12v22" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function MacroActionList({
  actions,
  isRecording,
  selectedActionId,
  onSelectAction,
  onDeleteAction,
  onOpenProfileSettings
}) {
  const totalDuration = actions.reduce((sum, action) => sum + calculateMacroActionDuration(action), 0)

  if (!actions.length) {
    return (
      <section className="armoury-crate-macros-list-shell empty-state">
        <div className="armoury-crate-macros-list-head">
          <span>Duration</span>
          <span>Action (0/{MACRO_ACTION_LIMIT})</span>
          <strong>Total time: {formatMacroDuration(0)}</strong>
        </div>

        <div className="armoury-crate-macros-empty">
          <div className="armoury-crate-macros-empty-icon">
            <MacroEmptyGlyph />
          </div>
          <div className="armoury-crate-macros-empty-copy">
            <h2>{isRecording ? 'Recording keystrokes...' : 'Macro editor is ready'}</h2>
            <p>
              {isRecording
                ? 'Press keys anywhere in the page. Press Esc to stop recording and keep the captured actions.'
                : 'Press the "Record" or "Insert" button to start editing the macro file.'}
            </p>
            <p>Number of actions is limited to 100 per macro profile.</p>
            <button type="button" onClick={onOpenProfileSettings}>
              Open profile settings
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="armoury-crate-macros-list-shell">
      <div className="armoury-crate-macros-list-head">
        <span>Duration</span>
        <span>Action ({actions.length}/{MACRO_ACTION_LIMIT})</span>
        <strong>Total time: {formatMacroDuration(totalDuration)}</strong>
      </div>

      <div className="armoury-crate-macros-list-body">
        {actions.map((action, index) => {
          const Icon = getActionIcon(action.type)
          const isSelected = selectedActionId === action.id

          return (
            <article key={action.id} className={`armoury-crate-macros-row ${isSelected ? 'selected' : ''}`}>
              <button type="button" className="armoury-crate-macros-row-surface" onClick={() => onSelectAction(action.id)}>
                <span className="armoury-crate-macros-row-duration">{formatMacroDuration(calculateMacroActionDuration(action))}</span>

                <span className="armoury-crate-macros-row-main">
                  <span className="armoury-crate-macros-row-icon">
                    <Icon size={16} strokeWidth={1.8} />
                  </span>
                  <span className="armoury-crate-macros-row-copy">
                    <strong>{describeMacroAction(action)}</strong>
                    <span>
                      Step {String(index + 1).padStart(2, '0')} / {action.label}
                    </span>
                  </span>
                </span>
              </button>

              <button
                type="button"
                className="armoury-crate-macros-row-delete"
                onClick={() => onDeleteAction(action.id)}
                aria-label={`Delete ${describeMacroAction(action)}`}
              >
                <Trash2 size={15} strokeWidth={1.8} />
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}
