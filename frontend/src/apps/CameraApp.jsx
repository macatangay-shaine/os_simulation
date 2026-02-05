import { useState, useRef, useEffect } from 'react'
import { Camera, Video, Circle, Square, Download } from 'lucide-react'

export default function CameraApp() {
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
    isMountedRef.current = true
    startCamera()
    
    return () => {
      isMountedRef.current = false
      stopCamera(true)
    }
  }, [])

  useEffect(() => {
    stopCamera(true)
    startCamera()
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

  const startCamera = async () => {
    const token = ++startTokenRef.current
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: mode === 'video' 
      })
      if (!isMountedRef.current || token !== startTokenRef.current) {
        mediaStream.getTracks().forEach(track => track.stop())
        return
      }
      streamRef.current = mediaStream
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setError(null)
    } catch (err) {
      setError('Camera access denied or not available')
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

  return (
    <div className="camera-app">
      <div className="camera-layout">
        <div className="camera-preview">
          {error ? (
            <div className="camera-error">
              <Camera size={48} />
              <p>{error}</p>
            </div>
          ) : (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className="camera-video"
            />
          )}
        </div>

        <aside className="camera-side">
          <div className="camera-controls">
            <div className="mode-selector">
              <button 
                className={`mode-btn ${mode === 'photo' ? 'active' : ''}`}
                onClick={() => setMode('photo')}
              >
                <Camera size={18} />
                Photo
              </button>
              <button 
                className={`mode-btn ${mode === 'video' ? 'active' : ''}`}
                onClick={() => setMode('video')}
              >
                <Video size={18} />
                Video
              </button>
            </div>
          </div>

          <div className="camera-actions">
            {mode === 'photo' ? (
              <button className="capture-btn" onClick={capturePhoto} disabled={!stream}>
                <Circle size={32} />
              </button>
            ) : (
              <button 
                className={`capture-btn ${isRecording ? 'recording' : ''}`}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={!stream}
              >
                {isRecording ? <Square size={24} /> : <Circle size={32} />}
              </button>
            )}
            <div className="camera-status">
              {mode === 'photo' ? 'Ready to shoot' : isRecording ? 'Recording...' : 'Ready to record'}
            </div>
          </div>

          <div className="camera-gallery">
            <h3>Recent Captures</h3>
            {capturedMedia.length === 0 ? (
              <div className="gallery-empty">No captures yet.</div>
            ) : (
              <div className="gallery-grid">
                {capturedMedia.map((item, idx) => (
                  <div key={idx} className="gallery-item">
                    {item.type === 'photo' ? (
                      <img src={item.url} alt={item.filename} />
                    ) : (
                      <video src={item.url} muted />
                    )}
                    <button 
                      className="download-btn"
                      onClick={() => downloadMedia(item)}
                      title="Download"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
