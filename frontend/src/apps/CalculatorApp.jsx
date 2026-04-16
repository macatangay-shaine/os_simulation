import { useEffect, useRef, useState } from 'react'
import {
  ChevronDown,
  Delete,
  History,
  Menu,
  PanelRightOpen,
  X
} from 'lucide-react'

const HISTORY_PANEL = 'history'
const MEMORY_PANEL = 'memory'
const ERROR_DIVIDE_BY_ZERO = 'Cannot divide by zero'
const ERROR_INVALID_INPUT = 'Invalid input'
const ERROR_OVERFLOW = 'Overflow'
const OPERATOR_SYMBOLS = {
  add: '+',
  subtract: '−',
  multiply: '×',
  divide: '÷'
}

export default function CalculatorApp({ onWindowTitleChange, windowControls }) {
  const [displayValue, setDisplayValue] = useState('0')
  const [expressionText, setExpressionText] = useState('')
  const [storedValue, setStoredValue] = useState(null)
  const [pendingOperator, setPendingOperator] = useState(null)
  const [lastOperator, setLastOperator] = useState(null)
  const [lastOperand, setLastOperand] = useState(null)
  const [overwriteDisplay, setOverwriteDisplay] = useState(false)
  const [hasPendingInput, setHasPendingInput] = useState(true)
  const [historyEntries, setHistoryEntries] = useState([])
  const [memoryEntries, setMemoryEntries] = useState([])
  const [activePanel, setActivePanel] = useState(HISTORY_PANEL)
  const [isWideLayout, setIsWideLayout] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const rootRef = useRef(null)

  useEffect(() => {
    onWindowTitleChange?.('Calculator')
  }, [onWindowTitleChange])

  useEffect(() => {
    const element = rootRef.current
    if (!element || typeof ResizeObserver === 'undefined') return undefined

    const observer = new ResizeObserver(([entry]) => {
      const nextIsWide = entry.contentRect.width >= 960
      setIsWideLayout(nextIsWide)
      if (nextIsWide) {
        setIsSidebarOpen(false)
      }
    })

    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  const showSidebar = isWideLayout || isSidebarOpen
  const hasMemory = memoryEntries.length > 0
  const displayHasError = isDisplayError(displayValue)

  const showError = (message) => {
    setDisplayValue(message)
    setExpressionText('')
    setStoredValue(null)
    setPendingOperator(null)
    setLastOperator(null)
    setLastOperand(null)
    setOverwriteDisplay(true)
    setHasPendingInput(true)
  }

  const addHistoryEntry = (expression, result, rawResult) => {
    setHistoryEntries((prev) => [{ expression, result, rawResult }, ...prev].slice(0, 50))
  }

  const beginFreshEntry = (nextValue) => {
    setDisplayValue(nextValue)
    setExpressionText('')
    setStoredValue(null)
    setPendingOperator(null)
    setLastOperator(null)
    setLastOperand(null)
    setOverwriteDisplay(false)
    setHasPendingInput(true)
  }

  const inputDigit = (digit) => {
    if (displayHasError) {
      beginFreshEntry(String(digit))
      return
    }

    if (overwriteDisplay) {
      if (!pendingOperator) {
        setExpressionText('')
        setStoredValue(null)
        setLastOperator(null)
        setLastOperand(null)
      }
      setDisplayValue(String(digit))
      setOverwriteDisplay(false)
      setHasPendingInput(true)
      return
    }

    setDisplayValue((prev) => {
      if (prev === '0') return String(digit)
      if (prev === '-0') return `-${digit}`
      return `${prev}${digit}`
    })
    setHasPendingInput(true)
  }

  const inputDecimal = () => {
    if (displayHasError) {
      beginFreshEntry('0.')
      return
    }

    if (overwriteDisplay) {
      if (!pendingOperator) {
        setExpressionText('')
        setStoredValue(null)
        setLastOperator(null)
        setLastOperand(null)
      }
      setDisplayValue('0.')
      setOverwriteDisplay(false)
      setHasPendingInput(true)
      return
    }

    if (!displayValue.includes('.')) {
      setDisplayValue((prev) => `${prev}.`)
    }
    setHasPendingInput(true)
  }

  const selectOperator = (nextOperator) => {
    if (displayHasError) return

    const currentValue = parseDisplayValue(displayValue)
    if (currentValue === null) return

    if (pendingOperator && storedValue !== null && hasPendingInput) {
      const calculation = executeBinaryOperation(storedValue, currentValue, pendingOperator)
      if (!calculation.ok) {
        showError(calculation.error)
        return
      }

      const nextStoredValue = calculation.value
      const nextDisplayValue = formatNumber(nextStoredValue)
      if (isDisplayError(nextDisplayValue)) {
        showError(nextDisplayValue)
        return
      }

      setDisplayValue(nextDisplayValue)
      setStoredValue(nextStoredValue)
      setExpressionText(`${formatDisplayValue(nextDisplayValue)} ${OPERATOR_SYMBOLS[nextOperator]}`)
    } else {
      const baseValue = storedValue !== null && !hasPendingInput ? storedValue : currentValue
      const baseDisplay = formatNumber(baseValue)

      setStoredValue(baseValue)
      setExpressionText(`${formatDisplayValue(baseDisplay)} ${OPERATOR_SYMBOLS[nextOperator]}`)
    }

    setPendingOperator(nextOperator)
    setLastOperator(null)
    setLastOperand(null)
    setOverwriteDisplay(true)
    setHasPendingInput(false)
  }

  const handleEquals = () => {
    if (displayHasError) return

    const currentValue = parseDisplayValue(displayValue)
    if (currentValue === null) return

    if (pendingOperator && storedValue !== null) {
      const calculation = executeBinaryOperation(storedValue, currentValue, pendingOperator)
      if (!calculation.ok) {
        showError(calculation.error)
        return
      }

      const nextDisplayValue = formatNumber(calculation.value)
      if (isDisplayError(nextDisplayValue)) {
        showError(nextDisplayValue)
        return
      }

      const nextExpression = `${formatDisplayValue(formatNumber(storedValue))} ${OPERATOR_SYMBOLS[pendingOperator]} ${formatDisplayValue(formatNumber(currentValue))} =`

      setDisplayValue(nextDisplayValue)
      setExpressionText(nextExpression)
      setStoredValue(calculation.value)
      setLastOperator(pendingOperator)
      setLastOperand(currentValue)
      setPendingOperator(null)
      setOverwriteDisplay(true)
      setHasPendingInput(true)
      addHistoryEntry(nextExpression, nextDisplayValue, calculation.value)
      return
    }

    if (lastOperator && lastOperand !== null) {
      const calculation = executeBinaryOperation(currentValue, lastOperand, lastOperator)
      if (!calculation.ok) {
        showError(calculation.error)
        return
      }

      const nextDisplayValue = formatNumber(calculation.value)
      if (isDisplayError(nextDisplayValue)) {
        showError(nextDisplayValue)
        return
      }

      const nextExpression = `${formatDisplayValue(formatNumber(currentValue))} ${OPERATOR_SYMBOLS[lastOperator]} ${formatDisplayValue(formatNumber(lastOperand))} =`

      setDisplayValue(nextDisplayValue)
      setExpressionText(nextExpression)
      setStoredValue(calculation.value)
      setOverwriteDisplay(true)
      setHasPendingInput(true)
      addHistoryEntry(nextExpression, nextDisplayValue, calculation.value)
    }
  }

  const handleClearAll = () => {
    setDisplayValue('0')
    setExpressionText('')
    setStoredValue(null)
    setPendingOperator(null)
    setLastOperator(null)
    setLastOperand(null)
    setOverwriteDisplay(false)
    setHasPendingInput(true)
  }

  const handleClearEntry = () => {
    if (displayHasError) {
      handleClearAll()
      return
    }

    setDisplayValue('0')
    setOverwriteDisplay(true)

    if (pendingOperator) {
      setHasPendingInput(false)
      return
    }

    setExpressionText('')
    setStoredValue(null)
    setLastOperator(null)
    setLastOperand(null)
    setHasPendingInput(true)
  }

  const handleBackspace = () => {
    if (displayHasError) {
      handleClearAll()
      return
    }

    if (overwriteDisplay) return

    setDisplayValue((prev) => {
      if (prev.length <= 1) return '0'
      const nextValue = prev.slice(0, -1)
      return nextValue === '-' ? '0' : nextValue
    })
    setHasPendingInput(true)
  }

  const applyUnaryOperation = (labelBuilder, operation) => {
    if (displayHasError) return

    const currentValue = parseDisplayValue(displayValue)
    if (currentValue === null) return

    const result = operation(currentValue)
    if (!result.ok) {
      showError(result.error)
      return
    }

    const nextDisplayValue = formatNumber(result.value)
    if (isDisplayError(nextDisplayValue)) {
      showError(nextDisplayValue)
      return
    }

    const operandLabel = labelBuilder(formatDisplayValue(formatNumber(currentValue)))
    const nextExpression =
      pendingOperator && storedValue !== null
        ? `${formatDisplayValue(formatNumber(storedValue))} ${OPERATOR_SYMBOLS[pendingOperator]} ${operandLabel}`
        : operandLabel

    setDisplayValue(nextDisplayValue)
    setExpressionText(nextExpression)
    setOverwriteDisplay(true)
    setHasPendingInput(true)
  }

  const handlePercent = () => {
    if (displayHasError) return

    const currentValue = parseDisplayValue(displayValue)
    if (currentValue === null) return

    const nextValue =
      pendingOperator && storedValue !== null
        ? (storedValue * currentValue) / 100
        : currentValue / 100

    const nextDisplayValue = formatNumber(nextValue)
    if (isDisplayError(nextDisplayValue)) {
      showError(nextDisplayValue)
      return
    }

    const nextExpression =
      pendingOperator && storedValue !== null
        ? `${formatDisplayValue(formatNumber(storedValue))} ${OPERATOR_SYMBOLS[pendingOperator]} ${formatDisplayValue(formatNumber(currentValue))}%`
        : `${formatDisplayValue(formatNumber(currentValue))}%`

    setDisplayValue(nextDisplayValue)
    setExpressionText(nextExpression)
    setOverwriteDisplay(true)
    setHasPendingInput(true)
  }

  const handleToggleSign = () => {
    if (displayHasError) return

    const currentValue = parseDisplayValue(displayValue)
    if (currentValue === null || currentValue === 0) return

    setDisplayValue(formatNumber(currentValue * -1))
    setOverwriteDisplay(false)
    setHasPendingInput(true)
  }

  const handleReciprocal = () => {
    applyUnaryOperation(
      (value) => `1/(${value})`,
      (value) => {
        if (value === 0) {
          return { ok: false, error: ERROR_DIVIDE_BY_ZERO }
        }
        return { ok: true, value: 1 / value }
      }
    )
  }

  const handleSquare = () => {
    applyUnaryOperation((value) => `sqr(${value})`, (value) => ({ ok: true, value: value * value }))
  }

  const handleSquareRoot = () => {
    applyUnaryOperation(
      (value) => `sqrt(${value})`,
      (value) => {
        if (value < 0) {
          return { ok: false, error: ERROR_INVALID_INPUT }
        }
        return { ok: true, value: Math.sqrt(value) }
      }
    )
  }

  const recallMemoryValue = (value) => {
    const nextDisplayValue = formatNumber(value)
    if (isDisplayError(nextDisplayValue)) {
      showError(nextDisplayValue)
      return
    }

    if (!pendingOperator) {
      setExpressionText('')
      setStoredValue(null)
      setLastOperator(null)
      setLastOperand(null)
    }

    setDisplayValue(nextDisplayValue)
    setOverwriteDisplay(true)
    setHasPendingInput(true)
  }

  const handleMemoryStore = () => {
    if (displayHasError) return

    const currentValue = parseDisplayValue(displayValue)
    if (currentValue === null) return

    setMemoryEntries((prev) => [currentValue, ...prev].slice(0, 20))
    setActivePanel(MEMORY_PANEL)
  }

  const handleMemoryClearAll = () => {
    setMemoryEntries([])
  }

  const handleMemoryAdd = () => {
    if (displayHasError) return

    const currentValue = parseDisplayValue(displayValue)
    if (currentValue === null) return

    setMemoryEntries((prev) => {
      if (prev.length === 0) {
        return [currentValue]
      }

      const nextValue = sanitizeNumber(prev[0] + currentValue)
      if (nextValue === null) {
        showError(ERROR_OVERFLOW)
        return prev
      }

      return [nextValue, ...prev.slice(1)]
    })
    setActivePanel(MEMORY_PANEL)
  }

  const handleMemorySubtract = () => {
    if (displayHasError) return

    const currentValue = parseDisplayValue(displayValue)
    if (currentValue === null) return

    setMemoryEntries((prev) => {
      if (prev.length === 0) {
        return [currentValue * -1]
      }

      const nextValue = sanitizeNumber(prev[0] - currentValue)
      if (nextValue === null) {
        showError(ERROR_OVERFLOW)
        return prev
      }

      return [nextValue, ...prev.slice(1)]
    })
    setActivePanel(MEMORY_PANEL)
  }

  const handleHistorySelect = (entry) => {
    const nextDisplayValue = formatNumber(entry.rawResult)
    setDisplayValue(nextDisplayValue)
    setExpressionText(entry.expression)
    setStoredValue(entry.rawResult)
    setPendingOperator(null)
    setLastOperator(null)
    setLastOperand(null)
    setOverwriteDisplay(true)
    setHasPendingInput(true)

    if (!isWideLayout) {
      setIsSidebarOpen(false)
    }
  }

  const removeMemoryEntry = (index) => {
    setMemoryEntries((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
  }

  const toggleSidebar = () => {
    if (isWideLayout) return
    setIsSidebarOpen((prev) => !prev)
  }

  const togglePanel = (panel) => {
    if (isWideLayout) {
      setActivePanel(panel)
      return
    }

    if (isSidebarOpen && activePanel === panel) {
      setIsSidebarOpen(false)
      return
    }

    setActivePanel(panel)
    setIsSidebarOpen(true)
  }

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return

      const target = event.target
      const isEditableTarget =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      if (isEditableTarget) return

      const { key } = event
      let handled = true

      if (key >= '0' && key <= '9') {
        inputDigit(key)
      } else if (key === '.') {
        inputDecimal()
      } else if (key === ',' && !displayValue.includes('.')) {
        inputDecimal()
      } else if (key === '+') {
        selectOperator('add')
      } else if (key === '-') {
        selectOperator('subtract')
      } else if (key === '*') {
        selectOperator('multiply')
      } else if (key === '/') {
        selectOperator('divide')
      } else if (key === '%') {
        handlePercent()
      } else if (key === 'Enter' || key === '=') {
        handleEquals()
      } else if (key === 'Backspace') {
        handleBackspace()
      } else if (key === 'Delete') {
        handleClearEntry()
      } else if (key === 'Escape') {
        handleClearAll()
      } else if (key === 'F9') {
        handleToggleSign()
      } else {
        handled = false
      }

      if (handled) {
        event.preventDefault()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    activePanel,
    displayValue,
    displayHasError,
    hasPendingInput,
    isSidebarOpen,
    isWideLayout,
    lastOperand,
    lastOperator,
    memoryEntries,
    overwriteDisplay,
    pendingOperator,
    storedValue
  ])

  return (
    <div
      ref={rootRef}
      className={`calculator-app ${isWideLayout ? 'wide' : 'compact'} ${showSidebar ? 'sidebar-open' : ''}`}
    >
      <div className="calculator-shell">
        <header className="calculator-chrome" data-window-drag-handle="true">
          <div className="calculator-chrome-brand">
            <img className="calculator-chrome-icon" src="/desktop-icons/calculator.png" alt="" />
            <span>Calculator</span>
          </div>
          {windowControls ? (
            <div className="calculator-window-controls" data-no-window-drag="true">
              <button
                type="button"
                className="calculator-window-control"
                onClick={windowControls.onMinimize}
                aria-label="Minimize"
              >
                <span className="os-window-glyph os-window-glyph-minimize" aria-hidden="true" />
              </button>
              {windowControls.canMaximize ? (
                <button
                  type="button"
                  className="calculator-window-control"
                  onClick={windowControls.onMaximize}
                  aria-label={windowControls.isMaximized ? 'Restore' : 'Maximize'}
                >
                  <span
                    className={`os-window-glyph ${windowControls.isMaximized ? 'os-window-glyph-restore' : 'os-window-glyph-maximize'}`}
                    aria-hidden="true"
                  />
                </button>
              ) : null}
              <button
                type="button"
                className="calculator-window-control close"
                onClick={windowControls.onClose}
                aria-label="Close"
              >
                <span className="os-window-glyph os-window-glyph-close" aria-hidden="true" />
              </button>
            </div>
          ) : null}
        </header>

        <div className={`calculator-workspace ${showSidebar ? 'has-sidebar' : ''}`}>
          <section className="calculator-main">
            <div className="calculator-toolbar">
              <div className="calculator-toolbar-left">
                <button
                  type="button"
                  className="calculator-toolbar-btn"
                  onClick={toggleSidebar}
                  aria-label="Toggle side panel"
                >
                  <Menu size={22} />
                </button>

                <div className="calculator-mode-group">
                  <div className="calculator-mode-title">Standard</div>
                  <button
                    type="button"
                    className="calculator-toolbar-btn subtle"
                    onClick={() => togglePanel(MEMORY_PANEL)}
                    aria-label="Open memory panel"
                  >
                    <PanelRightOpen size={18} />
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="calculator-toolbar-btn"
                onClick={() => togglePanel(HISTORY_PANEL)}
                aria-label="Open history panel"
              >
                <History size={20} />
              </button>
            </div>

            <div className="calculator-display-panel">
              <div className="calculator-expression">{expressionText || '\u00A0'}</div>
              <div className={`calculator-display ${displayHasError ? 'error' : ''}`}>
                {formatDisplayValue(displayValue)}
              </div>
            </div>

            <div className="calculator-memory-bar">
              <button type="button" className="calculator-memory-btn" onClick={handleMemoryClearAll} disabled={!hasMemory}>
                MC
              </button>
              <button
                type="button"
                className="calculator-memory-btn"
                onClick={() => recallMemoryValue(memoryEntries[0])}
                disabled={!hasMemory}
              >
                MR
              </button>
              <button type="button" className="calculator-memory-btn" onClick={handleMemoryAdd}>
                M+
              </button>
              <button type="button" className="calculator-memory-btn" onClick={handleMemorySubtract}>
                M-
              </button>
              <button type="button" className="calculator-memory-btn" onClick={handleMemoryStore}>
                MS
              </button>
              <button
                type="button"
                className="calculator-memory-btn calculator-memory-toggle"
                onClick={() => togglePanel(MEMORY_PANEL)}
                disabled={!hasMemory}
              >
                <span>M</span>
                <ChevronDown size={12} />
              </button>
            </div>

            <div className="calculator-keypad">
              <CalculatorKey className="utility" onClick={handlePercent}>
                %
              </CalculatorKey>
              <CalculatorKey className="utility" onClick={handleClearEntry}>
                CE
              </CalculatorKey>
              <CalculatorKey className="utility" onClick={handleClearAll}>
                C
              </CalculatorKey>
              <CalculatorKey className="utility icon" onClick={handleBackspace} ariaLabel="Backspace">
                <Delete size={18} />
              </CalculatorKey>

              <CalculatorKey className="utility" onClick={handleReciprocal}>
                1/x
              </CalculatorKey>
              <CalculatorKey className="utility" onClick={handleSquare}>
                <span className="calculator-inline-formula">
                  x<sup>2</sup>
                </span>
              </CalculatorKey>
              <CalculatorKey className="utility" onClick={handleSquareRoot}>
                <span className="calculator-inline-formula">
                  <sup>2</sup>√x
                </span>
              </CalculatorKey>
              <CalculatorKey className="operator" onClick={() => selectOperator('divide')}>
                ÷
              </CalculatorKey>

              <CalculatorKey onClick={() => inputDigit('7')}>7</CalculatorKey>
              <CalculatorKey onClick={() => inputDigit('8')}>8</CalculatorKey>
              <CalculatorKey onClick={() => inputDigit('9')}>9</CalculatorKey>
              <CalculatorKey className="operator" onClick={() => selectOperator('multiply')}>
                ×
              </CalculatorKey>

              <CalculatorKey onClick={() => inputDigit('4')}>4</CalculatorKey>
              <CalculatorKey onClick={() => inputDigit('5')}>5</CalculatorKey>
              <CalculatorKey onClick={() => inputDigit('6')}>6</CalculatorKey>
              <CalculatorKey className="operator" onClick={() => selectOperator('subtract')}>
                −
              </CalculatorKey>

              <CalculatorKey onClick={() => inputDigit('1')}>1</CalculatorKey>
              <CalculatorKey onClick={() => inputDigit('2')}>2</CalculatorKey>
              <CalculatorKey onClick={() => inputDigit('3')}>3</CalculatorKey>
              <CalculatorKey className="operator" onClick={() => selectOperator('add')}>
                +
              </CalculatorKey>

              <CalculatorKey onClick={handleToggleSign}>+/−</CalculatorKey>
              <CalculatorKey onClick={() => inputDigit('0')}>0</CalculatorKey>
              <CalculatorKey onClick={inputDecimal}>.</CalculatorKey>
              <CalculatorKey className="equals" onClick={handleEquals}>
                =
              </CalculatorKey>
            </div>
          </section>

          {showSidebar ? (
            <aside className={`calculator-sidebar ${isWideLayout ? 'docked' : 'floating'}`}>
              <div className="calculator-sidebar-tabs">
                <button
                  type="button"
                  className={`calculator-sidebar-tab ${activePanel === HISTORY_PANEL ? 'active' : ''}`}
                  onClick={() => setActivePanel(HISTORY_PANEL)}
                >
                  History
                </button>
                <button
                  type="button"
                  className={`calculator-sidebar-tab ${activePanel === MEMORY_PANEL ? 'active' : ''}`}
                  onClick={() => setActivePanel(MEMORY_PANEL)}
                >
                  Memory
                </button>
              </div>

              <div className="calculator-sidebar-content">
                {activePanel === HISTORY_PANEL ? (
                  historyEntries.length === 0 ? (
                    <div className="calculator-sidebar-empty">There&apos;s no history yet.</div>
                  ) : (
                    <div className="calculator-history-list">
                      {historyEntries.map((entry, index) => (
                        <button
                          key={`${entry.expression}-${index}`}
                          type="button"
                          className="calculator-history-entry"
                          onClick={() => handleHistorySelect(entry)}
                        >
                          <span className="calculator-history-expression">{entry.expression}</span>
                          <strong className="calculator-history-result">{formatDisplayValue(entry.result)}</strong>
                        </button>
                      ))}
                    </div>
                  )
                ) : memoryEntries.length === 0 ? (
                  <div className="calculator-sidebar-empty">Nothing&apos;s saved yet.</div>
                ) : (
                  <div className="calculator-memory-list">
                    {memoryEntries.map((value, index) => (
                      <div key={`${value}-${index}`} className="calculator-memory-entry">
                        <button
                          type="button"
                          className="calculator-memory-entry-value"
                          onClick={() => recallMemoryValue(value)}
                        >
                          {formatDisplayValue(formatNumber(value))}
                        </button>
                        <button
                          type="button"
                          className="calculator-memory-entry-clear"
                          onClick={() => removeMemoryEntry(index)}
                        >
                          MC
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          ) : null}

          {showSidebar && !isWideLayout ? (
            <button
              type="button"
              className="calculator-sidebar-backdrop"
              aria-label="Close side panel"
              onClick={() => setIsSidebarOpen(false)}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}

function CalculatorKey({ children, className = '', onClick, ariaLabel }) {
  return (
    <button type="button" className={`calculator-key ${className}`.trim()} onClick={onClick} aria-label={ariaLabel}>
      {children}
    </button>
  )
}

function isDisplayError(value) {
  return [ERROR_DIVIDE_BY_ZERO, ERROR_INVALID_INPUT, ERROR_OVERFLOW].includes(value)
}

function parseDisplayValue(value) {
  if (isDisplayError(value)) return null

  const parsedValue = Number(value)
  return Number.isFinite(parsedValue) ? parsedValue : null
}

function sanitizeNumber(value) {
  const formattedValue = formatNumber(value)
  if (isDisplayError(formattedValue)) return null
  return Number(formattedValue)
}

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return ERROR_OVERFLOW
  }

  const absoluteValue = Math.abs(value)
  if (absoluteValue !== 0 && (absoluteValue >= 1e15 || absoluteValue < 1e-12)) {
    const [mantissa, exponent] = value.toExponential(10).split('e')
    return `${mantissa.replace(/\.?0+$/, '')}e${exponent.replace('+', '')}`
  }

  const normalizedValue = Number(value.toFixed(12))
  const textValue = String(normalizedValue)
  return textValue === '-0' ? '0' : textValue
}

function formatDisplayValue(value) {
  if (!value || isDisplayError(value) || value.includes('e')) {
    return value
  }

  const [integerPart, decimalPart] = value.split('.')
  const isNegative = integerPart.startsWith('-')
  const digits = isNegative ? integerPart.slice(1) : integerPart
  const groupedDigits = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const signedInteger = isNegative ? `-${groupedDigits}` : groupedDigits

  return decimalPart !== undefined ? `${signedInteger}.${decimalPart}` : signedInteger
}

function executeBinaryOperation(leftValue, rightValue, operator) {
  switch (operator) {
    case 'add':
      return { ok: true, value: leftValue + rightValue }
    case 'subtract':
      return { ok: true, value: leftValue - rightValue }
    case 'multiply':
      return { ok: true, value: leftValue * rightValue }
    case 'divide':
      if (rightValue === 0) {
        return { ok: false, error: ERROR_DIVIDE_BY_ZERO }
      }
      return { ok: true, value: leftValue / rightValue }
    default:
      return { ok: true, value: rightValue }
  }
}
