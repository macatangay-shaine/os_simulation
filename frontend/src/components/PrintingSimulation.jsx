import { useState, useEffect } from 'react'
import { X, CheckCircle } from 'lucide-react'

export default function PrintingSimulation({ printJob, onClose }) {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('spooling')
  const [details, setDetails] = useState({
    dataProcessed: 0,
    currentPage: 1,
    dpiResolution: '600 x 600'
  })

  useEffect(() => {
    if (!printJob) return

    let currentProgress = 0
    let currentStatus = 'spooling'
    let currentPage = 1

    const interval = setInterval(() => {
      const now = Date.now()
      const jobAge = now - new Date(printJob.timestamp).getTime()

      // Spooling phase: 0-2 seconds (0% - 30%)
      if (jobAge < 2000) {
        currentStatus = 'spooling'
        currentProgress = (jobAge / 2000) * 30
      }
      // Processing phase: 2-5 seconds (30% - 70%)
      else if (jobAge < 5000) {
        currentStatus = 'processing'
        currentProgress = 30 + ((jobAge - 2000) / 3000) * 40
        currentPage = Math.floor(((jobAge - 2000) / 3000) * printJob.pages) + 1
      }
      // Printing phase: 5-10 seconds (70% - 100%)
      else if (jobAge < 10000) {
        currentStatus = 'printing'
        currentProgress = 70 + ((jobAge - 5000) / 5000) * 30
        currentPage = Math.floor(((jobAge - 5000) / 5000) * printJob.pages) + 1
      }
      // Complete: >= 10 seconds (100%)
      else {
        currentStatus = 'complete'
        currentProgress = 100
        currentPage = printJob.pages
      }

      setStatus(currentStatus)
      setProgress(Math.min(100, currentProgress))
      setDetails({
        dataProcessed: Math.round((currentProgress / 100) * printJob.pages * 500),
        currentPage: Math.min(currentPage, printJob.pages),
        dpiResolution: printJob.colorMode === 'color' ? '600 x 600' : '300 x 300'
      })

      if (currentStatus === 'complete') {
        clearInterval(interval)
      }
    }, 50)

    return () => clearInterval(interval)
  }, [printJob])

  if (!printJob) return null

  const getStatusColor = () => {
    switch (status) {
      case 'spooling':
        return '#3b82f6'
      case 'processing':
        return '#f59e0b'
      case 'printing':
        return '#10b981'
      case 'complete':
        return '#16a34a'
      default:
        return '#6b7280'
    }
  }

  const getStatusLabel = () => {
    switch (status) {
      case 'spooling':
        return 'Spooling...'
      case 'processing':
        return 'Processing...'
      case 'printing':
        return 'Printing...'
      case 'complete':
        return 'Complete'
      default:
        return 'Initializing'
    }
  }

  return (
    <div className="printing-simulation-overlay">
      <div className="printing-simulation-dialog">
        <div className="printing-simulation-header">
          <div>
            <h3>Printing Document</h3>
            <p className="printing-simulation-filename">{printJob.fileName}</p>
          </div>
          {status === 'complete' ? (
            <button className="printing-simulation-close" onClick={onClose}>
              <X size={20} />
            </button>
          ) : null}
        </div>

        <div className="printing-simulation-content">
          <div className="printing-animation">
            {status !== 'complete' ? (
              <>
                <div className="printer-icon">🖨️</div>
                <div className="paper-stack">
                  <div className="paper paper-1"></div>
                  <div className="paper paper-2"></div>
                  <div className="paper paper-3"></div>
                </div>
              </>
            ) : (
              <CheckCircle size={80} style={{ color: '#16a34a' }} />
            )}
          </div>

          <div className="printing-progress">
            <div className="progress-label">
              <span>{getStatusLabel()}</span>
              <span className="progress-percentage">{Math.round(progress)}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${progress}%`,
                  backgroundColor: getStatusColor(),
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
          </div>

          <div className="printing-details">
            <div className="detail-row">
              <span className="detail-label">Status:</span>
              <span className="detail-value">{getStatusLabel()}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Current Page:</span>
              <span className="detail-value">
                {details.currentPage} / {printJob.pages}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Data Processed:</span>
              <span className="detail-value">{details.dataProcessed} KB</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Color Mode:</span>
              <span className="detail-value">
                {printJob.colorMode === 'color' ? 'Color' : printJob.colorMode === 'grayscale' ? 'Grayscale' : 'Black & White'}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Paper Size:</span>
              <span className="detail-value">{printJob.paperSize}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Orientation:</span>
              <span className="detail-value">{printJob.orientation.charAt(0).toUpperCase() + printJob.orientation.slice(1)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">DPI:</span>
              <span className="detail-value">{details.dpiResolution}</span>
            </div>
          </div>
        </div>

        {status === 'complete' && (
          <div className="printing-simulation-footer">
            <button className="printing-done-btn" onClick={onClose}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
