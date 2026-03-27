import { FileText, Folder } from 'lucide-react'

export default function AppLauncher({ apps, desktopFiles = [], onLaunch, iconPositions = {}, onIconMove, onAppContextMenu }) {
  const GRID_COLS = 5
  const CELL_WIDTH = 100
  const CELL_HEIGHT = 110
  const GRID_GAP = 12
  const CELL_SIZE_HEIGHT = CELL_HEIGHT + GRID_GAP  // 122px - used for row calculations
  const PADDING = 24

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
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('appId', appId)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    const appId = e.dataTransfer.getData('appId')
    const launcherRect = e.currentTarget.getBoundingClientRect()
    let { row, col } = getGridCellFromCoords(e.clientX, e.clientY, launcherRect, e.currentTarget)
    
    // Allow placement in any row without visible bounds restriction
    row = Math.max(0, row)
    
    // Find a free cell if the target is occupied
    const finalPos = findFreeGridCell(row, col, appId)
    onIconMove?.(appId, finalPos)
  }

  const getGridStyle = (appId, gridPos) => {
    let col = 0
    let row = 0
    
    if (gridPos) {
      col = gridPos.col || 0
      row = gridPos.row || 0
    } else {
      // Auto-assign position based on app index if not set
      const index = apps.findIndex(app => app.id === appId)
      if (index >= 0) {
        col = index % GRID_COLS
        row = Math.floor(index / GRID_COLS)
      }
    }
    
    return {
      gridColumn: col + 1,
      gridRow: row + 1
    }
  }

  return (
    <div 
      className="app-launcher"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${GRID_COLS}, ${CELL_WIDTH}px)`,
        gridAutoRows: `${CELL_HEIGHT}px`,
        gap: `${GRID_GAP}px`,
        padding: `${PADDING}px`,
        alignContent: 'start',
        position: 'relative',
        width: '100%'
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      role="presentation"
    >
      {apps.map((app) => {
        const pos = iconPositions[app.id]
        const gridStyle = getGridStyle(app.id, pos)

        return (
          <button
            key={app.id}
            type="button"
            className="app-icon app-icon-draggable"
            data-app={app.id}
            style={gridStyle}
            draggable="true"
            onDragStart={(e) => handleDragStart(e, app.id)}
            onClick={() => onLaunch(app)}
            onContextMenu={(e) => onAppContextMenu?.(e, app)}
          >
            <div className="app-icon-badge">
              {app.icon ? <app.icon className="app-icon-svg" /> : null}
            </div>
            <div className="app-icon-label">{app.title}</div>
          </button>
        )
      })}

      {desktopFiles
        .filter(file => !file.path.endsWith('.lnk'))
        .map((file) => {
        const fileName = file.path.split('/').pop()
        const fileId = `file-${file.path}`
        const pos = iconPositions[fileId]
        const gridStyle = getGridStyle(fileId, pos)
        const isFolder = file.type === 'dir'

        return (
          <button
            key={fileId}
            type="button"
            className="app-icon app-icon-draggable"
            data-app={fileId}
            style={gridStyle}
            draggable="true"
            onDragStart={(e) => handleDragStart(e, fileId)}
            onClick={() => {
              // Create a synthetic app object for file operations
              window.dispatchEvent(new CustomEvent('openDesktopFile', { detail: file }))
            }}
            onContextMenu={(e) => onAppContextMenu?.(e, { ...file, title: fileName, isFile: true })}
            title={fileName}
          >
            <div className="app-icon-badge">
              {isFolder ? <Folder className="app-icon-svg" /> : <FileText className="app-icon-svg" />}
            </div>
            <div className="app-icon-label">{fileName}</div>
          </button>
        )
      })}
    </div>
  )
}
