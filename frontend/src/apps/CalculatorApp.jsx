import { useState, useEffect } from 'react'
import { Calculator as CalcIcon } from 'lucide-react'

export default function CalculatorApp() {
  const [display, setDisplay] = useState('0')
  const [previousValue, setPreviousValue] = useState(null)
  const [operation, setOperation] = useState(null)
  const [clearOnNext, setClearOnNext] = useState(false)

  // Keyboard bindings
  useEffect(() => {
    const handleKeyPress = (e) => {
      const key = e.key
      
      // Numbers
      if (key >= '0' && key <= '9') {
        e.preventDefault()
        handleNumber(parseInt(key))
      }
      // Operations
      else if (key === '+' || key === '-') {
        e.preventDefault()
        if (key === '+') handleOperation('+')
        else handleOperation('-')
      }
      else if (key === '*') {
        e.preventDefault()
        handleOperation('×')
      }
      else if (key === '/') {
        e.preventDefault()
        handleOperation('÷')
      }
      else if (key === '%') {
        e.preventDefault()
        handleOperation('%')
      }
      else if (key === '=' || key === 'Enter') {
        e.preventDefault()
        handleEquals()
      }
      else if (key === 'Backspace') {
        e.preventDefault()
        handleBackspace()
      }
      else if (key === '.' || key === ',') {
        e.preventDefault()
        handleDecimal()
      }
      else if (key === 'Escape' || key === 'c' || key === 'C') {
        e.preventDefault()
        handleClear()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [display, previousValue, operation, clearOnNext])

  const handleNumber = (num) => {
    if (clearOnNext) {
      setDisplay(String(num))
      setClearOnNext(false)
    } else {
      setDisplay(display === '0' ? String(num) : display + num)
    }
  }

  const handleDecimal = () => {
    if (clearOnNext) {
      setDisplay('0.')
      setClearOnNext(false)
    } else if (!display.includes('.')) {
      setDisplay(display + '.')
    }
  }

  const handleOperation = (op) => {
    const current = parseFloat(display)
    if (previousValue === null) {
      setPreviousValue(current)
    } else if (operation) {
      const result = calculate(previousValue, current, operation)
      setDisplay(String(result))
      setPreviousValue(result)
    }
    setOperation(op)
    setClearOnNext(true)
  }

  const calculate = (a, b, op) => {
    switch (op) {
      case '+': return a + b
      case '-': return a - b
      case '×': return a * b
      case '÷': return b !== 0 ? a / b : 0
      case '%': return a * (b / 100)
      default: return b
    }
  }

  const handleEquals = () => {
    if (operation && previousValue !== null) {
      const current = parseFloat(display)
      const result = calculate(previousValue, current, operation)
      setDisplay(String(result))
      setPreviousValue(null)
      setOperation(null)
      setClearOnNext(true)
    }
  }

  const handleClear = () => {
    setDisplay('0')
    setPreviousValue(null)
    setOperation(null)
    setClearOnNext(false)
  }

  const handleClearEntry = () => {
    setDisplay('0')
  }

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1))
    } else {
      setDisplay('0')
    }
  }

  const handleToggleSign = () => {
    const num = parseFloat(display)
    setDisplay(String(-num))
  }

  return (
    <div className="calculator-app">
      <div className="calculator-display">{display}</div>
      <div className="calculator-buttons">
        <button className="calc-btn calc-special" onClick={handleClear}>C</button>
        <button className="calc-btn calc-special" onClick={handleClearEntry}>CE</button>
        <button className="calc-btn calc-special" onClick={handleBackspace}>⌫</button>
        <button className="calc-btn calc-operation" onClick={() => handleOperation('÷')}>÷</button>

        <button className="calc-btn" onClick={() => handleNumber(7)}>7</button>
        <button className="calc-btn" onClick={() => handleNumber(8)}>8</button>
        <button className="calc-btn" onClick={() => handleNumber(9)}>9</button>
        <button className="calc-btn calc-operation" onClick={() => handleOperation('×')}>×</button>

        <button className="calc-btn" onClick={() => handleNumber(4)}>4</button>
        <button className="calc-btn" onClick={() => handleNumber(5)}>5</button>
        <button className="calc-btn" onClick={() => handleNumber(6)}>6</button>
        <button className="calc-btn calc-operation" onClick={() => handleOperation('-')}>−</button>

        <button className="calc-btn" onClick={() => handleNumber(1)}>1</button>
        <button className="calc-btn" onClick={() => handleNumber(2)}>2</button>
        <button className="calc-btn" onClick={() => handleNumber(3)}>3</button>
        <button className="calc-btn calc-operation" onClick={() => handleOperation('+')}>+</button>

        <button className="calc-btn" onClick={handleToggleSign}>+/−</button>
        <button className="calc-btn" onClick={() => handleNumber(0)}>0</button>
        <button className="calc-btn" onClick={handleDecimal}>.</button>
        <button className="calc-btn calc-equals" onClick={handleEquals}>=</button>

        <button className="calc-btn calc-operation calc-wide" onClick={() => handleOperation('%')} style={{gridColumn: 'span 4'}}>%</button>
      </div>
    </div>
  )
}
