import { useEffect, useState, useRef } from 'react'

import PrintingSimulation from '../components/PrintingSimulation'
import { useSharedSystemMonitorData } from '../hooks/useSharedSystemMonitorData'
import { readPrintJobs, updatePrintJobStatus, enqueuePrintJob } from '../utils/printJobs'

// ─── CPU Scheduling Algorithms ───────────────────────────────────────────────

function runFCFS(jobs) {
  let time = 0
  return jobs.map((job) => {
    const start = Math.max(time, job.arrival)
    const end = start + job.burst
    time = end
    return {
      ...job,
      start,
      end,
      waiting: start - job.arrival,
      turnaround: end - job.arrival
    }
  })
}

function runRR(jobs, quantum = 3) {
  const queue = jobs.map((j) => ({ ...j, remaining: j.burst }))
  const result = jobs.map((j) => ({ ...j, start: -1, end: 0, waiting: 0, turnaround: 0, segments: [] }))
  let time = 0
  const ready = []
  const arrived = new Set()
  let idx = 0

  queue.sort((a, b) => a.arrival - b.arrival)

  while (true) {
    queue.forEach((j, i) => {
      if (j.arrival <= time && !arrived.has(i)) {
        arrived.add(i)
        ready.push(i)
      }
    })

    if (ready.length === 0) {
      if (queue.every((j) => j.remaining === 0)) break
      time++
      continue
    }

    const i = ready.shift()
    const job = queue[i]
    if (result[i].start === -1) result[i].start = time

    const slice = Math.min(quantum, job.remaining)
    result[i].segments.push({ start: time, end: time + slice })
    time += slice
    job.remaining -= slice

    queue.forEach((j, k) => {
      if (j.arrival <= time && !arrived.has(k)) {
        arrived.add(k)
        ready.push(k)
      }
    })

    if (job.remaining > 0) {
      ready.push(i)
    } else {
      result[i].end = time
      result[i].turnaround = time - result[i].start
      result[i].waiting = result[i].turnaround - jobs[i].burst
    }
  }

  return result
}

// ─── Disk Scheduling Algorithms ──────────────────────────────────────────────

function diskFCFS(requests, head) {
  let pos = head
  let totalSeek = 0
  const order = [pos]
  for (const r of requests) {
    totalSeek += Math.abs(r - pos)
    pos = r
    order.push(pos)
  }
  return { order, totalSeek }
}

function diskSSTF(requests, head) {
  let pos = head
  let totalSeek = 0
  const order = [pos]
  const remaining = [...requests]
  while (remaining.length > 0) {
    let closest = remaining.reduce((best, r) =>
      Math.abs(r - pos) < Math.abs(best - pos) ? r : best
    )
    totalSeek += Math.abs(closest - pos)
    pos = closest
    remaining.splice(remaining.indexOf(closest), 1)
    order.push(pos)
  }
  return { order, totalSeek }
}

function diskSCAN(requests, head, maxCylinder = 199) {
  let pos = head
  let totalSeek = 0
  const order = [pos]
  const left = requests.filter((r) => r < pos).sort((a, b) => b - a)
  const right = requests.filter((r) => r >= pos).sort((a, b) => a - b)

  for (const r of right) {
    totalSeek += Math.abs(r - pos)
    pos = r
    order.push(pos)
  }
  if (right.length > 0 || left.length > 0) {
    totalSeek += Math.abs(maxCylinder - pos)
    pos = maxCylinder
    order.push(pos)
  }
  for (const r of left) {
    totalSeek += Math.abs(r - pos)
    pos = r
    order.push(pos)
  }
  return { order, totalSeek }
}

