import { Check, ChevronRight } from 'lucide-react'

export default function ContextMenu({ x, y, visible, items, onClose }) {
  if (!visible) return null

  return (
    <div className="context-menu" style={{ left: x, top: y }}>
      {items.map((item, index) => {
        if (item.separator) {
          return <div key={`separator-${index}`} className="context-menu-separator" />
        }

        const Icon = item.icon
        return (
          <button
            key={`${item.label}-${index}`}
            type="button"
            className="context-menu-item"
            disabled={item.disabled}
            onClick={(event) => {
              event.stopPropagation()
              if (item.disabled) return
              item.onClick()
              if (!item.keepOpen) {
                onClose()
              }
            }}
          >
            <span className="context-menu-item-left">
              {item.checked ? (
                <Check className="context-menu-item-check" />
              ) : Icon ? (
                <Icon className="context-menu-item-icon" />
              ) : (
                <span className="context-menu-item-icon-placeholder" aria-hidden="true" />
              )}
              <span className="context-menu-item-label">{item.label}</span>
            </span>
            <span className="context-menu-item-right">
              {item.shortcut ? <span className="context-menu-item-shortcut">{item.shortcut}</span> : null}
              {item.hasSubmenu ? <ChevronRight className="context-menu-item-chevron" /> : null}
            </span>
          </button>
        )
      })}
    </div>
  )
}
