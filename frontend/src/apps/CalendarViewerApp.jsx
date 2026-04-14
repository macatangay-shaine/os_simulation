import { useEffect, useState } from 'react'
import { AlignJustify, Calendar1, CalendarDays, CalendarFold, CalendarRange, ChevronLeft, ChevronRight, LayoutGrid, Mail, MoreHorizontal, Plus, Settings, Users } from 'lucide-react'

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const MAIN_DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MINI_DAY_NAMES = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const TIMELINE_HOURS = Array.from({ length: 14 }, (_, index) => index + 8)
const DEFAULT_CALENDAR_SOURCES = [
  { id: 'work', label: 'Work', color: '#67ace4', enabled: true, description: 'Outlook account' },
  { id: 'personal', label: 'Personal', color: '#f0a95b', enabled: true, description: 'Private schedule' },
  { id: 'birthdays', label: 'Birthdays', color: '#8fc98b', enabled: false, description: 'Contacts' }
]
const SIDEBAR_FOOTER_ITEMS = [
  { id: 'mail', icon: Mail, label: 'Mail' },
  { id: 'calendar', icon: CalendarDays, label: 'Calendar' },
  { id: 'people', icon: Users, label: 'People' },
  { id: 'view', icon: LayoutGrid, label: 'Views' },
  { id: 'settings', icon: Settings, label: 'Settings' }
]
const VIEW_BUTTONS = [
  { id: 'day', label: 'Day', icon: Calendar1 },
  { id: 'week', label: 'Week', icon: CalendarRange },
  { id: 'month', label: 'Month', icon: CalendarFold }
]

