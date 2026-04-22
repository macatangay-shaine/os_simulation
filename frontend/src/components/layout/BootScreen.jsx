import { useEffect, useRef, useState } from 'react'

export default function BootScreen({ onComplete }) {
  const hasSeenPowerTutorial = localStorage.getItem('jezos_power_tutorial_seen') === 'true'
  const [stage, setStage] = useState(hasSeenPowerTutorial ? 'black' : 'tutorial')
  const [error, setError] = useState('')
  const completedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

    // Use the same API base URL computation as main.jsx
    const DEFAULT_LOCAL_API_BASE = 'http://localhost:8000'
    const DEFAULT_PROD_API_BASE = 'https://os-simulation.onrender.com'
    const API_BASE = (
      import.meta.env.VITE_API_BASE_URL ||
      (import.meta.env.DEV ? DEFAULT_LOCAL_API_BASE : DEFAULT_PROD_API_BASE)
    ).replace(/\/$/, '')
    const bootEndpoints = [
      `${API_BASE}/boot`
    ]

    const checkBootEndpoint = async (url) => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      try {
        const response = await fetch(url, { signal: controller.signal })
        if (!response.ok) {
          throw new Error(`Boot failed: ${response.status}`)
        }
        await response.json()
        return true
      } finally {
        clearTimeout(timeoutId)
      }
    }

    const waitForKernel = async () => {
      const maxAttempts = 3
      let lastError = null

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        for (const endpoint of bootEndpoints) {
          try {
            await checkBootEndpoint(endpoint)
            return true
          } catch (error) {
            lastError = error
          }
        }

        if (attempt < maxAttempts) {
          await wait(1000)
        }
      }

      throw lastError || new Error('Kernel API unavailable')
    }

    const runBoot = async () => {
      try {
        const TUTORIAL_DELAY = 6500
        const BLACK_DELAY = 2200
        const BRAND_DELAY = 2000
        const LOADING_DELAY = 3500

        if (!hasSeenPowerTutorial) {
          setStage('tutorial')
          await wait(TUTORIAL_DELAY)
          if (cancelled) return
          localStorage.setItem('jezos_power_tutorial_seen', 'true')
        }

        setStage('black')
        await wait(BLACK_DELAY)
        if (cancelled) return
        setStage('brand')
        await wait(BRAND_DELAY)
        if (cancelled) return
        setStage('loading')

        await waitForKernel()
        await wait(LOADING_DELAY)
        if (cancelled) return
        if (!completedRef.current) {
          completedRef.current = true
          onComplete?.()
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : ''
        if (
          message.includes('Failed to fetch') ||
          message.includes('NetworkError') ||
          message.includes('aborted') ||
          message.includes('unavailable')
        ) {
          setError('Kernel API offline. Verify the backend is deployed and VITE_API_BASE_URL points to a reachable API.')
        } else {
          setError('Kernel initialization failed')
        }
      }
    }

    runBoot()
    return () => {
      cancelled = true
    }
  }, [hasSeenPowerTutorial, onComplete])

  const handleRetry = () => {
    setError('')
    setStage(hasSeenPowerTutorial ? 'black' : 'tutorial')
    completedRef.current = false
    window.location.reload()
  }

  return (
    <div className={`boot-screen boot-stage-${stage}`}>
      {stage === 'tutorial' ? (
        <div className="boot-tutorial-prompt">
          <div className="boot-tutorial-title">Press P to power on</div>
          <div className="boot-tutorial-hint">Tutorial tip: this appears once before boot starts.</div>
        </div>
      ) : null}

      {stage === 'brand' ? (
        <div className="boot-brand">EtchPi</div>
      ) : null}

      {stage === 'loading' ? (
        <div className="boot-loading">
          <div className="boot-logo" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="boot-title">JezOS</div>
          <div className="boot-loader" aria-label="Loading" />
        </div>
      ) : null}

      {error ? (
        <div className="boot-error">
          <div>{error}</div>
          <button className="boot-retry" type="button" onClick={handleRetry}>
            Retry Boot
          </button>
        </div>
      ) : null}
    </div>
  )
}
