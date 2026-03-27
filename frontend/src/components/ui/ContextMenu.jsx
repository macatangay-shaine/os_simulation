export default function ContextMenu({ x, y, visible, items, onClose }) {
  if (!visible) return null

  return (
    <div className="context-menu" style={{ left: x, top: y }} onMouseLeave={onClose}>
      {items.map((item, index) => {
        if (item.separator) {
          return <div key={`separator-${index}`} className="context-menu-separator" />
        }
        return (
          <button
            key={`${item.label}-${index}`}
            type="button"
            className="context-menu-item"
            onClick={() => {
              item.onClick()
              onClose()
            }}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