export default function CalendarApp({ onWindowTitleChange }) {
  const [currentDate, setCurrentDate] = useState(() => startOfDay(new Date()))
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()))
  const [showYearPicker, setShowYearPicker] = useState(false)
  const [activeView, setActiveView] = useState('month')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeSidebarModule, setActiveSidebarModule] = useState('calendar')
  const [showEventComposer, setShowEventComposer] = useState(false)
  const [showCalendarList, setShowCalendarList] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [calendarSources, setCalendarSources] = useState(DEFAULT_CALENDAR_SOURCES)
  const [events, setEvents] = useState(() => createSimulationEvents(new Date()))
  const [draftEvent, setDraftEvent] = useState(() => createDraftEvent(new Date(), DEFAULT_CALENDAR_SOURCES[0].id))

  useEffect(() => { onWindowTitleChange?.('Calendar') }, [onWindowTitleChange])

  const today = startOfDay(new Date())
  const currentYear = currentDate.getFullYear()
  const yearRange = Array.from({ length: 21 }, (_, index) => currentYear - 10 + index)
  const visibleEvents = getVisibleEvents(events, calendarSources)
  const calendarWeeks = chunk(buildCalendarCells(currentDate, selectedDate, visibleEvents), 7)
  const miniCalendarWeeks = chunk(buildCalendarCells(currentDate, selectedDate, visibleEvents), 7)
  const selectedDateLabel = selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const headerLabel = getHeaderLabel(currentDate, selectedDate, activeView, showYearPicker, yearRange)
  const weekDays = getWeekDays(selectedDate)
  const dayEvents = getEventsForDate(visibleEvents, selectedDate)
  const weekEvents = weekDays.map((date) => ({ date, events: getEventsForDate(visibleEvents, date) }))

  const closePanels = () => { setShowMoreMenu(false); setShowYearPicker(false) }
  const shiftRange = (days) => { const next = addDays(selectedDate, days); setSelectedDate(next); setCurrentDate(next); closePanels() }
  const previousMonth = () => { setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)); closePanels() }
  const nextMonth = () => { setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)); closePanels() }
  const previousYear = () => { setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1)); setShowMoreMenu(false) }
  const nextYear = () => { setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1)); setShowMoreMenu(false) }
  const goToToday = () => { const next = startOfDay(new Date()); setCurrentDate(next); setSelectedDate(next); closePanels() }
  const handleNavigateBackward = () => showYearPicker ? previousYear() : activeView === 'month' ? previousMonth() : shiftRange(activeView === 'week' ? -7 : -1)
  const handleNavigateForward = () => showYearPicker ? nextYear() : activeView === 'month' ? nextMonth() : shiftRange(activeView === 'week' ? 7 : 1)
  const handleSelectDate = (date, inCurrentMonth = true) => { if (!inCurrentMonth) return; const next = startOfDay(date); setSelectedDate(next); setCurrentDate(next); closePanels() }
  const handleToggleSidebar = () => { setSidebarCollapsed((previous) => !previous); setShowMoreMenu(false) }
  const handleSetView = (viewId) => { setActiveView(viewId); setShowYearPicker(false); setShowMoreMenu(false) }
  const handleOpenComposer = () => { setSidebarCollapsed(false); setActiveSidebarModule('calendar'); setShowCalendarList(true); setShowEventComposer(true); setDraftEvent(createDraftEvent(selectedDate, calendarSources.find((source) => source.enabled)?.id || DEFAULT_CALENDAR_SOURCES[0].id)); setShowMoreMenu(false) }
  const handleToggleCalendarList = () => { setSidebarCollapsed(false); setActiveSidebarModule('calendar'); setShowCalendarList((previous) => !previous); setShowMoreMenu(false) }
  const handleToggleCalendarSource = (sourceId) => setCalendarSources((previous) => previous.map((source) => source.id === sourceId ? { ...source, enabled: !source.enabled } : source))
  const handleDraftChange = (field, value) => setDraftEvent((previous) => ({ ...previous, [field]: value }))
  const handleSaveDraft = (event) => {
    event.preventDefault()
    const title = draftEvent.title.trim().replace(/\s+/g, ' ')
    if (!title) return
    setEvents((previous) => sortEvents([...previous, { id: `event-${Date.now()}`, title, dateKey: getDateKey(selectedDate), startHour: Number(draftEvent.startHour), durationHours: Number(draftEvent.durationHours), calendarId: draftEvent.calendarId }]))
    setDraftEvent(createDraftEvent(selectedDate, draftEvent.calendarId))
    setShowEventComposer(false)
    setActiveView('day')
  }
  const handleRemoveEvent = (eventId) => setEvents((previous) => previous.filter((event) => event.id !== eventId))
  const handleSelectSidebarModule = (moduleId) => { setActiveSidebarModule(moduleId); if (moduleId === 'calendar') setShowCalendarList(true); if (moduleId !== 'calendar') setShowEventComposer(false) }

  return (
    <div className={`calendar-viewer-app ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="calendar-viewer-sidebar">
        <div className="calendar-viewer-sidebar-top">
          <div className="calendar-viewer-app-label">Calendar</div>
          <button type="button" className="calendar-viewer-menu-btn" aria-label={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'} onClick={handleToggleSidebar}><AlignJustify size={20} /></button>
          <button type="button" className="calendar-viewer-new-event-btn" onClick={handleOpenComposer}><Plus size={22} /><span>New event</span></button>

          {!sidebarCollapsed ? (
            <>
              {showEventComposer ? (
                <form className="calendar-viewer-event-composer" onSubmit={handleSaveDraft}>
                  <label className="calendar-viewer-field"><span>Title</span><input type="text" value={draftEvent.title} onChange={(event) => handleDraftChange('title', event.target.value)} placeholder="Add a title" /></label>
                  <div className="calendar-viewer-field-grid">
                    <label className="calendar-viewer-field"><span>Start</span><select value={draftEvent.startHour} onChange={(event) => handleDraftChange('startHour', event.target.value)}>{TIMELINE_HOURS.map((hour) => <option key={hour} value={hour}>{formatHourOption(hour)}</option>)}</select></label>
                    <label className="calendar-viewer-field"><span>Duration</span><select value={draftEvent.durationHours} onChange={(event) => handleDraftChange('durationHours', event.target.value)}>{[1, 2, 3, 4].map((hours) => <option key={hours} value={hours}>{hours} hour{hours === 1 ? '' : 's'}</option>)}</select></label>
                  </div>
                  <label className="calendar-viewer-field"><span>Calendar</span><select value={draftEvent.calendarId} onChange={(event) => handleDraftChange('calendarId', event.target.value)}>{calendarSources.map((source) => <option key={source.id} value={source.id}>{source.label}</option>)}</select></label>
                  <div className="calendar-viewer-inline-actions"><button type="submit" className="calendar-viewer-primary-btn">Save</button><button type="button" className="calendar-viewer-secondary-btn" onClick={() => setShowEventComposer(false)}>Cancel</button></div>
                </form>
              ) : null}

              <section className="calendar-viewer-mini-panel">
                <div className="calendar-viewer-mini-head">
                  <button type="button" className="calendar-viewer-mini-title" onClick={() => { setShowYearPicker((previous) => !previous); setShowMoreMenu(false) }}>{MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}</button>
                  <div className="calendar-viewer-mini-nav">
                    <button type="button" className="calendar-viewer-mini-nav-btn" onClick={previousMonth} aria-label="Previous month"><ChevronLeft size={16} /></button>
                    <button type="button" className="calendar-viewer-mini-nav-btn" onClick={nextMonth} aria-label="Next month"><ChevronRight size={16} /></button>
                  </div>
                </div>
                <div className="calendar-viewer-mini-weekdays">{MINI_DAY_NAMES.map((dayName) => <div key={dayName} className="calendar-viewer-mini-weekday">{dayName}</div>)}</div>
                <div className="calendar-viewer-mini-grid">
                  {miniCalendarWeeks.flat().map((cell) => (
                    <button key={cell.key} type="button" className={['calendar-viewer-mini-day', cell.inCurrentMonth ? '' : 'outside', cell.isToday ? 'today' : '', cell.isSelected ? 'selected' : ''].filter(Boolean).join(' ')} onClick={() => handleSelectDate(cell.date, cell.inCurrentMonth)} disabled={!cell.inCurrentMonth}>{cell.date.getDate()}</button>
                  ))}
                </div>
              </section>

              <div className="calendar-viewer-sidebar-module">
                {activeSidebarModule === 'calendar' ? (
                  <>
                    <button type="button" className="calendar-viewer-sidebar-link" onClick={handleToggleCalendarList}><LayoutGrid size={18} /><span>{showCalendarList ? 'Hide calendars' : 'Add calendars'}</span></button>
                    {showCalendarList ? (
                      <div className="calendar-viewer-calendar-list">
                        {calendarSources.map((source) => (
                          <label key={source.id} className="calendar-viewer-calendar-source">
                            <input type="checkbox" checked={source.enabled} onChange={() => handleToggleCalendarSource(source.id)} />
                            <span className="calendar-viewer-calendar-source-box" />
                            <span className="calendar-viewer-calendar-source-dot" style={{ backgroundColor: source.color }} />
                            <span className="calendar-viewer-calendar-source-copy"><strong>{source.label}</strong><small>{source.description}</small></span>
                          </label>
                        ))}
                      </div>
                    ) : null}
                  </>
                ) : null}
                {activeSidebarModule === 'mail' ? <div className="calendar-viewer-sidebar-note">Mail integration is unavailable in this simulation.</div> : null}
                {activeSidebarModule === 'people' ? <div className="calendar-viewer-sidebar-note">People view is simulated through the Birthdays calendar.</div> : null}
                {activeSidebarModule === 'view' ? <div className="calendar-viewer-sidebar-quick-actions">{VIEW_BUTTONS.map(({ id, label }) => <button key={id} type="button" className={`calendar-viewer-chip-btn ${activeView === id ? 'active' : ''}`} onClick={() => handleSetView(id)}>{label}</button>)}</div> : null}
                {activeSidebarModule === 'settings' ? <div className="calendar-viewer-sidebar-quick-actions"><button type="button" className="calendar-viewer-chip-btn" onClick={goToToday}>Jump to today</button><button type="button" className="calendar-viewer-chip-btn" onClick={handleToggleSidebar}>{sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}</button><button type="button" className="calendar-viewer-chip-btn" onClick={() => setShowYearPicker((previous) => !previous)}>{showYearPicker ? 'Hide years' : 'Show years'}</button></div> : null}
              </div>
            </>
          ) : null}
        </div>

        <div className="calendar-viewer-sidebar-footer">
          {SIDEBAR_FOOTER_ITEMS.map(({ id, icon: Icon, label }) => <button key={id} type="button" className={`calendar-viewer-sidebar-icon ${activeSidebarModule === id ? 'active' : ''}`} aria-label={label} title={label} onClick={() => handleSelectSidebarModule(id)}><Icon size={18} /></button>)}
        </div>
      </aside>

      <main className="calendar-viewer-main">
        <div className="calendar-viewer-toolbar">
          <div className="calendar-viewer-toolbar-left">
            <div className="calendar-viewer-main-nav">
              <button type="button" className="calendar-viewer-main-nav-btn" onClick={handleNavigateBackward} aria-label={showYearPicker ? 'Previous year' : `Previous ${activeView}`}><ChevronLeft size={24} /></button>
              <button type="button" className="calendar-viewer-main-nav-btn" onClick={handleNavigateForward} aria-label={showYearPicker ? 'Next year' : `Next ${activeView}`}><ChevronRight size={24} /></button>
            </div>
            <button type="button" className="calendar-viewer-main-title" onClick={() => { setShowYearPicker((previous) => !previous); setShowMoreMenu(false) }}>{headerLabel}</button>
          </div>

          <div className="calendar-viewer-toolbar-right">
            <button type="button" className="calendar-viewer-toolbar-btn" onClick={goToToday}><CalendarDays size={18} /><span>Today</span></button>
            <div className="calendar-viewer-toolbar-divider" aria-hidden="true" />
            <div className="calendar-viewer-view-switch" aria-label="Calendar views">
              {VIEW_BUTTONS.map(({ id, label, icon: Icon }) => <button key={id} type="button" className={`calendar-viewer-view-btn ${activeView === id ? 'active' : ''}`} onClick={() => handleSetView(id)}><Icon size={17} /><span>{label}</span></button>)}
            </div>
            <div className="calendar-viewer-more-wrap">
              <button type="button" className="calendar-viewer-toolbar-icon" aria-label="More options" onClick={() => setShowMoreMenu((previous) => !previous)}><MoreHorizontal size={22} /></button>
              {showMoreMenu ? (
                <div className="calendar-viewer-more-menu">
                  <button type="button" onClick={handleOpenComposer}>New event</button>
                  <button type="button" onClick={handleToggleCalendarList}>{showCalendarList ? 'Hide calendars' : 'Show calendars'}</button>
                  <button type="button" onClick={handleToggleSidebar}>{sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}</button>
                  <button type="button" onClick={() => handleSetView('month')}>Back to month</button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {showYearPicker ? (
          <section className="calendar-viewer-year-panel"><div className="calendar-viewer-year-grid">{yearRange.map((year) => <button key={year} type="button" className={`calendar-viewer-year-btn ${year === currentYear ? 'active' : ''}`} onClick={() => { setCurrentDate(new Date(year, currentDate.getMonth(), 1)); setShowYearPicker(false) }}>{year}</button>)}</div></section>
        ) : activeView === 'month' ? (
          <>
            <div className="calendar-viewer-weekdays">{MAIN_DAY_NAMES.map((dayName) => <div key={dayName} className="calendar-viewer-weekday">{dayName}</div>)}</div>
            <section className="calendar-viewer-month-panel">
              <div className="calendar-viewer-month-grid">
                {calendarWeeks.map((week, weekIndex) => (
                  <div key={`week-${weekIndex}`} className="calendar-viewer-week-row">
                    {week.map((cell) => (
                      <button key={cell.key} type="button" className={['calendar-viewer-day', cell.inCurrentMonth ? '' : 'outside', cell.isToday ? 'today' : '', cell.isSelected ? 'selected' : ''].filter(Boolean).join(' ')} onClick={() => handleSelectDate(cell.date, cell.inCurrentMonth)} disabled={!cell.inCurrentMonth}>
                        <span className="calendar-viewer-day-number">{cell.date.getDate()}</span>
                        {cell.events.length > 0 ? <span className="calendar-viewer-day-event-dots" aria-hidden="true">{cell.events.slice(0, 3).map((event) => <span key={event.id} className="calendar-viewer-day-event-dot" style={{ backgroundColor: getCalendarColor(calendarSources, event.calendarId) }} />)}</span> : null}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : activeView === 'week' ? (
          <section className="calendar-viewer-week-surface">
            <div className="calendar-viewer-week-surface-head">
              {weekEvents.map(({ date }) => <button key={getDateKey(date)} type="button" className={`calendar-viewer-week-surface-day ${isSameDay(date, selectedDate) ? 'active' : ''}`} onClick={() => handleSelectDate(date)}><span>{MAIN_DAY_NAMES[getMondayFirstDayIndex(date)]}</span><strong>{date.getDate()}</strong></button>)}
            </div>
            <div className="calendar-viewer-week-surface-grid">
              {weekEvents.map(({ date, events: weekDayEvents }) => <div key={getDateKey(date)} className="calendar-viewer-week-column">{weekDayEvents.length > 0 ? weekDayEvents.map((event) => <EventCard key={event.id} event={event} color={getCalendarColor(calendarSources, event.calendarId)} onRemove={() => handleRemoveEvent(event.id)} />) : <div className="calendar-viewer-empty-slot">No events</div>}</div>)}
            </div>
          </section>
        ) : (
          <section className="calendar-viewer-day-surface">
            <div className="calendar-viewer-day-hero"><div><span className="calendar-viewer-day-hero-label">Focused day</span><h3>{selectedDateLabel}</h3></div><button type="button" className="calendar-viewer-toolbar-btn" onClick={handleOpenComposer}><Plus size={18} /><span>Add event</span></button></div>
            <div className="calendar-viewer-day-timeline">
              {TIMELINE_HOURS.map((hour) => {
                const hourEvents = dayEvents.filter((event) => event.startHour === hour)
                return <div key={hour} className="calendar-viewer-time-row"><div className="calendar-viewer-time-label">{formatHourOption(hour)}</div><div className="calendar-viewer-time-content">{hourEvents.length > 0 ? hourEvents.map((event) => <EventCard key={event.id} event={event} color={getCalendarColor(calendarSources, event.calendarId)} onRemove={() => handleRemoveEvent(event.id)} />) : <div className="calendar-viewer-empty-slot">Free</div>}</div></div>
              })}
            </div>
          </section>
        )}

        <footer className="calendar-viewer-footer"><span className="calendar-viewer-footer-label">Selected</span><strong>{selectedDateLabel}</strong><small>{dayEvents.length} event{dayEvents.length === 1 ? '' : 's'}</small></footer>
      </main>
    </div>
  )
}

function EventCard({ event, color, onRemove }) {
  return (
    <article className="calendar-viewer-agenda-event">
      <span className="calendar-viewer-agenda-event-marker" style={{ backgroundColor: color }} />
      <div className="calendar-viewer-agenda-event-copy"><strong>{event.title}</strong><small>{formatEventRange(event)}</small></div>
      <button type="button" className="calendar-viewer-remove-btn" onClick={onRemove}>Remove</button>
    </article>
  )
}

function createDraftEvent(date, calendarId) { return { title: '', startHour: '9', durationHours: '1', calendarId, dateKey: getDateKey(date) } }
function createSimulationEvents(now) { const base = startOfDay(now); return sortEvents([createEvent(base, 0, 9, 1, 'Stand-up', 'work'), createEvent(base, 0, 13, 2, 'Design review', 'work'), createEvent(base, 1, 11, 1, 'Lunch with Mia', 'personal'), createEvent(base, 2, 15, 1, 'Sprint check-in', 'work'), createEvent(base, 4, 18, 2, 'Birthday dinner', 'birthdays'), createEvent(base, 7, 10, 1, 'Project sync', 'work'), createEvent(base, -2, 16, 1, 'Gym', 'personal')]) }
function createEvent(baseDate, dayOffset, startHour, durationHours, title, calendarId) { const date = addDays(baseDate, dayOffset); return { id: `${calendarId}-${title.toLowerCase().replace(/\s+/g, '-')}-${dayOffset}-${startHour}`, title, dateKey: getDateKey(date), startHour, durationHours, calendarId } }
function buildCalendarCells(date, selectedDate, events) { const year = date.getFullYear(); const month = date.getMonth(); const today = startOfDay(new Date()); const firstOfMonth = new Date(year, month, 1); const offset = getMondayFirstDayIndex(firstOfMonth); const gridStart = new Date(year, month, 1 - offset); return Array.from({ length: 42 }, (_, index) => { const cellDate = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index); return { key: `${cellDate.getFullYear()}-${cellDate.getMonth()}-${cellDate.getDate()}`, date: cellDate, inCurrentMonth: cellDate.getMonth() === month, isToday: isSameDay(cellDate, today), isSelected: cellDate.getMonth() === month && isSameDay(cellDate, selectedDate), events: getEventsForDate(events, cellDate) } }) }
function chunk(items, size) { return Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, index * size + size)) }
function getVisibleEvents(events, sources) { const enabled = new Set(sources.filter((source) => source.enabled).map((source) => source.id)); return events.filter((event) => enabled.has(event.calendarId)) }
function getEventsForDate(events, date) { return sortEvents(events.filter((event) => event.dateKey === getDateKey(date))) }
function sortEvents(events) { return [...events].sort((left, right) => left.dateKey === right.dateKey ? left.startHour - right.startHour : left.dateKey.localeCompare(right.dateKey)) }
function getWeekDays(date) { const start = startOfWeek(date); return Array.from({ length: 7 }, (_, index) => addDays(start, index)) }
function startOfWeek(date) { return addDays(startOfDay(date), -getMondayFirstDayIndex(date)) }
function addDays(date, amount) { return startOfDay(new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount)) }
function startOfDay(date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()) }
function getHeaderLabel(currentDate, selectedDate, activeView, showYearPicker, yearRange) {
  if (showYearPicker) return `${yearRange[0]} - ${yearRange[yearRange.length - 1]}`
  if (activeView === 'day') return selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  if (activeView === 'week') { const week = getWeekDays(selectedDate); const start = week[0]; const end = week[week.length - 1]; return `${MONTH_NAMES[start.getMonth()]} ${start.getDate()} - ${MONTH_NAMES[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}` }
  return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
}
function getCalendarColor(sources, calendarId) { return sources.find((source) => source.id === calendarId)?.color || '#67ace4' }
function formatHourOption(hour) { const period = hour >= 12 ? 'PM' : 'AM'; const hour12 = hour % 12 || 12; return `${hour12}:00 ${period}` }
function formatEventRange(event) { return `${formatHourOption(event.startHour)} - ${formatHourOption(event.startHour + event.durationHours)}` }
function getDateKey(date) { const year = date.getFullYear(); const month = `${date.getMonth() + 1}`.padStart(2, '0'); const day = `${date.getDate()}`.padStart(2, '0'); return `${year}-${month}-${day}` }
function getMondayFirstDayIndex(date) { return (date.getDay() + 6) % 7 }
function isSameDay(left, right) { return left.getDate() === right.getDate() && left.getMonth() === right.getMonth() && left.getFullYear() === right.getFullYear() }
