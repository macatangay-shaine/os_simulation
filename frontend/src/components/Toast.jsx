import { X, AlertCircle, CheckCircle, Info } from 'lucide-react'
import { useEffect } from 'react'

export default function Toast({ id, notification, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id)
    }, notification.duration || 5000)

    return () => clearTimeout(timer)
  }, [id, notification.duration, onClose])

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="toast-icon" />
      case 'error':
        return <AlertCircle className="toast-icon" />
      case 'warning':
        return <AlertCircle className="toast-icon" />
      default:
        return <Info className="toast-icon" />
    }
  }

  return (
    <div className={`toast toast-${notification.type}`}>
      {getIcon()}
      <div className="toast-content">
        <div className="toast-title">{notification.title}</div>
        {notification.message && (
          <div className="toast-message">{notification.message}</div>
        )}
      </div>
      <button
        type="button"
        className="toast-close"
        onClick={() => onClose(id)}
        aria-label="Close notification"
      >
        <X className="toast-close-icon" />
      </button>
    </div>
  )
}
