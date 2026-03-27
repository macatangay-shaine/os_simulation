import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowUp,
  ClipboardCopy,
  ClipboardPaste,
  FilePlus,
  FileText,
  Folder,
  FolderPlus,
  Info,
  Pencil,
  Scissors,
  Trash2,
  Search,
  Home,
  Download,
  FileImage,
  Music,
  Video,
  HardDrive,
  Network,
  X,
  Terminal,
  Settings,
  Activity,
  Package,
  AlertCircle,
  Stethoscope,
  Printer,
  RotateCcw
} from 'lucide-react'

// Icon mapping for app shortcuts
const APP_SHORTCUT_ICONS = {
  'terminal': Terminal,
  'files': Folder,
  'localfiles': HardDrive,
  'notes': FileText,
  'settings': Settings,
  'monitor': Activity,
  'appstore': Package,
  'eventviewer': AlertCircle,
  'diagnostics': Stethoscope
}

const RECYCLE_BIN_PATH = '/home/user/.recycle_bin'

export default function FileExplorer({ onWindowTitleChange }) {
  const [currentPath, setCurrentPath] = useState('/home/user')
  const [entries, setEntries] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [error, setError] = useState('')
  const [apiBase, setApiBase] = useState('http://127.0.0.1:8000')
  const [clipboard, setClipboard] = useState(null)
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, targetPath: null })
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [renameTarget, setRenameTarget] = useState(null)
  const [renameName, setRenameName] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showPropertiesDialog, setShowPropertiesDialog] = useState(false)
  const [propertiesData, setPropertiesData] = useState(null)
  const [addressBarEdit, setAddressBarEdit] = useState(false)
  const [addressBarValue, setAddressBarValue] = useState(currentPath)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [fileContent, setFileContent] = useState(null)
  const [isLoadingFile, setIsLoadingFile] = useState(false)
  const [thumbnails, setThumbnails] = useState({})

  // Quick access locations
  const quickAccessItems = [
    { name: 'Desktop', path: '/home/user/Desktop', icon: Home },
    { name: 'Downloads', path: '/home/user/Downloads', icon: Download },
    { name: 'Documents', path: '/home/user/Documents', icon: FileText },
    { name: 'Pictures', path: '/home/user/Pictures', icon: FileImage },
    { name: 'Music', path: '/home/user/Music', icon: Music },
    { name: 'Videos', path: '/home/user/Videos', icon: Video },
    { name: 'Recycle Bin', path: RECYCLE_BIN_PATH, icon: Trash2 },
    { name: 'This PC', path: '/', icon: HardDrive },
    { name: 'Network', path: '/network', icon: Network }
  ]

  useEffect(() => {
    loadDirectory(currentPath)
    setSearchQuery('')
    setIsSearching(false)
  }, [currentPath])

  useEffect(() => {
    setAddressBarValue(currentPath)
  }, [currentPath])

  useEffect(() => {
    // Apply desktop/start-menu requested path after mount so it is stable in React dev/strict mode.
    const pathToOpen = localStorage.getItem('files_open_path')
    if (pathToOpen) {
      setCurrentPath(pathToOpen)
      localStorage.removeItem('files_open_path')
    }
  }, [])

  useEffect(() => {
    onWindowTitleChange?.(getWindowTitleFromPath(currentPath))
  }, [currentPath, onWindowTitleChange])

  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch()
    } else {
      setIsSearching(false)
      setSearchResults([])
    }
  }, [searchQuery])

  useEffect(() => {
    const entriesToPreview = (isSearching ? searchResults : entries)
      .filter((entry) => entry.type !== 'dir')
      .slice(0, 24)

    entriesToPreview.forEach((entry) => {
      const name = entry.path.split('/').pop()
      if (!isImageFile(name) && !isVideoFile(name)) return
      if (thumbnails[entry.path]) return
      loadThumbnail(entry.path, name)
    })
  }, [entries, searchResults, isSearching])

  useEffect(() => {
    return () => {
      Object.values(thumbnails).forEach((thumb) => {
        if (thumb?.url?.startsWith('blob:')) {
          URL.revokeObjectURL(thumb.url)
        }
      })
      if (fileContent?.mediaUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(fileContent.mediaUrl)
      }
    }
  }, [])

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

  const loadDirectory = async (path) => {
    setError('')
    setSearchQuery('')
    setIsSearching(false)
    setFileContent(null)
    try {
      const endpoint = path === RECYCLE_BIN_PATH
        ? '/fs/recycle/list'
        : `/fs/list?path=${encodeURIComponent(path)}`
      const response = await fetchApi(endpoint)
      if (response.ok) {
        const data = await response.json()
        setEntries(data.nodes || [])
      } else {
        setError('Failed to load directory')
      }
    } catch (err) {
      setError('System service unavailable')
    }
  }

  const performSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    setError('')
    
    try {
      // Simple search: filter current directory entries by name
      const filtered = entries.filter(entry => 
        entry.path.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setSearchResults(filtered)
    } catch (err) {
      setError('Search failed')
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setIsSearching(false)
    setSearchResults([])
  }

  const handleNavigate = (path) => {
    setCurrentPath(path)
    setSelectedFile(null)
    setFileContent(null)
  }

  const handleGoUp = () => {
    if (currentPath === '/') return
    const parts = currentPath.split('/').filter(Boolean)
    parts.pop()
    setCurrentPath('/' + parts.join('/'))
  }

  const handleFileClick = async (entry) => {
    console.log('File clicked:', entry)
    if (entry.type === 'dir') {
      handleNavigate(entry.path)
    } else {
      setSelectedFile(entry)
      
      // Check if it's an app shortcut - launch the app
      if (isAppShortcut(entry)) {
        console.log('Launching app shortcut:', entry.path)
        await launchAppFromShortcut(entry.path)
      } 
      // Check if it's a text file - open in Notes app
      else if (entry.path.endsWith('.txt')) {
        console.log('Opening text file in Notes:', entry.path)
        await openInNotesApp(entry.path)
      }
      // Otherwise, show file viewer
      else {
        console.log('Loading file content:', entry.path)
        await loadFileContent(entry.path)
      }
    }
  }

  const launchAppFromShortcut = async (shortcutPath) => {
    try {
      // Dispatch custom event to Desktop component to handle the launch
      window.dispatchEvent(new CustomEvent('launchAppShortcut', { 
        detail: { path: shortcutPath }
      }))
    } catch (err) {
      setError('Failed to launch app from shortcut')
    }
  }

  const openInNotesApp = async (filePath) => {
    try {
      console.log('[FileExplorer] Opening in Notes app. File:', filePath)
      // Store the file path for NotesApp to open
      localStorage.setItem('notes_open_file', filePath)
      console.log('[FileExplorer] localStorage set. Key exists:', !!localStorage.getItem('notes_open_file'))
      
      // Dispatch event to Desktop to launch Notes app properly
      console.log('[FileExplorer] Dispatching openFileInApp event to Desktop')
      window.dispatchEvent(new CustomEvent('openFileInApp', { 
        detail: { 
          appId: 'notes',
          filePath: filePath
        }
      }))
    } catch (err) {
      console.error('[FileExplorer] Failed to open file in Notes:', err)
      setError('Failed to open file in Notes')
      // Fallback to viewer
      await loadFileContent(filePath)
    }
  }

  const loadFileContent = async (filePath) => {
    setIsLoadingFile(true)
    setError('')
    try {
      const response = await fetchApi('/fs/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath })
      })
      if (response.ok) {
        const data = await response.json()
        if (fileContent?.mediaUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(fileContent.mediaUrl)
        }
        const name = filePath.split('/').pop()
        const mediaUrl = isImageFile(name) || isVideoFile(name)
          ? createMediaUrl(name, data.content)
          : null
        setFileContent({
          path: filePath,
          content: data.content,
          name,
          mediaUrl
        })
      } else {
        const message = response.status === 404 ? 'File not found' : 'Failed to read file'
        setError(message)
        setFileContent(null)
      }
    } catch (err) {
      setError('Failed to read file')
      setFileContent(null)
    } finally {
      setIsLoadingFile(false)
    }
  }

  const closeFileViewer = () => {
    if (fileContent?.mediaUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(fileContent.mediaUrl)
    }
    setFileContent(null)
    setSelectedFile(null)
  }

  const getExtension = (name = '') => name.toLowerCase().split('.').pop()

  const isImageFile = (name = '') => {
    const ext = getExtension(name)
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
  }

  const isVideoFile = (name = '') => {
    const ext = getExtension(name)
    return ['mp4', 'webm', 'mov'].includes(ext)
  }

  const getMimeType = (name = '') => {
    const ext = getExtension(name)
    if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
    if (ext === 'png') return 'image/png'
    if (ext === 'gif') return 'image/gif'
    if (ext === 'webp') return 'image/webp'
    if (ext === 'mp4') return 'video/mp4'
    if (ext === 'webm') return 'video/webm'
    if (ext === 'mov') return 'video/quicktime'
    return 'text/plain'
  }

  const createMediaUrl = (name, base64) => {
    if (!base64) return ''
    try {
      const mimeType = getMimeType(name).split(';')[0]
      let cleanBase64 = base64
      if (base64.startsWith('data:')) {
        cleanBase64 = base64.split(',')[1] || ''
      }
      if (!cleanBase64 || cleanBase64.length < 10) {
        console.error('Invalid base64 data')
        return ''
      }
      const byteCharacters = atob(cleanBase64)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: mimeType })
      return URL.createObjectURL(blob)
    } catch (err) {
      console.error('Failed to create media URL:', err)
      return ''
    }
  }

  const loadThumbnail = async (path, name) => {
    try {
      const response = await fetchApi('/fs/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      })
      if (!response.ok) return
      const data = await response.json()
      const url = createMediaUrl(name, data.content)
      if (url) {
        setThumbnails((prev) => ({
          ...prev,
          [path]: { url, type: isVideoFile(name) ? 'video' : 'image' }
        }))
      }
    } catch (err) {
      console.error('Thumbnail load failed:', err)
    }
  }

  const getBreadcrumbs = () => {
    const parts = currentPath.split('/').filter(Boolean)
    const breadcrumbs = [{ name: 'root', path: '/' }]
    let currentBuild = ''
    parts.forEach((part) => {
      currentBuild += '/' + part
      breadcrumbs.push({ name: part, path: currentBuild })
    })
    return breadcrumbs
  }

  const getWindowTitleFromPath = (path) => {
    if (path === RECYCLE_BIN_PATH) return 'Recycle Bin'
    if (path === '/') return 'This PC'
    if (path === '/home/user') return 'Home'

    const parts = path.split('/').filter(Boolean)
    if (parts.length === 0) return 'File Explorer'
    return parts[parts.length - 1]
  }

  const handleContextMenu = (event, entry) => {
    event.preventDefault()
    event.stopPropagation()
    // Adjust position to keep menu within viewport
    let x = event.clientX
    let y = event.clientY
    // Account for menu size (~180px width, ~200px height)
    if (x + 200 > window.innerWidth) {
      x = window.innerWidth - 200
    }
    if (y + 250 > window.innerHeight) {
      y = window.innerHeight - 250
    }
    setContextMenu({
      visible: true,
      x,
      y,
      targetPath: entry.path,
      targetType: entry.type
    })
  }

  const handleCopy = (e) => {
    e.stopPropagation()
    if (contextMenu.targetPath) {
      setClipboard({ action: 'copy', path: contextMenu.targetPath })
      setContextMenu({ visible: false, x: 0, y: 0, targetPath: null })
    }
  }

  const handleCut = (e) => {
    e.stopPropagation()
    if (contextMenu.targetPath) {
      setClipboard({ action: 'cut', path: contextMenu.targetPath })
      setContextMenu({ visible: false, x: 0, y: 0, targetPath: null })
    }
  }

  const handlePaste = async (e) => {
    if (e) e.stopPropagation()
    if (!clipboard) return
    const fileName = clipboard.path.split('/').pop()
    const targetPath = currentPath + '/' + fileName
    try {
      if (clipboard.action === 'copy') {
        // Read source file
        const readRes = await fetchApi('/fs/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: clipboard.path })
        })
        if (readRes.ok) {
          const data = await readRes.json()
          const content = data.content
          const createRes = await fetchApi('/fs/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: targetPath, node_type: 'file', content })
          })
          if (createRes.status === 409) {
            await fetchApi('/fs/write', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ path: targetPath, content })
            })
          }
          loadDirectory(currentPath)
          setClipboard(null)
        }
      } else if (clipboard.action === 'cut') {
        const readRes = await fetchApi('/fs/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: clipboard.path })
        })
        if (readRes.ok) {
          const data = await readRes.json()
          const content = data.content
          const createRes = await fetchApi('/fs/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: targetPath, node_type: 'file', content })
          })
          if (createRes.status === 409) {
            await fetchApi('/fs/write', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ path: targetPath, content })
            })
          }
          await fetchApi('/fs/delete?path=' + encodeURIComponent(clipboard.path), { method: 'DELETE' })
          loadDirectory(currentPath)
          setClipboard(null)
        }
      }
    } catch (err) {
      setError('Paste failed')
    }
    setContextMenu({ visible: false, x: 0, y: 0, targetPath: null })
  }

  const handleRename = (e) => {
    e.stopPropagation()
    if (contextMenu.targetPath) {
      setRenameTarget(contextMenu.targetPath)
      setRenameName(contextMenu.targetPath.split('/').pop())
      setShowRenameDialog(true)
    }
    setContextMenu({ visible: false, x: 0, y: 0, targetPath: null })
  }

  const confirmRename = async () => {
    if (!renameName.trim()) return
    const parts = renameTarget.split('/')
    parts[parts.length - 1] = renameName
    const newPath = parts.join('/')
    try {
      const response = await fetchApi('/fs/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ old_path: renameTarget, new_path: newPath })
      })
      if (response.ok) {
        loadDirectory(currentPath)
      } else {
        setError('Rename failed')
      }
    } catch (err) {
      setError('Rename failed')
    }
    setShowRenameDialog(false)
    setRenameTarget(null)
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    if (contextMenu.targetPath) {
      setDeleteTarget(contextMenu.targetPath)
      setShowDeleteConfirm(true)
    }
    setContextMenu({ visible: false, x: 0, y: 0, targetPath: null })
  }

  const confirmDelete = async () => {
    try {
      const permanentDelete = currentPath === RECYCLE_BIN_PATH
      const response = await fetchApi(
        `/fs/delete?path=${encodeURIComponent(deleteTarget)}${permanentDelete ? '&permanent=true' : ''}`,
        { method: 'DELETE' }
      )
      if (response.ok) {
        loadDirectory(currentPath)
      } else {
        setError('Delete failed')
      }
    } catch (err) {
      setError('Delete failed')
    }
    setShowDeleteConfirm(false)
    setDeleteTarget(null)
  }

  const handlePrint = (e) => {
    e.stopPropagation()
    if (contextMenu.targetPath) {
      const fileName = contextMenu.targetPath.split('/').pop()
      const pages = Math.ceil(Math.random() * 10) + 1
      
      window.dispatchEvent(new CustomEvent('submit-print-job', {
        detail: {
          jobName: fileName,
          pages,
          pid: 1
        }
      }))
      
      setError(`Print job submitted: ${fileName} (${pages} pages)`)
    }
    setContextMenu({ visible: false, x: 0, y: 0, targetPath: null })
  }

  const handleShowProperties = async (e) => {
    e.stopPropagation()
    if (contextMenu.targetPath) {
      try {
        const response = await fetchApi(`/fs/properties?path=${encodeURIComponent(contextMenu.targetPath)}`)
        if (response.ok) {
          const data = await response.json()
          setPropertiesData(data)
        } else {
          setPropertiesData({
            path: contextMenu.targetPath,
            type: contextMenu.targetType,
            name: contextMenu.targetPath.split('/').pop(),
            error: 'Failed to load properties'
          })
        }
      } catch (err) {
        setPropertiesData({
          path: contextMenu.targetPath,
          type: contextMenu.targetType,
          name: contextMenu.targetPath.split('/').pop(),
          error: 'Failed to load properties'
        })
      }
      setShowPropertiesDialog(true)
    }
    setContextMenu({ visible: false, x: 0, y: 0, targetPath: null })
  }

  const handleAddressBarSubmit = () => {
    if (addressBarValue.trim()) {
      handleNavigate(addressBarValue)
      setAddressBarEdit(false)
    }
  }

  const handleNewFolder = async () => {
    const folderName = prompt('New folder name:')
    if (!folderName) return
    const newPath = currentPath + '/' + folderName
    try {
      const response = await fetchApi('/fs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: newPath, node_type: 'dir', content: '' })
      })
      if (response.ok) {
        loadDirectory(currentPath)
      } else {
        setError('Failed to create folder')
      }
    } catch (err) {
      setError('Failed to create folder')
    }
  }

  const handleNewFile = async () => {
    const fileName = prompt('New file name:')
    if (!fileName) return
    const newPath = currentPath + '/' + fileName
    try {
      const response = await fetchApi('/fs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: newPath, node_type: 'file', content: '' })
      })
      if (response.ok) {
        loadDirectory(currentPath)
      } else {
        setError('Failed to create file')
      }
    } catch (err) {
      setError('Failed to create file')
    }
  }

  const handleQuickAccessClick = (item) => {
    handleNavigate(item.path)
  }

  const restoreRecycleItem = async (pathToRestore) => {
    if (!pathToRestore) return
    try {
      const response = await fetchApi(
        `/fs/recycle/restore?recycle_path=${encodeURIComponent(pathToRestore)}`,
        { method: 'POST' }
      )
      if (response.ok) {
        setError('Item restored')
        setSelectedFile(null)
        loadDirectory(currentPath)
      } else {
        setError('Restore failed')
      }
    } catch {
      setError('Restore failed')
    }
  }

  const emptyRecycleBin = async () => {
    const confirm = window.confirm('Permanently delete all items in Recycle Bin?')
    if (!confirm) return
    try {
      const response = await fetchApi('/fs/recycle/empty', { method: 'DELETE' })
      if (response.ok) {
        setSelectedFile(null)
        setError('Recycle Bin emptied')
        loadDirectory(currentPath)
      } else {
        setError('Failed to empty Recycle Bin')
      }
    } catch {
      setError('Failed to empty Recycle Bin')
    }
  }

  const isDesktopFolder = () => {
    return currentPath === '/home/user/Desktop'
  }

  const isAppShortcut = (entry) => {
    return entry.type === 'file' && entry.path.endsWith('.lnk')
  }

  const isTextFile = (entry) => {
    return entry.type === 'file' && entry.path.endsWith('.txt')
  }

  const isOpenableFile = (entry) => {
    return isAppShortcut(entry) || isTextFile(entry)
  }

  const getShortcutIcon = (entry) => {
    const name = entry.path.split('/').pop().replace('.lnk', '')
    // Try to match common app names
    const lowerName = name.toLowerCase()
    for (const [key, Icon] of Object.entries(APP_SHORTCUT_ICONS)) {
      if (lowerName.includes(key)) {
        return Icon
      }
    }
    return FileText
  }

  useEffect(() => {
    if (!contextMenu.visible) return
    const handleDocClick = (event) => {
      if (event.target.closest('.files-context-menu')) return
      setContextMenu({ visible: false, x: 0, y: 0, targetPath: null })
    }
    document.addEventListener('mousedown', handleDocClick)
    return () => document.removeEventListener('mousedown', handleDocClick)
  }, [contextMenu.visible])

  return (
    <div className="app-files">
      <div className="files-layout">
        {/* Sidebar */}
        <div className="files-sidebar">
          <div className="files-sidebar-header">
            <h3 className="files-sidebar-title">Quick Access</h3>
          </div>
          <div className="files-sidebar-list">
            {quickAccessItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.path}
                  type="button"
                  className={`files-sidebar-item ${currentPath === item.path ? 'active' : ''}`}
                  onClick={() => handleQuickAccessClick(item)}
                >
                  <Icon size={16} className="files-sidebar-icon" />
                  <span className="files-sidebar-name">{item.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="files-main">
          <div className="files-toolbar">
            <div className="files-nav-buttons">
              <button type="button" className="files-nav-btn" onClick={handleGoUp} title="Go up one level">
                <ArrowUp className="files-toolbar-icon" />
              </button>
              <button 
                type="button" 
                className={`files-nav-btn ${clipboard ? 'active' : ''}`}
                onClick={handlePaste}
                disabled={!clipboard}
                title={clipboard ? `Paste (${clipboard.action})` : 'Nothing to paste'}
              >
                <ClipboardPaste className="files-toolbar-icon" />
              </button>
              <button type="button" className="files-nav-btn" onClick={handleNewFolder} title="New Folder">
                <FolderPlus className="files-toolbar-icon" />
              </button>
              <button type="button" className="files-nav-btn" onClick={handleNewFile} title="New File">
                <FilePlus className="files-toolbar-icon" />
              </button>
              {currentPath === RECYCLE_BIN_PATH && (
                <>
                  <button
                    type="button"
                    className="files-nav-btn"
                    onClick={() => restoreRecycleItem(selectedFile?.path)}
                    disabled={!selectedFile}
                    title="Restore Selected"
                  >
                    <RotateCcw className="files-toolbar-icon" />
                  </button>
                  <button
                    type="button"
                    className="files-nav-btn"
                    onClick={emptyRecycleBin}
                    title="Empty Recycle Bin"
                  >
                    <Trash2 className="files-toolbar-icon" />
                  </button>
                </>
              )}
            </div>

            <div className="files-address-bar">
              {addressBarEdit ? (
                <input
                  type="text"
                  className="files-address-input"
                  value={addressBarValue}
                  onChange={(e) => setAddressBarValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddressBarSubmit()
                    if (e.key === 'Escape') setAddressBarEdit(false)
                  }}
                  autoFocus
                />
              ) : (
                <span className="files-path" onClick={() => setAddressBarEdit(true)}>
                  {currentPath}
                </span>
              )}
            </div>

            {/* Search Bar */}
            <div className="files-search-bar">
              <Search size={16} className="files-search-icon" />
              <input
                type="text"
                className="files-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files and folders..."
              />
              {searchQuery && (
                <button
                  type="button"
                  className="files-search-clear"
                  onClick={clearSearch}
                  title="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="files-breadcrumb">
            {getBreadcrumbs().map((breadcrumb, index) => (
              <div key={breadcrumb.path} className="files-breadcrumb-item">
                <button
                  type="button"
                  className="files-breadcrumb-btn"
                  onClick={() => handleNavigate(breadcrumb.path)}
                >
                  {breadcrumb.name}
                </button>
                {index < getBreadcrumbs().length - 1 && <span className="files-breadcrumb-sep">›</span>}
              </div>
            ))}
          </div>

          {error ? <div className="files-error">{error}</div> : null}

          {isDesktopFolder() && (
            <div className="files-desktop-notice">
              <Home size={16} />
              <span>This folder shows your desktop items and app shortcuts</span>
            </div>
          )}

          {isSearching && searchQuery && (
            <div className="files-search-info">
              Showing {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
            </div>
          )}

          <div className="files-list">
            {(isSearching ? searchResults : entries).length === 0 ? (
              <div className="files-empty">
                {isSearching ? 'No results found' : 'Directory is empty'}
              </div>
            ) : (
              (isSearching ? searchResults : entries).map((entry) => {
                const entryName = entry.path.split('/').pop()
                const isShortcut = isAppShortcut(entry)
                const isTxt = isTextFile(entry)
                const canOpen = isOpenableFile(entry)
                const ShortcutIcon = isShortcut ? getShortcutIcon(entry) : null
                const thumb = thumbnails[entry.path]
                const showThumb = entry.type !== 'dir' && thumb
                
                return (
                  <div
                    key={entry.path}
                    className={`files-item ${selectedFile?.path === entry.path ? 'selected' : ''} ${isShortcut ? 'is-shortcut' : ''} ${canOpen ? 'is-openable' : ''}`}
                    onClick={() => handleFileClick(entry)}
                    onContextMenu={(e) => handleContextMenu(e, entry)}
                    style={{ cursor: 'pointer' }}
                    title={canOpen ? (isShortcut ? 'Click to launch app' : isTxt ? 'Click to open in Notes' : '') : ''}
                  >
                    <span className="files-icon">
                      {entry.type === 'dir' ? (
                        <Folder className="files-item-icon" />
                      ) : showThumb ? (
                        <span className="files-thumb">
                          {thumb.type === 'image' ? (
                            <img src={thumb.url} alt={entryName} />
                          ) : (
                            <video src={thumb.url} muted playsInline loop autoPlay preload="metadata" />
                          )}
                        </span>
                      ) : isShortcut && ShortcutIcon ? (
                        <ShortcutIcon className="files-item-icon files-shortcut-icon" />
                      ) : (
                        <FileText className="files-item-icon" />
                      )}
                    </span>
                    <div className="files-item-info">
                      <span className="files-name">{entryName}</span>
                      <span className="files-type">
                        {entry.type === 'dir' ? 'Folder' : isShortcut ? 'App Shortcut' : isTxt ? 'Text File' : 'File'}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* File Viewer Panel */}
      {fileContent && (
        <div className="files-viewer-overlay" onClick={closeFileViewer}>
          <div className="files-viewer" onClick={(e) => e.stopPropagation()}>
            <div className="files-viewer-header">
              <div className="files-viewer-title">
                <FileText size={18} className="files-viewer-icon" />
                <span className="files-viewer-name">{fileContent.name}</span>
              </div>
              <button
                type="button"
                className="files-viewer-close"
                onClick={closeFileViewer}
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="files-viewer-content">
              {isLoadingFile ? (
                <div className="files-viewer-loading">Loading file...</div>
              ) : isImageFile(fileContent.name) ? (
                <img
                  className="files-viewer-media"
                  src={fileContent.mediaUrl}
                  alt={fileContent.name}
                />
              ) : isVideoFile(fileContent.name) ? (
                <video
                  className="files-viewer-media"
                  src={fileContent.mediaUrl}
                  controls
                  preload="metadata"
                  playsInline
                />
              ) : (
                <pre className="files-viewer-text">{fileContent.content || '(Empty file)'}</pre>
              )}
            </div>
            <div className="files-viewer-footer">
              <span className="files-viewer-path">{fileContent.path}</span>
              <span className="files-viewer-size">
                {fileContent.content ? `${fileContent.content.length} characters` : '0 bytes'}
              </span>
            </div>
          </div>
        </div>
      )}

      {contextMenu.visible && createPortal(
        <div 
          className="files-context-menu"
          style={{ 
            top: `${contextMenu.y}px`, 
            left: `${contextMenu.x}px`
          }}
        >
          <button type="button" className="files-context-item" onClick={handleCopy}>
            <ClipboardCopy className="files-context-icon" />
            Copy
          </button>
          <button type="button" className="files-context-item" onClick={handleCut}>
            <Scissors className="files-context-icon" />
            Cut
          </button>
          <button type="button" className="files-context-item" onClick={handlePaste} disabled={!clipboard}>
            <ClipboardPaste className="files-context-icon" />
            Paste
          </button>
          <div className="files-context-sep" />
          <button type="button" className="files-context-item" onClick={handleRename}>
            <Pencil className="files-context-icon" />
            Rename
          </button>
          <button type="button" className="files-context-item" onClick={handleDelete}>
            <Trash2 className="files-context-icon" />
            Delete
          </button>
          {currentPath === RECYCLE_BIN_PATH && (
            <button
              type="button"
              className="files-context-item"
              onClick={() => {
                restoreRecycleItem(contextMenu.targetPath)
                setContextMenu({ visible: false, x: 0, y: 0, targetPath: null })
              }}
            >
              <RotateCcw className="files-context-icon" />
              Restore
            </button>
          )}
          <button type="button" className="files-context-item" onClick={handlePrint}>
            <Printer className="files-context-icon" />
            Print
          </button>
          <button type="button" className="files-context-item" onClick={handleShowProperties}>
            <Info className="files-context-icon" />
            Properties
          </button>
        </div>,
        document.body
      )}

      {showRenameDialog && (
        <div className="files-dialog-overlay" onClick={() => setShowRenameDialog(false)}>
          <div className="files-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Rename File</h3>
            <input
              type="text"
              className="files-dialog-input"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmRename()
                if (e.key === 'Escape') setShowRenameDialog(false)
              }}
              autoFocus
            />
            <div className="files-dialog-buttons">
              <button type="button" className="files-dialog-btn primary" onClick={confirmRename}>
                Rename
              </button>
              <button type="button" className="files-dialog-btn" onClick={() => setShowRenameDialog(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="files-dialog-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="files-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>{currentPath === RECYCLE_BIN_PATH ? 'Permanently Delete' : 'Move to Recycle Bin'}</h3>
            <p>
              {currentPath === RECYCLE_BIN_PATH
                ? `Permanently delete "${deleteTarget.split('/').pop()}"? This cannot be undone.`
                : `Move "${deleteTarget.split('/').pop()}" to Recycle Bin?`}
            </p>
            <div className="files-dialog-buttons">
              <button type="button" className="files-dialog-btn danger" onClick={confirmDelete}>
                {currentPath === RECYCLE_BIN_PATH ? 'Delete Permanently' : 'Move to Recycle Bin'}
              </button>
              <button type="button" className="files-dialog-btn" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showPropertiesDialog && propertiesData && (
        <div className="files-dialog-overlay" onClick={() => setShowPropertiesDialog(false)}>
          <div className="files-dialog files-properties-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Properties</h3>
            <div className="files-properties">
              {propertiesData.error ? (
                <div className="files-prop-row">
                  <span className="files-prop-label">Error:</span>
                  <span className="files-prop-value">{propertiesData.error}</span>
                </div>
              ) : (
                <>
                  <div className="files-prop-row">
                    <span className="files-prop-label">Name:</span>
                    <span className="files-prop-value">{propertiesData.name}</span>
                  </div>
                  <div className="files-prop-row">
                    <span className="files-prop-label">Location:</span>
                    <span className="files-prop-value">{propertiesData.path}</span>
                  </div>
                  <div className="files-prop-row">
                    <span className="files-prop-label">Type:</span>
                    <span className="files-prop-value">{propertiesData.type}</span>
                  </div>
                  {propertiesData.type !== 'Directory' && (
                    <div className="files-prop-row">
                      <span className="files-prop-label">Size:</span>
                      <span className="files-prop-value">{propertiesData.size_display} ({propertiesData.size_bytes} bytes)</span>
                    </div>
                  )}
                  <div className="files-prop-row">
                    <span className="files-prop-label">Owner:</span>
                    <span className="files-prop-value">{propertiesData.owner}</span>
                  </div>
                  <div className="files-prop-row">
                    <span className="files-prop-label">Computer:</span>
                    <span className="files-prop-value">{propertiesData.computer}</span>
                  </div>
                  <div className="files-prop-row">
                    <span className="files-prop-label">Created:</span>
                    <span className="files-prop-value">{new Date(propertiesData.created).toLocaleString()}</span>
                  </div>
                  <div className="files-prop-row">
                    <span className="files-prop-label">Modified:</span>
                    <span className="files-prop-value">{new Date(propertiesData.modified).toLocaleString()}</span>
                  </div>
                  <div className="files-prop-row">
                    <span className="files-prop-label">Attributes:</span>
                    <span className="files-prop-value">{propertiesData.attributes}</span>
                  </div>
                </>
              )}
            </div>
            <div className="files-dialog-buttons">
              <button type="button" className="files-dialog-btn" onClick={() => setShowPropertiesDialog(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
