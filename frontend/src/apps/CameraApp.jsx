import { useState, useRef, useEffect } from 'react'
import {
  Camera,
  Video,
  Square,
  Download,
  Minus,
  X,
  Maximize2,
  Minimize2,
  Settings,
  Timer,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Image
} from 'lucide-react'

export default function CameraApp({ onWindowTitleChange, windowControls }) {
  const [mode, setMode] = useState('photo') // 'photo' or 'video'
  const [isRecording, setIsRecording] = useState(false)
  const [stream, setStream] = useState(null)
  const [capturedMedia, setCapturedMedia] = useState([])
  const [error, setError] = useState(null)
  const [apiBase, setApiBase] = useState('http://127.0.0.1:8000')
  
  const videoRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  const isMountedRef = useRef(false)
  const startTokenRef = useRef(0)

  useEffect(() => {
    onWindowTitleChange?.('Camera')
  }, [onWindowTitleChange])

  useEffect(() => {
    isMountedRef.current = true
    
    return () => {
      isMountedRef.current = false
      stopCamera(true)
    }
  }, [])

  useEffect(() => {
    if (!isMountedRef.current) return

    void startCamera()

    return () => {
      stopCamera(true)
    }
  }, [mode])

  const fetchApi = async (path, options = {}) => {
    const bases = [apiBase, 'http://127.0.0.1:8000', 'http://localhost:8000']
    const tried = new Set()
    for (const base of bases) {
      if (tried.has(base)) continue
      tried.add(base)
      try {
        const response = await fetch(`${base}${path}`, options)
        if (base !== apiBase) {
          setApiBase(base)
        }
        return response
      } catch (err) {
        continue
      }
    }
    throw new Error('network')
  }

  const requestUserMedia = async (constraints) => navigator.mediaDevices.getUserMedia(constraints)

  const getCameraErrorMessage = (err) => {
    if (!window.isSecureContext) {
      return 'Camera needs a secure context. Open this app from localhost or HTTPS.'
    }

    switch (err?.name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        return mode === 'video'
          ? 'Camera or microphone permission was denied. Allow access in your browser site settings.'
          : 'Camera permission was denied. Allow access in your browser site settings.'
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return mode === 'video'
          ? 'No camera or microphone was found on this device.'
          : 'No camera device was found on this device.'
      case 'NotReadableError':
      case 'TrackStartError':
        return 'Camera is busy in another app. Close the other app and try again.'
      case 'OverconstrainedError':
      case 'ConstraintNotSatisfiedError':
        return 'Camera started with unsupported settings. We could not find a compatible device profile.'
      case 'SecurityError':
        return 'Browser security settings blocked camera access.'
      case 'AbortError':
        return 'Camera startup was interrupted. Try opening the Camera app again.'
      default:
        return 'Camera is unavailable right now. Check browser permission settings and device access.'
    }
  }

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('This browser does not support camera access.')
      return
    }

    stopCamera()
    const token = ++startTokenRef.current

    try {
      const wantsAudio = mode === 'video'
      const preferredVideoConstraints = { facingMode: { ideal: 'user' } }
      let mediaStream = null
      let lastError = null

      const attempts = wantsAudio
        ? [
            { video: preferredVideoConstraints, audio: true },
            { video: preferredVideoConstraints, audio: false },
            { video: true, audio: false }
          ]
        : [
            { video: preferredVideoConstraints, audio: false },
            { video: true, audio: false }
          ]

      for (const constraints of attempts) {
        try {
          mediaStream = await requestUserMedia(constraints)
          break
        } catch (err) {
          lastError = err
        }
      }

      if (!mediaStream) {
        throw lastError || new Error('camera_unavailable')
      }

      if (!isMountedRef.current || token !== startTokenRef.current) {
        mediaStream.getTracks().forEach(track => track.stop())
        return
      }

      streamRef.current = mediaStream
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play?.().catch(() => {})
      }
      setError(null)
    } catch (err) {
      if (!isMountedRef.current || token !== startTokenRef.current) {
        return
      }
      streamRef.current = null
      setStream(null)
      setError(getCameraErrorMessage(err))
      console.error('Camera error:', err)
    }
  }

  const stopCamera = (force = false) => {
    startTokenRef.current += 1
    const activeStream = streamRef.current || stream
    if (activeStream) {
      activeStream.getTracks().forEach(track => {
        track.stop()
      })
      streamRef.current = null
      if (force) {
        setStream(null)
      }
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current.pause?.()
    }
    if (force) {
      setIsRecording(false)
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(videoRef.current, 0, 0)
    
    canvas.toBlob(async (blob) => {
      if (!blob) {
        setError('Failed to capture photo')
        return
      }
      const url = URL.createObjectURL(blob)
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const filename = `photo_${timestamp}.jpg`
      
      const saved = await saveToFileSystem(blob, filename, 'Pictures')
      if (saved) {
        setCapturedMedia(prev => [...prev, { type: 'photo', url, filename }])
      } else {
        URL.revokeObjectURL(url)
      }
    }, 'image/jpeg', 0.92)
  }

  const startRecording = () => {
    if (!stream) return
    chunksRef.current = []
    const preferredTypes = [
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm'
    ]
    const selectedType = preferredTypes.find((type) => MediaRecorder.isTypeSupported(type))
    const mediaRecorder = selectedType ? new MediaRecorder(stream, { mimeType: selectedType }) : new MediaRecorder(stream)
    mediaRecorderRef.current = mediaRecorder

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data)
      }
    }

    mediaRecorder.onstop = async () => {
      const mimeType = selectedType || 'video/webm'
      const blob = new Blob(chunksRef.current, { type: mimeType })
      const url = URL.createObjectURL(blob)
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const extension = mimeType.includes('mp4') ? 'mp4' : 'webm'
      const filename = `video_${timestamp}.${extension}`
      
      // Save to virtual file system (Videos folder)
      const saved = await saveToFileSystem(blob, filename, 'Videos')
      if (saved) {
        setCapturedMedia(prev => [...prev, { type: 'video', url, filename }])
      } else {
        URL.revokeObjectURL(url)
      }
    }

    mediaRecorder.start()
    setIsRecording(true)
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const ensureDirectories = async (folder) => {
    const dirs = ['/home', '/home/user', `/home/user/${folder}`]
    for (const dirPath of dirs) {
      try {
        const response = await fetchApi('/fs/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: dirPath,
            node_type: 'dir',
            content: ''
          })
        })
        if (!response.ok && response.status !== 409) {
          return false
        }
      } catch (err) {
        return false
      }
    }
    return true
  }

  const readAsDataUrl = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })

  const saveToFileSystem = async (blob, filename, folder) => {
    try {
      const dataUrl = await readAsDataUrl(blob)
      const base64 = dataUrl.split(',')[1]
      const path = `/home/user/${folder}/${filename}`
      const ensured = await ensureDirectories(folder)
      if (!ensured) {
        setError('Failed to prepare storage folders')
        return false
      }
      const createResponse = await fetchApi('/fs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path,
          node_type: 'file',
          content: base64
        })
      })
      if (createResponse.status === 409) {
        const writeResponse = await fetchApi('/fs/write', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path,
            content: base64
          })
        })
        if (!writeResponse.ok) {
          setError('Failed to save media file')
          return false
        }
      } else if (!createResponse.ok) {
        setError('Failed to save media file')
        return false
      }
      return true
    } catch (err) {
      console.error('Failed to save to file system:', err)
      setError('Failed to save media file')
      return false
    }
  }

  const downloadMedia = (item) => {
    const a = document.createElement('a')
    a.href = item.url
    a.download = item.filename
    a.click()
  }

  const retryCamera = () => {
    setError(null)
    void startCamera()
  }

  const statusText = mode === 'photo' ? 'Ready to shoot' : isRecording ? 'Recording...' : 'Ready to record'
  const capturePreview = [...capturedMedia].slice(-4).reverse()

  return (
    <div className="camera-app">
      <div className="camera-shell">
        <header className="camera-chrome" data-window-drag-handle="true">
          <div className="camera-chrome-brand">
            <img className="camera-chrome-icon" src="/desktop-icons/camera.png" alt="" />
            <span>Camera</span>
          </div>
          {windowControls ? (
            <div className="camera-window-controls" data-no-window-drag="true">
              <button
                type="button"
                className="camera-window-control"
                onClick={windowControls.onMinimize}
                aria-label="Minimize"
              >
                <Minus size={14} />
              </button>
              {windowControls.canMaximize ? (
                <button
                  type="button"
                  className="camera-window-control"
                  onClick={windowControls.onMaximize}
                  aria-label={windowControls.isMaximized ? 'Restore' : 'Maximize'}
                >
                  {windowControls.isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
              ) : null}
              <button 
                type="button"
                className="camera-window-control close"
                onClick={windowControls.onClose}
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>
          ) : null}
        </header>

        <div className="camera-workspace">
          <aside className="camera-utility-rail" aria-hidden="true">
            <div className="camera-utility-group">
              <div className="camera-utility-icon">
                <Settings size={18} />
              </div>
            </div>
            <div className="camera-utility-group">
              <div className="camera-utility-icon">
                <Sparkles size={18} />
              </div>
              <div className="camera-utility-icon">
                <Timer size={18} />
              </div>
            </div>
          </aside>

          <div className="camera-stage-area">
            <div className="camera-stage">
              {error ? (
                <div className="camera-error">
                  <Camera size={48} />
                  <p>{error}</p>
                  <button type="button" className="camera-error-retry" onClick={retryCamera}>
                    Retry camera
                  </button>
                </div>
              ) : (
                <>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted
                    className="camera-video"
                  />
                  <div className="camera-stage-sheen" aria-hidden="true" />
                  <div className="camera-guide-frame" aria-hidden="true" />
                  <div className={`camera-status-chip ${isRecording ? 'recording' : ''}`}>
                    {statusText}
                  </div>
                </>
              )}
            </div>
          </div>

          <aside className="camera-command-rail">
            <div className="camera-rail-chevron" aria-hidden="true">
              <ChevronUp size={22} />
            </div>

            <div className="camera-mode-stack" data-no-window-drag="true">
              <button 
                type="button"
                className={`camera-mode-toggle ${mode === 'photo' ? 'active' : ''}`}
                onClick={() => setMode('photo')}
                aria-label="Switch to photo mode"
                aria-pressed={mode === 'photo'}
              >
                <Camera size={19} />
              </button>
              <button 
                type="button"
                className={`camera-mode-toggle ${mode === 'video' ? 'active' : ''}`}
                onClick={() => setMode('video')}
                aria-label="Switch to video mode"
                aria-pressed={mode === 'video'}
              >
                <Video size={19} />
              </button>
            </div>

            <div className="camera-shutter-wrap" data-no-window-drag="true">
              <button 
                type="button"
                className={`camera-shutter ${mode === 'video' ? 'video-mode' : ''} ${isRecording ? 'recording' : ''}`}
                onClick={mode === 'photo' ? capturePhoto : isRecording ? stopRecording : startRecording}
                disabled={!stream}
                aria-label={
                  mode === 'photo'
                    ? 'Capture photo'
                    : isRecording
                      ? 'Stop recording'
                      : 'Start recording'
                }
              >
                <span className="camera-shutter-ring" />
                <span className="camera-shutter-core">
                  {mode === 'video' && isRecording ? <Square size={16} fill="currentColor" /> : mode === 'video' ? <Video size={20} /> : <Camera size={20} />}
                </span>
              </button>

              <div className="camera-mode-caption">
                {mode === 'photo' ? 'Photo' : isRecording ? 'Recording' : 'Video'}
              </div>
            </div>

            <div className="camera-gallery-rail" data-no-window-drag="true">
              <div className="camera-gallery-count">
                {capturedMedia.length} {capturedMedia.length === 1 ? 'capture' : 'captures'}
              </div>
              {capturePreview.length === 0 ? (
                <div className="camera-capture-placeholder">
                  <Image size={20} />
                </div>
              ) : (
                <div className="camera-capture-strip">
                  {capturePreview.map((item, idx) => (
                    <div key={`${item.filename}-${idx}`} className="camera-capture-card">
                      {item.type === 'photo' ? (
                        <img src={item.url} alt={item.filename} />
                      ) : (
                        <video src={item.url} muted playsInline preload="metadata" />
                      )}
                      <div className="camera-capture-badge">
                        {item.type === 'photo' ? <Camera size={12} /> : <Video size={12} />}
                      </div>
                      <button 
                        type="button"
                        className="camera-download-btn"
                        onClick={() => downloadMedia(item)}
                        title={`Download ${item.filename}`}
                        aria-label={`Download ${item.filename}`}
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="camera-rail-chevron" aria-hidden="true">
              <ChevronDown size={22} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
