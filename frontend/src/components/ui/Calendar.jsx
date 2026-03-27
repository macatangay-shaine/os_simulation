import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Calendar({ onClose }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isClosing, setIsClosing] = useState(false)

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, 200)
  }

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []

    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day-empty"></div>)
    }

    // Days of the month
    const today = new Date()
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday =
        day === today.getDate() &&
        currentDate.getMonth() === today.getMonth() &&
        currentDate.getFullYear() === today.getFullYear()

      days.push(
        <div
          key={day}
          className={`calendar-day ${isToday ? 'calendar-day-today' : ''}`}
        >
          {day}
        </div>
      )
    }

    return days
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <>
      <div className="calendar-overlay" onClick={handleClose} />
      <div className={`calendar-widget ${isClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
      <div className="calendar-header">
        <button
          type="button"
          className="calendar-nav-btn"
          onClick={goToPreviousMonth}
          title="Previous month"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="calendar-title">
          {currentDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}
        </div>
        <button
          type="button"
          className="calendar-nav-btn"
          onClick={goToNextMonth}
          title="Next month"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="calendar-grid">
        {dayNames.map((dayName) => (
          <div key={dayName} className="calendar-day-name">
            {dayName}
          </div>
        ))}
        {renderCalendarDays()}
      </div>

      <div className="calendar-today-info">
        <button
          type="button"
          className="calendar-today-btn"
          onClick={() => setCurrentDate(new Date())}
        >
          Today: {new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
        </button>
      </div>
      </div>
    </>
  )
}
