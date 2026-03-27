import { useState } from 'react'

export default function LocalFsPanel() {
  const [status, setStatus] = useState('Not connected')
  const [rootHandle, setRootHandle] = useState(null)
  const [entries, setEntries] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileContent, setFileContent] = useState('')
  const [error, setError] = useState('')

  const connectFolder = async () => {
    setError('')
    try {
      if (!('showDirectoryPicker' in window)) {
        setError('File system access not available on this system.')
        return
      }
      const handle = await window.showDirectoryPicker()
      setRootHandle(handle)
      setStatus('Connected')
      await refreshListing(handle)
    } catch (err) {
      if (err?.name !== 'AbortError') {
        setError('Failed to connect to local folder.')
      }
    }
  }

  const refreshListing = async (handle = rootHandle) => {
    if (!handle) return
    const nextEntries = []
    for await (const [name, entry] of handle.entries()) {
      nextEntries.push({ name, kind: entry.kind, handle: entry })
    }
    nextEntries.sort((a, b) => a.name.localeCompare(b.name))
    setEntries(nextEntries)
  }

  const openFile = async (entry) => {
    setError('')
    setSelectedFile(entry.name)
    if (entry.kind !== 'file') {
      setFileContent('')
      return
    }
    try {
      const file = await entry.handle.getFile()
      const text = await file.text()
      setFileContent(text)
    } catch (err) {
      setError('Unable to read file content.')
    }
  }

  return (
    <div className="localfs-panel">
      <div className="localfs-header">
        <div>
          <div className="localfs-title">Local Files (Optional)</div>
          <div className="localfs-status">{status}</div>
        </div>
        <div className="localfs-actions">
          <button type="button" className="localfs-button" onClick={connectFolder}>
            Connect Folder
          </button>
          <button
            type="button"
            className="localfs-button ghost"
            onClick={() => refreshListing()}
            disabled={!rootHandle}
          >
            Refresh
          </button>
        </div>
      </div>

      {error ? <div className="localfs-error">{error}</div> : null}

      <div className="localfs-body">
        <div className="localfs-list">
          {entries.length === 0 ? (
            <div className="localfs-empty">No files loaded yet.</div>
          ) : (
            entries.map((entry) => (
              <button
                type="button"
                key={entry.name}
                className={`localfs-item ${selectedFile === entry.name ? 'active' : ''}`}
                onClick={() => openFile(entry)}
              >
                <span className="localfs-item-name">{entry.name}</span>
                <span className="localfs-item-kind">{entry.kind}</span>
              </button>
            ))
          )}
        </div>
        <div className="localfs-preview">
          <div className="localfs-preview-title">Preview</div>
          <pre className="localfs-preview-content">
            {fileContent || 'Select a file to view its contents.'}
          </pre>
        </div>
      </div>
    </div>
  )
}
