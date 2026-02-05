import { useEffect, useRef, useState } from 'react'

export default function BootScreen({ onComplete }) {
  const [stage, setStage] = useState('black')
  const [error, setError] = useState('')
  const completedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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

        const response = await fetch('http://localhost:8000/boot')
        if (!response.ok) {
          throw new Error(`Boot failed: ${response.status}`)
        }
        await response.json()
        await wait(LOADING_DELAY)
        if (cancelled) return
        if (!completedRef.current) {
          completedRef.current = true
          onComplete?.()
        }
      } catch (err) {
        setError('Kernel initialization failed')
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
