import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import '../styles/index.css'

const DEFAULT_LOCAL_API_BASE = 'http://localhost:8000'
const DEFAULT_PROD_API_BASE = 'https://os-simulation.onrender.com'
const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? DEFAULT_LOCAL_API_BASE : DEFAULT_PROD_API_BASE)
).replace(/\/$/, '')
const LEGACY_LOCAL_HOSTS = ['http://localhost:8000', 'http://127.0.0.1:8000']
const DEVICE_ID_STORAGE_KEY = 'jez_os_device_id'

function rewriteLegacyApiUrl(inputUrl) {
  if (typeof inputUrl !== 'string') {
    return inputUrl
  }

  for (const legacyBase of LEGACY_LOCAL_HOSTS) {
    if (inputUrl.startsWith(legacyBase)) {
      return `${API_BASE}${inputUrl.slice(legacyBase.length)}`
    }
  }

  return inputUrl
}

function getOrCreateDeviceId() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null
  }

  const existing = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY)
  if (existing) return existing

  const generated = `device-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, generated)
  return generated
}

function patchGlobalFetch() {
  if (typeof window === 'undefined' || typeof window.fetch !== 'function') {
    return
  }

  const withSessionToken = (init = {}) => {
    const headers = new Headers(init?.headers || {})
    const sessionToken = window.localStorage?.getItem('session_token')
    const deviceId = getOrCreateDeviceId()

    if (sessionToken && !headers.has('session-token')) {
      headers.set('session-token', sessionToken)
    }
    if (deviceId && !headers.has('x-jezos-device-id')) {
      headers.set('x-jezos-device-id', deviceId)
    }

    return {
      ...init,
      headers
    }
  }

  const originalFetch = window.fetch.bind(window)
  window.fetch = (input, init) => {
    if (typeof input === 'string') {
      return originalFetch(rewriteLegacyApiUrl(input), withSessionToken(init))
    }

    if (input instanceof Request) {
      const rewrittenUrl = rewriteLegacyApiUrl(input.url)
      const request = rewrittenUrl !== input.url ? new Request(rewrittenUrl, input) : input
      return originalFetch(request, withSessionToken(init))
    }

    return originalFetch(input, withSessionToken(init))
  }
}

patchGlobalFetch()
getOrCreateDeviceId()

ReactDOM.createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
