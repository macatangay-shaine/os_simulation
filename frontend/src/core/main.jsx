import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import '../styles/index.css'

const DEFAULT_LOCAL_API_BASE = 'http://localhost:8000'
const API_BASE = (import.meta.env.VITE_API_BASE_URL || DEFAULT_LOCAL_API_BASE).replace(/\/$/, '')
const LEGACY_LOCAL_HOSTS = ['http://localhost:8000', 'http://127.0.0.1:8000']

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

function patchGlobalFetch() {
  if (typeof window === 'undefined' || typeof window.fetch !== 'function') {
    return
  }

  const originalFetch = window.fetch.bind(window)
  window.fetch = (input, init) => {
    if (typeof input === 'string') {
      return originalFetch(rewriteLegacyApiUrl(input), init)
    }

    if (input instanceof Request) {
      const rewrittenUrl = rewriteLegacyApiUrl(input.url)
      if (rewrittenUrl !== input.url) {
        return originalFetch(new Request(rewrittenUrl, input), init)
      }
    }

    return originalFetch(input, init)
  }
}

patchGlobalFetch()

ReactDOM.createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
