import { useEffect, useState } from 'react'
import { X, Wifi, Volume2, Battery, Sun, Bluetooth, Smartphone, Zap, Cast, ChevronRight } from 'lucide-react'

export default function ActionCenter({ onClose }) {
  const [battery, setBattery] = useState({ level: 80, charging: false })
  const [batterySupported, setBatterySupported] = useState(true)
  const [brightness, setBrightness] = useState(70)
  const [airplaneMode, setAirplaneMode] = useState(false)
  const [energySaver, setEnergySaver] = useState(false)
  const [bluetoothEnabled, setBluetoothEnabled] = useState(false)
  const [castingEnabled, setCastingEnabled] = useState(false)
  const [wifiEnabled, setWifiEnabled] = useState(navigator.onLine)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [volume, setVolume] = useState(75)
  const [connectionType, setConnectionType] = useState('4g')
  const [screenBrightness, setScreenBrightness] = useState(100)
  const [showWifiSelector, setShowWifiSelector] = useState(false)
  const [showBluetoothSelector, setShowBluetoothSelector] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [availableWifiNetworks, setAvailableWifiNetworks] = useState([
    { name: 'Network-5G', strength: 100, connected: true },
    { name: 'Network-2.4G', strength: 85, connected: false },
    { name: 'Guest Network', strength: 60, connected: false }
  ])
  const [selectedWifi, setSelectedWifi] = useState('Network-5G')
  const [availableBluetoothDevices, setAvailableBluetoothDevices] = useState([
    { name: 'Wireless Headphones', address: '00:1A:7D:DA:71:13', connected: true },
    { name: 'Smart Watch', address: '00:1A:7D:DA:71:14', connected: false },
    { name: 'Bluetooth Speaker', address: '00:1A:7D:DA:71:15', connected: false }
  ])
  const [selectedBluetooth, setSelectedBluetooth] = useState('Wireless Headphones')

  const normalizeBatteryState = (value, fallbackLevel = 80) => {
    const levelNumber = Number(value?.level)
    const safeLevel = Number.isFinite(levelNumber)
      ? Math.min(100, Math.max(0, Math.round(levelNumber)))
      : fallbackLevel

    return {
      level: safeLevel,
      charging: Boolean(value?.charging)
    }
  }

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, 200)
  }
  // Initialize from localStorage and system
  useEffect(() => {
    try {
      const savedBrightness = localStorage.getItem('jez_os_brightness')
      if (savedBrightness) {
        const value = parseInt(savedBrightness)
        setBrightness(value)
        setScreenBrightness(value)
      }
      
      const savedVolume = localStorage.getItem('jez_os_volume')
      if (savedVolume) setVolume(parseInt(savedVolume))
      
      const savedAirplane = localStorage.getItem('jez_os_airplane')
      if (savedAirplane) setAirplaneMode(JSON.parse(savedAirplane))
      
      const savedEnergySaver = localStorage.getItem('jez_os_energy_saver')
      if (savedEnergySaver) setEnergySaver(JSON.parse(savedEnergySaver))

      const savedBluetooth = localStorage.getItem('jez_os_bluetooth')
      if (savedBluetooth) setBluetoothEnabled(JSON.parse(savedBluetooth))

      const savedCast = localStorage.getItem('jez_os_cast')
      if (savedCast) setCastingEnabled(JSON.parse(savedCast))

      const savedWifi = localStorage.getItem('jez_os_wifi')
      if (savedWifi) setWifiEnabled(JSON.parse(savedWifi))

      const savedWifiNetwork = localStorage.getItem('jez_os_selected_wifi')
      if (savedWifiNetwork) setSelectedWifi(savedWifiNetwork)

      const savedBtDevice = localStorage.getItem('jez_os_selected_bluetooth')
      if (savedBtDevice) setSelectedBluetooth(savedBtDevice)
    } catch (error) {
      console.warn('Failed to load settings:', error)
    }
  }, [])

  // Get battery info with real updates
  useEffect(() => {
    let batteryObj = null
    let updateBattery = null

    const initBattery = async () => {
      try {
        if ('getBattery' in navigator) {
          setBatterySupported(true)
          batteryObj = await navigator.getBattery()
          updateBattery = () => {
            setBattery({
              level: Math.round(batteryObj.level * 100),
              charging: batteryObj.charging
            })
          }
          updateBattery()
          batteryObj.addEventListener('levelchange', updateBattery)
          batteryObj.addEventListener('chargingchange', updateBattery)
        } else {
          setBatterySupported(false)
        }
      } catch (error) {
        setBatterySupported(false)
        console.warn('Battery API not available:', error)
      }
    }

    initBattery()

    return () => {
      if (batteryObj && updateBattery) {
        batteryObj.removeEventListener('levelchange', updateBattery)
        batteryObj.removeEventListener('chargingchange', updateBattery)
      }
    }
  }, [])

  // Save battery state to localStorage and dispatch custom event for taskbar sync
  useEffect(() => {
    try {
      const normalizedBattery = normalizeBatteryState(battery)
      localStorage.setItem('jez_os_battery', JSON.stringify(normalizedBattery))
      // Dispatch custom event for same-tab listeners (Taskbar)
      window.dispatchEvent(new CustomEvent('batteryUpdate', { detail: normalizedBattery }))
    } catch (error) {
      console.warn('Failed to save battery state:', error)
    }
  }, [battery])

  const displayBattery = normalizeBatteryState(battery, 80)

  // Get connection info and detect Wi-Fi status
  useEffect(() => {
    const updateWifiStatus = () => {
      setIsOnline(navigator.onLine)
      if (!airplaneMode) {
        setWifiEnabled(navigator.onLine)
      }
    }

    if (navigator.connection) {
      const updateConnectionType = () => {
        const type = navigator.connection.effectiveType
        setConnectionType(type || '4g')
      }
      updateConnectionType()
      navigator.connection.addEventListener('change', updateConnectionType)
    }

    updateWifiStatus()
    window.addEventListener('online', updateWifiStatus)
    window.addEventListener('offline', updateWifiStatus)

    return () => {
      window.removeEventListener('online', updateWifiStatus)
      window.removeEventListener('offline', updateWifiStatus)
      if (navigator.connection) {
        navigator.connection.removeEventListener('change', updateWifiStatus)
      }
    }
  }, [airplaneMode])

  // Detect Bluetooth availability
  useEffect(() => {
    const checkBluetooth = async () => {
      try {
        if ('bluetooth' in navigator) {
          const available = await navigator.bluetooth.getAvailability()
          setBluetoothEnabled(available)
        }
      } catch (error) {
        console.warn('Bluetooth check failed:', error)
      }
    }

    checkBluetooth()
  }, [])

  const handleBrightnessChange = (value) => {
    const newValue = parseInt(value)
    setBrightness(newValue)
    setScreenBrightness(newValue)
    localStorage.setItem('jez_os_brightness', newValue.toString())
    
    if (document.documentElement.style) {
      document.documentElement.style.filter = `brightness(${newValue}%)`
    }
  }

  const handleVolumeChange = (value) => {
    const newValue = parseInt(value)
    setVolume(newValue)
    localStorage.setItem('jez_os_volume', newValue.toString())
  }

  const toggleAirplaneMode = () => {
    const newState = !airplaneMode
    setAirplaneMode(newState)
    localStorage.setItem('jez_os_airplane', JSON.stringify(newState))
    if (newState) {
      setWifiEnabled(false)
    } else {
      setWifiEnabled(navigator.onLine)
    }
  }

  const toggleEnergySaver = () => {
    const newState = !energySaver
    setEnergySaver(newState)
    localStorage.setItem('jez_os_energy_saver', JSON.stringify(newState))
    
    try {
      if (!newState && 'wakeLock' in navigator) {
        navigator.wakeLock.request('screen').catch(err => {
          console.warn('Could not acquire wake lock:', err)
        })
      }
    } catch (error) {
      console.warn('Wake Lock API not available:', error)
    }
  }

  const toggleBluetooth = () => {
    const newState = !bluetoothEnabled
    setBluetoothEnabled(newState)
    localStorage.setItem('jez_os_bluetooth', JSON.stringify(newState))
  }

  const toggleWifi = () => {
    const newState = !wifiEnabled
    setWifiEnabled(newState)
    localStorage.setItem('jez_os_wifi', JSON.stringify(newState))
  }

  const toggleCasting = () => {
    const newState = !castingEnabled
    setCastingEnabled(newState)
    localStorage.setItem('jez_os_cast', JSON.stringify(newState))
  }

  const connectToWifi = (networkName) => {
    setSelectedWifi(networkName)
    localStorage.setItem('jez_os_selected_wifi', networkName)
    setAvailableWifiNetworks(prev =>
      prev.map(net => ({
        ...net,
        connected: net.name === networkName
      }))
    )
    setShowWifiSelector(false)
  }

  const connectToBluetooth = (deviceName) => {
    setSelectedBluetooth(deviceName)
    localStorage.setItem('jez_os_selected_bluetooth', deviceName)
    setAvailableBluetoothDevices(prev =>
      prev.map(dev => ({
        ...dev,
        connected: dev.name === deviceName
      }))
    )
    setShowBluetoothSelector(false)
  }

  const getConnectionTypeLabel = () => {
    switch (connectionType) {
      case '4g':
      case '5g':
        return 'Fast'
      case '3g':
        return 'Good'
      case '2g':
      case 'slow-2g':
        return 'Slow'
      default:
        return 'Connected'
    }
  }

  return (
    <>
      <div className="action-center-overlay" onClick={handleClose} />
      <div className={`action-center ${isClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
      <div className="action-center-header">
        <h3 className="action-center-title">Quick Settings</h3>
        <button
          type="button"
          className="action-center-close"
          onClick={handleClose}
          aria-label="Close action center"
        >
          <X className="action-center-close-icon" />
        </button>
      </div>

      <div className="action-center-content">
        {/* Quick toggles grid */}
        <div className="action-quick-toggles">
          <button
            type="button"
            className={`quick-toggle ${wifiEnabled && !airplaneMode ? 'active' : ''}`}
            onClick={() => {
              if (!airplaneMode) {
                setShowWifiSelector(!showWifiSelector)
                setShowBluetoothSelector(false)
              }
            }}
            disabled={airplaneMode}
            title={`Wi-Fi: ${getConnectionTypeLabel()}`}
          >
            <Wifi className="quick-toggle-icon" />
            <span className="quick-toggle-label">Wi-Fi</span>
          </button>

          <button
            type="button"
            className={`quick-toggle ${bluetoothEnabled ? 'active' : ''}`}
            onClick={() => {
              setShowBluetoothSelector(!showBluetoothSelector)
              setShowWifiSelector(false)
            }}
            title="Bluetooth"
          >
            <Bluetooth className="quick-toggle-icon" />
            <span className="quick-toggle-label">Bluetooth</span>
          </button>

          <button
            type="button"
            className={`quick-toggle ${airplaneMode ? 'active' : ''}`}
            onClick={toggleAirplaneMode}
            title="Airplane Mode"
          >
            <Smartphone className="quick-toggle-icon" />
            <span className="quick-toggle-label">Airplane</span>
          </button>

          <button
            type="button"
            className={`quick-toggle ${castingEnabled ? 'active' : ''}`}
            onClick={toggleCasting}
            title="Cast to Device"
          >
            <Cast className="quick-toggle-icon" />
            <span className="quick-toggle-label">Cast</span>
          </button>
        </div>

        {/* Wi-Fi Networks Selector */}
        {showWifiSelector && (
          <div className="action-connection-selector">
            <h4 className="connection-selector-title">Available Networks</h4>
            <div className="connection-list">
              {availableWifiNetworks.map((network) => (
                <button
                  key={network.name}
                  type="button"
                  className={`connection-item ${network.connected ? 'connected' : ''}`}
                  onClick={() => connectToWifi(network.name)}
                >
                  <div className="connection-info">
                    <span className="connection-name">{network.name}</span>
                    <span className="connection-strength">{network.strength}%</span>
                  </div>
                  {network.connected && <span className="connection-check">✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bluetooth Devices Selector */}
        {showBluetoothSelector && (
          <div className="action-connection-selector">
            <h4 className="connection-selector-title">Available Devices</h4>
            <div className="connection-list">
              {availableBluetoothDevices.map((device) => (
                <button
                  key={device.address}
                  type="button"
                  className={`connection-item ${device.connected ? 'connected' : ''}`}
                  onClick={() => connectToBluetooth(device.name)}
                >
                  <div className="connection-info">
                    <span className="connection-name">{device.name}</span>
                    <span className="connection-address">{device.address}</span>
                  </div>
                  {device.connected && <span className="connection-check">✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Brightness Slider */}
        <div className="action-slider-group">
          <div className="action-slider-label">
            <Sun className="action-slider-icon" />
            <span>Brightness</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={brightness}
            onChange={(e) => handleBrightnessChange(e.target.value)}
            className="action-slider"
          />
          <span className="action-slider-value">{brightness}%</span>
        </div>

        {/* Volume Slider */}
        <div className="action-slider-group">
          <div className="action-slider-label">
            <Volume2 className="action-slider-icon" />
            <span>Volume</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => handleVolumeChange(e.target.value)}
            className="action-slider"
          />
          <span className="action-slider-value">{volume}%</span>
        </div>

        {/* Battery Status */}
        <div className="action-status-item">
          <div className="action-status-label">
            <Battery className="action-status-icon" />
            <span>Battery</span>
          </div>
          <div className="action-status-value">
            <div className="battery-bar">
              <div className="battery-fill" style={{ width: `${displayBattery.level}%` }} />
            </div>
            <span className="battery-text">
              {batterySupported ? `${displayBattery.level}% ${displayBattery.charging ? '⚡ Charging' : ''}` : 'Not available'}
            </span>
          </div>
        </div>

        {/* Energy Saver */}
        <div className="action-status-item">
          <div className="action-status-label">
            <Zap className="action-status-icon" />
            <span>Power</span>
          </div>
          <div className="action-status-value">
            <button
              type="button"
              className={`power-mode-btn ${energySaver ? 'active' : ''}`}
              onClick={toggleEnergySaver}
            >
              {energySaver ? 'Energy Saver On' : 'Normal'}
            </button>
          </div>
        </div>
      </div>
        </div>
    </>
  )
}
