import { useState, useRef, useEffect } from 'react'
import { FileText, Folder, Trash2 } from 'lucide-react'

const RECYCLE_BIN_PATH = '/home/user/.recycle_bin'

export default function AppLauncher({
  apps,
  desktopFiles = [],
  onLaunch,
  iconPositions = {},
  onIconMove,
  onAppContextMenu,
  touchpadEnabled = true,
  iconSize = 'medium',
  showDesktopIcons = true,
  autoArrangeIcons = false,
  alignIconsToGrid = true,
  isRefreshing = false
}) {
  // Multi-select state
  const [selectionBox, setSelectionBox] = useState(null)
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [lastSelectedItem, setLastSelectedItem] = useState(null)
  const launcherRef = useRef(null)
  const isSelecting = useRef(false)
  if (!showDesktopIcons) {
    return null
  }

  const SIZE_PRESETS = {
    large: {
      cellWidth: 112,
      cellHeight: 124,
      gridGap: 14,
      padding: 28,
      badgeSize: 56,
      iconSize: 28,
      labelSize: 13
    },
    medium: {
      cellWidth: 100,
      cellHeight: 110,
      gridGap: 12,
      padding: 24,
      badgeSize: 48,
      iconSize: 24,
      labelSize: 12
    },
    small: {
      cellWidth: 88,
      cellHeight: 98,
      gridGap: 10,
      padding: 22,
      badgeSize: 40,
      iconSize: 20,
      labelSize: 11
    }
  }

  const preset = SIZE_PRESETS[iconSize] || SIZE_PRESETS.medium
  const GRID_COLS = 5
  const CELL_WIDTH = preset.cellWidth
  const CELL_HEIGHT = preset.cellHeight
  const GRID_GAP = preset.gridGap
  const CELL_SIZE_HEIGHT = CELL_HEIGHT + GRID_GAP  // used for row calculations
  const PADDING = preset.padding

  const getGridCellFromCoords = (x, y, containerRect, containerEl) => {
    // Calculate the relative position within the launcher container
    let relX = x - containerRect.left - PADDING
    let relY = y - containerRect.top - PADDING
    
    // Account for scroll position
    if (containerEl) {
      relX += containerEl.scrollLeft
      relY += containerEl.scrollTop
    }
    
    // For columns, clamp to valid bounds
    relX = Math.max(0, relX)
    
    // For rows, allow negative relY (will be clamped to 0) and allow overflow for scrolling
    // Don't clamp relY to allow dropping below visible area
    
    // Calculate grid position
    let col = Math.floor(relX / (CELL_WIDTH + GRID_GAP))
    let row = Math.floor(relY / CELL_SIZE_HEIGHT)
    
    // Constrain column to valid grid bounds, rows are unconstrained
    col = Math.max(0, Math.min(col, GRID_COLS - 1))
    row = Math.max(0, row)
    
    return { row, col }
  }

  const findFreeGridCell = (targetRow, targetCol, appId) => {
    // Check if target cell is already occupied
    const occupiedCells = new Set()
    Object.entries(iconPositions).forEach(([id, pos]) => {
      if (id !== appId && pos) {
        occupiedCells.add(`${pos.row},${pos.col}`)
      }
    })

    // If target cell is free, use it
    if (!occupiedCells.has(`${targetRow},${targetCol}`)) {
      return { row: targetRow, col: targetCol }
    }

    // Otherwise find nearest free cell (increased search distance)
    for (let distance = 1; distance < 100; distance++) {
      for (let r = Math.max(0, targetRow - distance); r <= targetRow + distance; r++) {
        for (let c = Math.max(0, Math.min(targetCol - distance, GRID_COLS - 1)); c <= Math.min(targetCol + distance, GRID_COLS - 1); c++) {
          if (!occupiedCells.has(`${r},${c}`)) {
            return { row: r, col: c }
          }
        }
      }
    }

    // Fallback: place in next available row
    let row = targetRow
    while (occupiedCells.has(`${row},${targetCol}`)) {
      row++
    }
    return { row, col: targetCol }
  }

  const handleDragStart = (e, appId) => {
    if (autoArrangeIcons) {
      e.preventDefault()
      return
    }

    if (!touchpadEnabled) {
      e.preventDefault()
      return
    }

    // If dragging an unselected item, select only that item
    if (!selectedItems.has(appId)) {
      setSelectedItems(new Set([appId]))
      setLastSelectedItem(appId)
    }

    // Drag multiple items if more than one selected
    const itemsToDrag = selectedItems.has(appId) ? Array.from(selectedItems) : [appId]
    
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('appIds', JSON.stringify(itemsToDrag))
    e.dataTransfer.setData('appId', appId) // For fallback
  }

  const handleDragOver = (e) => {
    if (!touchpadEnabled || autoArrangeIcons) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e) => {
    if (!touchpadEnabled || autoArrangeIcons) return
    e.preventDefault()
    e.stopPropagation()
    
    // Handle multiple items
    const appIdsStr = e.dataTransfer.getData('appIds')
    const appIds = appIdsStr ? JSON.parse(appIdsStr) : [e.dataTransfer.getData('appId')]
    
    if (!appIds.length) return
    
    const launcherRect = e.currentTarget.getBoundingClientRect()
    let { row, col } = getGridCellFromCoords(e.clientX, e.clientY, launcherRect, e.currentTarget)
    
    // Allow placement in any row without visible bounds restriction
    row = Math.max(0, row)
    
    // Move each item relative to the drop position
    appIds.forEach((appId, index) => {
      const offsetRow = row + Math.floor(index / GRID_COLS)
      const offsetCol = (col + (index % GRID_COLS)) % GRID_COLS
      const finalPos = alignIconsToGrid ? findFreeGridCell(offsetRow, offsetCol, appId) : { row: offsetRow, col: offsetCol }
      onIconMove?.(appId, finalPos)
    })

    // Clear selection after drop
    setSelectedItems(new Set())
  }

  // Multi-select box handlers
  const handleLauncherMouseDown = (e) => {
    // Only start selection if clicking on empty space (not on an icon)
    if (e.target.closest('.app-icon')) return
    
    isSelecting.current = true
    const rect = launcherRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const startX = e.clientX - rect.left
    const startY = e.clientY - rect.top
    
    // Clear previous selection when starting new box
    setSelectedItems(new Set())
    setSelectionBox({
      startX,
      startY,
      currentX: startX,
      currentY: startY
    })
  }

  const handleLauncherMouseMove = (e) => {
    if (!isSelecting.current || !launcherRef.current) return
    
    const rect = launcherRef.current.getBoundingClientRect()
    const currentX = e.clientX - rect.left
    const currentY = e.clientY - rect.top
    
    setSelectionBox(prev => prev ? { ...prev, currentX, currentY } : null)
    
    // Calculate selection box bounds
    const x1 = Math.min(selectionBox?.startX || 0, currentX)
    const x2 = Math.max(selectionBox?.startX || 0, currentX)
    const y1 = Math.min(selectionBox?.startY || 0, currentY)
    const y2 = Math.max(selectionBox?.startY || 0, currentY)
    
    // Find all icons that intersect with selection box
    const selected = new Set()
    
    const checkIntersection = (id, gridCol, gridRow) => {
      const iconX1 = PADDING + gridCol * (CELL_WIDTH + GRID_GAP)
      const iconY1 = PADDING + gridRow * (CELL_HEIGHT + GRID_GAP)
      const iconX2 = iconX1 + CELL_WIDTH
      const iconY2 = iconY1 + CELL_HEIGHT
      
      // Check if icon intersects with selection box
      if (x2 >= iconX1 && x1 <= iconX2 && y2 >= iconY1 && y1 <= iconY2) {
        selected.add(id)
      }
    }
    
    // Check apps
    apps.forEach(app => {
      const pos = iconPositions[app.id]
      if (pos) {
        checkIntersection(app.id, pos.col, pos.row)
      } else {
        const index = apps.indexOf(app)
        const col = index % GRID_COLS
        const row = Math.floor(index / GRID_COLS)
        checkIntersection(app.id, col, row)
      }
    })
    
    // Check desktop files
    desktopFiles.forEach((file, fileIndex) => {
      if (file.path.endsWith('.lnk')) return
      const fileId = `file-${file.path}`
      const pos = iconPositions[fileId]
      if (pos) {
        checkIntersection(fileId, pos.col, pos.row)
      } else {
        const col = (apps.length + fileIndex) % GRID_COLS
        const row = Math.floor((apps.length + fileIndex) / GRID_COLS)
        checkIntersection(fileId, col, row)
      }
    })
    
    setSelectedItems(selected)
  }

  const handleLauncherMouseUp = () => {
    isSelecting.current = false
    // Keep selection visible, don't clear the box immediately
    // setSelectionBox(null)
  }

  useEffect(() => {
    // Clear selection when clicking elsewhere or pressing Escape
    const handleClickOutside = (e) => {
      if (!launcherRef.current?.contains(e.target)) {
        setSelectedItems(new Set())
        setSelectionBox(null)
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedItems(new Set())
        setSelectionBox(null)
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        // Ctrl+A to select all
        e.preventDefault()
        const allItems = new Set()
        apps.forEach(app => allItems.add(app.id))
        desktopFiles.forEach((file, idx) => {
          if (!file.path.endsWith('.lnk')) {
            allItems.add(`file-${file.path}`)
          }
        })
        setSelectedItems(allItems)
      } else if (e.key === 'Delete') {
        // Delete key - dispatch event for selected items
        if (selectedItems.size > 0) {
          e.preventDefault()
          window.dispatchEvent(new CustomEvent('deleteDesktopItems', { detail: Array.from(selectedItems) }))
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [apps, desktopFiles, selectedItems])

  // Handle icon click with Ctrl/Shift support
  const handleIconClick = (e, itemId, isApp = true) => {
    e.preventDefault()
    
    if (e.ctrlKey || e.metaKey) {
      // Ctrl+click: toggle selection
      setSelectedItems(prev => {
        const next = new Set(prev)
        if (next.has(itemId)) {
          next.delete(itemId)
        } else {
          next.add(itemId)
        }
        return next
      })
      setLastSelectedItem(itemId)
    } else if (e.shiftKey && lastSelectedItem) {
      // Shift+click: range selection
      const allItems = [
        ...apps.map(app => app.id),
        ...desktopFiles
          .filter(file => !file.path.endsWith('.lnk'))
          .map((file, idx) => `file-${file.path}`)
      ]
      
      const lastIdx = allItems.indexOf(lastSelectedItem)
      const currentIdx = allItems.indexOf(itemId)
      
      if (lastIdx >= 0 && currentIdx >= 0) {
        const [start, end] = lastIdx < currentIdx ? [lastIdx, currentIdx] : [currentIdx, lastIdx]
        const newSelection = new Set(allItems.slice(start, end + 1))
        setSelectedItems(newSelection)
      }
    } else {
      // Single click: select only this item
      setSelectedItems(new Set([itemId]))
      setLastSelectedItem(itemId)
    }
  }

  // Handle item drag - support dragging multiple selected items
  const getGridStyle = (appId, gridPos, fallbackIndex = 0) => {
    let col = 0
    let row = 0
    
    if (autoArrangeIcons) {
      const index = apps.findIndex(app => app.id === appId)
      const effectiveIndex = index >= 0 ? index : fallbackIndex
      col = effectiveIndex % GRID_COLS
      row = Math.floor(effectiveIndex / GRID_COLS)
    } else if (gridPos) {
      col = gridPos.col || 0
      row = gridPos.row || 0
    } else {
      // Auto-assign position based on app index if not set.
      // Desktop files pass an explicit fallback index so they do not stack at 0,0.
      const index = apps.findIndex(app => app.id === appId)
      const effectiveIndex = index >= 0 ? index : fallbackIndex
      col = effectiveIndex % GRID_COLS
      row = Math.floor(effectiveIndex / GRID_COLS)
    }
    
    return {
      gridColumn: col + 1,
      gridRow: row + 1
    }
  }

  const renderAppIcon = (app) => {
    const iconSrc = app.desktopIconSrc || app.iconSrc

    if (iconSrc) {
      return <img src={iconSrc} alt="" className="app-icon-image" style={{ width: `${preset.badgeSize}px`, height: `${preset.badgeSize}px` }} />
    }

    return app.icon ? <app.icon className="app-icon-svg" style={{ width: `${preset.iconSize}px`, height: `${preset.iconSize}px` }} /> : null
  }

  return (
    <div 
      ref={launcherRef}
      className={`app-launcher ${isRefreshing ? 'app-launcher-refreshing' : ''}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${GRID_COLS}, ${CELL_WIDTH}px)`,
        gridAutoRows: `${CELL_HEIGHT}px`,
        gap: `${GRID_GAP}px`,
        padding: `${PADDING}px`,
        alignContent: 'start',
        position: 'relative',
        width: '100%',
        userSelect: 'none'
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onMouseDown={handleLauncherMouseDown}
      onMouseMove={handleLauncherMouseMove}
      onMouseUp={handleLauncherMouseUp}
      onMouseLeave={handleLauncherMouseUp}
      role="presentation"
    >
      {/* Selection box visual */}
      {selectionBox && (
        <div
          className="app-selection-box"
          style={{
            position: 'absolute',
            left: Math.min(selectionBox.startX, selectionBox.currentX),
            top: Math.min(selectionBox.startY, selectionBox.currentY),
            width: Math.abs(selectionBox.currentX - selectionBox.startX),
            height: Math.abs(selectionBox.currentY - selectionBox.startY),
            border: '2px solid rgba(0, 120, 215, 0.8)',
            backgroundColor: 'rgba(0, 120, 215, 0.15)',
            pointerEvents: 'none',
            zIndex: 1000
          }}
        />
      )}

      {apps.map((app) => {
        const pos = iconPositions[app.id]
        const gridStyle = getGridStyle(app.id, pos)
        const isSelected = selectedItems.has(app.id)

        return (
          <button
            key={app.id}
            type="button"
            className={`app-icon app-icon-draggable ${isSelected ? 'app-icon-selected' : ''}`}
            data-app={app.id}
            style={{
              ...gridStyle,
              width: `${CELL_WIDTH}px`,
              minWidth: `${CELL_WIDTH}px`,
              maxWidth: `${CELL_WIDTH}px`,
              height: `${CELL_HEIGHT}px`,
              minHeight: `${CELL_HEIGHT}px`,
              maxHeight: `${CELL_HEIGHT}px`,
              backgroundColor: isSelected ? 'rgba(0, 120, 215, 0.2)' : 'transparent',
              borderRadius: '4px',
              border: isSelected ? '2px solid rgba(0, 120, 215, 0.6)' : 'none'
            }}
            draggable={touchpadEnabled && !autoArrangeIcons}
            onDragStart={(e) => handleDragStart(e, app.id)}
            onClick={(e) => handleIconClick(e, app.id, true)}
            onDoubleClick={() => onLaunch(app)}
            onContextMenu={(e) => onAppContextMenu?.(e, app)}
          >
            <div
              className={`app-icon-badge ${(app.desktopIconSrc || app.iconSrc) ? 'app-icon-badge-image' : ''}`}
              style={{ width: `${preset.badgeSize}px`, height: `${preset.badgeSize}px` }}
            >
              {renderAppIcon(app)}
            </div>
            <div className="app-icon-label" style={{ fontSize: `${preset.labelSize}px` }}>{app.title}</div>
          </button>
        )
      })}

      {desktopFiles
        .filter(file => !file.path.endsWith('.lnk'))
        .map((file, fileIndex) => {
        const isRecycleBin = file.path === RECYCLE_BIN_PATH
        const fileName = isRecycleBin ? 'Recycle Bin' : file.path.split('/').pop()
        const fileId = `file-${file.path}`
        const pos = iconPositions[fileId]
        const gridStyle = getGridStyle(fileId, pos, apps.length + fileIndex)
        const isFolder = file.type === 'dir'
        const isSelected = selectedItems.has(fileId)

        return (
          <button
            key={fileId}
            type="button"
            className={`app-icon app-icon-draggable ${isSelected ? 'app-icon-selected' : ''}`}
            data-app={fileId}
            style={{
              ...gridStyle,
              width: `${CELL_WIDTH}px`,
              minWidth: `${CELL_WIDTH}px`,
              maxWidth: `${CELL_WIDTH}px`,
              height: `${CELL_HEIGHT}px`,
              minHeight: `${CELL_HEIGHT}px`,
              maxHeight: `${CELL_HEIGHT}px`,
              backgroundColor: isSelected ? 'rgba(0, 120, 215, 0.2)' : 'transparent',
              borderRadius: '4px',
              border: isSelected ? '2px solid rgba(0, 120, 215, 0.6)' : 'none'
            }}
            draggable={touchpadEnabled && !autoArrangeIcons}
            onDragStart={(e) => handleDragStart(e, fileId)}
            onClick={(e) => handleIconClick(e, fileId, false)}
            onDoubleClick={() => {
              // Create a synthetic app object for file operations
              window.dispatchEvent(new CustomEvent('openDesktopFile', { detail: file }))
            }}
            onContextMenu={(e) => onAppContextMenu?.(e, { ...file, title: fileName, isFile: true })}
            title={fileName}
          >
            <div className="app-icon-badge" style={{ width: `${preset.badgeSize}px`, height: `${preset.badgeSize}px` }}>
              {isRecycleBin ? (
                <Trash2 className="app-icon-svg" />
              ) : isFolder ? (
                <Folder className="app-icon-svg" />
              ) : (
                <FileText className="app-icon-svg" />
              )}
            </div>
            <div className="app-icon-label" style={{ fontSize: `${preset.labelSize}px` }}>{fileName}</div>
          </button>
        )
      })}
    </div>
  )
}
