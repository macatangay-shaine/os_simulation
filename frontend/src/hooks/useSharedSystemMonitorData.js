import { useEffect, useState } from 'react'

const DEFAULT_SYSTEM_STATS = {
  totalMemory: 512,
  usedMemory: 0,
  availableMemory: 512,
  memoryUsagePercent: 0,
  cpuUsage: 0,
  processCount: 0,
  timestamp: null
}

const DEFAULT_STATE = {
  processes: [],
  systemStats: DEFAULT_SYSTEM_STATS,
  performanceHistory: [],
  isLoading: false,
  isRefreshing: false,
  hasLoaded: false,
  error: null
}

const listeners = new Set()
const subscribers = new Map()

let sharedState = DEFAULT_STATE
let activeRequest = null
let pollTimerId = null

function emitState() {
  listeners.forEach((listener) => listener(sharedState))
}

function normalizeResources(resources = {}) {
  return {
    totalMemory: Number(resources.maxMemory) || DEFAULT_SYSTEM_STATS.totalMemory,
    usedMemory: Number(resources.usedMemory) || 0,
    availableMemory: Number(resources.availableMemory) || 0,
    memoryUsagePercent: Number(resources.memoryUsagePercent) || 0,
    cpuUsage: Number(resources.cpuUsage) || 0,
    processCount: Number(resources.processCount) || 0,
    timestamp: resources.timestamp || null
  }
}

function deriveResourcesFromProcesses(processes = []) {
  const runningProcesses = (Array.isArray(processes) ? processes : []).filter((process) => process?.state === 'running')
  const usedMemory = runningProcesses.reduce((sum, process) => sum + (Number(process.memory) || 0), 0)
  const totalCpu = runningProcesses.reduce((sum, process) => sum + (Number(process.cpu_usage) || 0), 0)
  const processPressure = Math.min(24, runningProcesses.length * 2.8)
  const cpuUsage = Math.min(99, totalCpu * 0.8 + processPressure)
  const totalMemory = DEFAULT_SYSTEM_STATS.totalMemory

  return {
    maxMemory: totalMemory,
    usedMemory,
    availableMemory: Math.max(0, totalMemory - usedMemory),
    memoryUsagePercent: totalMemory > 0 ? (usedMemory / totalMemory) * 100 : 0,
    cpuUsage,
    processCount: runningProcesses.length,
    timestamp: new Date().toISOString()
  }
}

function getPollInterval() {
  if (subscribers.size === 0) return null
  return Math.min(...subscribers.values())
}

function syncPollingLoop() {
  if (pollTimerId != null) {
    window.clearInterval(pollTimerId)
    pollTimerId = null
  }

  const nextInterval = getPollInterval()
  if (nextInterval == null) return

  pollTimerId = window.setInterval(() => {
    fetchSharedSystemMonitorData().catch(() => {})
  }, nextInterval)
}

export async function fetchSharedSystemMonitorData() {
  if (activeRequest) return activeRequest

  sharedState = {
    ...sharedState,
    isLoading: !sharedState.hasLoaded,
    isRefreshing: sharedState.hasLoaded,
    error: null
  }
  emitState()

  activeRequest = (async () => {
    try {
      const [processResult, resourcesResult, historyResult] = await Promise.allSettled([
        fetch('http://localhost:8000/process/list'),
        fetch('http://localhost:8000/system/resources'),
        fetch('http://localhost:8000/system/performance-history')
      ])

      const nextProcesses =
        processResult.status === 'fulfilled' && processResult.value.ok
          ? await processResult.value.json()
          : sharedState.processes
      const fetchedResources =
        resourcesResult.status === 'fulfilled' && resourcesResult.value.ok
          ? await resourcesResult.value.json()
          : null
      const nextHistory =
        historyResult.status === 'fulfilled' && historyResult.value.ok
          ? await historyResult.value.json()
          : { history: sharedState.performanceHistory }

      const hasAnySuccess =
        (processResult.status === 'fulfilled' && processResult.value.ok) ||
        (resourcesResult.status === 'fulfilled' && resourcesResult.value.ok) ||
        (historyResult.status === 'fulfilled' && historyResult.value.ok)

      if (!hasAnySuccess) {
        throw new Error('Failed to load shared system monitor data.')
      }

      const shouldUseDerivedResources =
        !fetchedResources ||
        (
          Array.isArray(nextProcesses) &&
          nextProcesses.some((process) => process?.state === 'running') &&
          Number(fetchedResources.usedMemory || 0) <= 0 &&
          Number(fetchedResources.cpuUsage || 0) <= 0
        )

      const nextResources = shouldUseDerivedResources
        ? deriveResourcesFromProcesses(nextProcesses)
        : fetchedResources

      sharedState = {
        processes: Array.isArray(nextProcesses) ? nextProcesses : sharedState.processes,
        systemStats: normalizeResources(nextResources),
        performanceHistory: Array.isArray(nextHistory.history) ? nextHistory.history : sharedState.performanceHistory,
        isLoading: false,
        isRefreshing: false,
        hasLoaded: true,
        error: null
      }
      emitState()

      return sharedState
    } catch (error) {
      sharedState = {
        ...sharedState,
        isLoading: false,
        isRefreshing: false,
        error: error instanceof Error ? error.message : 'Failed to load shared system monitor data.'
      }
      emitState()
      throw error
    } finally {
      activeRequest = null
    }
  })()

  return activeRequest
}

export function useSharedSystemMonitorData({ enabled = true, intervalMs = 2000 } = {}) {
  const [state, setState] = useState(sharedState)

  useEffect(() => {
    if (!enabled) return undefined

    const subscriberId = Symbol('system-monitor-subscriber')
    const handleStateChange = (nextState) => setState(nextState)

    listeners.add(handleStateChange)
    subscribers.set(subscriberId, intervalMs)
    setState(sharedState)
    syncPollingLoop()
    fetchSharedSystemMonitorData().catch(() => {})

    return () => {
      listeners.delete(handleStateChange)
      subscribers.delete(subscriberId)
      syncPollingLoop()
    }
  }, [enabled, intervalMs])

  return {
    ...state,
    refresh: fetchSharedSystemMonitorData
  }
}
