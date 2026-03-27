import { useEffect, useState } from 'react'

export default function PowerScreen({ mode, update = false, onComplete }) {
  const [progress, setProgress] = useState(0)
  
  useEffect(() => {
    const duration = update ? 10000 : 2600
    let startTime = Date.now()
    let animationFrame
    
    const updateProgress = () => {
      const elapsed = Date.now() - startTime
      const percent = Math.min(Math.floor((elapsed / duration) * 100), 100)
      setProgress(percent)
      
      if (percent < 100) {
        animationFrame = requestAnimationFrame(updateProgress)
      }
    }
    
    if (update) {
      animationFrame = requestAnimationFrame(updateProgress)
    }
    
    const timer = setTimeout(() => {
      onComplete?.()
    }, duration)

    return () => {
      clearTimeout(timer)
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [onComplete, update])

  const message = mode === 'restart'
    ? (update ? 'Restarting and updating...' : 'Restarting...')
    : (update ? 'Shutting down and updating...' : 'Shutting Down...')

  return (
    <div className="power-screen">
      <div className="power-message">{message}</div>
      {update && (
        <div className="power-update-progress">
          <div className="power-progress-bar">
            <div className="power-progress-fill" style={{ '--progress': progress }} />
          </div>
          <div className="power-progress-text">{progress}%</div>
        </div>
      )}
      {!update && <div className="boot-loader" aria-label="Loading" />}
    </div>
  )
}
