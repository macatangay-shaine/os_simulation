import { useEffect, useMemo, useRef, useState } from 'react'
import { Activity, FileText, Folder, HardDrive, Settings, Terminal, Bell, Package, AlertCircle, Stethoscope, Calculator, Camera, Clock, Calendar as CalendarIcon, Lightbulb, Shield } from 'lucide-react'
import AppLauncher from '../app-management/AppLauncher.jsx'
import ContextMenu from '../ui/ContextMenu.jsx'
import StartMenu from './StartMenu.jsx'
import Taskbar from './Taskbar.jsx'
import Window from './Window.jsx'
import Toast from '../ui/Toast.jsx'
import NotificationCenter from '../system/NotificationCenter.jsx'
import ActionCenter from '../system/ActionCenter.jsx'
import Calendar from '../ui/Calendar.jsx'
import AppSwitcher from '../app-management/AppSwitcher.jsx'
import TerminalApp from '../../apps/TerminalApp.jsx'
import FileExplorer from '../../apps/FileExplorer.jsx'
import NotesApp from '../../apps/NotesApp.jsx'
import SettingsApp from '../../apps/SettingsApp.jsx'
import SystemMonitor from '../../apps/SystemMonitor.jsx'
import LocalFilesApp from '../../apps/LocalFilesApp.jsx'
import AppStore from '../../apps/AppStore.jsx'
import EventViewer from '../../apps/EventViewer.jsx'
import SystemDiagnostics from '../../apps/SystemDiagnostics.jsx'
import CalculatorApp from '../../apps/CalculatorApp.jsx'
import CameraApp from '../../apps/CameraApp.jsx'
import ClockApp from '../../apps/ClockApp.jsx'
import CalendarViewerApp from '../../apps/CalendarViewerApp.jsx'
import TipsApp from '../../apps/TipsApp.jsx'
import WebBrowserApp from '../../apps/WebBrowserApp.jsx'
import ArmouryCrateApp from '../../apps/ArmouryCrateApp.jsx'

const RECYCLE_BIN_PATH = '/home/user/.recycle_bin'
const ARMOURY_DEVICE_SETTINGS_STORAGE_KEY = 'jezos_armoury_device_settings'
const RECYCLE_BIN_DESKTOP_ITEM = {
  path: RECYCLE_BIN_PATH,
  type: 'dir',
  synthetic: true
}

// Component mapping for built-in apps
const APP_COMPONENTS = {
  'terminal': TerminalApp,
  'files': FileExplorer,
  'localfiles': LocalFilesApp,
  'notes': NotesApp,
  'settings': SettingsApp,
  'monitor': SystemMonitor,
  'appstore': AppStore,
  'eventviewer': EventViewer,
  'diagnostics': SystemDiagnostics,
  'calculator': CalculatorApp,
  'camera': CameraApp,
  'clock': ClockApp,
  'calendar': CalendarViewerApp,
  'tips': TipsApp,
  'webbrowser': WebBrowserApp,
  'armourycrate': ArmouryCrateApp
}

// Icon mapping for all apps
const APP_ICONS = {
  'terminal': Terminal,
  'files': Folder,
  'localfiles': HardDrive,
  'notes': FileText,
  'settings': Settings,
  'monitor': Activity,
  'appstore': Package,
  'eventviewer': AlertCircle,
  'diagnostics': Stethoscope,
  'calculator': Calculator,
  'camera': Camera,
  'clock': Clock,
  'calendar': CalendarIcon,
  'tips': Lightbulb,
  'webbrowser': Package, // You can replace with a browser icon if available
  'armourycrate': Shield
}

const APP_ICON_SOURCES = {
  'armourycrate': '/armoury-crate-icon.png'
}

const WINDOW_DEFAULTS = {
  width: 420,
  height: 280,
  x: 120,
  y: 120
}

// Apps that should open maximized by default, similar to common desktop UX.
const MAXIMIZED_BY_DEFAULT_APP_IDS = new Set([
  'files',
  'localfiles',
  'notes',
  'settings',
  'monitor',
  'webbrowser',
  'appstore',
  'eventviewer',
  'diagnostics',
  'armourycrate'
])

