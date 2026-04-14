import { useEffect, useRef, useState } from 'react'
import {
  AlarmClock,
  Bell,
  Check,
  ChevronDown,
  ChevronUp,
  Ellipsis,
  Flag,
  Globe2,
  Hourglass,
  MapPin,
  Maximize2,
  Minimize2,
  Minus,
  Moon,
  PanelsTopLeft,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Settings,
  SunMedium,
  Target,
  TimerReset,
  Trash2,
  X
} from 'lucide-react'

const CLOCK_ICON_SRC = '/desktop-icons/clock.png'
const WORLD_MAP_IMAGE_SRC = '/clock/world-map.svg?v=20260414c'
const FOCUS_STORAGE_KEY = 'jez_os_clock_focus_state_v2'
const TIMER_STORAGE_KEY = 'jez_os_clock_timers_v2'
const ALARM_STORAGE_KEY = 'jez_os_clock_alarms_v2'
const WORLD_STORAGE_KEY = 'jez_os_clock_world_v2'
const FOCUS_DAILY_GOAL_MINUTES = 60
const DAY_LABELS = ['Su', 'M', 'Tu', 'We', 'Th', 'Fri', 'Sa']

const DEFAULT_TIMERS = [
  createTimerPreset(1),
  createTimerPreset(3),
  createTimerPreset(5),
  createTimerPreset(10)
]

const DEFAULT_ALARMS = [
  {
    id: 'alarm-1',
    hour: 7,
    minute: 0,
    enabled: false,
    label: 'Good morning',
    days: [0, 1, 2, 3, 4, 5, 6]
  }
]

const WORLD_CITY_OPTIONS = [
  { id: 'tokyo', name: 'Tokyo', timeZone: 'Asia/Tokyo', x: 0.83, y: 0.33 },
  { id: 'sydney', name: 'Sydney', timeZone: 'Australia/Sydney', x: 0.86, y: 0.71 },
  { id: 'london', name: 'London', timeZone: 'Europe/London', x: 0.49, y: 0.29 },
  { id: 'dubai', name: 'Dubai', timeZone: 'Asia/Dubai', x: 0.63, y: 0.39 },
  { id: 'new-york', name: 'New York', timeZone: 'America/New_York', x: 0.23, y: 0.34 },
  { id: 'los-angeles', name: 'Los Angeles', timeZone: 'America/Los_Angeles', x: 0.14, y: 0.38 }
]

const LOCAL_TIMEZONE_POSITIONS = {
  'Asia/Manila': { name: 'Manila', x: 0.81, y: 0.43 },
  'Asia/Tokyo': { name: 'Tokyo', x: 0.83, y: 0.33 },
  'Europe/London': { name: 'London', x: 0.49, y: 0.29 },
  'America/New_York': { name: 'New York', x: 0.23, y: 0.34 },
  'America/Los_Angeles': { name: 'Los Angeles', x: 0.14, y: 0.38 },
  'Australia/Sydney': { name: 'Sydney', x: 0.86, y: 0.71 }
}

const APP_SECTIONS = [
  { id: 'focus', label: 'Focus sessions', icon: Target },
  { id: 'timer', label: 'Timer', icon: Hourglass },
  { id: 'alarm', label: 'Alarm', icon: AlarmClock },
  { id: 'stopwatch', label: 'Stopwatch', icon: TimerReset },
  { id: 'world', label: 'World clock', icon: Globe2 }
]