function diskCSCAN(requests, head, maxCylinder = 199) {
  let pos = head
  let totalSeek = 0
  const order = [pos]
  const right = requests.filter((r) => r >= pos).sort((a, b) => a - b)
  const left = requests.filter((r) => r < pos).sort((a, b) => a - b)

  for (const r of right) {
    totalSeek += Math.abs(r - pos)
    pos = r
    order.push(pos)
  }
  if (left.length > 0) {
    totalSeek += Math.abs(maxCylinder - pos) + maxCylinder
    pos = 0
    order.push(maxCylinder)
    order.push(0)
    for (const r of left) {
      totalSeek += Math.abs(r - pos)
      pos = r
      order.push(pos)
    }
  }
  return { order, totalSeek }
}

// ─── Default simulation data ─────────────────────────────────────────────────

const DEFAULT_CPU_JOBS = [
  { id: 'P1', arrival: 0, burst: 5 },
  { id: 'P2', arrival: 1, burst: 3 },
  { id: 'P3', arrival: 2, burst: 8 },
  { id: 'P4', arrival: 3, burst: 2 },
  { id: 'P5', arrival: 4, burst: 4 }
]

const DEFAULT_DISK_REQUESTS = [98, 183, 37, 122, 14, 124, 65, 67]
const DEFAULT_DISK_HEAD = 53

const COLORS = ['#4CAF50', '#2196F3', '#F59E0B', '#EF4444', '#A855F7', '#EC4899', '#14B8A6', '#F97316']

const SECTIONS = [
  { id: 'processes', label: 'Processes', icon: '⚙️' },
  { id: 'performance', label: 'Performance', icon: '📊' },
  { id: 'disk', label: 'Disk', icon: '💾' },
  { id: 'startup', label: 'Startup Apps', icon: '🚀' },
  { id: 'app-history', label: 'App History', icon: '📜' },
  { id: 'users', label: 'Users', icon: '👥' },
  { id: 'services', label: 'Services', icon: '🔧' },
  { id: 'io', label: 'I/O Devices', icon: '🖨️' },
  { id: 'cpu-scheduling', label: 'CPU Scheduling', icon: '🧠' },
  { id: 'disk-scheduling', label: 'Disk Scheduling', icon: '📀' }
]

