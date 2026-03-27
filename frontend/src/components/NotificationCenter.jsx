import { X, Bell, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function NotificationCenter({ onClose }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, 200)
  }

  const fetchNotifications = async () => {
    try {
      const response = await fetch('http://localhost:8000/notification/list')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notifId) => {
    try {
      await fetch(`http://localhost:8000/notification/${notifId}/read`, {
        method: 'PATCH'
      })
      fetchNotifications()
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const deleteNotification = async (notifId) => {
    try {
      await fetch(`http://localhost:8000/notification/${notifId}`, {
        method: 'DELETE'
      })
      fetchNotifications()
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <>
      <div className="notification-overlay" onClick={handleClose} />
      <div className={`notification-center-panel ${isClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
      <div className="notification-center-header">
        <div className="notification-center-title">
          <Bell className="notification-center-icon" />
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount}</span>
          )}
        </div>
        <button
          type="button"
          className="notification-center-close"
          onClick={handleClose}
          aria-label="Close notifications"
        >
          <X className="notification-close-icon" />
        </button>
      </div>

      <div className="notification-center-list">
        {loading ? (
          <div className="notification-empty">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="notification-empty">No notifications</div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`notification-item notification-item-${notif.type} ${
                !notif.read ? 'unread' : ''
              }`}
            >
              <div className="notification-item-content">
                <div className="notification-item-title">{notif.title}</div>
                {notif.message && (
                  <div className="notification-item-message">{notif.message}</div>
                )}
                <div className="notification-item-time">
                  {new Date(notif.created_at).toLocaleTimeString()}
                </div>
              </div>
              <button
                type="button"
                className="notification-item-delete"
                onClick={() => deleteNotification(notif.id)}
                aria-label="Delete notification"
              >
                <Trash2 className="notification-item-delete-icon" />
              </button>
            </div>
          ))
        )}
      </div>
      </div>
    </>
  )
}
