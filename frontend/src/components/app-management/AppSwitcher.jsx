import { useEffect, useRef } from 'react'

export default function AppSwitcher({ windows, selectedIndex, onSelect, onClose }) {
  const containerRef = useRef(null)

  useEffect(() => {
    // Scroll selected item into view
    if (containerRef.current && selectedIndex >= 0) {
      const selectedItem = containerRef.current.children[selectedIndex]
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
      }
    }
  }, [selectedIndex])

  if (windows.length === 0) return null

  return (
    <div className="app-switcher-overlay">
      <div className="app-switcher" ref={containerRef}>
        {windows.map((win, index) => {
          const Icon = win.icon
          return (
            <div
              key={win.id}
              className={`app-switcher-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => {
                onSelect(index)
                onClose()
              }}
            >
              <div className="app-switcher-icon">
                {win.iconSrc ? <img src={win.iconSrc} alt="" className="app-switcher-image" /> : null}
                {!win.iconSrc && Icon ? <Icon size={32} /> : null}
              </div>
              <div className="app-switcher-title">{win.title}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
