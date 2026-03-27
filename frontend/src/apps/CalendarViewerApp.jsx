import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'

export default function CalendarApp() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showYearPicker, setShowYearPicker] = useState(false)

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    return new Date(year, month, 1).getDay()
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const previousYear = () => {
    setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth()))
  }

  const nextYear = () => {
    setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth()))
  }

  const setYear = (year) => {
    setCurrentDate(new Date(year, currentDate.getMonth()))
    setShowYearPicker(false)
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
  }

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      const isToday = 
        date.getDate() === new Date().getDate() &&
        date.getMonth() === new Date().getMonth() &&
        date.getFullYear() === new Date().getFullYear()
      
      const isSelected =
        date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear()

      days.push(
        <div
          key={day}
          className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
          onClick={() => setSelectedDate(date)}
        >
          {day}
        </div>
      )
    }

    return days
  }

  const currentYear = currentDate.getFullYear()
  const yearRange = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i)

  return (
    <div className="calendar-app">
      <div className="calendar-header">
        {showYearPicker ? (
          <>
            <button className="calendar-nav-btn" onClick={previousYear}>
              <ChevronLeft size={20} />
            </button>
            <div className="calendar-title">
              <span>{yearRange[0]} - {yearRange[yearRange.length - 1]}</span>
            </div>
            <button className="calendar-nav-btn" onClick={nextYear}>
              <ChevronRight size={20} />
            </button>
          </>
        ) : (
          <>
            <button className="calendar-nav-btn" onClick={previousMonth}>
              <ChevronLeft size={20} />
            </button>
            <div className="calendar-title" onClick={() => setShowYearPicker(true)} style={{ cursor: 'pointer' }}>
              <CalendarIcon size={20} />
              <span>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
            </div>
            <button className="calendar-nav-btn" onClick={nextMonth}>
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      <div className="calendar-action">
        <button className="today-btn" onClick={goToToday}>
          Today
        </button>
      </div>

      {showYearPicker ? (
        <div className="year-picker-grid">
          {yearRange.map(year => (
            <button
              key={year}
              className={`year-picker-btn ${year === currentYear ? 'active' : ''}`}
              onClick={() => setYear(year)}
            >
              {year}
            </button>
          ))}
        </div>
      ) : (
        <div className="calendar-grid">
          <div className="calendar-weekdays">
            {dayNames.map(day => (
              <div key={day} className="calendar-weekday">{day}</div>
            ))}
          </div>
          <div className="calendar-days">
            {renderCalendarDays()}
          </div>
        </div>
      )}

      <div className="calendar-footer">
        <div className="selected-date">
          Selected: {selectedDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>
    </div>
  )
}
