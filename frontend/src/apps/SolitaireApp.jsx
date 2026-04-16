import { useEffect, useState } from 'react'
import { Lightbulb, RotateCcw, Settings, Undo2 } from 'lucide-react'
import '../styles/apps/solitaire.css'

const SUITS = ['♠', '♥', '♦', '♣']
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const RANK_VALUES = { A: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, J: 11, Q: 12, K: 13 }
const COLORS = { '♠': 'black', '♥': 'red', '♦': 'red', '♣': 'black' }
const DRAG_MIME = 'application/x-jezos-solitaire-card'
const DRAW_MODES = { ONE: 'ONE', THREE: 'THREE' }
const REDEAL_MODES = { UNLIMITED: 'UNLIMITED', THREE: 'THREE' }

function foundationSuitForIndex(index) {
  return SUITS[index]
}

function cloneState(state) {
  return JSON.parse(JSON.stringify(state))
}

function createDeck() {
  const deck = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ id: `${rank}${suit}`, suit, rank, faceUp: false })
    }
  }
  return deck
}

function shuffleDeck(deck) {
  const shuffled = [...deck]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }
  return shuffled
}

function createInitialState() {
  const deck = shuffleDeck(createDeck())
  const state = {
    stock: deck.slice(0, 24),
    waste: [],
    foundations: [[], [], [], []],
    tableau: [[], [], [], [], [], [], []]
  }

  let cardIndex = 24
  for (let column = 0; column < 7; column += 1) {
    for (let row = 0; row <= column; row += 1) {
      state.tableau[column].push({ ...deck[cardIndex], faceUp: row === column })
      cardIndex += 1
    }
  }

  return state
}

function canMoveToFoundation(card, foundation, foundationSuit = null) {
  if (!card) return false
  if (foundation.length === 0) {
    return card.rank === 'A' && (!foundationSuit || card.suit === foundationSuit)
  }
  const topCard = foundation[foundation.length - 1]
  return topCard.suit === card.suit && RANK_VALUES[topCard.rank] + 1 === RANK_VALUES[card.rank]
}

function canMoveToTableau(card, targetCard) {
  if (!card) return false
  if (!targetCard) return card.rank === 'K'
  return COLORS[card.suit] !== COLORS[targetCard.suit] && RANK_VALUES[card.rank] + 1 === RANK_VALUES[targetCard.rank]
}

function isValidTableauRun(cards) {
  if (!cards.length || !cards[0].faceUp) return false
  for (let index = 0; index < cards.length - 1; index += 1) {
    const current = cards[index]
    const next = cards[index + 1]
    if (!current.faceUp || !next.faceUp) return false
    if (COLORS[current.suit] === COLORS[next.suit]) return false
    if (RANK_VALUES[current.rank] !== RANK_VALUES[next.rank] + 1) return false
  }
  return true
}

function hasAnyPlacementMoves(state) {
  if (!state) return false

  const wasteTop = state.waste[state.waste.length - 1]
  if (wasteTop) {
    if (state.foundations.some((foundation, index) => canMoveToFoundation(wasteTop, foundation, foundationSuitForIndex(index)))) return true
    if (state.tableau.some((column) => canMoveToTableau(wasteTop, column[column.length - 1] || null))) return true
  }

  for (let sourceColumnIndex = 0; sourceColumnIndex < state.tableau.length; sourceColumnIndex += 1) {
    const column = state.tableau[sourceColumnIndex]

    for (let startIndex = 0; startIndex < column.length; startIndex += 1) {
      const movingCards = column.slice(startIndex)
      if (!isValidTableauRun(movingCards)) continue

      const movingCard = movingCards[0]
      const isTopCardOnly = startIndex === column.length - 1
      if (isTopCardOnly && state.foundations.some((foundation, index) => canMoveToFoundation(movingCard, foundation, foundationSuitForIndex(index)))) {
        return true
      }

      for (let targetColumnIndex = 0; targetColumnIndex < state.tableau.length; targetColumnIndex += 1) {
        if (targetColumnIndex === sourceColumnIndex) continue
        const targetCard = state.tableau[targetColumnIndex][state.tableau[targetColumnIndex].length - 1] || null
        if (canMoveToTableau(movingCard, targetCard)) return true
      }
    }
  }

  for (let foundationIndex = 0; foundationIndex < state.foundations.length; foundationIndex += 1) {
    const foundation = state.foundations[foundationIndex]
    const topCard = foundation[foundation.length - 1]
    if (!topCard) continue
    for (let columnIndex = 0; columnIndex < state.tableau.length; columnIndex += 1) {
      const targetCard = state.tableau[columnIndex][state.tableau[columnIndex].length - 1] || null
      if (canMoveToTableau(topCard, targetCard)) return true
    }
  }

  return false
}

