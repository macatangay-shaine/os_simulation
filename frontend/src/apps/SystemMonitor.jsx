import { useEffect, useMemo, useRef, useState } from 'react'

import PrintingSimulation from '../components/PrintingSimulation'
import { useSharedSystemMonitorData } from '../hooks/useSharedSystemMonitorData'
import { readPrintJobs, updatePrintJobStatus, enqueuePrintJob } from '../utils/printJobs'

export default function SystemMonitor() {
  const readDesktopWindowSnapshot = () => {
    if (Array.isArray(window.__jezOsDesktopWindows)) {
      return window.__jezOsDesktopWindows
    }

    try {
      const raw = localStorage.getItem('jez_os_active_windows')
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const [activeTab, setActiveTab] = useState('processes')
  const [startupProcesses, setStartupProcesses] = useState([])
  const [sortBy, setSortBy] = useState('pid')
  const [sortOrder, setSortOrder] = useState('asc')
  const [simulatedHistory, setSimulatedHistory] = useState([])
  const [ioQueue, setIoQueue] = useState([])
  const [printerDevices, setPrinterDevices] = useState([
    { id: 'printer-1', name: 'HP LaserJet Pro', type: 'printer', speed: 30, status: 'ready' },
    { id: 'disk-1', name: 'SSD /dev/sda', type: 'storage', speed: 500, status: 'ready' }
  ])
  
  // New state for new tabs
  const [diskData, setDiskData] = useState(null)
  const [partitionForm, setPartitionForm] = useState({ label: 'Work', sizeGb: '24', fileSystem: 'NTFS' })
  const [diskActionMessage, setDiskActionMessage] = useState('')
  const [users, setUsers] = useState([])
  const [services, setServices] = useState([])
  const [appHistory, setAppHistory] = useState([])
  const [desktopWindows, setDesktopWindows] = useState(() => readDesktopWindowSnapshot())
  
  const [currentPrintJob, setCurrentPrintJob] = useState(null)
  const [activePrintJobs, setActivePrintJobs] = useState([])
  
  const canvasRef = useRef(null)
  const {
    processes,
    systemStats,
    performanceHistory,
    refresh: refreshSystemMonitorData
  } = useSharedSystemMonitorData({ enabled: true, intervalMs: 2000 })

  useEffect(() => {
    const handleWindowsChanged = (event) => {
      const payload = event?.detail?.windows
      setDesktopWindows(Array.isArray(payload) ? payload : [])
    }

    window.addEventListener('desktop-windows-changed', handleWindowsChanged)
    window.dispatchEvent(new CustomEvent('desktop-windows-request'))

    return () => {
      window.removeEventListener('desktop-windows-changed', handleWindowsChanged)
    }
  }, [])

  useEffect(() => {
    const syncDesktopWindows = () => {
      const snapshot = readDesktopWindowSnapshot()
      setDesktopWindows((previous) => {
        if (previous.length === snapshot.length && previous.every((item, index) => item.id === snapshot[index]?.id)) {
          return previous
        }
        return snapshot
      })
    }

    syncDesktopWindows()
    const intervalId = window.setInterval(syncDesktopWindows, 1000)
    return () => window.clearInterval(intervalId)
  }, [])

  const mergedProcesses = useMemo(() => {
    const backendProcessMap = new Map(
      (Array.isArray(processes) ? processes : []).map((proc) => [Number(proc.pid), proc])
    )

    const merged = new Map()

    ;(Array.isArray(processes) ? processes : []).forEach((proc) => {
      merged.set(Number(proc.pid), proc)
    })

    desktopWindows.forEach((win) => {
      const pid = Number(win.id)
      if (!merged.has(pid) && !backendProcessMap.has(pid)) {
        merged.set(pid, {
          pid,
          app: win.title || win.appId || 'Unknown App',
          cpu_usage: 0.5,
          memory: Number(win.memory) || 12,
          state: 'running',
          isSynthetic: true
        })
      }
    })

    return Array.from(merged.values())
  }, [desktopWindows, processes])

  useEffect(() => {
    loadAllData()
    const interval = setInterval(() => {
      if (activeTab === 'disk') loadDiskData()
    }, 2000)
    return () => clearInterval(interval)
  }, [activeTab])

  useEffect(() => {
    const memoryPercent = systemStats.totalMemory
      ? (systemStats.usedMemory / systemStats.totalMemory) * 100
      : 0
    const diskPercent = diskData?.volumes?.[0]?.usage_percent ?? 0

    setSimulatedHistory((prev) => {
      const next = [
        ...prev,
        {
          cpu_usage: Number(systemStats.cpuUsage) || 0,
          memory_percent: Number(memoryPercent) || 0,
          disk_percent: Number(diskPercent) || 0,
          process_count: mergedProcesses.filter((proc) => proc.state === 'running').length
        }
      ]
      return next.slice(-60)
    })
  }, [systemStats, diskData, mergedProcesses])

  useEffect(() => {
    if (activeTab === 'performance' && canvasRef.current) {
      const history = simulatedHistory.length > 0 ? simulatedHistory : performanceHistory
      drawPerformanceGraph(history)
    }
  }, [simulatedHistory, performanceHistory, activeTab])

  useEffect(() => {
    const existingJobs = readPrintJobs()
    if (existingJobs.length > 0) {
      setIoQueue(existingJobs)
      setActivePrintJobs(existingJobs.filter((job) => job.status !== 'complete'))
      setCurrentPrintJob(existingJobs.find((job) => job.status !== 'complete') || null)
    }

    const handlePrintJob = (event) => {
      const incoming = event.detail || {}
      const printJob = incoming.id ? incoming : enqueuePrintJob(incoming)

      setCurrentPrintJob(printJob)
      setIoQueue((prev) => (prev.some((job) => job.id === printJob.id) ? prev : [...prev, printJob]))
      setActivePrintJobs((prev) => (prev.some((job) => job.id === printJob.id) ? prev : [...prev, printJob]))
    }

    window.addEventListener('submit-print-job', handlePrintJob)
    return () => window.removeEventListener('submit-print-job', handlePrintJob)
  }, [])

  const loadAllData = async () => {
    await Promise.all([
      refreshSystemMonitorData(),
      loadStartupProcesses(),
      loadDiskData(),
      loadUsers(),
      loadServices(),
      loadAppHistory()
    ])
  }

  const loadStartupProcesses = async () => {
    try {
      const response = await fetch('http://localhost:8000/system/startup-processes')
      if (response.ok) {
        const data = await response.json()
        setStartupProcesses(data.startup_processes || [])
      }
    } catch (error) {
      console.error('Failed to load startup processes:', error)
    }
  }

  const loadDiskData = async () => {
    try {
      const response = await fetch('http://localhost:8000/system/disk-management')
      if (response.ok) {
        const data = await response.json()
        setDiskData(data)
      }
    } catch (error) {
      console.error('Failed to load disk data:', error)
    }
  }

  const updateDiskScheduler = async (policy, direction) => {
    try {
      setDiskActionMessage('Applying disk scheduler...')
      const response = await fetch('http://localhost:8000/system/disk-management/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          policy,
          direction
        })
      })

      if (!response.ok) {
        throw new Error('Unable to update scheduler')
      }

      setDiskActionMessage(`Disk scheduler set to ${policy} (${direction}).`)
      await loadDiskData()
    } catch (error) {
      setDiskActionMessage('Failed to update disk scheduler.')
    }
  }

  const createDiskPartition = async () => {
    const sizeGb = Number(partitionForm.sizeGb)
    if (!partitionForm.label.trim() || !Number.isFinite(sizeGb) || sizeGb <= 1) {
      setDiskActionMessage('Enter a partition label and a valid size greater than 1 GB.')
      return
    }

    try {
      setDiskActionMessage('Creating partition...')
      const response = await fetch('http://localhost:8000/system/disk-management/partitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: partitionForm.label,
          size_gb: sizeGb,
          file_system: partitionForm.fileSystem
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to create partition')
      }

      setDiskActionMessage(`Partition ${data.partition.drive} (${partitionForm.label}) created.`)
      await loadDiskData()
    } catch (error) {
      setDiskActionMessage(error instanceof Error ? error.message : 'Failed to create partition.')
    }
  }

  const resizeDiskPartition = async (drive, currentBytes) => {
    const currentGb = Math.max(1, Math.round(currentBytes / (1024 * 1024 * 1024)))
    const nextSize = window.prompt(`Resize ${drive} partition (GB):`, String(currentGb))
    if (!nextSize) return

    const sizeGb = Number(nextSize)
    if (!Number.isFinite(sizeGb) || sizeGb <= 1) {
      setDiskActionMessage('Enter a valid partition size greater than 1 GB.')
      return
    }

    try {
      setDiskActionMessage(`Resizing ${drive} partition...`)
      const response = await fetch(`http://localhost:8000/system/disk-management/partitions/${encodeURIComponent(drive)}/resize`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ size_gb: sizeGb })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to resize partition')
      }

      setDiskActionMessage(`${drive} resized to ${sizeGb} GB.`)
      await loadDiskData()
    } catch (error) {
      setDiskActionMessage(error instanceof Error ? error.message : 'Failed to resize partition.')
    }
  }

  const formatDiskPartition = async (drive) => {
    const fileSystem = window.prompt(`Format ${drive} as file system (NTFS/exFAT/FAT32):`, 'NTFS')
    if (!fileSystem) return

    try {
      setDiskActionMessage(`Formatting ${drive}...`)
      const response = await fetch(`http://localhost:8000/system/disk-management/partitions/${encodeURIComponent(drive)}/format`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_system: fileSystem.toUpperCase() })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to format partition')
      }

      setDiskActionMessage(`${drive} formatted to ${data.partition.file_system}.`)
      await loadDiskData()
    } catch (error) {
      setDiskActionMessage(error instanceof Error ? error.message : 'Failed to format partition.')
    }
  }

  const deleteDiskPartition = async (drive) => {
    const confirmed = window.confirm(`Delete partition ${drive}? This simulated action cannot be undone.`)
    if (!confirmed) return

    try {
      setDiskActionMessage(`Deleting ${drive}...`)
      const response = await fetch(`http://localhost:8000/system/disk-management/partitions/${encodeURIComponent(drive)}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to delete partition')
      }

      setDiskActionMessage(`${drive} deleted.`)
      await loadDiskData()
    } catch (error) {
      setDiskActionMessage(error instanceof Error ? error.message : 'Failed to delete partition.')
    }
  }

  const loadUsers = async () => {
    try {
      const response = await fetch('http://localhost:8000/system/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to load users:', error)
    }
  }

  const loadServices = async () => {
    try {
      const response = await fetch('http://localhost:8000/system/services')
      if (response.ok) {
        const data = await response.json()
        setServices(data.services || [])
      }
    } catch (error) {
      console.error('Failed to load services:', error)
    }
  }

  const loadAppHistory = async () => {
    try {
      const response = await fetch('http://localhost:8000/system/app-history')
      if (response.ok) {
        const data = await response.json()
        setAppHistory(data.app_history || [])
      }
    } catch (error) {
      console.error('Failed to load app history:', error)
    }
  }

  const handleKillProcess = async (pid, isSynthetic = false) => {
    if (isSynthetic) {
      window.dispatchEvent(new CustomEvent('process-terminated', { detail: { pid } }))
      return
    }

    try {
      const response = await fetch(`http://localhost:8000/process/kill?pid=${pid}`, { method: 'POST' })
      if (response.ok) {
        window.dispatchEvent(new CustomEvent('process-terminated', { detail: { pid } }))
      }
      refreshSystemMonitorData()
    } catch (error) {
      console.error('Failed to kill process:', error)
    }
  }

  const handleForceKillProcess = async (pid, isSynthetic = false) => {
    if (isSynthetic) {
      window.dispatchEvent(new CustomEvent('process-terminated', { detail: { pid } }))
      return
    }

    if (confirm('Force kill this process? This may cause system instability.')) {
      try {
        const response = await fetch(`http://localhost:8000/process/force-kill?pid=${pid}`, { method: 'POST' })
        if (response.ok) {
          window.dispatchEvent(new CustomEvent('process-terminated', { detail: { pid } }))
        }
        refreshSystemMonitorData()
      } catch (error) {
        console.error('Failed to force kill process:', error)
      }
    }
  }

  const handleToggleStartup = async (appName, isCurrentlyStartup) => {
    try {
      const url = isCurrentlyStartup
        ? `http://localhost:8000/system/startup-processes/remove?app_name=${encodeURIComponent(appName)}`
        : `http://localhost:8000/system/startup-processes/add?app_name=${encodeURIComponent(appName)}`
      
      const method = isCurrentlyStartup ? 'DELETE' : 'POST'
      const response = await fetch(url, { method })
      
      if (response.ok) {
        loadStartupProcesses()
      }
    } catch (error) {
      console.error('Failed to toggle startup:', error)
    }
  }

  const drawPerformanceGraph = (history) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height
    const padding = 40

    ctx.fillStyle = '#1e1e1e'
    ctx.fillRect(0, 0, width, height)

    ctx.strokeStyle = '#333'
    ctx.lineWidth = 1
    for (let i = 0; i <= 10; i++) {
      const y = padding + (height - padding * 2) * (i / 10)
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
    }

    ctx.fillStyle = '#888'
    ctx.font = '12px monospace'
    ctx.textAlign = 'right'
    for (let i = 0; i <= 10; i++) {
      const y = padding + (height - padding * 2) * (i / 10)
      const value = 100 - (i * 10)
      ctx.fillText(`${value}%`, padding - 5, y + 4)
    }

    if (history.length < 2) return

    const dataPoints = history.slice(-60)
    const stepX = (width - padding * 2) / (dataPoints.length - 1)

    ctx.strokeStyle = '#4CAF50'
    ctx.lineWidth = 2
    ctx.beginPath()
    dataPoints.forEach((point, index) => {
      const x = padding + index * stepX
      const y = padding + (height - padding * 2) * (1 - point.cpu_usage / 100)
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    ctx.strokeStyle = '#2196F3'
    ctx.lineWidth = 2
    ctx.beginPath()
    dataPoints.forEach((point, index) => {
      const x = padding + index * stepX
      const y = padding + (height - padding * 2) * (1 - point.memory_percent / 100)
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    ctx.strokeStyle = '#F59E0B'
    ctx.lineWidth = 2
    ctx.beginPath()
    dataPoints.forEach((point, index) => {
      const x = padding + index * stepX
      const y = padding + (height - padding * 2) * (1 - (point.disk_percent || 0) / 100)
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    ctx.font = '14px monospace'
    ctx.fillStyle = '#4CAF50'
    ctx.fillText('■ CPU', width - 150, 30)
    ctx.fillStyle = '#2196F3'
    ctx.fillText('■ Memory', width - 150, 50)
    ctx.fillStyle = '#F59E0B'
    ctx.fillText('■ Disk', width - 150, 70)
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const sortProcesses = (procs) => {
    return [...procs].sort((a, b) => {
      let aVal = a[sortBy]
      let bVal = b[sortBy]
      
      if (sortBy === 'memory' || sortBy === 'cpu_usage' || sortBy === 'pid') {
        aVal = Number(aVal)
        bVal = Number(bVal)
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })
  }

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  const sortedProcesses = sortProcesses(mergedProcesses)
  const runningProcessCount = mergedProcesses.filter((proc) => proc.state === 'running').length
  const memoryUsagePercent = systemStats.totalMemory
    ? (systemStats.usedMemory / systemStats.totalMemory) * 100
    : 0
  const diskUsagePercent = diskData?.volumes?.[0]?.usage_percent ?? 0

  return (
    <div className="app-monitor">
      <div className="monitor-container">
        {/* Sidebar Navigation */}
        <div className="monitor-sidebar">
          <div className="monitor-sidebar-title">Task Manager</div>
          <nav className="monitor-nav">
            <button
              className={`monitor-nav-item ${activeTab === 'processes' ? 'active' : ''}`}
              onClick={() => setActiveTab('processes')}
            >
              <span className="monitor-nav-icon">⚙️</span>
              <span className="monitor-nav-label">Processes</span>
            </button>
            <button
              className={`monitor-nav-item ${activeTab === 'performance' ? 'active' : ''}`}
              onClick={() => setActiveTab('performance')}
            >
              <span className="monitor-nav-icon">📊</span>
              <span className="monitor-nav-label">Performance</span>
            </button>
            <button
              className={`monitor-nav-item ${activeTab === 'disk' ? 'active' : ''}`}
              onClick={() => setActiveTab('disk')}
            >
              <span className="monitor-nav-icon">💾</span>
              <span className="monitor-nav-label">Disk</span>
            </button>
            <button
              className={`monitor-nav-item ${activeTab === 'startup' ? 'active' : ''}`}
              onClick={() => setActiveTab('startup')}
            >
              <span className="monitor-nav-icon">🚀</span>
              <span className="monitor-nav-label">Startup Apps</span>
            </button>
            <button
              className={`monitor-nav-item ${activeTab === 'app-history' ? 'active' : ''}`}
              onClick={() => setActiveTab('app-history')}
            >
              <span className="monitor-nav-icon">📜</span>
              <span className="monitor-nav-label">App History</span>
            </button>
            <button
              className={`monitor-nav-item ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <span className="monitor-nav-icon">👥</span>
              <span className="monitor-nav-label">Users</span>
            </button>
            <button
              className={`monitor-nav-item ${activeTab === 'services' ? 'active' : ''}`}
              onClick={() => setActiveTab('services')}
            >
              <span className="monitor-nav-icon">🔧</span>
              <span className="monitor-nav-label">Services</span>
            </button>
            <button
              className={`monitor-nav-item ${activeTab === 'io' ? 'active' : ''}`}
              onClick={() => setActiveTab('io')}
            >
              <span className="monitor-nav-icon">🖨️</span>
              <span className="monitor-nav-label">I/O Devices</span>
            </button>
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="monitor-content">
          {/* PROCESSES TAB */}
          {activeTab === 'processes' && (
            <>
              <div className="monitor-section">
                <div className="monitor-stats-grid">
                  <div className="monitor-stat-card">
                    <div className="monitor-stat-label">CPU Usage</div>
                    <div className="monitor-stat-value-large">{systemStats.cpuUsage.toFixed(1)}%</div>
                    <div className="monitor-stat-bar">
                      <div
                        className="monitor-stat-fill cpu"
                        style={{ width: `${systemStats.cpuUsage}%` }}
                      />
                    </div>
                  </div>
                  <div className="monitor-stat-card">
                    <div className="monitor-stat-label">Memory Usage</div>
                    <div className="monitor-stat-value-large">
                      {systemStats.usedMemory} / {systemStats.totalMemory} MB
                    </div>
                    <div className="monitor-stat-bar">
                      <div
                        className="monitor-stat-fill memory"
                        style={{ width: `${(systemStats.usedMemory / systemStats.totalMemory) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="monitor-stat-card">
                    <div className="monitor-stat-label">Active Processes</div>
                    <div className="monitor-stat-value-large">{runningProcessCount}</div>
                  </div>
                </div>
              </div>

              <div className="monitor-section">
                <div className="monitor-title">Process List</div>
                <div className="monitor-process-table">
                  <div className="monitor-process-header">
                    <span onClick={() => handleSort('pid')}>PID {sortBy === 'pid' && (sortOrder === 'asc' ? '▲' : '▼')}</span>
                    <span onClick={() => handleSort('app')}>App {sortBy === 'app' && (sortOrder === 'asc' ? '▲' : '▼')}</span>
                    <span onClick={() => handleSort('cpu_usage')}>CPU {sortBy === 'cpu_usage' && (sortOrder === 'asc' ? '▲' : '▼')}</span>
                    <span onClick={() => handleSort('memory')}>Memory {sortBy === 'memory' && (sortOrder === 'asc' ? '▲' : '▼')}</span>
                    <span onClick={() => handleSort('state')}>State {sortBy === 'state' && (sortOrder === 'asc' ? '▲' : '▼')}</span>
                    <span>Actions</span>
                  </div>
                  <div className="monitor-process-list">
                    {sortedProcesses.length === 0 ? (
                      <div className="monitor-empty">No processes running</div>
                    ) : (
                      sortedProcesses.map((proc) => (
                        <div key={proc.pid} className="monitor-process-row">
                          <span>{proc.pid}</span>
                          <span>{proc.app}</span>
                          <span>{proc.cpu_usage?.toFixed(1) || '0.0'}%</span>
                          <span>{proc.memory} MB</span>
                          <span><span className={`monitor-state-badge ${proc.state}`}>{proc.state}</span></span>
                          <span>
                            {proc.state === 'running' && (
                              <div className="monitor-action-buttons">
                                <button
                                  type="button"
                                  className="monitor-kill-btn"
                                  onClick={() => handleKillProcess(proc.pid, proc.isSynthetic)}
                                >
                                  End
                                </button>
                                <button
                                  type="button"
                                  className="monitor-force-kill-btn"
                                  onClick={() => handleForceKillProcess(proc.pid, proc.isSynthetic)}
                                >
                                  Force
                                </button>
                              </div>
                            )}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* PERFORMANCE TAB */}
          {activeTab === 'performance' && (
            <div className="monitor-section">
              <div className="monitor-title">Performance History</div>
              <div className="monitor-performance-stats">
                <div className="monitor-perf-stat">
                  <span className="monitor-perf-label">CPU:</span>
                  <span className="monitor-perf-value cpu-color">{systemStats.cpuUsage.toFixed(1)}%</span>
                </div>
                <div className="monitor-perf-stat">
                  <span className="monitor-perf-label">Memory:</span>
                  <span className="monitor-perf-value memory-color">{memoryUsagePercent.toFixed(1)}%</span>
                </div>
                <div className="monitor-perf-stat">
                  <span className="monitor-perf-label">Disk:</span>
                  <span className="monitor-perf-value disk-color">{diskUsagePercent.toFixed(1)}%</span>
                </div>
                <div className="monitor-perf-stat">
                  <span className="monitor-perf-label">Processes:</span>
                  <span className="monitor-perf-value process-color">{runningProcessCount}</span>
                </div>
              </div>
              <canvas
                ref={canvasRef}
                width={800}
                height={400}
                className="monitor-performance-graph"
              />
            </div>
          )}

          {/* DISK TAB */}
          {activeTab === 'disk' && (
            <div className="monitor-section">
              <div className="monitor-title">Disk Management</div>
              {diskData ? (
                <>
                  <div className="monitor-disk-controls">
                    <div className="monitor-disk-title">Disk Scheduler</div>
                    <div className="monitor-disk-controls-row">
                      <select
                        className="monitor-disk-select"
                        value={diskData.scheduler?.policy || 'FCFS'}
                        onChange={(event) => updateDiskScheduler(event.target.value, diskData.scheduler?.direction || 'right')}
                      >
                        {(diskData.scheduler?.supported_policies || ['FCFS', 'SSTF', 'SCAN', 'C-SCAN']).map((policy) => (
                          <option key={policy} value={policy}>{policy}</option>
                        ))}
                      </select>
                      <select
                        className="monitor-disk-select"
                        value={diskData.scheduler?.direction || 'right'}
                        onChange={(event) => updateDiskScheduler(diskData.scheduler?.policy || 'FCFS', event.target.value)}
                      >
                        <option value="right">Direction: Right</option>
                        <option value="left">Direction: Left</option>
                      </select>
                    </div>
                    <div className="monitor-disk-help">
                      Head track: {diskData.scheduler?.head_track ?? 0}
                    </div>
                    {diskData.schedule && (
                      <div className="monitor-disk-help">
                        Requests: {diskData.schedule.request_count} | Total seek: {diskData.schedule.total_seek_tracks} tracks | Avg seek: {diskData.schedule.average_seek_tracks}
                      </div>
                    )}
                  </div>

                  <div className="monitor-disk-partitions">
                    <div className="monitor-disk-title">Disk Partitions</div>
                    <div className="monitor-disk-item-list">
                      {diskData.partitions?.map((partition) => (
                        <div key={partition.drive} className="monitor-disk-item">
                          <div className="monitor-disk-item-info">
                            <span className="monitor-disk-item-path">{partition.drive} ({partition.label})</span>
                            <span className="monitor-disk-item-type">
                              {partition.file_system} · {partition.type} · {partition.health}
                            </span>
                          </div>
                          <div className="monitor-disk-item-size">
                            <span>{formatBytes(partition.used_bytes)} / {formatBytes(partition.total_bytes)}</span>
                            <span className="monitor-disk-usage-percent">{partition.usage_percent}%</span>
                          </div>
                          <div className="monitor-disk-actions">
                            <button
                              type="button"
                              className="monitor-disk-action-btn"
                              onClick={() => resizeDiskPartition(partition.drive, partition.total_bytes)}
                              disabled={partition.is_protected}
                            >
                              Resize
                            </button>
                            <button
                              type="button"
                              className="monitor-disk-action-btn"
                              onClick={() => formatDiskPartition(partition.drive)}
                              disabled={partition.is_protected}
                            >
                              Format
                            </button>
                            <button
                              type="button"
                              className="monitor-disk-action-btn danger"
                              onClick={() => deleteDiskPartition(partition.drive)}
                              disabled={partition.is_protected}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="monitor-disk-partition-form">
                      <input
                        type="text"
                        className="monitor-disk-input"
                        placeholder="Partition label"
                        value={partitionForm.label}
                        onChange={(event) => setPartitionForm((prev) => ({ ...prev, label: event.target.value }))}
                      />
                      <input
                        type="number"
                        min="2"
                        step="1"
                        className="monitor-disk-input"
                        placeholder="Size (GB)"
                        value={partitionForm.sizeGb}
                        onChange={(event) => setPartitionForm((prev) => ({ ...prev, sizeGb: event.target.value }))}
                      />
                      <select
                        className="monitor-disk-select"
                        value={partitionForm.fileSystem}
                        onChange={(event) => setPartitionForm((prev) => ({ ...prev, fileSystem: event.target.value }))}
                      >
                        <option value="NTFS">NTFS</option>
                        <option value="exFAT">exFAT</option>
                        <option value="FAT32">FAT32</option>
                      </select>
                      <button type="button" className="monitor-disk-button" onClick={createDiskPartition}>
                        Create Partition
                      </button>
                    </div>
                    <div className="monitor-disk-help">
                      Unallocated space: {formatBytes(diskData.unallocated_bytes || 0)}
                    </div>
                    {diskActionMessage ? <div className="monitor-disk-message">{diskActionMessage}</div> : null}
                  </div>

                  <div className="monitor-disk-volumes">
                    <div className="monitor-disk-title">Volumes</div>
                    {diskData.volumes.map((volume, idx) => (
                      <div key={idx} className="monitor-disk-volume">
                        <div className="monitor-disk-volume-name">{volume.drive} ({volume.type})</div>
                        <div className="monitor-disk-volume-bar">
                          <div
                            className="monitor-disk-volume-used"
                            style={{ width: `${volume.usage_percent}%` }}
                          />
                        </div>
                        <div className="monitor-disk-volume-stats">
                          <span>{formatBytes(volume.used_bytes)} / {formatBytes(volume.total_bytes)}</span>
                          <span className="monitor-disk-usage-percent">{volume.usage_percent}%</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="monitor-disk-items">
                    <div className="monitor-disk-title">Top Folders</div>
                    <div className="monitor-disk-item-list">
                      {diskData.disk_items.slice(0, 20).map((item, idx) => (
                        <div key={idx} className="monitor-disk-item">
                          <div className="monitor-disk-item-info">
                            <span className="monitor-disk-item-path">{item.path}</span>
                            <span className="monitor-disk-item-type">{item.type}</span>
                          </div>
                          <div className="monitor-disk-item-size">
                            <span>{formatBytes(item.size_bytes)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="monitor-empty">Loading disk simulation data...</div>
              )}
            </div>
          )}

          {/* STARTUP TAB */}
          {activeTab === 'startup' && (
            <div className="monitor-section">
              <div className="monitor-title">Startup Programs</div>
              <div className="monitor-startup-list">
                {mergedProcesses.filter((p) => p.state === 'running').map((proc) => (
                  <div key={proc.pid} className="monitor-startup-item">
                    <div className="monitor-startup-details">
                      <div className="monitor-startup-name">{proc.app}</div>
                      <div className="monitor-startup-status">
                        {proc.is_startup ? (
                          <span className="monitor-startup-enabled">✓ Enabled</span>
                        ) : (
                          <span className="monitor-startup-disabled">Disabled</span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`monitor-startup-toggle ${proc.is_startup ? 'enabled' : 'disabled'}`}
                      onClick={() => handleToggleStartup(proc.app, proc.is_startup)}
                    >
                      {proc.is_startup ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* APP HISTORY TAB */}
          {activeTab === 'app-history' && (
            <div className="monitor-section">
              <div className="monitor-title">App History</div>
              <div className="monitor-app-history-list">
                {appHistory.map((app, idx) => (
                  <div key={idx} className="monitor-app-history-item">
                    <div className="monitor-app-history-info">
                      <div className="monitor-app-history-name">{app.app_name}</div>
                      <div className="monitor-app-history-details">
                        <span>Opened: {new Date(app.last_opened).toLocaleString()}</span>
                        <span>Runtime: {app.total_runtime_hours.toFixed(1)}h</span>
                        <span>Times opened: {app.open_count}</span>
                      </div>
                    </div>
                    <div className={`monitor-app-history-status ${app.status}`}>
                      {app.status === 'running' ? '▶ Running' : '⏹ Closed'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div className="monitor-section">
              <div className="monitor-title">Users</div>
              <div className="monitor-users-list">
                {users.map((user, idx) => (
                  <div key={idx} className="monitor-user-item">
                    <div className="monitor-user-info">
                      <div className="monitor-user-name">{user.full_name}</div>
                      <div className="monitor-user-details">
                        <span>Username: {user.username}</span>
                        <span>Type: {user.type}</span>
                      </div>
                    </div>
                    <div className={`monitor-user-status ${user.status}`}>
                      {user.status === 'logged_in' ? '🟢 Logged In' : '🔴 Logged Out'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SERVICES TAB */}
          {activeTab === 'services' && (
            <div className="monitor-section">
              <div className="monitor-title">Services</div>
              <div className="monitor-services-list">
                {services.map((service, idx) => (
                  <div key={idx} className="monitor-service-item">
                    <div className="monitor-service-info">
                      <div className="monitor-service-name">{service.name}</div>
                      <div className="monitor-service-description">{service.description}</div>
                    </div>
                    <div className="monitor-service-status">
                      <span className={`monitor-service-badge ${service.status}`}>
                        {service.status === 'running' ? '▶ Running' : '⏹ Stopped'}
                      </span>
                      <span className="monitor-service-type">{service.startup_type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* I/O DEVICES TAB */}
          {activeTab === 'io' && (
            <div className="monitor-section">
              <div className="monitor-title">I/O Devices & Print Queue</div>
              <div className="monitor-io-summary">
                <div className="monitor-io-metric">
                  <span className="monitor-io-label">Active Print Jobs</span>
                  <span className="monitor-io-value">{ioQueue.length}</span>
                </div>
                <div className="monitor-io-metric">
                  <span className="monitor-io-label">Printer Status</span>
                  <span className="monitor-io-value">{currentPrintJob ? 'Printing' : 'Ready'}</span>
                </div>
              </div>

              <div className="monitor-io-devices">
                <div className="monitor-io-devices-title">Devices</div>
                {printerDevices.map((device) => (
                  <div key={device.id} className={`monitor-io-device ${device.status}`}>
                    <div className="monitor-io-device-info">
                      <div className="monitor-io-device-name">{device.name}</div>
                      <div className="monitor-io-device-type">{device.type}</div>
                    </div>
                    <span className={`monitor-io-status-badge ${device.status}`}>
                      {device.status === 'ready' ? '✓ Ready' : '⚙ Busy'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="monitor-io-queue">
                <div className="monitor-io-queue-title">Print Queue</div>
                {ioQueue.length === 0 ? (
                  <div className="monitor-io-empty">No print jobs</div>
                ) : (
                  <div className="monitor-io-queue-list">
                    {ioQueue.map((job, idx) => (
                      <div key={job.id} className="monitor-print-job">
                        <div className="monitor-print-job-info">
                          <div className="monitor-print-job-name">{job.jobName || job.fileName}</div>
                          <div className="monitor-print-job-details">
                            {job.pages} page{job.pages !== 1 ? 's' : ''} • {job.colorMode || 'color'}
                          </div>
                        </div>
                        <span className={`monitor-print-job-badge ${job === currentPrintJob ? 'active' : 'queued'}`}>
                          {job === currentPrintJob ? '🖨️ Printing' : '📋 Queued'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {currentPrintJob && (
        <PrintingSimulation
          printJob={currentPrintJob}
          onClose={() => {
            updatePrintJobStatus(currentPrintJob.id, 'complete')
            setCurrentPrintJob(null)
            setIoQueue((prev) => prev.map((job) => (
              job.id === currentPrintJob.id ? { ...job, status: 'complete' } : job
            )))
            setActivePrintJobs((prev) => prev.filter((job) => job.id !== currentPrintJob.id))
          }}
        />
      )}
    </div>
  )
}
