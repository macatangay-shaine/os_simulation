import { useEffect } from 'react'

export default function ShutdownScreen({ onTurnOn }) {
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault()
        onTurnOn?.()
      }
    }

    window.addEventListener('keydown', handleKeyPress)

    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [onTurnOn])

  return (
    <div className="shutdown-screen">
      <p className="shutdown-hint">Press <kbd>P</kbd> to power on</p>
    </div>
  )
}