function hasAnyLegalMoves(state, canRedeal) {
  if (!state) return false
  if (state.stock.length > 0) return true
  if (canRedeal) return true
  return hasAnyPlacementMoves(state)
}

function cardLabel(card) {
  if (!card) return ''
  return `${card.rank}${card.suit}`
}

function findHint(state, drawMode, redealMode, redealsUsed) {
  if (!state) return null

  const wasteTop = state.waste[state.waste.length - 1]
  if (wasteTop) {
    const foundationIndex = state.foundations.findIndex((foundation, index) => canMoveToFoundation(wasteTop, foundation, foundationSuitForIndex(index)))
    if (foundationIndex >= 0) {
      return `Move ${cardLabel(wasteTop)} from Waste to ${SUITS[foundationIndex]} foundation.`
    }
  }

  for (let columnIndex = 0; columnIndex < state.tableau.length; columnIndex += 1) {
    const column = state.tableau[columnIndex]
    const topCard = column[column.length - 1]
    if (!topCard || !topCard.faceUp) continue
    const foundationIndex = state.foundations.findIndex((foundation, index) => canMoveToFoundation(topCard, foundation, foundationSuitForIndex(index)))
    if (foundationIndex >= 0) {
      return `Move ${cardLabel(topCard)} from Tableau ${columnIndex + 1} to ${SUITS[foundationIndex]} foundation.`
    }
  }

  if (wasteTop) {
    for (let targetColumnIndex = 0; targetColumnIndex < state.tableau.length; targetColumnIndex += 1) {
      const targetCard = state.tableau[targetColumnIndex][state.tableau[targetColumnIndex].length - 1] || null
      if (canMoveToTableau(wasteTop, targetCard)) {
        return `Move ${cardLabel(wasteTop)} from Waste to Tableau ${targetColumnIndex + 1}.`
      }
    }
  }

  for (let sourceColumnIndex = 0; sourceColumnIndex < state.tableau.length; sourceColumnIndex += 1) {
    const sourceColumn = state.tableau[sourceColumnIndex]
    for (let startIndex = 0; startIndex < sourceColumn.length; startIndex += 1) {
      const movingCards = sourceColumn.slice(startIndex)
      if (!isValidTableauRun(movingCards)) continue
      const movingCard = movingCards[0]
      for (let targetColumnIndex = 0; targetColumnIndex < state.tableau.length; targetColumnIndex += 1) {
        if (targetColumnIndex === sourceColumnIndex) continue
        const targetCard = state.tableau[targetColumnIndex][state.tableau[targetColumnIndex].length - 1] || null
        if (canMoveToTableau(movingCard, targetCard)) {
          return `Move ${cardLabel(movingCard)} (and run) from Tableau ${sourceColumnIndex + 1} to Tableau ${targetColumnIndex + 1}.`
        }
      }
    }
  }

  for (let foundationIndex = 0; foundationIndex < state.foundations.length; foundationIndex += 1) {
    const foundation = state.foundations[foundationIndex]
    const topCard = foundation[foundation.length - 1]
    if (!topCard) continue
    for (let targetColumnIndex = 0; targetColumnIndex < state.tableau.length; targetColumnIndex += 1) {
      const targetCard = state.tableau[targetColumnIndex][state.tableau[targetColumnIndex].length - 1] || null
      if (canMoveToTableau(topCard, targetCard)) {
        return `Move ${cardLabel(topCard)} from ${SUITS[foundationIndex]} foundation to Tableau ${targetColumnIndex + 1}.`
      }
    }
  }

  for (let columnIndex = 0; columnIndex < state.tableau.length; columnIndex += 1) {
    const column = state.tableau[columnIndex]
    const topCard = column[column.length - 1]
    if (topCard && !topCard.faceUp) {
      return `Reveal top face-down card in Tableau ${columnIndex + 1}.`
    }
  }

  if (state.stock.length > 0) {
    return `Draw from Stock (${drawMode === DRAW_MODES.THREE ? 'Draw 3' : 'Draw 1'} mode).`
  }

  if (state.waste.length > 0) {
    const canRedeal = redealMode === REDEAL_MODES.UNLIMITED || redealsUsed < 3
    if (canRedeal) {
      return 'Redeal Waste back to Stock.'
    }
  }

  return 'No legal moves available.'
}

