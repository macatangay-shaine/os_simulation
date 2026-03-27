import { useState, useEffect, useRef } from 'react'
import { Clock, Timer, Play, Pause, RotateCcw } from 'lucide-react'

export default function ClockApp() {
  const [mode, setMode] = useState('clock') // 'clock', 'timer' or 'stopwatch'
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // Timer state
  const [timerMinutes, setTimerMinutes] = useState(5)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerRemaining, setTimerRemaining] = useState(0)
  
  // Stopwatch state
  const [stopwatchTime, setStopwatchTime] = useState(0)
  const [stopwatchRunning, setStopwatchRunning] = useState(false)
  
  const intervalRef = useRef(null)

  // Update current time every second
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    return () => clearInterval(clockInterval)
  }, [])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  // Timer functions
  const startTimer = () => {
    const totalSeconds = (timerMinutes * 60) + timerSeconds
    if (totalSeconds <= 0) return
    
    setTimerRemaining(totalSeconds)
    setTimerRunning(true)
    
    intervalRef.current = setInterval(() => {
      setTimerRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          setTimerRunning(false)
          playAlarm()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const pauseTimer = () => {
    clearInterval(intervalRef.current)
    setTimerRunning(false)
  }

  const resetTimer = () => {
    clearInterval(intervalRef.current)
    setTimerRunning(false)
    setTimerRemaining(0)
  }

  const playAlarm = () => {
    // Simple audio notification
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGJ0vPTgjMGHm7A7+OZTS0LQZ7U6d6qWBEMQZ/Z6t2rWRIMQJvW6NyrWRIMQqDY6t2rWhEMQqLY6N2rWREMQqLY5dyqWBELQZ/U5d2rWRALQJ/W6Nyr')
    audio.play().catch(() => {})
  }

  // Stopwatch functions
  const startStopwatch = () => {
    setStopwatchRunning(true)
    intervalRef.current = setInterval(() => {
      setStopwatchTime(prev => prev + 10)
    }, 10)
  }

  const pauseStopwatch = () => {
    clearInterval(intervalRef.current)
    setStopwatchRunning(false)
  }

  const resetStopwatch = () => {
    clearInterval(intervalRef.current)
    setStopwatchRunning(false)
    setStopwatchTime(0)
  }

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    const milliseconds = Math.floor((ms % 1000) / 10)
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`
  }

  const formatTimerTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="clock-app">
      <div className="clock-tabs">
        <button 
          className={`clock-tab ${mode === 'clock' ? 'active' : ''}`}
          onClick={() => setMode('clock')}
        >
          <Clock size={20} />
          Clock
        </button>
        <button 
          className={`clock-tab ${mode === 'timer' ? 'active' : ''}`}
          onClick={() => setMode('timer')}
        >
          <Timer size={20} />
          Timer
        </button>
        <button 
          className={`clock-tab ${mode === 'stopwatch' ? 'active' : ''}`}
          onClick={() => setMode('stopwatch')}
        >
          <Clock size={20} />
          Stopwatch
        </button>
      </div>

      {mode === 'clock' ? (
        <div className="clock-view">
          <div className="current-time">
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
          </div>
          <div className="current-date">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      ) : mode === 'timer' ? (
        <div className="timer-view">
          {!timerRunning ? (
            <div className="timer-inputs">
              <div className="time-input-group">
                <label>Minutes</label>
                <input 
                  type="number" 
                  min="0" 
                  max="99" 
                  value={timerMinutes}
                  onChange={(e) => setTimerMinutes(Math.max(0, Math.min(99, parseInt(e.target.value) || 0)))}
                />
              </div>
              <div className="time-input-group">
                <label>Seconds</label>
                <input 
                  type="number" 
                  min="0" 
                  max="59" 
                  value={timerSeconds}
                  onChange={(e) => setTimerSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                />
              </div>
            </div>
          ) : (
            <div className="timer-display">
              {formatTimerTime(timerRemaining)}
            </div>
          )}

          <div className="clock-controls">
            {!timerRunning ? (
              <button className="clock-btn start" onClick={startTimer}>
                <Play size={24} />
                Start
              </button>
            ) : (
              <>
                <button className="clock-btn pause" onClick={pauseTimer}>
                  <Pause size={24} />
                  Pause
                </button>
                <button className="clock-btn reset" onClick={resetTimer}>
                  <RotateCcw size={24} />
                  Reset
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="stopwatch-view">
          <div className="stopwatch-display">
            {formatTime(stopwatchTime)}
          </div>

          <div className="clock-controls">
            {!stopwatchRunning ? (
              <>
                <button className="clock-btn start" onClick={startStopwatch}>
                  <Play size={24} />
                  Start
                </button>
                {stopwatchTime > 0 && (
                  <button className="clock-btn reset" onClick={resetStopwatch}>
                    <RotateCcw size={24} />
                    Reset
                  </button>
                )}
              </>
            ) : (
              <button className="clock-btn pause" onClick={pauseStopwatch}>
                <Pause size={24} />
                Pause
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
