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
      drawPerformanceGraph()
    }
  }, [performanceHistory, activeTab])

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

  const drawPerformanceGraph = () => {
    const canvas = canvasRef.current
    if (!canvas || performanceHistory.length === 0) return

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

    if (performanceHistory.length < 2) return

    const dataPoints = performanceHistory.slice(-60)
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

  const memoryPercentage = (systemStats.usedMemory / systemStats.totalMemory) * 100
  const sortedProcesses = sortProcesses(processes)

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
      </div>

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
                    style={{ width: `${memoryPercentage}%` }}
                  />
                </div>
              </div>
              <div className="monitor-stat-card">
                <div className="monitor-stat-label">Active Processes</div>
                <div className="monitor-stat-value-large">{systemStats.processCount}</div>
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
        </>
      )}

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
              <span className="monitor-perf-value memory-color">{memoryPercentage.toFixed(1)}%</span>
            </div>
            <div className="monitor-perf-stat">
              <span className="monitor-perf-label">Processes:</span>
              <span className="monitor-perf-value">{systemStats.processCount}</span>
            </div>
          </div>
          <canvas
            ref={canvasRef}
            width={800}
            height={400}
            className="monitor-performance-graph"
          />
          <div className="monitor-graph-info">
            {performanceHistory.length > 0 ? (
              <span>Showing last {performanceHistory.length} data points (2-minute window)</span>
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
    </div>
  )
}