export default function SolitaireApp({ onWindowTitleChange, windowControls }) {
  const [gameState, setGameState] = useState(null)
  const [moves, setMoves] = useState(0)
  const [score, setScore] = useState(0)
  const [history, setHistory] = useState([])
  const [gameWon, setGameWon] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [noMovesNotice, setNoMovesNotice] = useState(false)
  const [dragOverTarget, setDragOverTarget] = useState(null)
  const [drawMode, setDrawMode] = useState(DRAW_MODES.THREE)
  const [redealMode, setRedealMode] = useState(REDEAL_MODES.UNLIMITED)
  const [redealsUsed, setRedealsUsed] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [hintsRemaining, setHintsRemaining] = useState(3)
  const [hintMessage, setHintMessage] = useState('')
  const isMaximized = Boolean(windowControls?.isMaximized)

  useEffect(() => {
    onWindowTitleChange?.('Solitaire')
  }, [onWindowTitleChange])

  useEffect(() => {
    setGameState(createInitialState())
    setMoves(0)
    setScore(0)
    setHistory([])
    setGameWon(false)
    setGameOver(false)
    setDragOverTarget(null)
    setDrawMode(DRAW_MODES.THREE)
    setRedealMode(REDEAL_MODES.UNLIMITED)
    setRedealsUsed(0)
    setHintsRemaining(3)
    setHintMessage('')
  }, [])

  useEffect(() => {
    if (!gameState) return
    const won = gameState.foundations.every((foundation) => foundation.length === 13)
    const hasPlacement = hasAnyPlacementMoves(gameState)
    const canRedeal =
      gameState.stock.length === 0 &&
      gameState.waste.length > 0 &&
      (redealMode === REDEAL_MODES.UNLIMITED || redealsUsed < 3)
    setGameWon(won)
    setGameOver(!won && !hasAnyLegalMoves(gameState, canRedeal))
    setNoMovesNotice(!won && !hasPlacement && gameState.stock.length > 0)
  }, [gameState, redealMode, redealsUsed])

  const resetGame = () => {
    setGameState(createInitialState())
    setMoves(0)
    setScore(0)
    setHistory([])
    setGameWon(false)
    setGameOver(false)
    setNoMovesNotice(false)
    setDragOverTarget(null)
    setRedealsUsed(0)
    setSettingsOpen(false)
    setHintsRemaining(3)
    setHintMessage('')
  }

  const handleHint = () => {
    if (!gameState || hintsRemaining <= 0 || gameWon || gameOver) return
    const hint = findHint(gameState, drawMode, redealMode, redealsUsed)
    setHintMessage(hint || 'No hint available.')
    setHintsRemaining((value) => Math.max(0, value - 1))
  }

  const handleQuitGame = () => {
    windowControls?.onClose?.()
  }

  const applyMove = (mutator) => {
    setGameState((previous) => {
      if (!previous || gameWon || gameOver) return previous
      const draft = cloneState(previous)
      const outcome = mutator(draft)
      if (outcome === false) return previous
      const scoreDelta = typeof outcome === 'number' ? outcome : 0
      setHistory((previousHistory) => [...previousHistory, { gameState: previous, moves, score, redealsUsed }])
      setMoves((value) => value + 1)
      if (scoreDelta !== 0) {
        setScore((value) => Math.max(0, value + scoreDelta))
      }
      return draft
    })
  }

  const revealTopIfNeeded = (column) => {
    const newTop = column[column.length - 1]
    if (newTop && !newTop.faceUp) {
      newTop.faceUp = true
      return true
    }
    return false
  }

  const scoreForDrawCount = (count) => (count > 0 ? 5 : 0)

  const handleDraw = () => {
    if (!gameState || gameWon || gameOver) return
    applyMove((draft) => {
      if (draft.stock.length === 0) {
        if (draft.waste.length === 0) return false
        if (redealMode === REDEAL_MODES.THREE && redealsUsed >= 3) return false
        draft.stock = draft.waste.slice().reverse().map((card) => ({ ...card, faceUp: false }))
        draft.waste = []
        setRedealsUsed((value) => value + 1)
        return 0
      }

      const drawCount = drawMode === DRAW_MODES.THREE ? 3 : 1
      let moved = 0
      for (let count = 0; count < drawCount; count += 1) {
        const card = draft.stock.pop()
        if (!card) break
        card.faceUp = true
        draft.waste.push(card)
        moved += 1
      }
      if (moved === 0) return false
      return scoreForDrawCount(moved)
    })
  }

  const handleUndo = () => {
    if (history.length === 0) return
    const previousSnapshot = history[history.length - 1]
    setGameState(cloneState(previousSnapshot.gameState))
    setHistory((previousHistory) => previousHistory.slice(0, -1))
    setMoves(previousSnapshot.moves)
    setScore(previousSnapshot.score)
    setRedealsUsed(previousSnapshot.redealsUsed || 0)
    setGameWon(false)
    setGameOver(false)
    setNoMovesNotice(false)
  }

  const handleWasteToFoundation = () => {
    if (!gameState || gameWon || gameOver) return
    applyMove((draft) => {
      const card = draft.waste[draft.waste.length - 1]
      if (!card) return false
      const foundationIndex = draft.foundations.findIndex((foundation, index) => canMoveToFoundation(card, foundation, foundationSuitForIndex(index)))
      if (foundationIndex < 0) return false
      draft.foundations[foundationIndex].push(draft.waste.pop())
      return 10
    })
  }

  const handleTableauToFoundation = (columnIndex) => {
    if (!gameState || gameWon || gameOver) return
    applyMove((draft) => {
      const column = draft.tableau[columnIndex]
      const card = column[column.length - 1]
      if (!card || !card.faceUp) return false
      const foundationIndex = draft.foundations.findIndex((foundation, index) => canMoveToFoundation(card, foundation, foundationSuitForIndex(index)))
      if (foundationIndex < 0) return false
      draft.foundations[foundationIndex].push(column.pop())
      const revealed = revealTopIfNeeded(column)
      return 10 + (revealed ? 5 : 0)
    })
  }

  const handleTableauReveal = (columnIndex, cardIndex) => {
    if (!gameState || gameWon || gameOver) return
    const column = gameState.tableau[columnIndex]
    if (cardIndex !== column.length - 1) return
    const card = column[cardIndex]
    if (!card || card.faceUp) return

    applyMove((draft) => {
      const target = draft.tableau[columnIndex][cardIndex]
      if (!target || target.faceUp) return false
      target.faceUp = true
      return 5
    })
  }

  const getDragPayload = (event) => {
    try {
      const raw = event.dataTransfer.getData(DRAG_MIME)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  const handleDragStartWaste = (event) => {
    if (!gameState || gameWon || gameOver || gameState.waste.length === 0) return
    event.dataTransfer.setData(DRAG_MIME, JSON.stringify({ source: 'waste' }))
    event.dataTransfer.effectAllowed = 'move'
    const rect = event.currentTarget.getBoundingClientRect()
    const offsetX = Math.max(0, Math.min(rect.width, event.clientX - rect.left))
    const offsetY = Math.max(0, Math.min(rect.height, event.clientY - rect.top))
    event.dataTransfer.setDragImage(event.currentTarget, offsetX, offsetY)
  }

  const handleDragStartTableau = (event, columnIndex, cardIndex) => {
    if (!gameState || gameWon || gameOver) return
    const column = gameState.tableau[columnIndex]
    const movingCards = column.slice(cardIndex)
    if (!isValidTableauRun(movingCards)) {
      event.preventDefault()
      return
    }

    event.dataTransfer.setData(DRAG_MIME, JSON.stringify({ source: 'tableau', columnIndex, cardIndex }))
    event.dataTransfer.effectAllowed = 'move'
    const rect = event.currentTarget.getBoundingClientRect()
    const offsetX = Math.max(0, Math.min(rect.width, event.clientX - rect.left))
    const offsetY = Math.max(0, Math.min(rect.height, event.clientY - rect.top))
    event.dataTransfer.setDragImage(event.currentTarget, offsetX, offsetY)
  }

  const handleDragStartFoundation = (event, foundationIndex) => {
    if (!gameState || gameWon || gameOver) return
    const foundation = gameState.foundations[foundationIndex]
    if (!foundation || foundation.length === 0) return
    event.dataTransfer.setData(DRAG_MIME, JSON.stringify({ source: 'foundation', foundationIndex }))
    event.dataTransfer.effectAllowed = 'move'
    const rect = event.currentTarget.getBoundingClientRect()
    const offsetX = Math.max(0, Math.min(rect.width, event.clientX - rect.left))
    const offsetY = Math.max(0, Math.min(rect.height, event.clientY - rect.top))
    event.dataTransfer.setDragImage(event.currentTarget, offsetX, offsetY)
  }

  const handleDropOnFoundation = (event, foundationIndex) => {
    event.preventDefault()
    if (!gameState || gameWon || gameOver) return
    setDragOverTarget(null)

    const payload = getDragPayload(event)
    if (!payload) return

    if (payload.source === 'waste') {
      applyMove((draft) => {
        const card = draft.waste[draft.waste.length - 1]
        if (!card || !canMoveToFoundation(card, draft.foundations[foundationIndex], foundationSuitForIndex(foundationIndex))) return false
        draft.foundations[foundationIndex].push(draft.waste.pop())
        return 10
      })
      return
    }

    if (payload.source === 'tableau') {
      applyMove((draft) => {
        const column = draft.tableau[payload.columnIndex]
        if (!column || payload.cardIndex !== column.length - 1) return false
        const card = column[column.length - 1]
        if (!card || !canMoveToFoundation(card, draft.foundations[foundationIndex], foundationSuitForIndex(foundationIndex))) return false
        draft.foundations[foundationIndex].push(column.pop())
        const revealed = revealTopIfNeeded(column)
        return 10 + (revealed ? 5 : 0)
      })
    }
  }

  const handleDropOnTableau = (event, targetColumnIndex) => {
    event.preventDefault()
    if (!gameState || gameWon || gameOver) return
    setDragOverTarget(null)

    const payload = getDragPayload(event)
    if (!payload) return

    applyMove((draft) => {
      const targetColumn = draft.tableau[targetColumnIndex]
      const targetCard = targetColumn[targetColumn.length - 1] || null

      if (payload.source === 'waste') {
        const card = draft.waste[draft.waste.length - 1]
        if (!card || !canMoveToTableau(card, targetCard)) return false
        targetColumn.push(draft.waste.pop())
        return 5
      }

      if (payload.source === 'tableau') {
        if (payload.columnIndex === targetColumnIndex) return false
        const sourceColumn = draft.tableau[payload.columnIndex]
        const movingCards = sourceColumn.slice(payload.cardIndex)
        if (!isValidTableauRun(movingCards)) return false
        if (!canMoveToTableau(movingCards[0], targetCard)) return false

        targetColumn.push(...sourceColumn.splice(payload.cardIndex))
        const revealed = revealTopIfNeeded(sourceColumn)
        return revealed ? 5 : 0
      }

      if (payload.source === 'foundation') {
        const foundation = draft.foundations[payload.foundationIndex]
        if (!foundation || foundation.length === 0) return false
        const card = foundation[foundation.length - 1]
        if (!canMoveToTableau(card, targetCard)) return false
        targetColumn.push(foundation.pop())
        return -15
      }

      return false
    })
  }

  const getTableauCardTop = (column, cardIndex) => {
    const faceUpOffset = isMaximized ? 30 : 22
    const faceDownOffset = isMaximized ? 16 : 12
    let offset = 0
    for (let index = 0; index < cardIndex; index += 1) {
      offset += column[index].faceUp ? faceUpOffset : faceDownOffset
    }
    return offset
  }

  if (!gameState) {
    return <div className="solitaire-app solitaire-loading">Loading...</div>
  }

  return (
    <div className={`solitaire-app ${isMaximized ? 'layout-maximized' : 'layout-windowed'}`}>
      <div className="solitaire-header">
        <div className="header-left">
          <button className="header-btn" onClick={resetGame} title="New Game">
            <RotateCcw size={16} />
          </button>
          <button className="header-btn" onClick={handleUndo} disabled={history.length === 0} title="Undo">
            <Undo2 size={16} />
          </button>
          <button className="header-btn" onClick={handleHint} disabled={hintsRemaining === 0 || gameWon || gameOver} title="Hint">
            <Lightbulb size={16} />
          </button>
        </div>
        <div className="header-center">
          <span className="moves-counter">Moves: {moves}</span>
          <span className="score-counter">Score: {score}</span>
          <span className="score-counter">Hints: {hintsRemaining}</span>
          {redealMode === REDEAL_MODES.THREE ? (
            <span className="score-counter">Redeals: {redealsUsed}/3</span>
          ) : null}
        </div>
        <div className="header-right">
          <button
            type="button"
            className="settings-trigger"
            onClick={() => setSettingsOpen((previous) => !previous)}
            aria-label="Open Solitaire settings"
            title="Settings"
          >
            <Settings size={16} />
          </button>
          {gameWon ? <span className="win-text">YOU WIN!</span> : null}
          {gameOver && !gameWon ? <span className="lose-text">GAME OVER</span> : null}
        </div>
      </div>

      {settingsOpen ? (
        <div className="solitaire-settings-overlay" onClick={() => setSettingsOpen(false)} aria-hidden="true" />
      ) : null}

      {settingsOpen ? (
        <aside className="solitaire-settings-drawer open" aria-label="Solitaire settings panel">
          <div className="solitaire-settings-header">
            <h3>Game Settings</h3>
            <button type="button" className="solitaire-settings-close" onClick={() => setSettingsOpen(false)} aria-label="Close settings">
              Close
            </button>
          </div>

          <div className="solitaire-settings-group">
            <div className="solitaire-settings-label">Draw Mode</div>
            <div className="solitaire-segment" role="group" aria-label="Draw mode">
              <button
                type="button"
                className={`solitaire-segment-option ${drawMode === DRAW_MODES.ONE ? 'active' : ''}`}
                onClick={() => setDrawMode(DRAW_MODES.ONE)}
              >
                Draw 1
              </button>
              <button
                type="button"
                className={`solitaire-segment-option ${drawMode === DRAW_MODES.THREE ? 'active' : ''}`}
                onClick={() => setDrawMode(DRAW_MODES.THREE)}
              >
                Draw 3
              </button>
            </div>
          </div>

          <div className="solitaire-settings-group">
            <div className="solitaire-settings-label">Redeal Limit</div>
            <div className="solitaire-segment" role="group" aria-label="Redeal mode">
              <button
                type="button"
                className={`solitaire-segment-option ${redealMode === REDEAL_MODES.UNLIMITED ? 'active' : ''}`}
                onClick={() => setRedealMode(REDEAL_MODES.UNLIMITED)}
              >
                Infinite
              </button>
              <button
                type="button"
                className={`solitaire-segment-option ${redealMode === REDEAL_MODES.THREE ? 'active' : ''}`}
                onClick={() => setRedealMode(REDEAL_MODES.THREE)}
              >
                3
              </button>
            </div>
          </div>
        </aside>
      ) : null}

      {hintMessage && !gameWon ? (
        <div className="solitaire-status-banner hint">Hint: {hintMessage}</div>
      ) : null}

      {gameWon ? (
        <div className="solitaire-win-overlay" role="dialog" aria-modal="true" aria-label="Solitaire win banner">
          <div className="solitaire-win-banner">
            <div className="solitaire-win-title">YOU WIN!</div>
            <div className="solitaire-win-subtitle">Great game. What would you like to do next?</div>
            <div className="solitaire-win-actions">
              <button type="button" className="header-btn solitaire-win-button" onClick={resetGame}>
                <RotateCcw size={16} />
                Restart
              </button>
              <button type="button" className="header-btn solitaire-win-button" onClick={handleQuitGame}>
                Quit Game
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {gameOver && !gameWon ? (
        <div className="solitaire-status-banner lose">No more legal moves. Click New Game to deal again.</div>
      ) : null}

      {noMovesNotice && !gameOver && !gameWon ? (
        <div className="solitaire-status-banner no-moves">No direct moves available. Draw from stock.</div>
      ) : null}

      <div className="solitaire-play-area">
        <div className="solitaire-stock-waste">
          <div className="solitaire-pile stock-pile" onClick={handleDraw}>
            <div className="pile-label">Stock</div>
            <div className="card-count">{gameState.stock.length}</div>
          </div>

          <div className="solitaire-pile waste-pile">
            <div className="pile-label">Waste</div>
            {gameState.waste.length > 0 ? (() => {
              const wasteTop = gameState.waste[gameState.waste.length - 1]
              return (
                <div
                  className="card waste-card"
                  style={{ color: COLORS[wasteTop.suit] }}
                  draggable
                  onDragStart={handleDragStartWaste}
                  onDoubleClick={handleWasteToFoundation}
                >
                  <div className="card-inner">
                    <div className="card-corner top-left">
                      <div className="card-rank">{wasteTop.rank}</div>
                      <div className="card-suit">{wasteTop.suit}</div>
                    </div>
                    <div className="card-center-suit">{wasteTop.suit}</div>
                    <div className="card-corner bottom-right">
                      <div className="card-rank">{wasteTop.rank}</div>
                      <div className="card-suit">{wasteTop.suit}</div>
                    </div>
                  </div>
                </div>
              )
            })() : null}
          </div>
        </div>

        <div className="solitaire-foundations">
          {gameState.foundations.map((foundation, foundationIndex) => (
            <div
              key={`foundation-${foundationIndex}`}
              className={`solitaire-pile foundation-pile ${dragOverTarget === `foundation-${foundationIndex}` ? 'drag-over' : ''}`}
              onDragOver={(event) => {
                event.preventDefault()
                setDragOverTarget(`foundation-${foundationIndex}`)
              }}
              onDragLeave={() => setDragOverTarget((previous) => (previous === `foundation-${foundationIndex}` ? null : previous))}
              onDrop={(event) => handleDropOnFoundation(event, foundationIndex)}
            >
              <div className="pile-label">{SUITS[foundationIndex]}</div>
              {foundation.length > 0 ? (() => {
                const topCard = foundation[foundation.length - 1]
                return (
                  <div className="card foundation-card" style={{ color: COLORS[topCard.suit] }} draggable onDragStart={(event) => handleDragStartFoundation(event, foundationIndex)}>
                    <div className="card-inner">
                      <div className="card-corner top-left">
                        <div className="card-rank">{topCard.rank}</div>
                        <div className="card-suit">{topCard.suit}</div>
                      </div>
                      <div className="card-center-suit">{topCard.suit}</div>
                      <div className="card-corner bottom-right">
                        <div className="card-rank">{topCard.rank}</div>
                        <div className="card-suit">{topCard.suit}</div>
                      </div>
                    </div>
                  </div>
                )
              })() : null}
            </div>
          ))}
        </div>
      </div>

      <div className="solitaire-tableau">
        {gameState.tableau.map((column, columnIndex) => (
          <div
            key={`tableau-${columnIndex}`}
            className={`tableau-column ${dragOverTarget === `tableau-${columnIndex}` ? 'drag-over' : ''}`}
            onDragOver={(event) => {
              event.preventDefault()
              setDragOverTarget(`tableau-${columnIndex}`)
            }}
            onDragLeave={() => setDragOverTarget((previous) => (previous === `tableau-${columnIndex}` ? null : previous))}
            onDrop={(event) => handleDropOnTableau(event, columnIndex)}
          >
            <div className="column-placeholder" />
            {column.map((card, cardIndex) => (
              <div key={`${card.id}-${cardIndex}`}>
                <div
                  className={`card tableau-card ${!card.faceUp ? 'face-down' : ''}`}
                  style={{ top: `${getTableauCardTop(column, cardIndex)}px`, color: !card.faceUp ? '#999' : COLORS[card.suit] }}
                  draggable={card.faceUp}
                  onClick={() => handleTableauReveal(columnIndex, cardIndex)}
                  onDoubleClick={() => handleTableauToFoundation(columnIndex)}
                  onDragStart={(event) => handleDragStartTableau(event, columnIndex, cardIndex)}
                >
                  {card.faceUp ? (
                    <div className="card-inner">
                      <div className="card-corner top-left">
                        <div className="card-rank">{card.rank}</div>
                        <div className="card-suit">{card.suit}</div>
                      </div>
                      <div className="card-center-suit">{card.suit}</div>
                      <div className="card-corner bottom-right">
                        <div className="card-rank">{card.rank}</div>
                        <div className="card-suit">{card.suit}</div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="solitaire-footer">
        <small>Klondike rules: drag cards, build alternating descending tableau, build same-suit ascending foundations.</small>
      </div>
    </div>
  )
}
