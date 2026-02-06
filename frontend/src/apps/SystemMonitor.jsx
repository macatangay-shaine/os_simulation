import { useEffect, useState, useRef } from 'react'

export default function SystemMonitor() {
  const [activeTab, setActiveTab] = useState('processes')
  const [processes, setProcesses] = useState([])
  const [systemStats, setSystemStats] = useState({
    totalMemory: 512,
    usedMemory: 0,
    cpuUsage: 0,
    processCount: 0
  })
  const [performanceHistory, setPerformanceHistory] = useState([])
  const [startupProcesses, setStartupProcesses] = useState([])
  const [sortBy, setSortBy] = useState('pid')
  const [sortOrder, setSortOrder] = useState('asc')
  const [scheduleAlgo, setScheduleAlgo] = useState('fcfs')
  const [timeQuantum, setTimeQuantum] = useState(4)
  const [simulatedHistory, setSimulatedHistory] = useState([])
  const [ioQueue, setIoQueue] = useState([])
  const [printerStatus, setPrinterStatus] = useState('idle')
  const [printerDevices, setPrinterDevices] = useState([
    { id: 'printer-1', name: 'HP LaserJet Pro', type: 'printer', speed: 30, status: 'ready' },
    { id: 'disk-1', name: 'SSD /dev/sda', type: 'storage', speed: 500, status: 'ready' }
  ])
  const canvasRef = useRef(null)

  useEffect(() => {
    loadSystemData()
    loadStartupProcesses()
    const interval = setInterval(() => {
      loadSystemData()
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (activeTab === 'performance' && canvasRef.current) {
      drawPerformanceGraph(simulatedHistory)
    }
  }, [simulatedHistory, activeTab])

  const loadSystemData = async () => {
    try {
      const [procResponse, resourcesResponse, historyResponse] = await Promise.all([
        fetch('http://localhost:8000/process/list'),
        fetch('http://localhost:8000/system/resources'),
        fetch('http://localhost:8000/system/performance-history')
      ])
      
      if (procResponse.ok && resourcesResponse.ok && historyResponse.ok) {
        const procData = await procResponse.json()
        const resourcesData = await resourcesResponse.json()
        const historyData = await historyResponse.json()
        
        setProcesses(procData)
        setSystemStats({
          totalMemory: resourcesData.maxMemory,
          usedMemory: resourcesData.usedMemory,
          cpuUsage: resourcesData.cpuUsage,
          processCount: resourcesData.processCount
        })
        setPerformanceHistory(historyData.history || [])
      }
    } catch (error) {
      console.error('Failed to load system data:', error)
    }
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

  const handleKillProcess = async (pid) => {
    try {
      await fetch(`http://localhost:8000/process/kill?pid=${pid}`, { method: 'POST' })
      loadSystemData()
    } catch (error) {
      console.error('Failed to kill process:', error)
    }
  }

  const handleForceKillProcess = async (pid) => {
    if (confirm('Force kill this process? This may cause system instability.')) {
      try {
        await fetch(`http://localhost:8000/process/force-kill?pid=${pid}`, { method: 'POST' })
        loadSystemData()
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

  const submitPrintJob = (jobName, pages, pid) => {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const newJob = {
      id: jobId,
      name: jobName,
      pages,
      pid,
      status: 'spooled',
      timestamp: new Date().toISOString()
    }
    setIoQueue((prev) => [...prev, newJob])
    window.dispatchEvent(new CustomEvent('print-job-submitted', { detail: newJob }))
  }

  useEffect(() => {
    const handlePrintRequest = (event) => {
      const { jobName, pages, pid } = event.detail
      submitPrintJob(jobName, pages, pid || 1)
    }
    window.addEventListener('submit-print-job', handlePrintRequest)
    return () => window.removeEventListener('submit-print-job', handlePrintRequest)
  }, [])

  useEffect(() => {
    if (ioQueue.length === 0) {
      setPrinterStatus('idle')
      setPrinterDevices((prev) =>
        prev.map((d) => (d.id === 'printer-1' ? { ...d, status: 'ready' } : d))
      )
      return
    }

    const timer = setInterval(() => {
      setIoQueue((prev) => {
        const updated = prev.map((job) => {
          const now = Date.now()
          const jobAge = now - new Date(job.timestamp).getTime()
          const spoolTime = 2000
          const printTime = 5000
          const totalTime = spoolTime + printTime

          if (jobAge < spoolTime) {
            return { ...job, status: 'spooled' }
          } else if (jobAge < totalTime) {
            return { ...job, status: 'printing' }
          } else {
            return { ...job, status: 'done' }
          }
        })

        const printingCount = updated.filter((j) => j.status === 'printing').length
        const doneCount = updated.filter((j) => j.status === 'done').length

        if (printingCount > 0) {
          setPrinterStatus('printing')
          setPrinterDevices((prev) =>
            prev.map((d) => (d.id === 'printer-1' ? { ...d, status: 'busy' } : d))
          )
        } else {
          setPrinterStatus('idle')
          setPrinterDevices((prev) =>
            prev.map((d) => (d.id === 'printer-1' ? { ...d, status: 'ready' } : d))
          )
        }

        return updated.filter((j) => j.status !== 'done' || doneCount < 5)
      })
    }, 500)

    return () => clearInterval(timer)
  }, [ioQueue.length])

  const drawPerformanceGraph = (history) => {
    const canvas = canvasRef.current
    if (!canvas || history.length === 0) return

    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height
    const padding = 40

    // Clear canvas
    ctx.fillStyle = '#1e1e1e'
    ctx.fillRect(0, 0, width, height)

    // Draw grid
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 1
    for (let i = 0; i <= 10; i++) {
      const y = padding + (height - padding * 2) * (i / 10)
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
    }

    // Draw Y-axis labels
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

    // Draw CPU line
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

    // Draw Memory line
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

    // Draw legend
    ctx.font = '14px monospace'
    ctx.fillStyle = '#4CAF50'
    ctx.fillText('■ CPU', width - 150, 30)
    ctx.fillStyle = '#2196F3'
    ctx.fillText('■ Memory', width - 150, 50)
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

  const sortedProcesses = sortProcesses(processes)

  const safeQuantum = Math.max(1, Math.min(20, Number(timeQuantum) || 1))

  const getTimeBaseline = (procs) => {
    const running = procs.filter((proc) => proc.state === 'running')
    if (running.length === 0) return null
    const times = running
      .map((proc) => Date.parse(proc.start_time))
      .filter((time) => Number.isFinite(time))
    if (times.length === 0) return null
    return Math.min(...times)
  }

  const buildSchedulingInput = (procs) => {
    const running = procs.filter((proc) => proc.state === 'running')
    if (running.length === 0) return []

    const parsedTimes = running
      .map((proc) => ({ pid: proc.pid, time: Date.parse(proc.start_time) }))
      .filter((entry) => Number.isFinite(entry.time))

    const minTime = parsedTimes.length > 0
      ? Math.min(...parsedTimes.map((entry) => entry.time))
      : null

    return running.map((proc) => {
      const rawTime = Date.parse(proc.start_time)
      const arrival = Number.isFinite(rawTime) && minTime !== null
        ? Math.max(0, Math.round((rawTime - minTime) / 1000))
        : 0
      const memoryBurst = Math.max(0.5, Math.round((proc.memory / 32) * 2) / 2)
      const cpuBurst = proc.cpu_usage ? Math.max(0.5, Math.round((proc.cpu_usage / 10) * 2) / 2) : 0.5
      const burst = Math.min(5, Math.max(memoryBurst, cpuBurst))

      return {
        pid: proc.pid,
        app: proc.app,
        arrival,
        burst
      }
    })
  }

  const computeFcfsSchedule = (items) => {
    const sorted = [...items].sort((a, b) => a.arrival - b.arrival || a.pid - b.pid)
    let time = 0
    const segments = []
    const perProcess = sorted.map((proc) => {
      if (time < proc.arrival) {
        time = proc.arrival
      }
      const start = time
      const end = time + proc.burst
      segments.push({ pid: proc.pid, app: proc.app, start, end })
      time = end
      const waiting = start - proc.arrival
      const turnaround = end - proc.arrival
      return {
        ...proc,
        start,
        completion: end,
        waiting,
        turnaround
      }
    })
    const averageWaiting = perProcess.length > 0
      ? perProcess.reduce((sum, proc) => sum + proc.waiting, 0) / perProcess.length
      : 0
    return { segments, perProcess, averageWaiting }
  }

  const computeRoundRobinSchedule = (items, quantum) => {
    const sorted = [...items].sort((a, b) => a.arrival - b.arrival || a.pid - b.pid)
    if (sorted.length === 0) {
      return { segments: [], perProcess: [], averageWaiting: 0 }
    }
    const remaining = new Map(sorted.map((proc) => [proc.pid, proc.burst]))
    const completion = new Map()
    const segments = []
    const queue = []
    let time = sorted[0].arrival
    let index = 0

    const pushArrivals = () => {
      while (index < sorted.length && sorted[index].arrival <= time) {
        queue.push(sorted[index])
        index += 1
      }
    }

    pushArrivals()

    while (completion.size < sorted.length) {
      if (queue.length === 0) {
        time = sorted[index].arrival
        pushArrivals()
        continue
      }

      const current = queue.shift()
      const remainingTime = remaining.get(current.pid) || 0
      const slice = Math.min(quantum, remainingTime)
      const start = time
      const end = time + slice
      segments.push({ pid: current.pid, app: current.app, start, end })
      time = end
      remaining.set(current.pid, remainingTime - slice)
      pushArrivals()

      if ((remaining.get(current.pid) || 0) > 0) {
        queue.push(current)
      } else {
        completion.set(current.pid, time)
      }
    }

    const perProcess = sorted.map((proc) => {
      const completionTime = completion.get(proc.pid) || time
      const turnaround = completionTime - proc.arrival
      const waiting = Math.max(0, turnaround - proc.burst)
      return {
        ...proc,
        completion: completionTime,
        waiting,
        turnaround
      }
    })

    const averageWaiting = perProcess.length > 0
      ? perProcess.reduce((sum, proc) => sum + proc.waiting, 0) / perProcess.length
      : 0
    return { segments, perProcess, averageWaiting }
  }

  const formatGantt = (segments) => {
    if (segments.length === 0) return 'No schedule computed.'
    return segments
      .map((segment) => `| P${segment.pid} ${segment.start}-${segment.end} `)
      .join('')
      .concat('|')
  }

  const schedulingInput = buildSchedulingInput(processes)
  const scheduleResult = schedulingInput.length === 0
    ? null
    : scheduleAlgo === 'fcfs'
    ? computeFcfsSchedule(schedulingInput)
    : computeRoundRobinSchedule(schedulingInput, safeQuantum)

  const timeBaseline = getTimeBaseline(processes)
  const nowSim = timeBaseline ? Math.max(0, Math.round((Date.now() - timeBaseline) / 1000)) : 0

  const computeCpuUsage = (segments, nowSeconds, windowSeconds = 60) => {
    if (!segments || segments.length === 0) return 0
    const cycleLength = segments.reduce((maxEnd, segment) => Math.max(maxEnd, segment.end), 0)
    if (cycleLength <= 0) return 0

    const windowStart = Math.max(0, nowSeconds - windowSeconds)
    const windowEnd = nowSeconds
    const minCycle = Math.floor(windowStart / cycleLength) - 1
    const maxCycle = Math.floor(windowEnd / cycleLength) + 1
    let busy = 0

    for (let cycle = minCycle; cycle <= maxCycle; cycle += 1) {
      const offset = cycle * cycleLength
      segments.forEach((segment) => {
        const segmentStart = segment.start + offset
        const segmentEnd = segment.end + offset
        const overlapStart = Math.max(windowStart, segmentStart)
        const overlapEnd = Math.min(windowEnd, segmentEnd)
        if (overlapEnd > overlapStart) {
          busy += overlapEnd - overlapStart
        }
      })
    }

    return Math.min(100, Math.max(0, (busy / windowSeconds) * 100))
  }

  const buildFixedPartitions = (totalMemory) => {
    const baseSizes = [64, 64, 96, 96, 128, 64]
    const baseTotal = baseSizes.reduce((sum, size) => sum + size, 0)
    const scale = totalMemory / baseTotal
    const scaled = baseSizes.map((size) => Math.max(16, Math.round((size * scale) / 8) * 8))
    let total = scaled.reduce((sum, size) => sum + size, 0)

    if (total < totalMemory) {
      scaled[scaled.length - 1] += totalMemory - total
    } else if (total > totalMemory) {
      let overflow = total - totalMemory
      for (let i = scaled.length - 1; i >= 0 && overflow > 0; i -= 1) {
        const reducible = Math.max(0, scaled[i] - 16)
        const reduction = Math.min(reducible, overflow)
        scaled[i] -= reduction
        overflow -= reduction
      }
    }

    let base = 0
    return scaled.map((size, index) => {
      const start = base
      base += size
      return {
        id: index + 1,
        size,
        start,
        end: base - 1,
        allocation: null
      }
    })
  }

  const allocateFixedPartitions = (partitions, procs) => {
    const running = procs
      .filter((proc) => proc.state === 'running')
      .sort((a, b) => Date.parse(a.start_time) - Date.parse(b.start_time) || a.pid - b.pid)
    const allocated = []

    running.forEach((proc) => {
      const target = partitions.find((part) => !part.allocation && part.size >= proc.memory)
      if (target) {
        target.allocation = {
          pid: proc.pid,
          app: proc.app,
          memory: proc.memory
        }
        allocated.push(target)
      }
    })

    return {
      partitions,
      allocated,
      free: partitions.filter((part) => !part.allocation)
    }
  }

  const formatMemoryMap = (partitionState) => {
    return partitionState.partitions.map((part) => {
      if (part.allocation) {
        const frag = part.size - part.allocation.memory
        return `P${part.id} [${part.start}-${part.end}] USED by ${part.allocation.app} (PID ${part.allocation.pid}) ${part.allocation.memory}MB / ${part.size}MB | frag ${frag}MB`
      }
      return `P${part.id} [${part.start}-${part.end}] FREE ${part.size}MB`
    }).join('\n')
  }

  const fixedPartitions = buildFixedPartitions(systemStats.totalMemory)
  const partitionState = allocateFixedPartitions(fixedPartitions, processes)
  const totalInternalFragmentation = partitionState.partitions.reduce((sum, part) => {
    if (!part.allocation) return sum
    return sum + (part.size - part.allocation.memory)
  }, 0)

  const simulatedMemoryUsed = processes
    .filter((proc) => proc.state === 'running')
    .reduce((sum, proc) => sum + proc.memory, 0)
  const simulatedMemoryPercent = systemStats.totalMemory
    ? (simulatedMemoryUsed / systemStats.totalMemory) * 100
    : 0
  const allocatedMemoryUsed = partitionState.partitions.reduce((sum, part) => {
    return sum + (part.allocation ? part.size : 0)
  }, 0)
  const simulatedCpuUsage = scheduleResult
    ? computeCpuUsage(scheduleResult.segments, nowSim)
    : 0
  const runningProcessCount = processes.filter((proc) => proc.state === 'running').length
  const schedulingLookup = schedulingInput.reduce((acc, proc) => {
    acc[proc.pid] = proc
    return acc
  }, {})
  const partitionLookup = partitionState.partitions.reduce((acc, part) => {
    if (part.allocation) {
      acc[part.allocation.pid] = part
    }
    return acc
  }, {})

  useEffect(() => {
    setSimulatedHistory((prev) => {
      const next = [...prev, {
        cpu_usage: simulatedCpuUsage,
        memory_percent: simulatedMemoryPercent
      }]
      return next.slice(-60)
    })
  }, [simulatedCpuUsage, simulatedMemoryPercent])

  return (
    <div className="app-monitor">
      <div className="monitor-tabs">
        <button
          type="button"
          className={`monitor-tab ${activeTab === 'processes' ? 'active' : ''}`}
          onClick={() => setActiveTab('processes')}
        >
          Processes
        </button>
        <button
          type="button"
          className={`monitor-tab ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          Performance
        </button>
        <button
          type="button"
          className={`monitor-tab ${activeTab === 'startup' ? 'active' : ''}`}
          onClick={() => setActiveTab('startup')}
        >
          Startup
        </button>
        <button
          type="button"
          className={`monitor-tab ${activeTab === 'io' ? 'active' : ''}`}
          onClick={() => setActiveTab('io')}
        >
          I/O Devices
        </button>
      </div>

      {activeTab === 'processes' && (
        <>
          <div className="monitor-section">
            <div className="monitor-stats-grid">
              <div className="monitor-stat-card">
                <div className="monitor-stat-label">CPU Usage</div>
                <div className="monitor-stat-value-large">{simulatedCpuUsage.toFixed(1)}%</div>
                <div className="monitor-stat-bar">
                  <div
                    className="monitor-stat-fill cpu"
                    style={{ width: `${simulatedCpuUsage}%` }}
                  />
                </div>
              </div>
              <div className="monitor-stat-card">
                <div className="monitor-stat-label">Memory Usage</div>
                <div className="monitor-stat-value-large">
                  {simulatedMemoryUsed} / {systemStats.totalMemory} MB
                </div>
                <div className="monitor-stat-bar">
                  <div
                    className="monitor-stat-fill memory"
                    style={{ width: `${simulatedMemoryPercent}%` }}
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
                <span className="monitor-col-pid" onClick={() => handleSort('pid')}>
                  PID {sortBy === 'pid' && (sortOrder === 'asc' ? '▲' : '▼')}
                </span>
                <span className="monitor-col-app" onClick={() => handleSort('app')}>
                  Application {sortBy === 'app' && (sortOrder === 'asc' ? '▲' : '▼')}
                </span>
                <span className="monitor-col-cpu" onClick={() => handleSort('cpu_usage')}>
                  CPU {sortBy === 'cpu_usage' && (sortOrder === 'asc' ? '▲' : '▼')}
                </span>
                <span className="monitor-col-mem" onClick={() => handleSort('memory')}>
                  Memory {sortBy === 'memory' && (sortOrder === 'asc' ? '▲' : '▼')}
                </span>
                <span className="monitor-col-arrival">Arrival</span>
                <span className="monitor-col-burst">Burst</span>
                <span className="monitor-col-partition">Partition</span>
                <span className="monitor-col-state" onClick={() => handleSort('state')}>
                  State {sortBy === 'state' && (sortOrder === 'asc' ? '▲' : '▼')}
                </span>
                <span className="monitor-col-startup">Startup</span>
                <span className="monitor-col-action">Actions</span>
              </div>
              <div className="monitor-process-list">
                {sortedProcesses.length === 0 ? (
                  <div className="monitor-empty">No processes running</div>
                ) : (
                  sortedProcesses.map((proc) => (
                    <div key={proc.pid} className="monitor-process-row">
                      <span className="monitor-col-pid">{proc.pid}</span>
                      <span className="monitor-col-app">{proc.app}</span>
                      <span className="monitor-col-cpu">{proc.cpu_usage?.toFixed(1) || '0.0'}%</span>
                      <span className="monitor-col-mem">{proc.memory} MB</span>
                      <span className="monitor-col-arrival">{schedulingLookup[proc.pid]?.arrival ?? '—'}</span>
                      <span className="monitor-col-burst">{schedulingLookup[proc.pid]?.burst ?? '—'}</span>
                      <span className="monitor-col-partition">
                        {partitionLookup[proc.pid] ? `P${partitionLookup[proc.pid].id}` : '—'}
                      </span>
                      <span className="monitor-col-state">
                        <span className={`monitor-state-badge ${proc.state}`}>
                          {proc.state}
                        </span>
                      </span>
                      <span className="monitor-col-startup">
                        {proc.is_startup ? '✓' : ''}
                      </span>
                      <span className="monitor-col-action">
                        {proc.state === 'running' && (
                          <div className="monitor-action-buttons">
                            <button
                              type="button"
                              className="monitor-kill-btn"
                              onClick={() => handleKillProcess(proc.pid)}
                              title="End Task"
                            >
                              End
                            </button>
                            <button
                              type="button"
                              className="monitor-force-kill-btn"
                              onClick={() => handleForceKillProcess(proc.pid)}
                              title="Force Kill"
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

          <div className="monitor-section">
            <div className="monitor-title">CPU Scheduling</div>
            <div className="monitor-scheduling-controls">
              <div className="monitor-scheduling-toggle">
                <button
                  type="button"
                  className={`monitor-scheduling-btn ${scheduleAlgo === 'fcfs' ? 'active' : ''}`}
                  onClick={() => setScheduleAlgo('fcfs')}
                >
                  FCFS
                </button>
                <button
                  type="button"
                  className={`monitor-scheduling-btn ${scheduleAlgo === 'rr' ? 'active' : ''}`}
                  onClick={() => setScheduleAlgo('rr')}
                >
                  Round Robin
                </button>
              </div>
              {scheduleAlgo === 'rr' && (
                <label className="monitor-quantum">
                  Time quantum
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={timeQuantum}
                    onChange={(event) => setTimeQuantum(event.target.value)}
                  />
                </label>
              )}
            </div>

            {schedulingInput.length === 0 ? (
              <div className="monitor-empty">No running processes for scheduling</div>
            ) : (
              <>
                <div className="monitor-scheduling-summary">
                  <div className="monitor-scheduling-metric">
                    <span className="monitor-scheduling-label">Algorithm</span>
                    <span className="monitor-scheduling-value">
                      {scheduleAlgo === 'fcfs' ? 'FCFS (First-Come, First-Served)' : `Round Robin (q=${safeQuantum})`}
                    </span>
                  </div>
                  <div className="monitor-scheduling-metric">
                    <span className="monitor-scheduling-label">Average waiting time</span>
                    <span className="monitor-scheduling-value">
                      {scheduleResult ? scheduleResult.averageWaiting.toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>

                <div className="monitor-gantt">
                  <div className="monitor-gantt-label">Gantt (text)</div>
                  <pre className="monitor-gantt-text">
                    {scheduleResult ? formatGantt(scheduleResult.segments) : 'No schedule computed.'}
                  </pre>
                </div>

                <div className="monitor-scheduling-table">
                  <div className="monitor-scheduling-header">
                    <span className="monitor-sched-col">PID</span>
                    <span className="monitor-sched-col">App</span>
                    <span className="monitor-sched-col">Arrival</span>
                    <span className="monitor-sched-col">Burst</span>
                    <span className="monitor-sched-col">Waiting</span>
                    <span className="monitor-sched-col">Turnaround</span>
                  </div>
                  <div className="monitor-scheduling-rows">
                    {scheduleResult?.perProcess.map((proc) => (
                      <div key={proc.pid} className="monitor-scheduling-row">
                        <span className="monitor-sched-col">{proc.pid}</span>
                        <span className="monitor-sched-col">{proc.app}</span>
                        <span className="monitor-sched-col">{proc.arrival}</span>
                        <span className="monitor-sched-col">{proc.burst}</span>
                        <span className="monitor-sched-col">{proc.waiting}</span>
                        <span className="monitor-sched-col">{proc.turnaround}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="monitor-section">
            <div className="monitor-title">Memory Management</div>
            <div className="monitor-memory-summary">
              <div className="monitor-memory-metric">
                <span className="monitor-memory-label">Fixed partitions</span>
                <span className="monitor-memory-value">{partitionState.partitions.length}</span>
              </div>
              <div className="monitor-memory-metric">
                <span className="monitor-memory-label">Allocated</span>
                <span className="monitor-memory-value">{partitionState.allocated.length}</span>
              </div>
              <div className="monitor-memory-metric">
                <span className="monitor-memory-label">Free</span>
                <span className="monitor-memory-value">{partitionState.free.length}</span>
              </div>
              <div className="monitor-memory-metric">
                <span className="monitor-memory-label">Internal fragmentation</span>
                <span className="monitor-memory-value">{totalInternalFragmentation} MB</span>
              </div>
              <div className="monitor-memory-metric">
                <span className="monitor-memory-label">Actual used</span>
                <span className="monitor-memory-value">{simulatedMemoryUsed} MB</span>
              </div>
            </div>

            <div className="monitor-memory-table">
              <div className="monitor-memory-header">
                <span className="monitor-memory-col">Partition</span>
                <span className="monitor-memory-col">Range</span>
                <span className="monitor-memory-col">Size</span>
                <span className="monitor-memory-col">Status</span>
                <span className="monitor-memory-col">Process</span>
                <span className="monitor-memory-col">Fragment</span>
              </div>
              <div className="monitor-memory-rows">
                {partitionState.partitions.map((part) => {
                  const status = part.allocation ? 'Allocated' : 'Free'
                  const frag = part.allocation ? part.size - part.allocation.memory : 0
                  return (
                    <div key={part.id} className={`monitor-memory-row ${part.allocation ? 'allocated' : 'free'}`}>
                      <span className="monitor-memory-col">P{part.id}</span>
                      <span className="monitor-memory-col">{part.start}-{part.end}</span>
                      <span className="monitor-memory-col">{part.size} MB</span>
                      <span className="monitor-memory-col">{status}</span>
                      <span className="monitor-memory-col">
                        {part.allocation ? `${part.allocation.app} (PID ${part.allocation.pid})` : '—'}
                      </span>
                      <span className="monitor-memory-col">{part.allocation ? `${frag} MB` : '—'}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="monitor-memory-map">
              <div className="monitor-memory-map-label">Memory map (text)</div>
              <pre className="monitor-memory-map-text">
                {formatMemoryMap(partitionState)}
              </pre>
            </div>
          </div>
        </>
      )}

      {activeTab === 'performance' && (
        <div className="monitor-section">
          <div className="monitor-title">Performance History</div>
          <div className="monitor-performance-stats">
            <div className="monitor-perf-stat">
              <span className="monitor-perf-label">CPU:</span>
              <span className="monitor-perf-value cpu-color">{simulatedCpuUsage.toFixed(1)}%</span>
            </div>
            <div className="monitor-perf-stat">
              <span className="monitor-perf-label">Memory:</span>
              <span className="monitor-perf-value memory-color">{simulatedMemoryPercent.toFixed(1)}%</span>
            </div>
            <div className="monitor-perf-stat">
              <span className="monitor-perf-label">Processes:</span>
              <span className="monitor-perf-value">{runningProcessCount}</span>
            </div>
          </div>
          <canvas
            ref={canvasRef}
            width={800}
            height={400}
            className="monitor-performance-graph"
          />
          <div className="monitor-graph-info">
            {simulatedHistory.length > 0 ? (
              <span>Showing last {simulatedHistory.length} simulated data points (2-minute window)</span>
            ) : performanceHistory.length > 0 ? (
              <span>Showing last {performanceHistory.length} backend data points</span>
            ) : (
              <span>Collecting performance data...</span>
            )}
          </div>
        </div>
      )}

      {activeTab === 'startup' && (
        <div className="monitor-section">
          <div className="monitor-title">Startup Programs</div>
          <div className="monitor-startup-info">
            Programs configured to start automatically when the system boots.
          </div>
          <div className="monitor-startup-list">
            {processes.filter((p) => p.state === 'running').map((proc) => (
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
          <div className="monitor-startup-footer">
            <strong>Configured Startup Processes:</strong> {startupProcesses.join(', ') || 'None'}
          </div>
        </div>
      )}

      {activeTab === 'io' && (
        <div className="monitor-section">
          <div className="monitor-title">I/O Devices & Spooling</div>
          <div className="monitor-io-summary">
            <div className="monitor-io-metric">
              <span className="monitor-io-label">Print queue</span>
              <span className="monitor-io-value">{ioQueue.length}</span>
            </div>
            <div className="monitor-io-metric">
              <span className="monitor-io-label">Printer</span>
              <span className="monitor-io-value">{printerStatus}</span>
            </div>
            <div className="monitor-io-metric">
              <span className="monitor-io-label">Spooled files</span>
              <span className="monitor-io-value">{ioQueue.filter((j) => j.status === 'spooled').length}</span>
            </div>
            <div className="monitor-io-metric">
              <span className="monitor-io-label">Printing</span>
              <span className="monitor-io-value">{ioQueue.filter((j) => j.status === 'printing').length}</span>
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
                <div className="monitor-io-device-status">
                  <span className={`monitor-io-status-badge ${device.status}`}>
                    {device.status === 'ready' ? '✓ Ready' : '⚙ Busy'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="monitor-io-queue">
            <div className="monitor-io-queue-title">Print Queue</div>
            {ioQueue.length === 0 ? (
              <div className="monitor-io-empty">No jobs in queue</div>
            ) : (
              <div className="monitor-io-queue-list">
                {ioQueue.map((job, index) => (
                  <div key={job.id} className={`monitor-io-job ${job.status}`}>
                    <div className="monitor-io-job-num">#{index + 1}</div>
                    <div className="monitor-io-job-info">
                      <div className="monitor-io-job-name">{job.name}</div>
                      <div className="monitor-io-job-meta">{job.pages} pages • PID {job.pid}</div>
                    </div>
                    <div className="monitor-io-job-status">
                      <span className={`monitor-io-job-badge ${job.status}`}>
                        {job.status === 'spooled' ? '📁 Spooled' : job.status === 'printing' ? '🖨️ Printing' : '✓ Done'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