export default function SystemMonitor() {
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

  const [diskData, setDiskData] = useState(null)
  const [users, setUsers] = useState([])
  const [services, setServices] = useState([])
  const [appHistory, setAppHistory] = useState([])

  const [currentPrintJob, setCurrentPrintJob] = useState(null)
  const [activePrintJobs, setActivePrintJobs] = useState([])

  // ── CPU Scheduling state ──
  const [cpuAlgo, setCpuAlgo] = useState('FCFS')
  const [cpuJobs, setCpuJobs] = useState(DEFAULT_CPU_JOBS)
  const [cpuResult, setCpuResult] = useState(null)
  const [rrQuantum, setRrQuantum] = useState(3)
  const [cpuJobInput, setCpuJobInput] = useState({ id: '', arrival: '', burst: '' })

  // ── Disk Scheduling state ──
  const [diskAlgo, setDiskAlgo] = useState('FCFS')
  const [diskRequests, setDiskRequests] = useState(DEFAULT_DISK_REQUESTS)
  const [diskHead, setDiskHead] = useState(DEFAULT_DISK_HEAD)
  const [diskResult, setDiskResult] = useState(null)
  const [diskRequestInput, setDiskRequestInput] = useState('')
  const [diskHeadInput, setDiskHeadInput] = useState(String(DEFAULT_DISK_HEAD))

  const canvasRef = useRef(null)
  const {
    processes,
    systemStats,
    performanceHistory,
    refresh: refreshSystemMonitorData
  } = useSharedSystemMonitorData({ enabled: true, intervalMs: 2000 })

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
          process_count: processes.filter((proc) => proc.state === 'running').length
        }
      ]
      return next.slice(-60)
    })
  }, [systemStats, diskData, processes])

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

  // ── Run CPU scheduling when algo/jobs/quantum change ──
  useEffect(() => {
    if (cpuJobs.length === 0) { setCpuResult(null); return }
    const sorted = [...cpuJobs].sort((a, b) => a.arrival - b.arrival)
    if (cpuAlgo === 'FCFS') setCpuResult({ type: 'fcfs', data: runFCFS(sorted) })
    else if (cpuAlgo === 'RR') setCpuResult({ type: 'rr', data: runRR(sorted, rrQuantum) })
  }, [cpuAlgo, cpuJobs, rrQuantum])

  // ── Run disk scheduling when algo/requests/head change ──
  useEffect(() => {
    if (diskRequests.length === 0) { setDiskResult(null); return }
    if (diskAlgo === 'FCFS') setDiskResult(diskFCFS(diskRequests, diskHead))
    else if (diskAlgo === 'SSTF') setDiskResult(diskSSTF(diskRequests, diskHead))
    else if (diskAlgo === 'SCAN') setDiskResult(diskSCAN(diskRequests, diskHead))
    else if (diskAlgo === 'C-SCAN') setDiskResult(diskCSCAN(diskRequests, diskHead))
  }, [diskAlgo, diskRequests, diskHead])

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

  const handleKillProcess = async (pid) => {
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

  const handleForceKillProcess = async (pid) => {
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
      if (response.ok) loadStartupProcesses()
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
      ctx.fillText(`${100 - i * 10}%`, padding - 5, y + 4)
    }
    if (history.length < 2) return
    const dataPoints = history.slice(-60)
    const stepX = (width - padding * 2) / (dataPoints.length - 1)
    const drawLine = (key, color) => {
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.beginPath()
      dataPoints.forEach((point, index) => {
        const x = padding + index * stepX
        const y = padding + (height - padding * 2) * (1 - point[key] / 100)
        index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      })
      ctx.stroke()
    }
    drawLine('cpu_usage', '#4CAF50')
    drawLine('memory_percent', '#2196F3')
    drawLine('disk_percent', '#F59E0B')
    ctx.font = '14px monospace'
    ctx.fillStyle = '#4CAF50'; ctx.fillText('■ CPU', width - 150, 30)
    ctx.fillStyle = '#2196F3'; ctx.fillText('■ Memory', width - 150, 50)
    ctx.fillStyle = '#F59E0B'; ctx.fillText('■ Disk', width - 150, 70)
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
      let aVal = a[sortBy], bVal = b[sortBy]
      if (['memory', 'cpu_usage', 'pid'].includes(sortBy)) { aVal = Number(aVal); bVal = Number(bVal) }
      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1)
    })
  }

  const handleSort = (column) => {
    if (sortBy === column) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    else { setSortBy(column); setSortOrder('desc') }
  }

  // ── CPU scheduling helpers ──
  const addCpuJob = () => {
    const { id, arrival, burst } = cpuJobInput
    if (!id || arrival === '' || burst === '') return
    setCpuJobs((prev) => [...prev, { id, arrival: Number(arrival), burst: Number(burst) }])
    setCpuJobInput({ id: '', arrival: '', burst: '' })
  }

  const removeCpuJob = (id) => setCpuJobs((prev) => prev.filter((j) => j.id !== id))
  const resetCpuJobs = () => setCpuJobs(DEFAULT_CPU_JOBS)

  // ── Disk scheduling helpers ──
  const applyDiskInputs = () => {
    const reqs = diskRequestInput
      .split(',')
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n) && n >= 0 && n <= 199)
    if (reqs.length > 0) setDiskRequests(reqs)
    const h = parseInt(diskHeadInput)
    if (!isNaN(h) && h >= 0 && h <= 199) setDiskHead(h)
  }

  const resetDiskInputs = () => {
    setDiskRequests(DEFAULT_DISK_REQUESTS)
    setDiskHead(DEFAULT_DISK_HEAD)
    setDiskRequestInput('')
    setDiskHeadInput(String(DEFAULT_DISK_HEAD))
  }

  // ── Gantt chart for FCFS ──
  const renderFCFSGantt = (data) => {
    const totalTime = Math.max(...data.map((j) => j.end))
    return (
      <div className="sched-gantt">
        {data.map((job, i) => (
          <div
            key={job.id}
            className="sched-gantt-block"
            style={{
              left: `${(job.start / totalTime) * 100}%`,
              width: `${(job.burst / totalTime) * 100}%`,
              backgroundColor: COLORS[i % COLORS.length]
            }}
            title={`${job.id}: ${job.start}–${job.end}`}
          >
            {job.id}
          </div>
        ))}
        <div className="sched-gantt-axis">
          {data.map((job) => (
            <span
              key={`t-${job.id}`}
              style={{ left: `${(job.start / totalTime) * 100}%` }}
            >
              {job.start}
            </span>
          ))}
          <span style={{ left: '100%' }}>{totalTime}</span>
        </div>
      </div>
    )
  }

  // ── Gantt chart for RR (segments) ──
  const renderRRGantt = (data) => {
    const allSegs = data.flatMap((j, i) =>
      (j.segments || []).map((seg) => ({ ...seg, id: j.id, color: COLORS[i % COLORS.length] }))
    )
    allSegs.sort((a, b) => a.start - b.start)
    const totalTime = allSegs.length > 0 ? allSegs[allSegs.length - 1].end : 0
    return (
      <div className="sched-gantt">
        {allSegs.map((seg, i) => (
          <div
            key={i}
            className="sched-gantt-block"
            style={{
              left: `${(seg.start / totalTime) * 100}%`,
              width: `${((seg.end - seg.start) / totalTime) * 100}%`,
              backgroundColor: seg.color
            }}
            title={`${seg.id}: ${seg.start}–${seg.end}`}
          >
            {seg.id}
          </div>
        ))}
        <div className="sched-gantt-axis">
          {[...new Set(allSegs.map((s) => s.start))].map((t) => (
            <span key={t} style={{ left: `${(t / totalTime) * 100}%` }}>{t}</span>
          ))}
          <span style={{ left: '100%' }}>{totalTime}</span>
        </div>
      </div>
    )
  }

  // ── Disk seek chart ──
  const renderDiskChart = (result) => {
    if (!result) return null
    const { order } = result
    const MAX_CYL = 199
    const width = 600
    const height = 260
    const padX = 40
    const padY = 30
    const innerW = width - padX * 2
    const innerH = height - padY * 2

    const cx = (cyl) => padX + (cyl / MAX_CYL) * innerW
    const cy = (i) => padY + (i / (order.length - 1)) * innerH

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="sched-disk-svg">
        {/* Grid lines */}
        {[0, 50, 100, 150, 199].map((c) => (
          <g key={c}>
            <line x1={cx(c)} y1={padY} x2={cx(c)} y2={height - padY} stroke="#333" strokeWidth="1" />
            <text x={cx(c)} y={height - 8} fill="#888" fontSize="11" textAnchor="middle">{c}</text>
          </g>
        ))}
        {/* Seek path */}
        {order.slice(0, -1).map((_, i) => (
          <line
            key={i}
            x1={cx(order[i])} y1={cy(i)}
            x2={cx(order[i + 1])} y2={cy(i + 1)}
            stroke="#2196F3" strokeWidth="2"
          />
        ))}
        {/* Points */}
        {order.map((cyl, i) => (
          <g key={i}>
            <circle cx={cx(cyl)} cy={cy(i)} r="5"
              fill={i === 0 ? '#F59E0B' : '#4CAF50'} />
            <text x={cx(cyl) + 7} y={cy(i) + 4} fill="#ccc" fontSize="10">{cyl}</text>
          </g>
        ))}
      </svg>
    )
  }

  const sortedProcesses = sortProcesses(processes)
  const runningProcessCount = processes.filter((proc) => proc.state === 'running').length
  const memoryUsagePercent = systemStats.totalMemory
    ? (systemStats.usedMemory / systemStats.totalMemory) * 100 : 0
  const diskUsagePercent = diskData?.volumes?.[0]?.usage_percent ?? 0

  // ── avg stats helpers ──
  const avg = (arr) => arr.length ? (arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(2) : '—'

  return (
    <div className="app-monitor">
      <div className="monitor-container">
        {/* Sidebar Navigation */}
        <div className="monitor-sidebar">
          <div className="monitor-sidebar-title">Task Manager</div>
          <nav className="monitor-nav">
            {SECTIONS.map(({ id, label, icon }) => (
              <button
                key={id}
                className={`monitor-nav-item ${activeTab === id ? 'active' : ''}`}
                onClick={() => setActiveTab(id)}
              >
                <span className="monitor-nav-icon">{icon}</span>
                <span className="monitor-nav-label">{label}</span>
              </button>
            ))}
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
                      <div className="monitor-stat-fill cpu" style={{ width: `${systemStats.cpuUsage}%` }} />
                    </div>
                  </div>
                  <div className="monitor-stat-card">
                    <div className="monitor-stat-label">Memory Usage</div>
                    <div className="monitor-stat-value-large">
                      {systemStats.usedMemory} / {systemStats.totalMemory} MB
                    </div>
                    <div className="monitor-stat-bar">
                      <div className="monitor-stat-fill memory"
                        style={{ width: `${(systemStats.usedMemory / systemStats.totalMemory) * 100}%` }} />
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
                    {['pid', 'app', 'cpu_usage', 'memory', 'state'].map((col) => (
                      <span key={col} onClick={() => handleSort(col)} style={{ cursor: 'pointer' }}>
                        {col.replace('_', ' ').toUpperCase()} {sortBy === col && (sortOrder === 'asc' ? '▲' : '▼')}
                      </span>
                    ))}
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
                                <button type="button" className="monitor-kill-btn" onClick={() => handleKillProcess(proc.pid)}>End</button>
                                <button type="button" className="monitor-force-kill-btn" onClick={() => handleForceKillProcess(proc.pid)}>Force</button>
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
                <div className="monitor-perf-stat"><span className="monitor-perf-label">CPU:</span><span className="monitor-perf-value cpu-color">{systemStats.cpuUsage.toFixed(1)}%</span></div>
                <div className="monitor-perf-stat"><span className="monitor-perf-label">Memory:</span><span className="monitor-perf-value memory-color">{memoryUsagePercent.toFixed(1)}%</span></div>
                <div className="monitor-perf-stat"><span className="monitor-perf-label">Disk:</span><span className="monitor-perf-value disk-color">{diskUsagePercent.toFixed(1)}%</span></div>
                <div className="monitor-perf-stat"><span className="monitor-perf-label">Processes:</span><span className="monitor-perf-value process-color">{runningProcessCount}</span></div>
              </div>
              <canvas ref={canvasRef} width={800} height={400} className="monitor-performance-graph" />
            </div>
          )}

          {/* DISK TAB */}
          {activeTab === 'disk' && (
            <div className="monitor-section">
              <div className="monitor-title">Disk Management</div>
              {diskData ? (
                <>
                  <div className="monitor-disk-volumes">
                    <div className="monitor-disk-title">Volumes</div>
                    {diskData.volumes.map((volume, idx) => (
                      <div key={idx} className="monitor-disk-volume">
                        <div className="monitor-disk-volume-name">{volume.drive} ({volume.type})</div>
                        <div className="monitor-disk-volume-bar">
                          <div className="monitor-disk-volume-used" style={{ width: `${volume.usage_percent}%` }} />
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
                          <div className="monitor-disk-item-size"><span>{formatBytes(item.size_bytes)}</span></div>
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
                {processes.filter((p) => p.state === 'running').map((proc) => (
                  <div key={proc.pid} className="monitor-startup-item">
                    <div className="monitor-startup-details">
                      <div className="monitor-startup-name">{proc.app}</div>
                      <div className="monitor-startup-status">
                        {proc.is_startup
                          ? <span className="monitor-startup-enabled">✓ Enabled</span>
                          : <span className="monitor-startup-disabled">Disabled</span>}
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
                    {ioQueue.map((job) => (
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

          {/* ── CPU SCHEDULING TAB ── */}
          {activeTab === 'cpu-scheduling' && (
            <div className="monitor-section">
              <div className="monitor-title">CPU Scheduling — Live Processes</div>

              {/* Live import banner */}
              <div className="sched-live-bar">
                <div className={`sched-live-badge ${processes.filter(p => p.state === 'running').length > 0 ? '' : 'sched-live-badge--fallback'}`}>
                  {processes.filter(p => p.state === 'running').length > 0
                    ? `🟢 ${processes.filter(p => p.state === 'running').length} live processes available`
                    : '⚠️ No live processes detected'}
                </div>
                <button
                  type="button"
                  className="sched-import-btn"
                  onClick={() => {
                    const liveJobs = processes
                      .filter((p) => p.state === 'running')
                      .slice(0, 8)
                      .map((p, i) => ({
                        id: p.app || `P${p.pid}`,
                        arrival: i,
                        burst: Math.max(1, Math.round(p.cpu_usage * 10) || Math.ceil(p.memory / 50) || 3)
                      }))
                    if (liveJobs.length > 0) setCpuJobs(liveJobs)
                  }}
                >
                  ↓ Import Live Processes
                </button>
              </div>

              {/* Algorithm selector */}
              <div className="sched-toolbar">
                <div className="sched-algo-group">
                  {['FCFS', 'RR'].map((algo) => (
                    <button
                      key={algo}
                      type="button"
                      className={`sched-algo-btn ${cpuAlgo === algo ? 'active' : ''}`}
                      onClick={() => setCpuAlgo(algo)}
                    >
                      {algo}
                    </button>
                  ))}
                </div>
                {cpuAlgo === 'RR' && (
                  <div className="sched-quantum-group">
                    <label className="sched-label">Quantum:</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      className="sched-input sched-input-sm"
                      value={rrQuantum}
                      onChange={(e) => setRrQuantum(Math.max(1, Number(e.target.value)))}
                    />
                  </div>
                )}
                <button type="button" className="sched-reset-btn" onClick={resetCpuJobs}>Reset to Default</button>
              </div>

              {/* Add job manually */}
              <div className="sched-add-row">
                <input
                  className="sched-input"
                  placeholder="ID (e.g. P6)"
                  value={cpuJobInput.id}
                  onChange={(e) => setCpuJobInput((p) => ({ ...p, id: e.target.value }))}
                />
                <input
                  type="number"
                  className="sched-input"
                  placeholder="Arrival"
                  value={cpuJobInput.arrival}
                  onChange={(e) => setCpuJobInput((p) => ({ ...p, arrival: e.target.value }))}
                />
                <input
                  type="number"
                  className="sched-input"
                  placeholder="Burst"
                  value={cpuJobInput.burst}
                  onChange={(e) => setCpuJobInput((p) => ({ ...p, burst: e.target.value }))}
                />
                <button type="button" className="sched-add-btn" onClick={addCpuJob}>Add Process</button>
              </div>

              {/* Job table */}
              <div className="sched-table-wrap">
                <table className="sched-table">
                  <thead>
                    <tr>
                      <th>Process</th>
                      <th>Arrival</th>
                      <th>Burst</th>
                      {cpuResult && <><th>Waiting</th><th>Turnaround</th></>}
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cpuJobs.map((job, i) => {
                      const res = cpuResult?.data?.find((r) => r.id === job.id)
                      // find matching live process for extra info
                      const liveProc = processes.find((p) => (p.app || `P${p.pid}`) === job.id)
                      return (
                        <tr key={job.id}>
                          <td>
                            <span className="sched-pid-dot" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            {job.id}
                            {liveProc && <span className="sched-live-tag">live</span>}
                          </td>
                          <td>{job.arrival}</td>
                          <td>
                            {job.burst}
                            {liveProc && (
                              <span className="sched-burst-hint"> (cpu: {liveProc.cpu_usage?.toFixed(1)}%)</span>
                            )}
                          </td>
                          {cpuResult && (
                            <>
                              <td>{res ? res.waiting : '—'}</td>
                              <td>{res ? res.turnaround : '—'}</td>
                            </>
                          )}
                          <td>
                            <button type="button" className="sched-remove-btn" onClick={() => removeCpuJob(job.id)}>✕</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  {cpuResult && (
                    <tfoot>
                      <tr>
                        <td colSpan="3"><strong>Averages</strong></td>
                        <td><strong>{avg(cpuResult.data.map((j) => j.waiting))}</strong></td>
                        <td><strong>{avg(cpuResult.data.map((j) => j.turnaround))}</strong></td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Gantt chart */}
              {cpuResult && (
                <div className="sched-gantt-wrap">
                  <div className="sched-section-label">
                    Gantt Chart ({cpuAlgo}{cpuAlgo === 'RR' ? ` Q=${rrQuantum}` : ''})
                  </div>
                  <div className="sched-gantt-container">
                    {cpuAlgo === 'FCFS' && renderFCFSGantt(cpuResult.data)}
                    {cpuAlgo === 'RR' && renderRRGantt(cpuResult.data)}
                  </div>
                  <div className="sched-legend">
                    {cpuJobs.map((job, i) => (
                      <span key={job.id} className="sched-legend-item">
                        <span className="sched-legend-dot" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        {job.id}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── DISK SCHEDULING TAB ── */}
          {activeTab === 'disk-scheduling' && (
            <div className="monitor-section">
              <div className="monitor-title">Disk Scheduling — Live I/O</div>

              {/* Live import banner */}
              <div className="sched-live-bar">
                <div className={`sched-live-badge ${ioQueue.length > 0 ? '' : 'sched-live-badge--fallback'}`}>
                  {ioQueue.length > 0
                    ? `🟢 ${ioQueue.length} live I/O job(s) in queue`
                    : '⚠️ No live I/O jobs — using process-derived cylinders'}
                </div>
                <button
                  type="button"
                  className="sched-import-btn"
                  onClick={() => {
                    // If there are real I/O jobs, map them to cylinder positions
                    if (ioQueue.length > 0) {
                      const requests = ioQueue
                        .map((job, i) => (job.pages ? (job.pages * 7 + i * 13) % 200 : (i * 23 + 37) % 200))
                        .filter((v, i, arr) => arr.indexOf(v) === i)
                      const head = requests[0] || 53
                      setDiskRequests(requests)
                      setDiskHead(head)
                      setDiskHeadInput(String(head))
                      setDiskRequestInput(requests.join(', '))
                    } else {
                      // Fall back to deriving from live processes
                      const runningProcs = processes.filter((p) => p.state === 'running')
                      if (runningProcs.length > 0) {
                        const requests = runningProcs
                          .map((p) => p.pid % 200)
                          .filter((v, i, arr) => arr.indexOf(v) === i)
                          .slice(0, 10)
                        const head = runningProcs[0]?.pid % 200 || 53
                        setDiskRequests(requests)
                        setDiskHead(head)
                        setDiskHeadInput(String(head))
                        setDiskRequestInput(requests.join(', '))
                      }
                    }
                  }}
                >
                  ↓ Import Live I/O Data
                </button>
              </div>

              {/* Algorithm selector */}
              <div className="sched-toolbar">
                <div className="sched-algo-group">
                  {['FCFS', 'SSTF', 'SCAN', 'C-SCAN'].map((algo) => (
                    <button
                      key={algo}
                      type="button"
                      className={`sched-algo-btn ${diskAlgo === algo ? 'active' : ''}`}
                      onClick={() => setDiskAlgo(algo)}
                    >
                      {algo}
                    </button>
                  ))}
                </div>
                <button type="button" className="sched-reset-btn" onClick={resetDiskInputs}>Reset to Default</button>
              </div>

              {/* Manual inputs */}
              <div className="sched-disk-inputs">
                <div className="sched-disk-input-group">
                  <label className="sched-label">Initial Head Position (0–199):</label>
                  <input
                    type="number"
                    min="0"
                    max="199"
                    className="sched-input sched-input-sm"
                    value={diskHeadInput}
                    onChange={(e) => setDiskHeadInput(e.target.value)}
                  />
                </div>
                <div className="sched-disk-input-group">
                  <label className="sched-label">Request Queue (comma-separated, 0–199):</label>
                  <input
                    className="sched-input sched-input-wide"
                    placeholder={DEFAULT_DISK_REQUESTS.join(', ')}
                    value={diskRequestInput}
                    onChange={(e) => setDiskRequestInput(e.target.value)}
                  />
                </div>
                <button type="button" className="sched-add-btn" onClick={applyDiskInputs}>Apply</button>
              </div>

              {/* Live I/O queue preview — shown when there are real jobs */}
              {ioQueue.length > 0 && (
                <div className="sched-live-io-list">
                  <div className="sched-section-label">Live I/O Queue</div>
                  {ioQueue.map((job, i) => (
                    <div key={job.id} className="sched-live-io-item">
                      <span className="sched-pid-dot" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="sched-live-io-name">{job.jobName || job.fileName || `Job ${i + 1}`}</span>
                      <span className="sched-live-io-meta">{job.pages} page(s)</span>
                      <span className="sched-live-io-cyl">
                        → cylinder {(job.pages ? (job.pages * 7 + i * 13) % 200 : (i * 23 + 37) % 200)}
                      </span>
                      <span className={`monitor-print-job-badge ${job.status === 'complete' ? 'queued' : 'active'}`}>
                        {job.status || 'queued'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Current config */}
              <div className="sched-disk-config">
                <span>Head: <strong>{diskHead}</strong></span>
                <span>Requests: <strong>{diskRequests.join(', ')}</strong></span>
                <span>Algorithm: <strong>{diskAlgo}</strong></span>
              </div>

              {/* Result */}
              {diskResult && (
                <>
                  <div className="sched-disk-stats">
                    <div className="sched-stat-card">
                      <div className="sched-stat-label">Total Seek Time</div>
                      <div className="sched-stat-value">{diskResult.totalSeek} cylinders</div>
                    </div>
                    <div className="sched-stat-card">
                      <div className="sched-stat-label">Seek Order</div>
                      <div className="sched-stat-value sched-stat-small">{diskResult.order.join(' → ')}</div>
                    </div>
                  </div>

                  <div className="sched-section-label">Seek Path Visualization</div>
                  <div className="sched-disk-chart-wrap">
                    {renderDiskChart(diskResult)}
                    <div className="sched-disk-legend">
                      <span><span className="sched-disk-dot" style={{ backgroundColor: '#F59E0B' }} /> Initial Head ({diskHead})</span>
                      <span><span className="sched-disk-dot" style={{ backgroundColor: '#4CAF50' }} /> Visited</span>
                      <span style={{ color: '#2196F3' }}>— Seek Path</span>
                    </div>
                  </div>
                </>
              )}
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
              setIoQueue((prev) => prev.map((job) =>
                job.id === currentPrintJob.id ? { ...job, status: 'complete' } : job
              ))
              setActivePrintJobs((prev) => prev.filter((job) => job.id !== currentPrintJob.id))
            }}
          />
        )}
      </div>
  )
}
