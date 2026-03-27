import { useState } from 'react'
import { handleApiError, logError, EventIds } from '../utils/errorHandler'

export default function TerminalApp() {
  const [history, setHistory] = useState([
    { type: 'output', text: 'JezOS Terminal v1.0' },
    { type: 'output', text: 'Type "help" for available commands' }
  ])
  const [input, setInput] = useState('')
  const [cwd, setCwd] = useState('/home/user')
  const [commandHistory, setCommandHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('jez_os_terminal_history')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [historyIndex, setHistoryIndex] = useState(-1)

  const persistHistory = (nextHistory) => {
    setCommandHistory(nextHistory)
    localStorage.setItem('jez_os_terminal_history', JSON.stringify(nextHistory.slice(-200)))
  }

  const handleCommand = async (cmd) => {
    const trimmed = cmd.trim()
    setHistory((prev) => [...prev, { type: 'input', text: `${cwd}$ ${trimmed}` }])

    if (!trimmed) return

    const nextHistory = [...commandHistory, trimmed]
    persistHistory(nextHistory)
    setHistoryIndex(-1)

    // Handle clear locally
    if (trimmed === 'clear') {
      setHistory([])
      return
    }

    try {
      const response = await fetch('http://localhost:8000/terminal/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: trimmed, cwd })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Update working directory if changed
        if (data.cwd !== cwd) {
          setCwd(data.cwd)
        }

        // Add output if present
        if (data.output) {
          setHistory((prev) => [...prev, { type: 'output', text: data.output }])
        }
      } else {
        const error = await handleApiError(response, 'executing terminal command')
        setHistory((prev) => [...prev, { type: 'output', text: `Error: ${error.message}` }])
        
        // Log error to event system
        await logError('Terminal', error.message, {
          eventId: EventIds.ERROR_GENERIC,
          details: { command: trimmed, cwd, status: response.status }
        })
      }
    } catch (error) {
      const errorMessage = 'System service unavailable'
      setHistory((prev) => [...prev, { type: 'output', text: errorMessage }])
      
      // Log network error
      await logError('Terminal', errorMessage, {
        eventId: EventIds.ERROR_NETWORK,
        details: { command: trimmed, cwd },
        stackTrace: error.stack
      })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    handleCommand(input)
    setInput('')
  }

  const handleInputKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!commandHistory.length) return
      const nextIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1)
      setHistoryIndex(nextIndex)
      setInput(commandHistory[nextIndex])
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!commandHistory.length) return
      if (historyIndex === -1) return
      if (historyIndex >= commandHistory.length - 1) {
        setHistoryIndex(-1)
        setInput('')
        return
      }
      const nextIndex = historyIndex + 1
      setHistoryIndex(nextIndex)
      setInput(commandHistory[nextIndex])
    }
  }

  const clearStoredHistory = async () => {
    persistHistory([])
    setHistoryIndex(-1)
    try {
      await fetch('http://localhost:8000/terminal/history', { method: 'DELETE' })
    } catch {
      // Ignore backend clear failures; local clear is still valid.
    }
    setHistory((prev) => [...prev, { type: 'output', text: 'Terminal history cleared' }])
  }

  return (
    <div className="app-terminal">
      <div className="terminal-toolbar">
        <button type="button" className="terminal-toolbar-btn" onClick={clearStoredHistory}>
          Clear History
        </button>
      </div>
      <div className="terminal-output">
        {history.map((line, index) => (
          <div key={index} className={`terminal-line ${line.type}`}>
            {line.text}
          </div>
        ))}
      </div>
      <form className="terminal-input-form" onSubmit={handleSubmit}>
        <span className="terminal-prompt">{cwd}$</span>
        <input
          type="text"
          className="terminal-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleInputKeyDown}
          autoFocus
        />
      </form>
    </div>
  )
}
