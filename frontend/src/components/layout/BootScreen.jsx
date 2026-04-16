import { useEffect, useRef, useState } from 'react'

export default function BootScreen({ onComplete }) {
  const [stage, setStage] = useState('black')
  const [error, setError] = useState('')
  const completedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

    const bootEndpoints = [
      'http://localhost:8000/boot',
      'http://127.0.0.1:8000/boot'
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
        const BLACK_DELAY = 4000
        const BRAND_DELAY = 2000
        const LOADING_DELAY = 3500

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
          setError('Kernel API offline. Start backend on http://localhost:8000 and retry.')
        } else {
          setError('Kernel initialization failed')
        }
      }
    }

    runBoot()
    return () => {
      cancelled = true
    }
  }, [onComplete])

  const handleRetry = () => {
    setError('')
    setStage('black')
    completedRef.current = false
    window.location.reload()
  }

  return (
    <div className={`boot-screen boot-stage-${stage}`}>
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
