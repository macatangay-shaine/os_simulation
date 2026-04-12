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
      const [processResponse, resourcesResponse, historyResponse] = await Promise.all([
        fetch('http://localhost:8000/process/list'),
        fetch('http://localhost:8000/system/resources'),
        fetch('http://localhost:8000/system/performance-history')
      ])

      if (!processResponse.ok || !resourcesResponse.ok || !historyResponse.ok) {
        throw new Error('Failed to load shared system monitor data.')
      }

      const processData = await processResponse.json()
      const resourcesData = await resourcesResponse.json()
      const historyData = await historyResponse.json()

      sharedState = {
        processes: Array.isArray(processData) ? processData : [],
        systemStats: normalizeResources(resourcesData),
        performanceHistory: Array.isArray(historyData.history) ? historyData.history : [],
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