export default function ClockApp({ onWindowTitleChange, windowControls }) {
  const [activeSection, setActiveSection] = useState('focus')
  const [currentTime, setCurrentTime] = useState(new Date())

  const [focusState, setFocusState] = useState(() => loadFocusState())
  const [timers, setTimers] = useState(() => loadTimerState())
  const [timerEditMode, setTimerEditMode] = useState(false)
  const [alarms, setAlarms] = useState(() => loadAlarmState())
  const [alarmEditMode, setAlarmEditMode] = useState(false)
  const [worldClocks, setWorldClocks] = useState(() => loadWorldClockState())
  const [worldEditMode, setWorldEditMode] = useState(false)
  const [activeAlarmId, setActiveAlarmId] = useState(null)

  const [stopwatchElapsed, setStopwatchElapsed] = useState(0)
  const [stopwatchRunning, setStopwatchRunning] = useState(false)
  const [stopwatchOrigin, setStopwatchOrigin] = useState(null)
  const [stopwatchOffset, setStopwatchOffset] = useState(0)
  const [stopwatchLaps, setStopwatchLaps] = useState([])

  const lastAlarmTriggerRef = useRef({})
  const currentTimeZone = getCurrentTimeZone()
  const currentUser = getCurrentUser()
  const localMarker = getLocalMarker(currentTimeZone)
  const hasAvailableWorldClock = WORLD_CITY_OPTIONS.some(
    (city) => city.timeZone !== currentTimeZone && !worldClocks.includes(city.id)
  )
  const worldMarkers = [
    { id: 'local', name: localMarker.name, x: localMarker.x, y: localMarker.y, local: true },
    ...worldClocks
      .map((id) => WORLD_CITY_OPTIONS.find((city) => city.id === id))
      .filter(Boolean)
  ]

  useEffect(() => {
    onWindowTitleChange?.('Clock')
  }, [onWindowTitleChange])

  useEffect(() => {
    const tick = window.setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => window.clearInterval(tick)
  }, [])

  useEffect(() => {
    if (!stopwatchRunning || stopwatchOrigin == null) return undefined

    const intervalId = window.setInterval(() => {
      setStopwatchElapsed(stopwatchOffset + (Date.now() - stopwatchOrigin))
    }, 10)

    return () => window.clearInterval(intervalId)
  }, [stopwatchOffset, stopwatchOrigin, stopwatchRunning])

  useEffect(() => {
    persistState(FOCUS_STORAGE_KEY, focusState)
  }, [focusState])

  useEffect(() => {
    persistState(TIMER_STORAGE_KEY, timers)
  }, [timers])

  useEffect(() => {
    persistState(ALARM_STORAGE_KEY, alarms)
  }, [alarms])

  useEffect(() => {
    persistState(WORLD_STORAGE_KEY, worldClocks)
  }, [worldClocks])

  useEffect(() => {
    if (!focusState.running) return

    setFocusState((previous) => {
      if (!previous.running) return previous
      if (previous.remainingSeconds <= 1) {
        const completedTaskId = previous.selectedTaskId

        playAlarm()
        return {
          ...previous,
          running: false,
          remainingSeconds: 0,
          tasks: previous.tasks.map((task) =>
            task.id === completedTaskId
              ? {
                  ...task,
                  focusMinutes: task.focusMinutes + previous.durationMinutes,
                  sessionCount: task.sessionCount + 1
                }
              : task
          ),
          history: [
            ...previous.history,
            {
              completedAt: new Date().toISOString(),
              durationMinutes: previous.durationMinutes
            }
          ].slice(-90)
        }
      }

      return {
        ...previous,
        remainingSeconds: previous.remainingSeconds - 1
      }
    })
  }, [currentTime, focusState.running])

  useEffect(() => {
    setTimers((previous) => {
      let changed = false
      let completed = 0

      const nextTimers = previous.map((timer) => {
        if (!timer.running) return timer
        changed = true

        if (timer.remainingSeconds <= 1) {
          completed += 1
          return {
            ...timer,
            running: false,
            remainingSeconds: 0
          }
        }

        return {
          ...timer,
          remainingSeconds: timer.remainingSeconds - 1
        }
      })

      if (!changed) return previous
      if (completed > 0) playAlarm()
      return nextTimers
    })
  }, [currentTime])

  useEffect(() => {
    alarms.forEach((alarm) => {
      const triggerStamp = getAlarmTriggerStamp(alarm, currentTime)
      if (!triggerStamp) return
      if (lastAlarmTriggerRef.current[alarm.id] === triggerStamp) return

      lastAlarmTriggerRef.current[alarm.id] = triggerStamp
      setActiveAlarmId(alarm.id)
      playAlarm()
    })
  }, [alarms, currentTime])

  useEffect(() => {
    if (!activeAlarmId) return undefined
    const timeoutId = window.setTimeout(() => setActiveAlarmId(null), 4000)
    return () => window.clearTimeout(timeoutId)
  }, [activeAlarmId])

  const focusStats = getFocusStats(focusState.history, currentTime)
  const focusProgress = Math.min(1, focusStats.todayMinutes / focusState.dailyGoalMinutes)
  const focusBreakCount = focusState.skipBreaks ? 0 : getFocusBreakCount(focusState.durationMinutes)
  const focusButtonLabel = focusState.running
    ? 'Pause focus session'
    : focusState.remainingSeconds > 0
      ? 'Resume focus session'
      : 'Start focus session'
  const FocusButtonIcon = focusState.running ? Pause : Play
  const stopwatchParts = formatStopwatchParts(stopwatchElapsed)
  const localClockDisplay = formatClockForZone(currentTime, currentTimeZone)

  const handleFocusPrimaryAction = () => {
    setFocusState((previous) => {
      if (previous.running) {
        return {
          ...previous,
          running: false
        }
      }

      const remainingSeconds = previous.remainingSeconds > 0
        ? previous.remainingSeconds
        : previous.durationMinutes * 60

      return {
        ...previous,
        running: true,
        remainingSeconds
      }
    })
  }

  const handleFocusReset = () => {
    setFocusState((previous) => ({
      ...previous,
      running: false,
      remainingSeconds: 0
    }))
  }

  const adjustFocusDuration = (step) => {
    setFocusState((previous) => {
      if (previous.running) return previous

      const durationMinutes = clamp(previous.durationMinutes + step, 5, 180)
      return {
        ...previous,
        durationMinutes,
        remainingSeconds: 0
      }
    })
  }

  const handleSetFocusDailyGoal = (minutes) => {
    setFocusState((previous) => ({
      ...previous,
      dailyGoalMinutes: clamp(Number(minutes) || previous.dailyGoalMinutes, 15, 480)
    }))
  }

  const handleAddFocusTask = (title) => {
    const nextTitle = sanitizeFocusTaskTitle(title)
    if (!nextTitle) return

    setFocusState((previous) => {
      const nextTask = createFocusTask(nextTitle)
      return {
        ...previous,
        tasks: [nextTask, ...previous.tasks],
        selectedTaskId: previous.selectedTaskId || nextTask.id
      }
    })
  }

  const handleUpdateFocusTask = (taskId, title) => {
    const nextTitle = sanitizeFocusTaskTitle(title)
    if (!nextTitle) return

    setFocusState((previous) => ({
      ...previous,
      tasks: previous.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              title: nextTitle
            }
          : task
      )
    }))
  }

  const handleToggleFocusTask = (taskId) => {
    setFocusState((previous) => ({
      ...previous,
      selectedTaskId: previous.selectedTaskId === taskId ? null : previous.selectedTaskId,
      tasks: previous.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              completed: !task.completed
            }
          : task
      )
    }))
  }

  const handleDeleteFocusTask = (taskId) => {
    setFocusState((previous) => ({
      ...previous,
      selectedTaskId: previous.selectedTaskId === taskId ? null : previous.selectedTaskId,
      tasks: previous.tasks.filter((task) => task.id !== taskId)
    }))
  }

  const handleSelectFocusTask = (taskId) => {
    setFocusState((previous) => {
      const task = previous.tasks.find((entry) => entry.id === taskId)
      if (!task || task.completed) return previous

      return {
        ...previous,
        selectedTaskId: previous.selectedTaskId === taskId ? null : taskId
      }
    })
  }

  const handleClearCompletedFocusTasks = () => {
    setFocusState((previous) => ({
      ...previous,
      selectedTaskId: previous.tasks.some(
        (task) => task.id === previous.selectedTaskId && !task.completed
      )
        ? previous.selectedTaskId
        : null,
      tasks: previous.tasks.filter((task) => !task.completed)
    }))
  }

  const handleToggleTimer = (timerId) => {
    setTimers((previous) =>
      previous.map((timer) => {
        if (timer.id !== timerId) return timer

        const nextRemainingSeconds = timer.remainingSeconds > 0 ? timer.remainingSeconds : timer.totalSeconds
        return {
          ...timer,
          remainingSeconds: nextRemainingSeconds,
          running: !timer.running
        }
      })
    )
  }

  const handleResetTimer = (timerId) => {
    setTimers((previous) =>
      previous.map((timer) =>
        timer.id === timerId
          ? {
              ...timer,
              running: false,
              remainingSeconds: timer.totalSeconds
            }
          : timer
      )
    )
  }

  const handleToggleTimerExpanded = (timerId) => {
    setTimers((previous) =>
      previous.map((timer) => ({
        ...timer,
        expanded: timer.id === timerId ? !timer.expanded : false
      }))
    )
  }

  const handlePromoteTimer = (timerId) => {
    setTimers((previous) => {
      const selectedTimer = previous.find((timer) => timer.id === timerId)
      if (!selectedTimer) return previous
      return [selectedTimer, ...previous.filter((timer) => timer.id !== timerId)]
    })
  }

  const handleAddTimer = () => {
    setTimers((previous) => {
      const durations = previous.map((timer) => Math.round(timer.totalSeconds / 60))
      const nextMinutes = clamp((Math.max(...durations, 10) || 10) + 5, 1, 90)
      return [...previous, createTimerPreset(nextMinutes, `timer-${Date.now()}`)]
    })
  }

  const handleRemoveTimer = (timerId) => {
    setTimers((previous) => {
      if (previous.length === 1) return previous
      return previous.filter((timer) => timer.id !== timerId)
    })
  }

  const handleToggleAlarm = (alarmId) => {
    setAlarms((previous) =>
      previous.map((alarm) =>
        alarm.id === alarmId
          ? {
              ...alarm,
              enabled: !alarm.enabled
            }
          : alarm
      )
    )
  }

  const handleToggleAlarmDay = (alarmId, dayIndex) => {
    setAlarms((previous) =>
      previous.map((alarm) => {
        if (alarm.id !== alarmId) return alarm

        const hasDay = alarm.days.includes(dayIndex)
        const days = hasDay
          ? alarm.days.filter((day) => day !== dayIndex)
          : [...alarm.days, dayIndex].sort((left, right) => left - right)

        return {
          ...alarm,
          days
        }
      })
    )
  }

  const handleAddAlarm = () => {
    const nextDate = new Date(currentTime.getTime() + (60 * 60 * 1000))
    const label = nextDate.getHours() < 12 ? 'Good morning' : nextDate.getHours() < 18 ? 'Good afternoon' : 'Good evening'

    setAlarms((previous) => [
      ...previous,
      {
        id: `alarm-${Date.now()}`,
        hour: nextDate.getHours(),
        minute: 0,
        enabled: false,
        label,
        days: [0, 1, 2, 3, 4, 5, 6]
      }
    ])
  }

  const handleRemoveAlarm = (alarmId) => {
    setAlarms((previous) => {
      if (previous.length === 1) return previous
      return previous.filter((alarm) => alarm.id !== alarmId)
    })
  }

  const handleStartStopwatch = () => {
    setStopwatchOrigin(Date.now())
    setStopwatchRunning(true)
  }

  const handlePauseStopwatch = () => {
    setStopwatchOffset(stopwatchElapsed)
    setStopwatchRunning(false)
  }

  const handleResetStopwatch = () => {
    setStopwatchRunning(false)
    setStopwatchOrigin(null)
    setStopwatchOffset(0)
    setStopwatchElapsed(0)
    setStopwatchLaps([])
  }

  const handleLapStopwatch = () => {
    if (stopwatchElapsed <= 0) return
    setStopwatchLaps((previous) => [
      { id: `lap-${Date.now()}`, value: stopwatchElapsed },
      ...previous
    ].slice(0, 8))
  }

  const handleAddWorldClock = () => {
    setWorldClocks((previous) => {
      const nextOption = WORLD_CITY_OPTIONS.find(
        (city) => city.timeZone !== currentTimeZone && !previous.includes(city.id)
      )
      if (!nextOption) return previous
      return [nextOption.id, ...previous]
    })
  }

  const handleRemoveWorldClock = (clockId) => {
    setWorldClocks((previous) => previous.filter((id) => id !== clockId))
  }

  return (
    <div className="clock-app">
      <div className="clock-shell">
        <header className="clock-chrome" data-window-drag-handle="true">
          <div className="clock-chrome-brand">
            <img className="clock-chrome-icon" src={CLOCK_ICON_SRC} alt="" />
            <span>Clock</span>
          </div>
          {windowControls ? (
            <div className="clock-window-controls" data-no-window-drag="true">
              <button
                type="button"
                className="clock-window-control"
                onClick={windowControls.onMinimize}
                aria-label="Minimize"
              >
                <Minus size={14} />
              </button>
              {windowControls.canMaximize ? (
                <button
                  type="button"
                  className="clock-window-control"
                  onClick={windowControls.onMaximize}
                  aria-label={windowControls.isMaximized ? 'Restore' : 'Maximize'}
                >
                  {windowControls.isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
              ) : null}
              <button
                type="button"
                className="clock-window-control close"
                onClick={windowControls.onClose}
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>
          ) : null}
        </header>

        <div className="clock-workspace">
          <aside className="clock-sidebar">
            <nav className="clock-nav" aria-label="Clock sections">
              {APP_SECTIONS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={`clock-nav-item ${activeSection === id ? 'active' : ''}`}
                  onClick={() => setActiveSection(id)}
                >
                  <Icon size={20} strokeWidth={1.8} />
                  <span>{label}</span>
                </button>
              ))}
            </nav>

            <div className="clock-sidebar-footer">
              <div className="clock-user-chip">
                <div className="clock-user-avatar">{currentUser.initials}</div>
                <div className="clock-user-copy">
                  <div className="clock-user-name">{currentUser.label}</div>
                  <div className="clock-user-subtitle">Clock profile</div>
                </div>
              </div>

              <button type="button" className="clock-settings-link">
                <Settings size={18} />
                <span>Settings</span>
              </button>
            </div>
          </aside>

          <main className={`clock-main clock-main-${activeSection}`}>
            {activeSection === 'focus' ? (
              <FocusPage
                focusState={focusState}
                focusStats={focusStats}
                focusProgress={focusProgress}
                focusBreakCount={focusBreakCount}
                focusButtonLabel={focusButtonLabel}
                FocusButtonIcon={FocusButtonIcon}
                setActiveSection={setActiveSection}
                setFocusState={setFocusState}
                adjustFocusDuration={adjustFocusDuration}
                handleFocusPrimaryAction={handleFocusPrimaryAction}
                handleFocusReset={handleFocusReset}
                handleSetFocusDailyGoal={handleSetFocusDailyGoal}
                handleAddFocusTask={handleAddFocusTask}
                handleUpdateFocusTask={handleUpdateFocusTask}
                handleToggleFocusTask={handleToggleFocusTask}
                handleDeleteFocusTask={handleDeleteFocusTask}
                handleSelectFocusTask={handleSelectFocusTask}
                handleClearCompletedFocusTasks={handleClearCompletedFocusTasks}
              />
            ) : null}

            {activeSection === 'timer' ? renderTimerPage({
              timers,
              timerEditMode,
              setTimerEditMode,
              handleToggleTimer,
              handleResetTimer,
              handleToggleTimerExpanded,
              handlePromoteTimer,
              handleAddTimer,
              handleRemoveTimer
            }) : null}

            {activeSection === 'alarm' ? renderAlarmPage({
              alarms,
              currentTime,
              activeAlarmId,
              alarmEditMode,
              setAlarmEditMode,
              handleToggleAlarm,
              handleToggleAlarmDay,
              handleAddAlarm,
              handleRemoveAlarm
            }) : null}

            {activeSection === 'stopwatch' ? renderStopwatchPage({
              stopwatchElapsed,
              stopwatchRunning,
              stopwatchParts,
              stopwatchLaps,
              handleStartStopwatch,
              handlePauseStopwatch,
              handleResetStopwatch,
              handleLapStopwatch
            }) : null}

            {activeSection === 'world' ? renderWorldPage({
              worldMarkers,
              worldClocks,
              worldEditMode,
              setWorldEditMode,
              currentTime,
              localClockDisplay,
              hasAvailableWorldClock,
              handleAddWorldClock,
              handleRemoveWorldClock
            }) : null}
          </main>
        </div>
      </div>
    </div>
  )
}

