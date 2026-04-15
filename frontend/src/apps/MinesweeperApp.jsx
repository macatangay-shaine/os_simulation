import { useState, useEffect, useCallback } from 'react'
import { RotateCcw } from 'lucide-react'
import '../styles/apps/minesweeper.css'

const DIFFICULTY = {
  EASY: { rows: 8, cols: 8, mines: 10 },
  MEDIUM: { rows: 12, cols: 12, mines: 30 },
  HARD: { rows: 16, cols: 16, mines: 40 }
}

export default function MinesweeperApp({ onWindowTitleChange }) {
  const [difficulty, setDifficulty] = useState('EASY')
  const [grid, setGrid] = useState([])
  const [revealed, setRevealed] = useState([])
  const [flagged, setFlagged] = useState([])
  const [gameState, setGameState] = useState('playing') // 'playing', 'won', 'lost'
  const [mineCount, setMineCount] = useState(0)
  const [flagCount, setFlagCount] = useState(0)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)

  useEffect(() => {
    onWindowTitleChange?.('Minesweeper')
  }, [onWindowTitleChange])

  // Initialize game
  useEffect(() => {
    initializeGame()
  }, [difficulty])

  // Timer
  useEffect(() => {
    if (!gameStarted || gameState !== 'playing') return
    const interval = setInterval(() => {
      setTimeElapsed(t => t + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [gameStarted, gameState])

  const initializeGame = () => {
    const config = DIFFICULTY[difficulty]
    const newGrid = generateGrid(config.rows, config.cols, config.mines)
    setGrid(newGrid)
    setRevealed(Array(config.rows * config.cols).fill(false))
    setFlagged(Array(config.rows * config.cols).fill(false))
    setMineCount(config.mines)
    setFlagCount(0)
    setGameState('playing')
    setTimeElapsed(0)
    setGameStarted(false)
  }

  const generateGrid = (rows, cols, mineCount) => {
    const totalCells = rows * cols
    const grid = Array(totalCells).fill(0)
    
    // Place mines
    let minesPlaced = 0
    while (minesPlaced < mineCount) {
      const randomIdx = Math.floor(Math.random() * totalCells)
      if (grid[randomIdx] !== 'M') {
        grid[randomIdx] = 'M'
        minesPlaced++
      }
    }

    // Calculate numbers
    for (let i = 0; i < grid.length; i++) {
      if (grid[i] !== 'M') {
        const adjacentMines = countAdjacentMines(grid, i, rows, cols)
        grid[i] = adjacentMines
      }
    }

    return grid
  }

  const countAdjacentMines = (grid, index, rows, cols) => {
    const row = Math.floor(index / cols)
    const col = index % cols
    let count = 0

    for (let r = Math.max(0, row - 1); r <= Math.min(rows - 1, row + 1); r++) {
      for (let c = Math.max(0, col - 1); c <= Math.min(cols - 1, col + 1); c++) {
        if (r === row && c === col) continue
        if (grid[r * cols + c] === 'M') count++
      }
    }
    return count
  }

  const revealCell = useCallback((index) => {
    if (gameState !== 'playing' || revealed[index] || flagged[index]) return

    if (!gameStarted) {
      setGameStarted(true)
    }

    const newRevealed = [...revealed]
    const newFlagged = [...flagged]

    if (grid[index] === 'M') {
      // Hit a mine - lose
      revealAllMines(newRevealed)
      setRevealed(newRevealed)
      setGameState('lost')
      return
    }

    if (grid[index] === 0) {
      // Flood fill for empty cells
      floodFill(index, newRevealed, newFlagged)
    } else {
      newRevealed[index] = true
    }

    setRevealed(newRevealed)
    checkWinCondition(newRevealed)
  }, [grid, revealed, flagged, gameState, gameStarted])

  const floodFill = (index, revealedGrid, flaggedGrid) => {
    const config = DIFFICULTY[difficulty]
    const cols = config.cols
    const queue = [index]
    const visited = new Set()

    while (queue.length > 0) {
      const current = queue.shift()
      if (visited.has(current) || revealedGrid[current]) continue
      visited.add(current)
      revealedGrid[current] = true

      if (grid[current] === 0) {
        const row = Math.floor(current / cols)
        const col = current % cols
        for (let r = Math.max(0, row - 1); r <= Math.min(config.rows - 1, row + 1); r++) {
          for (let c = Math.max(0, col - 1); c <= Math.min(cols - 1, col + 1); c++) {
            const neighborIdx = r * cols + c
            if (!visited.has(neighborIdx) && !revealedGrid[neighborIdx]) {
              queue.push(neighborIdx)
            }
          }
        }
      }
    }
  }

  const revealAllMines = (revealedGrid) => {
    grid.forEach((cell, idx) => {
      if (cell === 'M') revealedGrid[idx] = true
    })
  }

  const checkWinCondition = (revealedGrid) => {
    let nonMinesCells = 0
    let nonMinesRevealed = 0

    grid.forEach((cell, idx) => {
      if (cell !== 'M') {
        nonMinesCells++
        if (revealedGrid[idx]) nonMinesRevealed++
      }
    })

    if (nonMinesCells === nonMinesRevealed) {
      setGameState('won')
    }
  }

  const toggleFlag = (index, e) => {
    e.preventDefault()
    if (gameState !== 'playing' || revealed[index]) return

    const newFlagged = [...flagged]
    newFlagged[index] = !newFlagged[index]
    setFlagged(newFlagged)
    setFlagCount(newFlagged.filter(Boolean).length)
  }

  const renderCell = (index) => {
    const config = DIFFICULTY[difficulty]
    const row = Math.floor(index / config.cols)
    const col = index % config.cols
    const isRevealed = revealed[index]
    const isFlagged = flagged[index]
    const content = grid[index]

    let cellContent = ''
    let cellClass = 'minesweeper-cell'

    if (isRevealed) {
      cellClass += ' revealed'
      if (content === 'M') {
        cellContent = '*'
        cellClass += ' mine'
      } else if (content > 0) {
        cellContent = content
        cellClass += ` number-${content}`
      }
    } else if (isFlagged) {
      cellContent = 'F'
      cellClass += ' flagged'
    } else {
      cellClass += ' unrevealed'
    }

    return (
      <div
        key={index}
        className={cellClass}
        onClick={() => revealCell(index)}
        onContextMenu={(e) => toggleFlag(index, e)}
      >
        {cellContent}
      </div>
    )
  }

  const config = DIFFICULTY[difficulty]
  const cellSize = difficulty === 'EASY' ? 40 : difficulty === 'MEDIUM' ? 34 : 30

  return (
    <div className="minesweeper-app">
      <div className="minesweeper-header">
        <div className="minesweeper-title-block">
          <h2>Minesweeper</h2>
          <p>Clear the board without hitting a mine.</p>
        </div>

        <div className="minesweeper-status">
          <div className="status-item">
            <span className="label">Mines Left</span>
            <span className="value">{mineCount - flagCount}</span>
          </div>
          <div className="status-item">
            <span className="label">Flags</span>
            <span className="value">{flagCount}</span>
          </div>
          <div className="status-item">
            <span className="label">Time</span>
            <span className="value">{String(timeElapsed).padStart(3, '0')}</span>
          </div>
        </div>

        <button
          className="reset-btn"
          onClick={initializeGame}
          title="New Game"
          aria-label="New Game"
        >
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>
      </div>

      <div className="minesweeper-difficulty">
        {Object.keys(DIFFICULTY).map(level => (
          <button
            key={level}
            className={`difficulty-btn ${difficulty === level ? 'active' : ''}`}
            onClick={() => setDifficulty(level)}
          >
            <span>{level}</span>
            <small>{DIFFICULTY[level].rows}x{DIFFICULTY[level].cols}</small>
          </button>
        ))}
      </div>

      {gameState !== 'playing' && (
        <div className={`minesweeper-result ${gameState.toLowerCase()}`}>
          {gameState === 'won' ? 'YOU WIN' : 'GAME OVER'}
        </div>
      )}

      <div className="minesweeper-grid-wrap">
        <div
          className="minesweeper-grid"
          style={{
            gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
            gridTemplateRows: `repeat(${config.rows}, 1fr)`,
            '--cell-size': `${cellSize}px`
          }}
        >
          {grid.map((_, index) => renderCell(index))}
        </div>
      </div>

      <div className="minesweeper-footer">
        <small>Left-click to reveal | Right-click to flag</small>
      </div>
    </div>
  )
}
