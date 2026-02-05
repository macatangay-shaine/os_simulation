import { useState } from 'react'
import { Lightbulb, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react'

export default function TipsApp() {
  const [currentTip, setCurrentTip] = useState(0)

  const tips = [
    {
      title: 'Welcome to JezOS!',
      content: 'JezOS is a simulated operating system running in your browser. Explore the desktop, open apps, and experience a Windows-like environment.',
      icon: '👋'
    },
    {
      title: 'Start Menu',
      content: 'Click the Windows icon in the taskbar to open the Start Menu. Here you can launch apps, search, and access power options.',
      icon: '🪟'
    },
    {
      title: 'File Explorer',
      content: 'Manage your files with File Explorer. Create folders, upload files, and organize your virtual file system. Files are saved in your browser.',
      icon: '📁'
    },
    {
      title: 'Terminal',
      content: 'Open the Terminal app to run commands like ls, cd, cat, ps, and more. It simulates a real command-line interface.',
      icon: '💻'
    },
    {
      title: 'Taskbar',
      content: 'The taskbar shows running apps and pinned shortcuts. Right-click apps to pin/unpin them. Hover over icons with multiple windows to see all instances.',
      icon: '📊'
    },
    {
      title: 'Window Management',
      content: 'Drag windows to move them, resize from corners, minimize to taskbar, or close them. Multiple windows can be open at once.',
      icon: '🪟'
    },
    {
      title: 'Action Center',
      content: 'Click the notification icon in the taskbar to see system notifications and quick settings like WiFi, volume, and battery status.',
      icon: '🔔'
    },
    {
      title: 'Settings App',
      content: 'Customize JezOS in Settings. Change themes, wallpapers, time format, and view system information.',
      icon: '⚙️'
    },
    {
      title: 'App Store',
      content: 'Visit the App Store to install new applications. Apps can be installed and uninstalled like a real operating system.',
      icon: '🏪'
    },
    {
      title: 'System Monitor',
      content: 'Track CPU and RAM usage in the System Monitor app. See which apps are using the most resources.',
      icon: '📈'
    },
    {
      title: 'Camera & Calculator',
      content: 'Use the Camera app to take photos and record videos (requires camera permission). The Calculator handles basic math operations.',
      icon: '📷'
    },
    {
      title: 'Clock & Calendar',
      content: 'Set timers and use the stopwatch in the Clock app. View and navigate dates in the Calendar app.',
      icon: '🕐'
    }
  ]

  const nextTip = () => {
    if (currentTip < tips.length - 1) {
      setCurrentTip(currentTip + 1)
    }
  }

  const previousTip = () => {
    if (currentTip > 0) {
      setCurrentTip(currentTip - 1)
    }
  }

  return (
    <div className="tips-app">
      <div className="tips-header">
        <Lightbulb size={32} className="tips-icon" />
        <h2>Getting Started with JezOS</h2>
      </div>

      <div className="tips-content">
        <div className="tip-card">
          <div className="tip-icon">{tips[currentTip].icon}</div>
          <h3>{tips[currentTip].title}</h3>
          <p>{tips[currentTip].content}</p>
        </div>

        <div className="tips-navigation">
          <button 
            className="tip-nav-btn" 
            onClick={previousTip} 
            disabled={currentTip === 0}
          >
            <ChevronLeft size={20} />
            Previous
          </button>

          <div className="tip-indicators">
            {tips.map((_, index) => (
              <div
                key={index}
                className={`tip-indicator ${index === currentTip ? 'active' : ''} ${index < currentTip ? 'completed' : ''}`}
                onClick={() => setCurrentTip(index)}
              >
                {index < currentTip ? <CheckCircle size={12} /> : null}
              </div>
            ))}
          </div>

          <button 
            className="tip-nav-btn" 
            onClick={nextTip} 
            disabled={currentTip === tips.length - 1}
          >
            Next
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="tip-counter">
          {currentTip + 1} of {tips.length}
        </div>
      </div>

      <div className="tips-footer">
        <p>💡 Pro Tip: Explore each app to discover more features!</p>
      </div>
    </div>
  )
}