function FocusPage({
  focusState,
  focusStats,
  focusProgress,
  focusBreakCount,
  focusButtonLabel,
  FocusButtonIcon,
  setActiveSection,
  setFocusState,
  adjustFocusDuration,
  handleFocusPrimaryAction,
  handleFocusReset,
  handleSetFocusDailyGoal,
  handleAddFocusTask,
  handleUpdateFocusTask,
  handleToggleFocusTask,
  handleDeleteFocusTask,
  handleSelectFocusTask,
  handleClearCompletedFocusTasks
}) {
  const [goalEditorOpen, setGoalEditorOpen] = useState(false)
  const [goalDraft, setGoalDraft] = useState(`${focusState.dailyGoalMinutes}`)
  const [taskComposerOpen, setTaskComposerOpen] = useState(focusState.tasks.length === 0)
  const [taskDraft, setTaskDraft] = useState('')
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [editingTaskDraft, setEditingTaskDraft] = useState('')

  const selectedTask = focusState.tasks.find(
    (task) => task.id === focusState.selectedTaskId && !task.completed
  ) || null
  const orderedTasks = [
    ...focusState.tasks.filter((task) => !task.completed),
    ...focusState.tasks.filter((task) => task.completed)
  ]
  const completedTaskCount = focusState.tasks.filter((task) => task.completed).length
  const goalDisplay = getFocusGoalDisplay(focusState.dailyGoalMinutes)
  const taskProgressLabel = getFocusTaskProgressLabel(selectedTask)

  const openGoalEditor = () => {
    setGoalDraft(`${focusState.dailyGoalMinutes}`)
    setGoalEditorOpen(true)
  }

  const closeGoalEditor = () => {
    setGoalDraft(`${focusState.dailyGoalMinutes}`)
    setGoalEditorOpen(false)
  }

  const handleSubmitGoal = (event) => {
    event.preventDefault()
    const nextGoalMinutes = clamp(Number(goalDraft) || focusState.dailyGoalMinutes, 15, 480)
    handleSetFocusDailyGoal(nextGoalMinutes)
    setGoalDraft(`${nextGoalMinutes}`)
    setGoalEditorOpen(false)
  }

  const openTaskComposer = () => {
    setTaskComposerOpen(true)
    setTaskDraft('')
  }

  const closeTaskComposer = () => {
    setTaskComposerOpen(false)
    setTaskDraft('')
  }

  const handleSubmitTask = (event) => {
    event.preventDefault()
    const nextTitle = sanitizeFocusTaskTitle(taskDraft)
    if (!nextTitle) return
    handleAddFocusTask(nextTitle)
    setTaskDraft('')
    setTaskComposerOpen(false)
  }

  const openTaskEditor = (task) => {
    setEditingTaskId(task.id)
    setEditingTaskDraft(task.title)
  }

  const closeTaskEditor = () => {
    setEditingTaskId(null)
    setEditingTaskDraft('')
  }

  const handleSubmitTaskEdit = (event, taskId) => {
    event.preventDefault()
    const nextTitle = sanitizeFocusTaskTitle(editingTaskDraft)
    if (!nextTitle) return
    handleUpdateFocusTask(taskId, nextTitle)
    closeTaskEditor()
  }

  return (
    <div className="clock-page">
      <div className="clock-focus-grid">
        <section className="clock-card focus-session-card">
          <div className="clock-card-toolbar">
            <div />
            <div className="clock-card-actions">
              <button type="button" className="clock-icon-btn" onClick={() => setActiveSection('timer')} aria-label="Open timer">
                <PanelsTopLeft size={18} />
              </button>
              <button type="button" className="clock-icon-btn" aria-label="More options">
                <Ellipsis size={18} />
              </button>
            </div>
          </div>

          <div className="focus-session-copy">
            <h2>Get ready to focus</h2>
            <p>
              We&apos;ll turn off notifications and app alerts during each session. For
              longer sessions, we&apos;ll add a short break so you can recharge.
            </p>
          </div>

          <div className={`focus-stepper ${focusState.running ? 'running' : ''}`}>
            <div className="focus-stepper-value-wrap">
              <div className="focus-stepper-value">
                {focusState.running || focusState.remainingSeconds > 0
                  ? formatClockDuration(focusState.remainingSeconds)
                  : `${focusState.durationMinutes}`}
              </div>
              <div className="focus-stepper-label">
                {focusState.running || focusState.remainingSeconds > 0 ? 'remaining' : 'mins'}
              </div>
            </div>
            <div className="focus-stepper-controls">
              <button
                type="button"
                className="focus-stepper-button"
                onClick={() => adjustFocusDuration(5)}
                disabled={focusState.running}
                aria-label="Increase focus duration"
              >
                <ChevronUp size={22} />
              </button>
              <button
                type="button"
                className="focus-stepper-button"
                onClick={() => adjustFocusDuration(-5)}
                disabled={focusState.running}
                aria-label="Decrease focus duration"
              >
                <ChevronDown size={22} />
              </button>
            </div>
          </div>

          <div className="focus-break-copy">
            {focusState.running || focusState.remainingSeconds > 0
              ? `You have ${formatDurationLong(focusState.remainingSeconds)} left.`
              : `You'll have ${focusBreakCount} break${focusBreakCount === 1 ? '' : 's'}.`}
          </div>

          <div className={`focus-active-task ${selectedTask ? '' : 'empty'}`}>
            <span className="focus-active-task-label">Task for this session</span>
            <strong>{selectedTask ? selectedTask.title : 'No task selected'}</strong>
            <small>{taskProgressLabel}</small>
          </div>

          <label className="clock-checkbox-row">
            <input
              type="checkbox"
              checked={focusState.skipBreaks}
              onChange={(event) =>
                setFocusState((previous) => ({
                  ...previous,
                  skipBreaks: event.target.checked
                }))
              }
            />
            <span className="clock-checkbox-box">
              {focusState.skipBreaks ? <Check size={14} /> : null}
            </span>
            <span>Skip breaks</span>
          </label>

          <div className="focus-session-actions">
            <button type="button" className="clock-primary-btn" onClick={handleFocusPrimaryAction}>
              <FocusButtonIcon size={20} fill={focusState.running ? 'none' : 'currentColor'} />
              <span>{focusButtonLabel}</span>
            </button>
            {focusState.remainingSeconds > 0 ? (
              <button type="button" className="clock-secondary-btn" onClick={handleFocusReset}>
                <RotateCcw size={18} />
                <span>Reset</span>
              </button>
            ) : null}
          </div>
        </section>

        <section className="clock-card focus-progress-card">
          <div className="clock-card-toolbar">
            <h3>Daily progress</h3>
            <button
              type="button"
              className={`clock-icon-btn ${goalEditorOpen ? 'active' : ''}`}
              onClick={goalEditorOpen ? closeGoalEditor : openGoalEditor}
              aria-label={goalEditorOpen ? 'Close daily goal editor' : 'Edit daily goal'}
            >
              <Pencil size={18} />
            </button>
          </div>

          {goalEditorOpen ? (
            <form className="focus-goal-editor" onSubmit={handleSubmitGoal}>
              <label className="focus-field">
                <span>Daily goal</span>
                <input
                  type="number"
                  min="15"
                  max="480"
                  step="15"
                  value={goalDraft}
                  onChange={(event) => setGoalDraft(event.target.value)}
                />
                <small>minutes</small>
              </label>
              <div className="focus-inline-actions">
                <button type="submit" className="clock-subtle-btn">
                  Save goal
                </button>
                <button type="button" className="clock-secondary-btn" onClick={closeGoalEditor}>
                  Cancel
                </button>
              </div>
            </form>
          ) : null}

          <div className="focus-progress-body">
            <div className="focus-progress-stat">
              <span className="focus-progress-label">Yesterday</span>
              <strong>{focusStats.yesterdayMinutes}</strong>
              <span className="focus-progress-meta">minutes</span>
            </div>

            <ProgressRing size={264} strokeWidth={18} progress={focusProgress} className="focus-goal-ring">
              <div className="focus-goal-copy">
                <span>Daily goal</span>
                <strong>{goalDisplay.value}</strong>
                <small>{goalDisplay.unit}</small>
              </div>
            </ProgressRing>

            <div className="focus-progress-stat">
              <span className="focus-progress-label">Streak</span>
              <strong>{focusStats.streakDays}</strong>
              <span className="focus-progress-meta">days</span>
            </div>
          </div>

          <div className="focus-progress-foot">
            Completed: {focusStats.todayMinutes} of {focusState.dailyGoalMinutes} minutes
          </div>
        </section>

        <section className="clock-card focus-tasks-card">
          <div className="clock-card-toolbar">
            <div className="clock-card-title-with-icon">
              <Check size={18} />
              <h3>Tasks</h3>
            </div>
            <div className="clock-card-actions">
              <button
                type="button"
                className={`clock-icon-btn ${taskComposerOpen ? 'active' : ''}`}
                onClick={taskComposerOpen ? closeTaskComposer : openTaskComposer}
                aria-label={taskComposerOpen ? 'Close new task form' : 'Add task'}
              >
                <Plus size={18} />
              </button>
              <button
                type="button"
                className="clock-icon-btn"
                onClick={handleClearCompletedFocusTasks}
                disabled={completedTaskCount === 0}
                aria-label="Clear completed tasks"
              >
                <Ellipsis size={18} />
              </button>
            </div>
          </div>

          {taskComposerOpen ? (
            <form className="focus-task-composer" onSubmit={handleSubmitTask}>
              <label className="focus-field">
                <span>New task</span>
                <input
                  type="text"
                  maxLength={120}
                  placeholder="Add a task for your next focus session"
                  value={taskDraft}
                  onChange={(event) => setTaskDraft(event.target.value)}
                />
              </label>
              <div className="focus-inline-actions">
                <button type="submit" className="clock-subtle-btn">
                  Add task
                </button>
                <button type="button" className="clock-secondary-btn" onClick={closeTaskComposer}>
                  Cancel
                </button>
              </div>
            </form>
          ) : null}

          {orderedTasks.length > 0 ? (
            <>
              <div className="focus-task-list" role="list">
                {orderedTasks.map((task) => {
                  const isEditing = editingTaskId === task.id
                  const isSelected = task.id === focusState.selectedTaskId && !task.completed

                  return (
                    <div
                      key={task.id}
                      className={`focus-task-item ${task.completed ? 'completed' : ''} ${isSelected ? 'selected' : ''}`}
                      role="listitem"
                    >
                      <button
                        type="button"
                        className={`focus-task-check ${task.completed ? 'checked' : ''}`}
                        onClick={() => {
                          if (isEditing) closeTaskEditor()
                          handleToggleFocusTask(task.id)
                        }}
                        aria-label={task.completed ? 'Mark task as not completed' : 'Mark task as completed'}
                      >
                        {task.completed ? <Check size={14} /> : null}
                      </button>

                      <div className="focus-task-main">
                        {isEditing ? (
                          <form className="focus-task-edit-form" onSubmit={(event) => handleSubmitTaskEdit(event, task.id)}>
                            <input
                              type="text"
                              maxLength={120}
                              value={editingTaskDraft}
                              onChange={(event) => setEditingTaskDraft(event.target.value)}
                            />
                            <div className="focus-inline-actions">
                              <button type="submit" className="clock-subtle-btn">
                                Save
                              </button>
                              <button type="button" className="clock-secondary-btn" onClick={closeTaskEditor}>
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <div className="focus-task-title-row">
                              <span className="focus-task-title">{task.title}</span>
                              {isSelected ? <span className="focus-task-badge">This session</span> : null}
                            </div>
                            <span className="focus-task-meta">{getFocusTaskProgressLabel(task)}</span>
                          </>
                        )}
                      </div>

                      {!isEditing ? (
                        <div className="focus-task-actions">
                          {!task.completed ? (
                            <button
                              type="button"
                              className={`focus-task-select-btn ${isSelected ? 'active' : ''}`}
                              onClick={() => handleSelectFocusTask(task.id)}
                            >
                              {isSelected ? 'Selected' : 'Focus'}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="clock-icon-btn"
                            onClick={() => openTaskEditor(task)}
                            aria-label={`Edit ${task.title}`}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            className="clock-icon-btn"
                            onClick={() => {
                              if (isEditing) closeTaskEditor()
                              handleDeleteFocusTask(task.id)
                            }}
                            aria-label={`Delete ${task.title}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>

              <div className="focus-task-foot">
                <span>{completedTaskCount} completed</span>
                {!taskComposerOpen ? (
                  <button type="button" className="clock-subtle-btn" onClick={openTaskComposer}>
                    <Plus size={18} />
                    <span>Add a task</span>
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <div className="clock-empty-state">
              <h4>Stay on track</h4>
              <p>Add tasks, pick one for the session, and keep your focus time attached to real work.</p>
              <button type="button" className="clock-subtle-btn" onClick={openTaskComposer}>
                <Plus size={18} />
                <span>Add a task</span>
              </button>
            </div>
          )}
        </section>

        <section className="clock-card focus-spotify-card">
          <div className="clock-card-toolbar">
            <div className="focus-spotify-brand">Spotify</div>
            <button type="button" className="clock-icon-btn" aria-label="More Spotify options">
              <Ellipsis size={18} />
            </button>
          </div>

          <div className="clock-empty-state compact">
            <p>
              You need the Spotify app to enhance your focus sessions with music and podcasts.
            </p>
            <button type="button" className="clock-subtle-btn">
              <span>Install Spotify</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

function renderTimerPage({
  timers,
  timerEditMode,
  setTimerEditMode,
  handleToggleTimer,
  handleResetTimer,
  handleToggleTimerExpanded,
  handlePromoteTimer,
  handleAddTimer,
  handleRemoveTimer
}) {
  return (
    <div className="clock-page timer-page">
      <div className="clock-timer-grid">
        {timers.map((timer) => {
          const timerProgress = timer.totalSeconds <= 0
            ? 0
            : 1 - (timer.remainingSeconds / timer.totalSeconds)

          return (
            <section
              key={timer.id}
              className={`clock-card timer-card ${timer.expanded ? 'expanded' : ''}`}
            >
              <div className="clock-card-toolbar">
                <h3>{timer.label}</h3>
                <div className="clock-card-actions">
                  <button
                    type="button"
                    className="clock-icon-btn"
                    onClick={() => handleToggleTimerExpanded(timer.id)}
                    aria-label={timer.expanded ? 'Collapse timer card' : 'Expand timer card'}
                  >
                    {timer.expanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                  </button>
                  <button
                    type="button"
                    className="clock-icon-btn"
                    onClick={() => handlePromoteTimer(timer.id)}
                    aria-label="Move timer to first position"
                  >
                    <PanelsTopLeft size={18} />
                  </button>
                </div>
              </div>

              <ProgressRing
                size={timer.expanded ? 312 : 268}
                strokeWidth={16}
                progress={timerProgress}
                className="timer-progress-ring"
              >
                <div className="timer-display">{formatClockDuration(timer.remainingSeconds)}</div>
              </ProgressRing>

              <div className="timer-card-controls">
                <button
                  type="button"
                  className="clock-circle-btn primary"
                  onClick={() => handleToggleTimer(timer.id)}
                  aria-label={timer.running ? `Pause ${timer.label}` : `Start ${timer.label}`}
                >
                  {timer.running ? <Pause size={22} /> : <Play size={22} fill="currentColor" />}
                </button>
                <button
                  type="button"
                  className="clock-circle-btn"
                  onClick={() => handleResetTimer(timer.id)}
                  aria-label={`Reset ${timer.label}`}
                >
                  <RotateCcw size={22} />
                </button>
                {timerEditMode ? (
                  <button
                    type="button"
                    className="clock-circle-btn"
                    onClick={() => handleRemoveTimer(timer.id)}
                    aria-label={`Delete ${timer.label}`}
                  >
                    <X size={20} />
                  </button>
                ) : null}
              </div>
            </section>
          )
        })}
      </div>

      <div className="clock-floating-actions">
        <button type="button" className={`clock-floating-btn ${timerEditMode ? 'active' : ''}`} onClick={() => setTimerEditMode((previous) => !previous)} aria-label="Toggle timer edit mode">
          <Pencil size={22} />
        </button>
        <button type="button" className="clock-floating-btn" onClick={handleAddTimer} aria-label="Add timer">
          <Plus size={24} />
        </button>
      </div>
    </div>
  )
}

function renderAlarmPage({
  alarms,
  currentTime,
  activeAlarmId,
  alarmEditMode,
  setAlarmEditMode,
  handleToggleAlarm,
  handleToggleAlarmDay,
  handleAddAlarm,
  handleRemoveAlarm
}) {
  return (
    <div className="clock-page alarm-page">
      <div className="clock-alarm-grid">
        {alarms.map((alarm) => {
          const alarmDisplay = formatAlarmDisplay(alarm)
          const alarmSummary = getAlarmSummary(alarm, currentTime)

          return (
            <section
              key={alarm.id}
              className={`clock-card alarm-card ${alarm.enabled ? 'enabled' : 'disabled'} ${activeAlarmId === alarm.id ? 'ringing' : ''}`}
            >
              <div className="alarm-card-head">
                <div className="alarm-card-time">
                  <span>{alarmDisplay.time}</span>
                  <small>{alarmDisplay.period}</small>
                </div>
                <button
                  type="button"
                  className={`clock-switch ${alarm.enabled ? 'active' : ''}`}
                  onClick={() => handleToggleAlarm(alarm.id)}
                  aria-label={alarm.enabled ? 'Disable alarm' : 'Enable alarm'}
                  aria-pressed={alarm.enabled}
                >
                  <span />
                </button>
              </div>

              <div className="alarm-card-summary">
                <Bell size={15} />
                <span>{alarmSummary}</span>
              </div>

              <div className="alarm-card-greeting">{alarm.label || getGreeting(currentTime)}</div>

              <div className="alarm-day-row">
                {DAY_LABELS.map((label, index) => (
                  <button
                    key={`${alarm.id}-${label}`}
                    type="button"
                    className={`alarm-day-pill ${alarm.days.includes(index) ? 'active' : ''}`}
                    onClick={() => handleToggleAlarmDay(alarm.id, index)}
                    aria-pressed={alarm.days.includes(index)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {alarmEditMode ? (
                <button
                  type="button"
                  className="clock-delete-inline"
                  onClick={() => handleRemoveAlarm(alarm.id)}
                >
                  Remove alarm
                </button>
              ) : null}
            </section>
          )
        })}
      </div>

      <div className="clock-floating-actions">
        <button type="button" className={`clock-floating-btn ${alarmEditMode ? 'active' : ''}`} onClick={() => setAlarmEditMode((previous) => !previous)} aria-label="Toggle alarm edit mode">
          <Pencil size={22} />
        </button>
        <button type="button" className="clock-floating-btn" onClick={handleAddAlarm} aria-label="Add alarm">
          <Plus size={24} />
        </button>
      </div>
    </div>
  )
}

function renderStopwatchPage({
  stopwatchElapsed,
  stopwatchRunning,
  stopwatchParts,
  stopwatchLaps,
  handleStartStopwatch,
  handlePauseStopwatch,
  handleResetStopwatch,
  handleLapStopwatch
}) {
  return (
    <div className="clock-page stopwatch-page">
      <section className="clock-card stopwatch-hero-card">
        <div className="clock-card-toolbar">
          <div />
          <div className="clock-card-actions">
            <button type="button" className="clock-icon-btn" aria-label="Expand stopwatch">
              <Maximize2 size={18} />
            </button>
            <button type="button" className="clock-icon-btn" aria-label="Dock stopwatch">
              <PanelsTopLeft size={18} />
            </button>
          </div>
        </div>

        <div className="stopwatch-hero-display">
          <div className="stopwatch-time">
            <span className="stopwatch-main">
              {stopwatchParts.hours}:{stopwatchParts.minutes}:{stopwatchParts.seconds}
            </span>
            <span className="stopwatch-centiseconds">.{stopwatchParts.centiseconds}</span>
          </div>
          <div className="stopwatch-unit-row">
            <span>hr</span>
            <span>min</span>
            <span>sec</span>
          </div>
        </div>

        <div className="stopwatch-controls">
          {!stopwatchRunning ? (
            <button type="button" className="clock-circle-btn primary large" onClick={handleStartStopwatch} aria-label="Start stopwatch">
              <Play size={28} fill="currentColor" />
            </button>
          ) : (
            <button type="button" className="clock-circle-btn primary large" onClick={handlePauseStopwatch} aria-label="Pause stopwatch">
              <Pause size={28} />
            </button>
          )}
          <button
            type="button"
            className="clock-circle-btn large"
            onClick={handleLapStopwatch}
            disabled={stopwatchElapsed <= 0}
            aria-label="Add lap"
          >
            <Flag size={24} />
          </button>
          <button
            type="button"
            className="clock-circle-btn large"
            onClick={handleResetStopwatch}
            disabled={stopwatchElapsed <= 0}
            aria-label="Reset stopwatch"
          >
            <RotateCcw size={24} />
          </button>
        </div>

        {stopwatchLaps.length > 0 ? (
          <div className="stopwatch-lap-list">
            {stopwatchLaps.map((lap, index) => (
              <div key={lap.id} className="stopwatch-lap-item">
                <span>Lap {stopwatchLaps.length - index}</span>
                <strong>{formatLapTime(lap.value)}</strong>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  )
}

function renderWorldPage({
  worldMarkers,
  worldClocks,
  worldEditMode,
  setWorldEditMode,
  currentTime,
  localClockDisplay,
  hasAvailableWorldClock,
  handleAddWorldClock,
  handleRemoveWorldClock
}) {
  return (
    <div className="clock-page world-page">
      <div className="clock-world-layout">
        <section className="world-map-stage">
          <div className="world-map-stage-surface">
            <WorldMapGraphic markers={worldMarkers} />
          </div>
        </section>

        <aside className="world-side-panel">
          <section className="clock-card world-local-card">
            <div className="world-local-icon">
              {localClockDisplay.isDay ? <SunMedium size={22} /> : <Moon size={22} />}
            </div>
            <div className="world-local-time">
              <strong>{localClockDisplay.time}</strong>
              <span>{localClockDisplay.period}</span>
            </div>
            <div className="world-local-copy">
              <div className="world-local-label">Local time</div>
              <div className="world-local-date">{localClockDisplay.date}</div>
            </div>
          </section>

          <div className={`world-saved-clocks ${worldClocks.length === 0 ? 'empty' : ''}`}>
            {worldClocks.map((clockId) => {
              const city = WORLD_CITY_OPTIONS.find((entry) => entry.id === clockId)
              if (!city) return null
              const display = formatClockForZone(currentTime, city.timeZone)

              return (
                <section key={clockId} className="clock-card world-city-card">
                  <div className="world-city-card-head">
                    <div className="world-city-name">{city.name}</div>
                    {worldEditMode ? (
                      <button
                        type="button"
                        className="clock-icon-btn"
                        onClick={() => handleRemoveWorldClock(clockId)}
                        aria-label={`Remove ${city.name}`}
                      >
                        <X size={16} />
                      </button>
                    ) : null}
                  </div>
                  <div className="world-city-time">
                    <strong>{display.time}</strong>
                    <span>{display.period}</span>
                  </div>
                  <div className="world-city-date">{display.date}</div>
                </section>
              )
            })}
          </div>
        </aside>
      </div>

      <div className="clock-floating-actions world-floating-actions">
        <button type="button" className="clock-floating-btn world-floating-btn muted" disabled aria-label="World clock collection">
          <Globe2 size={21} />
        </button>
        <button
          type="button"
          className={`clock-floating-btn ${worldEditMode ? 'active' : ''}`}
          onClick={() => setWorldEditMode((previous) => !previous)}
          aria-label="Toggle world clock edit mode"
          disabled={worldClocks.length === 0}
        >
          <Pencil size={22} />
        </button>
        <button
          type="button"
          className="clock-floating-btn"
          onClick={handleAddWorldClock}
          aria-label="Add world clock"
          disabled={!hasAvailableWorldClock}
        >
          <Plus size={24} />
        </button>
      </div>
    </div>
  )
}

function ProgressRing({
  size = 260,
  strokeWidth = 16,
  progress = 0,
  className = '',
  children
}) {
  const normalizedProgress = clamp(progress, 0, 1)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - normalizedProgress)

  return (
    <div
      className={`clock-progress-ring ${className}`}
      style={{ width: `min(100%, ${size}px)`, aspectRatio: '1 / 1' }}
    >
      <svg
        className="clock-progress-ring-svg"
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
      >
        <circle
          className="clock-progress-ring-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className="clock-progress-ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="clock-progress-ring-content">{children}</div>
    </div>
  )
}

function WorldMapGraphic({ markers }) {
  return (
    <div className="clock-world-map-wrap">
      <div className="clock-world-shadow" aria-hidden="true" />
      <div className="clock-world-glow" aria-hidden="true" />
      <img className="clock-world-map-image" src={WORLD_MAP_IMAGE_SRC} alt="" />
      <div className="clock-world-scanline" aria-hidden="true" />

      {markers.map((marker) => (
        <div
          key={marker.id}
          className={`clock-world-marker ${marker.local ? 'local' : ''}`}
          style={{
            left: `${marker.x * 100}%`,
            top: `${marker.y * 100}%`
          }}
          title={marker.local ? 'Local time' : marker.name}
        >
          <MapPin size={16} />
        </div>
      ))}
    </div>
  )
}

function createTimerPreset(minutes, id = `timer-${minutes}`) {
  return {
    id,
    label: `${minutes} min`,
    totalSeconds: minutes * 60,
    remainingSeconds: minutes * 60,
    running: false,
    expanded: false
  }
}

function createFocusTask(title, id = `focus-task-${Date.now()}-${Math.round(Math.random() * 100000)}`) {
  return {
    id,
    title,
    completed: false,
    focusMinutes: 0,
    sessionCount: 0
  }
}

function sanitizeFocusTaskTitle(value) {
  return typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ').slice(0, 120)
    : ''
}

function normalizeFocusTasks(tasks) {
  if (!Array.isArray(tasks)) return []

  return tasks
    .map((task, index) => {
      const title = sanitizeFocusTaskTitle(task?.title)
      if (!title) return null

      return {
        id: typeof task.id === 'string' && task.id.trim()
          ? task.id
          : `focus-task-${index}-${Date.now()}`,
        title,
        completed: Boolean(task.completed),
        focusMinutes: Math.max(0, Math.round(Number(task.focusMinutes) || 0)),
        sessionCount: Math.max(0, Math.round(Number(task.sessionCount) || 0))
      }
    })
    .filter(Boolean)
}

function loadFocusState() {
  const stored = loadJson(FOCUS_STORAGE_KEY, null)
  const tasks = normalizeFocusTasks(stored?.tasks)
  const selectedTaskId = typeof stored?.selectedTaskId === 'string' && tasks.some(
    (task) => task.id === stored.selectedTaskId && !task.completed
  )
    ? stored.selectedTaskId
    : null

  if (!stored) {
    return {
      durationMinutes: 30,
      dailyGoalMinutes: FOCUS_DAILY_GOAL_MINUTES,
      remainingSeconds: 0,
      running: false,
      skipBreaks: false,
      history: [],
      tasks: [],
      selectedTaskId: null
    }
  }

  return {
    durationMinutes: clamp(Number(stored.durationMinutes) || 30, 5, 180),
    dailyGoalMinutes: clamp(Number(stored.dailyGoalMinutes) || FOCUS_DAILY_GOAL_MINUTES, 15, 480),
    remainingSeconds: Math.max(0, Number(stored.remainingSeconds) || 0),
    running: false,
    skipBreaks: Boolean(stored.skipBreaks),
    history: Array.isArray(stored.history) ? stored.history : [],
    tasks,
    selectedTaskId
  }
}

function loadTimerState() {
  const stored = loadJson(TIMER_STORAGE_KEY, null)
  if (!Array.isArray(stored) || stored.length === 0) return DEFAULT_TIMERS

  return stored.map((timer, index) => {
    const totalSeconds = Math.max(60, Number(timer.totalSeconds) || ((index + 1) * 60))
    const remainingSeconds = clamp(Number(timer.remainingSeconds) || totalSeconds, 0, totalSeconds)

    return {
      id: timer.id || `timer-${index}`,
      label: timer.label || formatTimerLabel(totalSeconds),
      totalSeconds,
      remainingSeconds,
      running: false,
      expanded: false
    }
  })
}

function loadAlarmState() {
  const stored = loadJson(ALARM_STORAGE_KEY, null)
  if (!Array.isArray(stored) || stored.length === 0) return DEFAULT_ALARMS

  return stored.map((alarm, index) => ({
    id: alarm.id || `alarm-${index}`,
    hour: clamp(Number(alarm.hour) || 0, 0, 23),
    minute: clamp(Number(alarm.minute) || 0, 0, 59),
    enabled: Boolean(alarm.enabled),
    label: typeof alarm.label === 'string' && alarm.label.trim() ? alarm.label.trim() : 'Alarm',
    days: Array.isArray(alarm.days)
      ? alarm.days
          .map((day) => clamp(Number(day) || 0, 0, 6))
          .filter((value, dayIndex, values) => values.indexOf(value) === dayIndex)
      : [0, 1, 2, 3, 4, 5, 6]
  }))
}

function loadWorldClockState() {
  const stored = loadJson(WORLD_STORAGE_KEY, null)
  if (!Array.isArray(stored)) return []
  return stored.filter((id, index, values) => typeof id === 'string' && values.indexOf(id) === index)
}

function loadJson(key, fallbackValue) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallbackValue
  } catch {
    return fallbackValue
  }
}

function persistState(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore storage issues in the simulated desktop environment.
  }
}

function playAlarm() {
  const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGJ0vPTgjMGHm7A7+OZTS0LQZ7U6d6qWBEMQZ/Z6t2rWRIMQJvW6NyrWRIMQqDY6t2rWhEMQqLY6N2rWREMQqLY5dyqWBELQZ/U5d2rWRALQJ/W6Nyr')
  audio.play().catch(() => {})
}

function formatClockDuration(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0)
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  return `00:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function formatDurationLong(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0)
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.ceil((safeSeconds % 3600) / 60)
  const parts = []

  if (hours > 0) parts.push(`${hours} hour${hours === 1 ? '' : 's'}`)
  if (minutes > 0 || hours === 0) parts.push(`${minutes} minute${minutes === 1 ? '' : 's'}`)
  return parts.join(', ')
}

function formatTimerLabel(totalSeconds) {
  const minutes = Math.round(totalSeconds / 60)
  return `${minutes} min`
}

function formatAlarmDisplay(alarm) {
  const hours12 = alarm.hour % 12 || 12
  const minutes = `${alarm.minute}`.padStart(2, '0')
  return {
    time: `${hours12}:${minutes}`,
    period: alarm.hour >= 12 ? 'PM' : 'AM'
  }
}

function getAlarmSummary(alarm, now) {
  if (!alarm.enabled) return 'Alarm is turned off'

  const nextDate = getNextAlarmOccurrence(alarm, now)
  if (!nextDate) return 'Pick at least one day'

  const diffMinutes = Math.max(0, Math.round((nextDate.getTime() - now.getTime()) / 60000))
  const hours = Math.floor(diffMinutes / 60)
  const minutes = diffMinutes % 60

  if (hours === 0) {
    return `in ${minutes} minute${minutes === 1 ? '' : 's'}`
  }

  return `in ${hours} hour${hours === 1 ? '' : 's'}, ${minutes} minute${minutes === 1 ? '' : 's'}`
}

function getNextAlarmOccurrence(alarm, now) {
  if (!alarm.days.length) return null

  for (let offset = 0; offset < 8; offset += 1) {
    const candidate = new Date(now)
    candidate.setDate(now.getDate() + offset)
    candidate.setHours(alarm.hour, alarm.minute, 0, 0)

    if (!alarm.days.includes(candidate.getDay())) continue
    if (candidate.getTime() <= now.getTime()) continue
    return candidate
  }

  return null
}

function getAlarmTriggerStamp(alarm, currentTime) {
  if (!alarm.enabled) return null
  if (!alarm.days.includes(currentTime.getDay())) return null
  if (alarm.hour !== currentTime.getHours()) return null
  if (alarm.minute !== currentTime.getMinutes()) return null

  return `${alarm.id}-${currentTime.getFullYear()}-${currentTime.getMonth()}-${currentTime.getDate()}-${currentTime.getHours()}-${currentTime.getMinutes()}`
}

function formatStopwatchParts(elapsedMilliseconds) {
  const safeMilliseconds = Math.max(0, Number(elapsedMilliseconds) || 0)
  const totalSeconds = Math.floor(safeMilliseconds / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const centiseconds = Math.floor((safeMilliseconds % 1000) / 10)

  return {
    hours: hours.toString().padStart(2, '0'),
    minutes: minutes.toString().padStart(2, '0'),
    seconds: seconds.toString().padStart(2, '0'),
    centiseconds: centiseconds.toString().padStart(2, '0')
  }
}

function formatLapTime(elapsedMilliseconds) {
  const parts = formatStopwatchParts(elapsedMilliseconds)
  return `${parts.hours}:${parts.minutes}:${parts.seconds}.${parts.centiseconds}`
}

function formatClockForZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone
  }).formatToParts(date)
  const hour = parts.find((part) => part.type === 'hour')?.value || '12'
  const minute = parts.find((part) => part.type === 'minute')?.value || '00'
  const period = parts.find((part) => part.type === 'dayPeriod')?.value || ''
  const hour24 = Number(new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hour12: false,
    timeZone
  }).format(date))

  return {
    time: `${hour}:${minute}`,
    period,
    date: new Intl.DateTimeFormat('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      timeZone
    }).format(date),
    isDay: hour24 >= 6 && hour24 < 18
  }
}

function getFocusBreakCount(durationMinutes) {
  return durationMinutes >= 30 ? Math.max(1, Math.floor(durationMinutes / 30)) : 0
}

function getFocusGoalDisplay(goalMinutes) {
  const safeMinutes = clamp(Number(goalMinutes) || FOCUS_DAILY_GOAL_MINUTES, 15, 480)
  if (safeMinutes % 60 === 0) {
    const hours = safeMinutes / 60
    return {
      value: `${hours}`,
      unit: `hour${hours === 1 ? '' : 's'}`
    }
  }

  return {
    value: `${safeMinutes}`,
    unit: 'minutes'
  }
}

function getFocusTaskProgressLabel(task) {
  if (!task) return 'Pick one below, or start a session without a task.'

  const parts = []
  if (task.focusMinutes > 0) parts.push(`${task.focusMinutes} min focused`)
  if (task.sessionCount > 0) parts.push(`${task.sessionCount} session${task.sessionCount === 1 ? '' : 's'}`)
  if (parts.length === 0) return task.completed ? 'Completed' : 'Ready for your next session.'
  return parts.join(' | ')
}

function getFocusStats(history, now) {
  const todayKey = getDateKey(now)
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const yesterdayKey = getDateKey(yesterday)

  const minutesByDay = {}
  history.forEach((entry) => {
    if (!entry?.completedAt) return
    const date = new Date(entry.completedAt)
    if (Number.isNaN(date.getTime())) return
    const key = getDateKey(date)
    minutesByDay[key] = (minutesByDay[key] || 0) + (Number(entry.durationMinutes) || 0)
  })

  let streakDays = 0
  const cursor = new Date(now)
  while (true) {
    const key = getDateKey(cursor)
    if (!minutesByDay[key]) break
    streakDays += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return {
    todayMinutes: minutesByDay[todayKey] || 0,
    yesterdayMinutes: minutesByDay[yesterdayKey] || 0,
    streakDays
  }
}

function getDateKey(date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getGreeting(date) {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function getCurrentUser() {
  try {
    const raw = window.localStorage.getItem('user')
    if (!raw) return { label: 'User', initials: 'U' }

    const parsed = JSON.parse(raw)
    const username = typeof parsed?.username === 'string' && parsed.username.trim()
      ? parsed.username.trim()
      : 'User'
    const label = username
      .split(/[\s._-]+/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
    const initials = label
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase()

    return {
      label,
      initials: initials || 'U'
    }
  } catch {
    return { label: 'User', initials: 'U' }
  }
}

function getCurrentTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

function getLocalMarker(timeZone) {
  const directMatch = LOCAL_TIMEZONE_POSITIONS[timeZone]
  if (directMatch) return directMatch

  const knownCity = WORLD_CITY_OPTIONS.find((city) => city.timeZone === timeZone)
  if (knownCity) {
    return {
      name: knownCity.name,
      x: knownCity.x,
      y: knownCity.y
    }
  }

  const label = timeZone.includes('/')
    ? timeZone.split('/').pop().replace(/_/g, ' ')
    : 'Local time'

  return {
    name: label,
    x: 0.8,
    y: 0.42
  }
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value))
}