export default function Desktop({ user, onLogout, onLock, onRestart, onShutdown, onSleep, isSleeping = false }) {
  const [appRegistry, setAppRegistry] = useState([])
  const [desktopFiles, setDesktopFiles] = useState([])
  const [windows, setWindows] = useState([])
  const [zCounter, setZCounter] = useState(2)
  const [activeWindowId, setActiveWindowId] = useState(null)
  const zeroKeyPressed = useRef(false)
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 })
  const [contextMenuItems, setContextMenuItems] = useState([])
  const [showStartMenu, setShowStartMenu] = useState(false)
  const [showNotificationCenter, setShowNotificationCenter] = useState(false)
  const [showActionCenter, setShowActionCenter] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [showAppSwitcher, setShowAppSwitcher] = useState(false)
  const [appSwitcherIndex, setAppSwitcherIndex] = useState(0)
  const [toasts, setToasts] = useState([])
  const [recentApps, setRecentApps] = useState([])
  const [taskbarSearchQuery, setTaskbarSearchQuery] = useState('')
  const [updateStatus, setUpdateStatus] = useState(null)
  const [armouryDeviceSettings, setArmouryDeviceSettings] = useState(() => loadArmouryDeviceSettings())
  const [pinnedAppIds, setPinnedAppIds] = useState(() => {
    try {
      const saved = localStorage.getItem('jez_os_pinned_apps')
      const parsed = saved ? JSON.parse(saved) : []
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      console.warn('Failed to load pinned apps:', error)
      return []
    }
  })
  const [iconPositions, setIconPositions] = useState(() => {
    try {
      const saved = localStorage.getItem('jez_os_icon_positions')
      if (!saved) return {}
      const parsed = JSON.parse(saved)
      // If webbrowser icon is missing, force reset
      if (!Object.keys(parsed).includes('webbrowser')) {
        localStorage.removeItem('jez_os_icon_positions');
        return {};
      }
      // Validate positions - ensure row and col are valid numbers
      const validated = {}
      Object.entries(parsed).forEach(([id, pos]) => {
        if (pos && typeof pos.row === 'number' && typeof pos.col === 'number' && 
            pos.row >= 0 && pos.col >= 0 && pos.col < 5) {
          validated[id] = pos
        }
      })
      return validated
    } catch (error) {
      console.warn('Failed to load icon positions from localStorage:', error)
      return {}
    }
  })
  
  const resetDesktopLayout = () => {
    localStorage.removeItem('jez_os_icon_positions')
    // Create new positions for current appRegistry
    setAppRegistry((prev) => {
      const newPositions = {}
      prev.forEach((app, index) => {
        newPositions[app.id] = {
          row: Math.floor(index / 5),
          col: index % 5
        }
      })
      setIconPositions(newPositions)
      return prev
    })
  }
  
  // Load apps from backend on mount
  useEffect(() => {
    const loadApps = async () => {
      const defaultRegistry = [
        { id: 'terminal', title: 'Terminal', icon: Terminal, component: TerminalApp },
        { id: 'files', title: 'Files', icon: Folder, component: FileExplorer },
        { id: 'localfiles', title: 'Local Files', icon: HardDrive, component: LocalFilesApp },
        { id: 'notes', title: 'Notes', icon: FileText, component: NotesApp },
        { id: 'settings', title: 'Settings', icon: Settings, component: SettingsApp },
        { id: 'monitor', title: 'System Monitor', icon: Activity, component: SystemMonitor },
        { id: 'webbrowser', title: 'Web Browser', icon: Package, component: WebBrowserApp },
        { id: 'appstore', title: 'App Store', icon: Package, component: AppStore },
        { id: 'eventviewer', title: 'Event Viewer', icon: AlertCircle, component: EventViewer },
        { id: 'diagnostics', title: 'System Diagnostics', icon: Stethoscope, component: SystemDiagnostics },
        { id: 'armourycrate', title: 'Armoury Crate', icon: Shield, iconSrc: APP_ICON_SOURCES.armourycrate, component: ArmouryCrateApp }
      ]

      try {
        const response = await fetch('http://localhost:8000/app/list')
        if (!response.ok) {
          throw new Error('Failed to fetch app list')
        }
        const apps = await response.json()
        if (!Array.isArray(apps) || apps.length === 0) {
          setAppRegistry(defaultRegistry)
          setIconPositions((prev) => {
            const updated = { ...prev }
            defaultRegistry.forEach((app, index) => {
              if (!updated[app.id]) {
                updated[app.id] = {
                  row: Math.floor(index / 5),
                  col: index % 5
                }
              }
            })
            return updated
          })
          return
        }
        
        // Convert API response to app registry format
        let registry = apps.map(app => ({
          id: app.id,
          title: app.name,
          icon: APP_ICONS[app.id] || Package,
          iconSrc: APP_ICON_SOURCES[app.id] || null,
          component: APP_COMPONENTS[app.id] || AppStore,
          installed: app.installed
        }))

        // Ensure critical system apps are always present
        if (!registry.some((app) => app.id === 'appstore')) {
          registry = [
            ...registry,
            { id: 'appstore', title: 'App Store', icon: Package, component: AppStore, installed: 1 }
          ]
        }
        
        if (!registry.some((app) => app.id === 'eventviewer')) {
          registry = [
            ...registry,
            { id: 'eventviewer', title: 'Event Viewer', icon: AlertCircle, component: EventViewer, installed: 1 }
          ]
        }

        if (!registry.some((app) => app.id === 'diagnostics')) {
          registry = [
            ...registry,
            { id: 'diagnostics', title: 'System Diagnostics', icon: Stethoscope, component: SystemDiagnostics, installed: 1 }
          ]
        }

        if (!registry.some((app) => app.id === 'armourycrate')) {
          registry = [
            ...registry,
            { id: 'armourycrate', title: 'Armoury Crate', icon: Shield, iconSrc: APP_ICON_SOURCES.armourycrate, component: ArmouryCrateApp, installed: 1 }
          ]
        }
        
        setAppRegistry(registry)
        
        // Update icon positions for any new apps that don't have saved positions
        setIconPositions((prev) => {
          const updated = { ...prev }
          registry.forEach((app, index) => {
            if (!updated[app.id]) {
              updated[app.id] = {
                row: Math.floor(index / 5),
                col: index % 5
              }
            }
          })
          return updated
        })
      } catch (error) {
        console.error('Failed to load apps:', error)
        // Fallback to default apps if backend fails
        setAppRegistry(defaultRegistry)
        
        // Update positions for fallback apps
        setIconPositions((prev) => {
          const updated = { ...prev }
          defaultRegistry.forEach((app, index) => {
            if (!updated[app.id]) {
              updated[app.id] = {
                row: Math.floor(index / 5),
                col: index % 5
              }
            }
          })
          return updated
        })
      }
    }
    
    loadApps()
  }, [])

  useEffect(() => {
    const syncArmouryDeviceSettings = (event) => {
      if (event?.detail) {
        setArmouryDeviceSettings((previous) => ({ ...previous, ...event.detail }))
        return
      }

      setArmouryDeviceSettings(loadArmouryDeviceSettings())
    }

    window.addEventListener('jezos_armoury_device_settings_updated', syncArmouryDeviceSettings)
    return () => window.removeEventListener('jezos_armoury_device_settings_updated', syncArmouryDeviceSettings)
  }, [])

  useEffect(() => {
    let intervalId = null
    const loadUpdateStatus = async () => {
      try {
        const response = await fetch('http://localhost:8000/update/status')
        if (response.ok) {
          const data = await response.json()
          setUpdateStatus(data.state || null)
        }
      } catch (error) {
        // ignore
      }
    }

    loadUpdateStatus()
    intervalId = setInterval(loadUpdateStatus, 8000)

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [])

  // Save icon positions to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('jez_os_icon_positions', JSON.stringify(iconPositions))
    } catch (error) {
      console.warn('Failed to save icon positions:', error)
    }
  }, [iconPositions])

  // Load desktop files from filesystem
  useEffect(() => {
    const loadDesktopFiles = async () => {
      try {
        const response = await fetch('http://localhost:8000/fs/list?path=%2Fhome%2Fuser%2FDesktop')
        if (response.ok) {
          const data = await response.json()
          console.log('Desktop files:', data.nodes)
          const nodes = Array.isArray(data.nodes) ? data.nodes : []
          const hasRecycleBin = nodes.some((node) => node.path === RECYCLE_BIN_PATH)
          setDesktopFiles(hasRecycleBin ? nodes : [RECYCLE_BIN_DESKTOP_ITEM, ...nodes])
        } else {
          console.error('Failed to load desktop files')
        }
      } catch (error) {
        console.error('Failed to load desktop files:', error)
      }
    }

    // Load on mount and then every 5 seconds to catch changes
    loadDesktopFiles()
    const interval = setInterval(loadDesktopFiles, 5000)
    return () => clearInterval(interval)
  }, [])

  // Keep window list aligned with backend process state.
  useEffect(() => {
    const syncWindowsWithProcesses = async () => {
      try {
        const response = await fetch('http://localhost:8000/process/list')
        if (!response.ok) return
        const processList = await response.json()
        const runningPids = new Set(
          (processList || [])
            .filter((proc) => proc.state === 'running')
            .map((proc) => proc.pid)
        )

        setWindows((prev) => prev.filter((win) => runningPids.has(win.id)))
      } catch {
        // Ignore transient backend failures.
      }
    }

    syncWindowsWithProcesses()
    const interval = setInterval(syncWindowsWithProcesses, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleProcessTerminated = (event) => {
      const pid = Number(event?.detail?.pid)
      if (!Number.isFinite(pid)) return
      setWindows((prev) => prev.filter((win) => win.id !== pid))
    }

    window.addEventListener('process-terminated', handleProcessTerminated)
    return () => window.removeEventListener('process-terminated', handleProcessTerminated)
  }, [])

  // Handle opening desktop files
  useEffect(() => {
    const handleOpenFile = (event) => {
      console.log('Custom event received:', event.detail)
      openDesktopFile(event.detail)
    }

    const handleLaunchShortcut = (event) => {
      console.log('Launch shortcut event received:', event.detail)
      launchShortcut(event.detail.path)
    }

    const handleOpenFileInApp = (event) => {
      console.log('[Desktop] openFileInApp event received:', event.detail)
      const { appId, filePath } = event.detail
      // Find the app in registry
      const app = appRegistry.find(a => a.id === appId)
      if (app) {
        console.log('[Desktop] Launching app:', app.title)
        launchApp(app)
      } else {
        console.error('[Desktop] App not found:', appId)
      }
    }
    
    window.addEventListener('openDesktopFile', handleOpenFile)
    window.addEventListener('launchAppShortcut', handleLaunchShortcut)
    window.addEventListener('openFileInApp', handleOpenFileInApp)
    return () => {
      window.removeEventListener('openDesktopFile', handleOpenFile)
      window.removeEventListener('launchAppShortcut', handleLaunchShortcut)
      window.removeEventListener('openFileInApp', handleOpenFileInApp)
    }
  }, [appRegistry])

  // Sync desktop apps to filesystem
  useEffect(() => {
    const syncDesktopToFilesystem = async () => {
      try {
        // Get apps that should be on desktop (those with icon positions)
        const desktopApps = appRegistry.filter(app => iconPositions[app.id])
        
        for (const app of desktopApps) {
          const shortcutPath = `/home/user/Desktop/${app.title}.lnk`
          const shortcutContent = JSON.stringify({
            type: 'app-shortcut',
            appId: app.id,
            appTitle: app.title,
            position: iconPositions[app.id]
          })
          
          try {
            // Try to create the shortcut file
            const response = await fetch('http://localhost:8000/fs/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                path: shortcutPath,
                node_type: 'file',
                content: shortcutContent
              })
            })
            
            if (!response.ok && response.status !== 409) {
              console.error('Failed to sync shortcut:', shortcutPath)
            }
          } catch (err) {
            // File might already exist, that's okay
            console.log('Shortcut already exists or error:', shortcutPath)
          }
        }
      } catch (error) {
        console.error('Failed to sync desktop to filesystem:', error)
      }
    }
    
    if (appRegistry.length > 0) {
      syncDesktopToFilesystem()
    }
  }, [appRegistry, iconPositions])

  useEffect(() => {
    try {
      localStorage.setItem('jez_os_pinned_apps', JSON.stringify(pinnedAppIds))
    } catch (error) {
      console.warn('Failed to save pinned apps:', error)
    }
  }, [pinnedAppIds])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      console.log('Key pressed:', event.key, 'Zero pressed:', zeroKeyPressed.current, 'Active window:', activeWindowId)
      
      // Track when '0' is pressed
      if (event.key === '0') {
        zeroKeyPressed.current = true
        console.log('Zero key activated')
        return
      }
      
      // 0 + Plus for app switching
      if (zeroKeyPressed.current && (event.key === '+' || event.key === '=')) {
        event.preventDefault()
        console.log('App switcher triggered')
        const visibleWindows = windows.filter(w => !w.minimized)
        
        if (visibleWindows.length === 0) return
        
        if (!showAppSwitcher) {
          setShowAppSwitcher(true)
          setAppSwitcherIndex(0)
        } else {
          setAppSwitcherIndex((prev) => (prev + 1) % visibleWindows.length)
        }
      }
      
      // 0 + Arrow keys for window snapping
      if (zeroKeyPressed.current && activeWindowId) {
        const screenWidth = window.innerWidth
        const screenHeight = window.innerHeight - 50
        
        let snapZone = null
        
        if (event.key === 'ArrowLeft') {
          event.preventDefault()
          console.log('Snapping left')
          snapZone = { x: 0, y: 0, width: screenWidth / 2, height: screenHeight }
        } else if (event.key === 'ArrowRight') {
          event.preventDefault()
          console.log('Snapping right')
          snapZone = { x: screenWidth / 2, y: 0, width: screenWidth / 2, height: screenHeight }
        } else if (event.key === 'ArrowUp') {
          event.preventDefault()
          console.log('Maximizing')
          snapZone = { x: 0, y: 0, width: screenWidth, height: screenHeight }
        }
        
        if (snapZone) {
          snapWindow(activeWindowId, snapZone)
        }
      }
    }
    
    const handleKeyUp = (event) => {
      // Close app switcher when '0' is released
      if (event.key === '0') {
        zeroKeyPressed.current = false
        if (showAppSwitcher) {
          const visibleWindows = windows.filter(w => !w.minimized)
          if (visibleWindows.length > 0 && appSwitcherIndex < visibleWindows.length) {
            const selectedWindow = visibleWindows[appSwitcherIndex]
            focusWindow(selectedWindow.id)
            if (selectedWindow.minimized) {
              toggleMinimize(selectedWindow.id)
            }
          }
          setShowAppSwitcher(false)
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [windows, showAppSwitcher, appSwitcherIndex, activeWindowId])

  const toggleStartMenu = () => {
    setShowStartMenu(!showStartMenu)
  }

  const closeStartMenu = () => {
    setShowStartMenu(false)
    setTaskbarSearchQuery('')
  }

  const handleTaskbarSearchChange = (value) => {
    setTaskbarSearchQuery(value)
    if (value.trim()) {
      setShowStartMenu(true)
    }
  }

  const handleIconMove = (appId, gridPos) => {
    setIconPositions((prev) => {
      const updated = {
        ...prev,
        [appId]: gridPos
      }
      // Save to localStorage
      try {
        localStorage.setItem('jez_os_icon_positions', JSON.stringify(updated))
      } catch (error) {
        console.error('Failed to save icon positions:', error)
      }
      return updated
    })
  }

  const handleTogglePin = (appId) => {
    setPinnedAppIds((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    )
  }

  const handleLaunchPinned = (appId) => {
    const app = appRegistry.find((entry) => entry.id === appId)
    if (app) {
      launchApp(app)
    }
  }

  const showToast = (title, message, type = 'info', duration = 5000) => {
    const id = Date.now()
    const notification = { title, message, type, duration }
    setToasts((prev) => [...prev, { id, ...notification }])
  }

  const closeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }


  const openDesktopFile = async (file) => {
    console.log('Opening desktop file:', file)
    
    if (file.type === 'dir') {
      // Open Files app and navigate to folder
      const filesApp = appRegistry.find(app => app.id === 'files')
      if (filesApp) {
        // Store the path to open
        localStorage.setItem('files_open_path', file.path)
        const windowTitle = file.path === RECYCLE_BIN_PATH ? 'Recycle Bin' : filesApp.title
        launchApp(filesApp, { windowTitle })
      }
    } else if (file.path.endsWith('.txt')) {
      // Open text file in Notes
      localStorage.setItem('notes_open_file', file.path)
      const notesApp = appRegistry.find(app => app.id === 'notes')
      if (notesApp) {
        launchApp(notesApp)
      }
    } else if (file.path.endsWith('.lnk')) {
      // Launch app shortcut
      await launchShortcut(file.path)
    } else {
      // Open other files in Files app
      const filesApp = appRegistry.find(app => app.id === 'files')
      if (filesApp) {
        launchApp(filesApp)
      }
    }
  }

  const launchShortcut = async (shortcutPath) => {
    try {
      const response = await fetch('http://localhost:8000/fs/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: shortcutPath })
      })
      
      if (response.ok) {
        const data = await response.json()
        const shortcutData = JSON.parse(data.content)
        
        const targetApp = appRegistry.find(app => app.id === shortcutData.appId)
        if (targetApp) {
          launchApp(targetApp)
        }
      }
    } catch (err) {
      console.error('Failed to open shortcut:', err)
    }
  }

  const launchApp = async (app, options = {}) => {
    const memory = Math.floor(Math.random() * 20) + 8
    let pid = Date.now()
    
    // Check memory limit
    try {
      const checkResponse = await fetch('http://localhost:8000/system/resources')
      if (checkResponse.ok) {
        const resources = await checkResponse.json()
        if (resources.usedMemory + memory > resources.maxMemory) {
          alert(`Cannot launch ${app.title}: Insufficient memory (${resources.usedMemory + memory}/${resources.maxMemory} MB)`)
          return
        }
      }
    } catch (error) {
      // Continue if resource check fails
    }
    
    try {
      const response = await fetch('http://localhost:8000/process/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app: app.title, memory })
      })
      if (response.ok) {
        const data = await response.json()
        pid = data.pid
        
        // Check if we need to kill background processes
        if (data.killed_processes && data.killed_processes.length > 0) {
          console.log('Auto-killed background processes:', data.killed_processes)
          const killedSet = new Set(data.killed_processes)
          setWindows((prev) => prev.filter((win) => !killedSet.has(win.id)))
        }
      } else {
        const errorData = await response.json()
        alert(errorData.detail || 'Failed to launch app')
        return
      }
    } catch (error) {
      pid = Date.now()
    }

    setWindows((prev) => {
      const defaultX = WINDOW_DEFAULTS.x + prev.length * 24
      const defaultY = WINDOW_DEFAULTS.y + prev.length * 24
      const screenWidth = window.innerWidth
      const screenHeight = window.innerHeight - 50
      const shouldStartMaximized =
        options.startMaximized ?? MAXIMIZED_BY_DEFAULT_APP_IDS.has(app.id)

      const defaultWidth = app.id === 'calculator' ? 428 : WINDOW_DEFAULTS.width
      const defaultHeight = app.id === 'calculator' ? 520 : WINDOW_DEFAULTS.height

      const windowEntry = {
        id: pid,
        appId: app.id,
        title: options.windowTitle || app.title,
        icon: app.icon,
        iconSrc: app.iconSrc || null,
        memory,
        minimized: false,
        isMaximized: shouldStartMaximized,
        zIndex: zCounter,
        x: shouldStartMaximized ? 0 : defaultX,
        y: shouldStartMaximized ? 0 : defaultY,
        width: shouldStartMaximized ? screenWidth : defaultWidth,
        height: shouldStartMaximized ? screenHeight : defaultHeight,
        prevX: defaultX,
        prevY: defaultY,
        prevWidth: defaultWidth,
        prevHeight: defaultHeight,
        noMaximize: app.id === 'calculator', // Disable maximize for calculator
        minWidth: app.id === 'calculator' ? 428 : undefined,
        minHeight: app.id === 'calculator' ? 520 : undefined
      }

      return [
      ...prev,
      windowEntry
    ]
    })
    setZCounter((prev) => prev + 1)

    // Track recent apps (keep last 5)
    setRecentApps((prev) => {
      const filtered = prev.filter((a) => a.id !== app.id)
      return [app, ...filtered].slice(0, 5)
    })
  }

  const closeWindow = async (pid) => {
    setWindows((prev) => prev.filter((win) => win.id !== pid))
    try {
      const response = await fetch(`http://localhost:8000/process/kill?pid=${pid}`, { method: 'POST' })
      if (!response.ok && response.status !== 404) {
        // Silently fail for missing processes
      }
      window.dispatchEvent(new CustomEvent('process-terminated', { detail: { pid } }))
    } catch (error) {
      // Silently fail if process close fails
    }
  }

  const toggleMinimize = (pid) => {
    setWindows((prev) =>
      prev.map((win) => {
        if (win.id === pid) {
          // If minimizing, just toggle minimized flag
          // If restoring, toggle minimized flag AND bring to front
          const newMinimized = !win.minimized
          return {
            ...win,
            minimized: newMinimized,
            zIndex: newMinimized ? win.zIndex : zCounter
          }
        }
        return win
      })
    )
    // Increment zCounter so restored window gets highest z-index
    setZCounter((prev) => prev + 1)
  }

  const focusWindow = (pid) => {
    setActiveWindowId(pid)
    setWindows((prev) =>
      prev.map((win) => (win.id === pid ? { ...win, zIndex: zCounter } : win))
    )
    setZCounter((prev) => prev + 1)
  }

  const moveWindow = (pid, x, y) => {
    setWindows((prev) =>
      prev.map((win) => (win.id === pid ? { ...win, x, y } : win))
    )
  }

  const snapWindow = (pid, snapZone) => {
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight - 50 // Account for taskbar
    
    const parseValue = (value, max) => {
      if (typeof value === 'string' && value.includes('%')) {
        return (parseFloat(value) / 100) * max
      }
      return parseFloat(value) || 0
    }
    
    setWindows((prev) =>
      prev.map((win) => {
        if (win.id === pid) {
          return {
            ...win,
            x: parseValue(snapZone.x, screenWidth),
            y: parseValue(snapZone.y, screenHeight),
            width: parseValue(snapZone.width, screenWidth),
            height: parseValue(snapZone.height, screenHeight),
            isMaximized: false
          }
        }
        return win
      })
    )
  }

  const maximizeWindow = (pid) => {
    setWindows((prev) =>
      prev.map((win) => {
        if (win.id === pid) {
          if (win.isMaximized) {
            // Restore to previous size
            return {
              ...win,
              x: win.prevX || WINDOW_DEFAULTS.x,
              y: win.prevY || WINDOW_DEFAULTS.y,
              width: win.prevWidth || WINDOW_DEFAULTS.width,
              height: win.prevHeight || WINDOW_DEFAULTS.height,
              isMaximized: false
            }
          } else {
            // Maximize
            const screenWidth = window.innerWidth
            const screenHeight = window.innerHeight - 50
            return {
              ...win,
              prevX: win.x,
              prevY: win.y,
              prevWidth: win.width,
              prevHeight: win.height,
              x: 0,
              y: 0,
              width: screenWidth,
              height: screenHeight,
              isMaximized: true
            }
          }
        }
        return win
      })
    )
  }

  const resizeWindow = (pid, newX, newY, newWidth, newHeight) => {
    setWindows((prev) =>
      prev.map((win) => {
        if (win.id === pid) {
          return {
            ...win,
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight,
            isMaximized: false
          }
        }
        return win
      })
    )
  }

  const updateWindowTitle = (pid, title) => {
    if (!title) return
    setWindows((prev) =>
      prev.map((win) => (win.id === pid ? { ...win, title } : win))
    )
  }

  const desktopContextItems = useMemo(
    () =>
      appRegistry.map((app) => ({
        label: `Open ${app.title}`,
        onClick: () => launchApp(app)
      })),
    [appRegistry, zCounter]
  )

  const handleContextMenu = (event) => {
    event.preventDefault()
    const items = [
      ...desktopContextItems,
      { separator: true },
      {
        label: 'Reset Desktop Layout',
        onClick: () => resetDesktopLayout()
      }
    ]
    setContextMenuItems(items)
    setContextMenu({ visible: true, x: event.clientX, y: event.clientY })
  }

  const handleAppContextMenu = (event, app) => {
    event.preventDefault()
    event.stopPropagation()

    const isAlreadyPinned = pinnedAppIds.includes(app.id)
    setContextMenuItems([
      {
        label: `Open ${app.title}`,
        onClick: () => launchApp(app)
      },
      {
        label: isAlreadyPinned ? 'Unpin from taskbar' : 'Pin to taskbar',
        onClick: () => handleTogglePin(app.id)
      }
    ])
    setContextMenu({ visible: true, x: event.clientX, y: event.clientY })
  }

  const closeContextMenu = () => {
    setContextMenu((prev) => ({ ...prev, visible: false }))
  }

  const closeAllPanels = () => {
    closeStartMenu()  // This also clears the search
    setShowNotificationCenter(false)
    setShowActionCenter(false)
    setShowCalendar(false)
  }

  const handleDesktopClick = (event) => {
    // Close context menu when clicking desktop
    closeContextMenu()
    
    // Check if clicking on any panel content
    const isClickingPanel = 
      event.target.closest('.start-menu') ||
      event.target.closest('.notification-center-panel') ||
      event.target.closest('.action-center') ||
      event.target.closest('.calendar-widget')
    
    // Only close panels if clicking on the wallpaper/desktop content (not panels)
    if ((event.target.classList.contains('desktop-wallpaper') || 
         event.target.classList.contains('desktop-content')) &&
        !isClickingPanel) {
      closeAllPanels()
    }
  }

  return (
    <div className="desktop" onContextMenu={handleContextMenu} onClick={handleDesktopClick}>
      <div className="desktop-wallpaper" />
      <div className="desktop-content">
        <AppLauncher 
          apps={appRegistry} 
          desktopFiles={desktopFiles}
          onLaunch={launchApp}
          iconPositions={iconPositions}
          onIconMove={handleIconMove}
          onAppContextMenu={handleAppContextMenu}
          touchpadEnabled={armouryDeviceSettings['touch-pad'] !== false}
        />
      </div>

      {windows.map((win) => {
        const AppComponent = appRegistry.find((app) => app.id === win.appId)?.component
        return (
          <Window
            key={win.id}
            windowData={{ ...win, isActive: win.id === activeWindowId }}
            onClose={closeWindow}
            onMinimize={toggleMinimize}
            onMaximize={maximizeWindow}
            onFocus={focusWindow}
            onMove={moveWindow}
            onResize={resizeWindow}
            onSnap={snapWindow}
            touchpadEnabled={armouryDeviceSettings['touch-pad'] !== false}
          >
            {AppComponent ? <AppComponent onWindowTitleChange={(title) => updateWindowTitle(win.id, title)} /> : (
              <div className="window-placeholder">
                <div className="window-placeholder-title">{win.title}</div>
                <div className="window-placeholder-body">
                  App content for {win.title} will go here.
                </div>
              </div>
            )}
          </Window>
        )
      })}

      <ContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        items={contextMenuItems.length ? contextMenuItems : desktopContextItems}
        onClose={closeContextMenu}
      />

      <StartMenu
        visible={showStartMenu}
        onClose={closeStartMenu}
        apps={appRegistry}
        onLaunch={launchApp}
        onLock={onLock}
        onLogout={onLogout}
        onRestart={onRestart}
        onShutdown={onShutdown}
        onSleep={onSleep}
        updateStatus={updateStatus}
        recentApps={recentApps}
        searchQuery={taskbarSearchQuery}
        onSearchQueryChange={handleTaskbarSearchChange}
      />

      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            notification={toast}
            onClose={closeToast}
          />
        ))}
      </div>

      {showNotificationCenter && (
        <NotificationCenter onClose={() => setShowNotificationCenter(false)} />
      )}

      {showCalendar && (
        <Calendar onClose={() => setShowCalendar(false)} />
      )}

      {showActionCenter && (
        <ActionCenter onClose={() => setShowActionCenter(false)} />
      )}

      {showAppSwitcher && (
        <AppSwitcher
          windows={windows.filter(w => !w.minimized)}
          selectedIndex={appSwitcherIndex}
          onSelect={(index) => {
            const visibleWindows = windows.filter(w => !w.minimized)
            if (index < visibleWindows.length) {
              setAppSwitcherIndex(index)
            }
          }}
          onClose={() => setShowAppSwitcher(false)}
        />
      )}

      <Taskbar 
        windows={windows} 
        onToggleMinimize={toggleMinimize}
        onFocusWindow={focusWindow}
        user={user}
        onLogout={onLogout}
        onLock={onLock}
        onSleep={onSleep}
        onStartClick={toggleStartMenu}
        onNotificationClick={() => setShowNotificationCenter(!showNotificationCenter)}
        onActionCenterClick={() => setShowActionCenter(!showActionCenter)}
        onCalendarClick={() => setShowCalendar(!showCalendar)}
        pinnedApps={appRegistry.filter((app) => pinnedAppIds.includes(app.id))}
        onTogglePin={handleTogglePin}
        onLaunchPinned={handleLaunchPinned}
        isPinned={(appId) => pinnedAppIds.includes(appId)}
        searchQuery={taskbarSearchQuery}
        onSearchChange={handleTaskbarSearchChange}
        isSleeping={isSleeping}
      />
    </div>
  )
}

function loadArmouryDeviceSettings() {
  try {
    const savedSettings = localStorage.getItem(ARMOURY_DEVICE_SETTINGS_STORAGE_KEY)
    if (!savedSettings) return { 'touch-pad': true, 'win-key': true }

    const parsed = JSON.parse(savedSettings)
    return {
      'touch-pad': true,
      'win-key': true,
      ...parsed
    }
  } catch (error) {
    console.warn('Failed to load Armoury Crate device settings in Desktop:', error)
    return { 'touch-pad': true, 'win-key': true }
  }
}
