import { useState, useEffect } from 'react'
import { FileText, Plus, Trash2, Save, FolderOpen, Printer } from 'lucide-react'

export default function NotesApp() {
  const [content, setContent] = useState('')
  const [currentNote, setCurrentNote] = useState(null)
  const [notesList, setNotesList] = useState([])
  const [status, setStatus] = useState('')
  const [notesDir] = useState('/home/user/notes')
  const [isModified, setIsModified] = useState(false)
  const [newNoteName, setNewNoteName] = useState('')
  const [showNewNoteDialog, setShowNewNoteDialog] = useState(false)
  const [showHistoryPanel, setShowHistoryPanel] = useState(false)
  const [historyEntries, setHistoryEntries] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [viewMode, setViewMode] = useState('notes')
  const [trashNotes, setTrashNotes] = useState([])

  useEffect(() => {
    // Load notes directory on mount
    loadNotesList()
    loadTrashNotes()
    
    // Check if a file should be opened from File Explorer
    checkForFileToOpen().catch(err => {
      console.error('Error checking for file to open:', err)
      setStatus('Failed to open file')
    })
  }, [])

  useEffect(() => {
    // Mark as modified when content changes
    if (currentNote && content !== currentNote.originalContent) {
      setIsModified(true)
    } else {
      setIsModified(false)
    }
  }, [content, currentNote])

  const checkForFileToOpen = async () => {
    const fileToOpen = localStorage.getItem('notes_open_file')
    console.log('[NotesApp] Checking for file to open. Key exists:', !!fileToOpen, 'Path:', fileToOpen)
    
    if (fileToOpen) {
      // Clear the flag
      localStorage.removeItem('notes_open_file')
      
      // Open the file
      try {
        console.log('[NotesApp] Attempting to read file:', fileToOpen)
        const response = await fetchApi('/fs/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: fileToOpen })
        })
        if (response.ok) {
          const data = await response.json()
          console.log('[NotesApp] File read successfully. Content length:', data.content.length)
          setContent(data.content)
          setCurrentNote({
            path: fileToOpen,
            type: 'file',
            originalContent: data.content
          })
          loadNoteHistory(fileToOpen)
          setStatus('File opened')
          setIsModified(false)
          
          // Reload notes list to include external file
          setTimeout(() => loadNotesList(), 100)
        } else {
          console.error('[NotesApp] File read failed. Status:', response.status)
          setStatus('Failed to open file: ' + response.status)
        }
      } catch (error) {
        console.error('[NotesApp] Error reading file:', error)
        setStatus('Failed to open file: ' + error.message)
      }
    }
  }

  const fetchApi = async (path, options = {}) => {
    const bases = ['http://localhost:8000', 'http://127.0.0.1:8000']
    for (const base of bases) {
      try {
        const response = await fetch(`${base}${path}`, options)
        return response
      } catch (err) {
        continue
      }
    }
    throw new Error('System service unavailable')
  }

  const loadNotesList = async () => {
    try {
      // First ensure notes directory exists
      await fetchApi('/fs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: notesDir, node_type: 'dir', content: '' })
      })

      // List all files in notes directory
      const response = await fetchApi(`/fs/list?path=${encodeURIComponent(notesDir)}`)
      if (response.ok) {
        const data = await response.json()
        // Filter only text files
        const txtFiles = (data.nodes || []).filter(
          node => node.type === 'file' && node.path.endsWith('.txt')
        )
        setNotesList(txtFiles)
        
        // If current note is open and not in notes directory, add it to the list for display
        if (currentNote && !currentNote.path.startsWith(notesDir)) {
          setNotesList(prev => [{
            path: currentNote.path,
            type: 'file'
          }, ...prev])
        }
      }
    } catch (error) {
      setStatus('Failed to load notes')
    }
  }

  const loadTrashNotes = async () => {
    try {
      const response = await fetchApi('/fs/recycle/list')
      if (!response.ok) {
        setTrashNotes([])
        return
      }

      const data = await response.json()
      const notesTrash = (data.nodes || []).filter((node) => {
        const originalPath = node.original_path || ''
        return originalPath.startsWith(`${notesDir}/`) && originalPath.endsWith('.txt')
      })
      setTrashNotes(notesTrash)
    } catch {
      setTrashNotes([])
    }
  }

  const loadNoteHistory = async (notePath) => {
    if (!notePath) {
      setHistoryEntries([])
      return
    }
    setHistoryLoading(true)
    try {
      const response = await fetchApi(`/fs/history?path=${encodeURIComponent(notePath)}`)
      if (response.ok) {
        const data = await response.json()
        setHistoryEntries(data.versions || [])
      } else {
        setHistoryEntries([])
      }
    } catch {
      setHistoryEntries([])
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleSelectNote = async (note) => {
    if (isModified) {
      const confirm = window.confirm('You have unsaved changes. Do you want to continue?')
      if (!confirm) return
    }

    try {
      const response = await fetchApi('/fs/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: note.path })
      })
      if (response.ok) {
        const data = await response.json()
        setContent(data.content)
        setCurrentNote({
          ...note,
          originalContent: data.content
        })
        loadNoteHistory(note.path)
        setStatus('Note loaded')
        setIsModified(false)
      } else {
        setStatus('Failed to load note')
      }
    } catch (error) {
      setStatus('System service unavailable')
    }
  }

  const handleSave = async () => {
    if (!currentNote) {
      setStatus('No note selected')
      return
    }

    setStatus('Saving...')
    try {
      const response = await fetchApi('/fs/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: currentNote.path, content })
      })
      if (response.ok) {
        setStatus('Saved successfully')
        setCurrentNote({ ...currentNote, originalContent: content })
        setIsModified(false)
        loadNoteHistory(currentNote.path)
        
        // Send notification
        try {
          await fetchApi('/notification/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: 'Notes',
              message: 'Note saved successfully',
              type: 'success',
              app_id: 'notes'
            })
          })
        } catch (error) {
          // Ignore notification errors
        }
      } else {
        setStatus('Failed to save')
      }
    } catch (error) {
      setStatus('System service unavailable')
    }
  }

  const handlePrint = () => {
    if (!currentNote) return
    
    const fileName = currentNote.path.split('/').pop()
    const pages = Math.max(1, Math.ceil(content.length / 500))
    
    window.dispatchEvent(new CustomEvent('submit-print-job', {
      detail: {
        jobName: fileName,
        pages,
        pid: 1
      }
    }))
    
    setStatus(`Print job submitted: ${fileName} (${pages} pages)`)
  }

  const handleNewNote = () => {
    if (isModified) {
      const confirm = window.confirm('You have unsaved changes. Do you want to continue?')
      if (!confirm) return
    }
    setNewNoteName('')
    setShowNewNoteDialog(true)
  }

  const createNewNote = async () => {
    if (!newNoteName.trim()) {
      setStatus('Please enter a note name')
      return
    }

    const fileName = newNoteName.endsWith('.txt') ? newNoteName : `${newNoteName}.txt`
    const notePath = `${notesDir}/${fileName}`

    try {
      const response = await fetchApi('/fs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: notePath, node_type: 'file', content: '' })
      })
      
      if (response.ok) {
        setContent('')
        setCurrentNote({
          path: notePath,
          type: 'file',
          originalContent: ''
        })
        setHistoryEntries([])
        setShowHistoryPanel(false)
        setIsModified(false)
        setStatus('New note created')
        setShowNewNoteDialog(false)
        loadNotesList()
      } else {
        setStatus('Failed to create note')
      }
    } catch (error) {
      setStatus('System service unavailable')
    }
  }

  const handleDeleteNote = async (note, e) => {
    e.stopPropagation()
    
    const confirm = window.confirm(`Are you sure you want to delete "${note.path.split('/').pop()}"?`)
    if (!confirm) return

    try {
      const response = await fetchApi(`/fs/delete?path=${encodeURIComponent(note.path)}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setStatus('Note moved to Trash')
        if (currentNote?.path === note.path) {
          setContent('')
          setCurrentNote(null)
          setHistoryEntries([])
          setShowHistoryPanel(false)
          setIsModified(false)
        }
        loadNotesList()
        loadTrashNotes()
        
        // Send notification
        try {
          await fetchApi('/notification/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: 'Notes',
              message: 'Note deleted',
              type: 'info',
              app_id: 'notes'
            })
          })
        } catch (error) {
          // Ignore notification errors
        }
      } else {
        setStatus('Failed to delete note')
      }
    } catch (error) {
      setStatus('System service unavailable')
    }
  }

  const restoreDeletedNote = async (trashNote, e) => {
    e.stopPropagation()
    try {
      const response = await fetchApi(
        `/fs/recycle/restore?recycle_path=${encodeURIComponent(trashNote.path)}`,
        { method: 'POST' }
      )
      if (response.ok) {
        setStatus('Note restored from Trash')
        loadNotesList()
        loadTrashNotes()
      } else {
        setStatus('Failed to restore note')
      }
    } catch {
      setStatus('Failed to restore note')
    }
  }

  const permanentlyDeleteNote = async (trashNote, e) => {
    e.stopPropagation()
    const confirm = window.confirm('Permanently delete this note from Trash?')
    if (!confirm) return

    try {
      const response = await fetchApi(
        `/fs/delete?path=${encodeURIComponent(trashNote.path)}&permanent=true`,
        { method: 'DELETE' }
      )
      if (response.ok) {
        setStatus('Note permanently deleted')
        loadTrashNotes()
      } else {
        setStatus('Failed to permanently delete note')
      }
    } catch {
      setStatus('Failed to permanently delete note')
    }
  }

  const restoreHistoryVersion = async (versionId) => {
    if (!currentNote) return
    try {
      const response = await fetchApi(
        `/fs/history/restore?path=${encodeURIComponent(currentNote.path)}&version_id=${versionId}`,
        { method: 'POST' }
      )
      if (!response.ok) {
        setStatus('Failed to restore version')
        return
      }

      const readResponse = await fetchApi('/fs/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: currentNote.path })
      })
      if (readResponse.ok) {
        const data = await readResponse.json()
        setContent(data.content)
        setCurrentNote({ ...currentNote, originalContent: data.content })
        setIsModified(false)
        setStatus('Version restored')
        loadNoteHistory(currentNote.path)
      }
    } catch {
      setStatus('Failed to restore version')
    }
  }

  return (
    <div className="app-notes">
      <div className="notes-container">
        {/* Notes List Sidebar */}
        <div className="notes-sidebar">
          <div className="notes-sidebar-header">
            <div className="notes-sidebar-modes">
              <button
                type="button"
                className={`notes-mode-btn ${viewMode === 'notes' ? 'active' : ''}`}
                onClick={() => setViewMode('notes')}
              >
                My Notes
              </button>
              <button
                type="button"
                className={`notes-mode-btn ${viewMode === 'trash' ? 'active' : ''}`}
                onClick={() => {
                  setViewMode('trash')
                  loadTrashNotes()
                }}
              >
                Trash ({trashNotes.length})
              </button>
            </div>
            <button 
              type="button" 
              className="notes-sidebar-btn"
              onClick={handleNewNote}
              title="New Note"
              disabled={viewMode !== 'notes'}
            >
              <Plus size={18} />
            </button>
          </div>
          
          <div className="notes-list">
            {viewMode === 'notes' && notesList.length === 0 ? (
              <div className="notes-empty">
                <FileText size={32} className="notes-empty-icon" />
                <p>No notes yet</p>
                <button 
                  type="button" 
                  className="notes-empty-btn"
                  onClick={handleNewNote}
                >
                  Create your first note
                </button>
              </div>
            ) : viewMode === 'notes' ? (
              notesList.map((note) => {
                const isExternal = !note.path.startsWith(notesDir)
                return (
                  <div
                    key={note.path}
                    className={`notes-list-item ${currentNote?.path === note.path ? 'active' : ''} ${isExternal ? 'external' : ''}`}
                    onClick={() => handleSelectNote(note)}
                    title={isExternal ? note.path : ''}
                  >
                    <FileText size={16} className="notes-list-icon" />
                    <span className="notes-list-name">
                      {isExternal ? note.path.split('/').pop().replace('.txt', '') : note.path.split('/').pop().replace('.txt', '')}
                    </span>
                    {!isExternal && (
                      <button
                        type="button"
                        className="notes-list-delete"
                        onClick={(e) => handleDeleteNote(note, e)}
                        title="Delete note"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )
              })
            ) : trashNotes.length === 0 ? (
              <div className="notes-empty">
                <Trash2 size={32} className="notes-empty-icon" />
                <p>Trash is empty</p>
              </div>
            ) : (
              trashNotes.map((note) => {
                const noteName = (note.original_path || note.path).split('/').pop().replace('.txt', '')
                return (
                  <div key={note.path} className="notes-list-item trash-item">
                    <FileText size={16} className="notes-list-icon" />
                    <div className="notes-trash-info">
                      <span className="notes-list-name">{noteName}</span>
                      <span className="notes-trash-date">Deleted: {new Date(note.deleted_at).toLocaleString()}</span>
                    </div>
                    <button
                      type="button"
                      className="notes-list-action"
                      onClick={(e) => restoreDeletedNote(note, e)}
                      title="Restore note"
                    >
                      Restore
                    </button>
                    <button
                      type="button"
                      className="notes-list-delete"
                      onClick={(e) => permanentlyDeleteNote(note, e)}
                      title="Delete permanently"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Editor Area */}
        <div className="notes-editor-area">
          <div className="notes-toolbar">
            <div className="notes-toolbar-left">
              {currentNote ? (
                <>
                  <FolderOpen size={16} className="notes-toolbar-icon" />
                  <span className="notes-current-file">
                    {currentNote.path.split('/').pop()}
                  </span>
                  {isModified && <span className="notes-modified-indicator">●</span>}
                </>
              ) : (
                <span className="notes-no-file">No note selected</span>
              )}
            </div>
            
            <div className="notes-toolbar-actions">
              <button
                type="button"
                className="notes-toolbar-btn"
                onClick={() => {
                  const next = !showHistoryPanel
                  setShowHistoryPanel(next)
                  if (next && currentNote) {
                    loadNoteHistory(currentNote.path)
                  }
                }}
                disabled={!currentNote}
                title="Version History"
              >
                History
              </button>
              <button 
                type="button" 
                className="notes-toolbar-btn"
                onClick={handleSave}
                disabled={!currentNote || !isModified}
                title="Save"
              >
                <Save size={16} />
                Save
              </button>
              <button 
                type="button" 
                className="notes-toolbar-btn"
                onClick={handlePrint}
                disabled={!currentNote}
                title="Print"
              >
                <Printer size={16} />
                Print
              </button>
            </div>
          </div>

          {status && <div className="notes-status">{status}</div>}

          {showHistoryPanel && currentNote && (
            <div className="notes-history-panel">
              <div className="notes-history-title">Version History</div>
              {historyLoading ? (
                <div className="notes-history-empty">Loading history...</div>
              ) : historyEntries.length === 0 ? (
                <div className="notes-history-empty">No saved versions yet</div>
              ) : (
                <div className="notes-history-list">
                  {historyEntries.map((version) => (
                    <div key={version.id} className="notes-history-item">
                      <div className="notes-history-meta">
                        <div className="notes-history-date">{new Date(version.created_at).toLocaleString()}</div>
                        <div className="notes-history-preview">{version.preview}</div>
                      </div>
                      <button
                        type="button"
                        className="notes-history-restore"
                        onClick={() => restoreHistoryVersion(version.id)}
                      >
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <textarea
            className="notes-editor"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={currentNote ? "Start typing..." : "Select or create a note to begin"}
            disabled={!currentNote}
          />
        </div>
      </div>

      {/* New Note Dialog */}
      {showNewNoteDialog && (
        <div className="notes-dialog-overlay" onClick={() => setShowNewNoteDialog(false)}>
          <div className="notes-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Note</h3>
            <input
              type="text"
              className="notes-dialog-input"
              value={newNoteName}
              onChange={(e) => setNewNoteName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') createNewNote()
                if (e.key === 'Escape') setShowNewNoteDialog(false)
              }}
              placeholder="Note name (e.g., My Note)"
              autoFocus
            />
            <div className="notes-dialog-buttons">
              <button type="button" className="notes-dialog-btn primary" onClick={createNewNote}>
                Create
              </button>
              <button type="button" className="notes-dialog-btn" onClick={() => setShowNewNoteDialog(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
