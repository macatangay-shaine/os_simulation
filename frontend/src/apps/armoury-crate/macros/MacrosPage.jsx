import { useEffect, useMemo, useRef, useState } from 'react'
import MacroActionList from './MacroActionList.jsx'
import MacroEditorToolbar from './MacroEditorToolbar.jsx'
import MacroPropertiesPanel from './MacroPropertiesPanel.jsx'
import {
  ARMOURY_MACROS_STORAGE_KEY,
  cloneMacroDraft,
  createDefaultMacrosState,
  createMacroAction,
  createMacroProfile,
  createRecordedKeystrokeAction,
  getNextMacroProfileName,
  loadMacrosState,
  MACRO_ACTION_LIMIT,
  MACRO_COMPATIBLE_DEVICES,
  summarizeMacroProfile
} from './macrosData.js'

function isEditableTarget(target) {
  return (
    target instanceof HTMLElement &&
    (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)
  )
}

function formatRecordedCombo(event) {
  const modifierOnlyKeys = new Set(['Control', 'Shift', 'Alt', 'Meta'])
  if (modifierOnlyKeys.has(event.key)) return null

  const parts = []
  if (event.ctrlKey) parts.push('Ctrl')
  if (event.shiftKey) parts.push('Shift')
  if (event.altKey) parts.push('Alt')
  if (event.metaKey) parts.push('Win')

  let normalizedKey = event.key
  if (normalizedKey === ' ') normalizedKey = 'Space'
  if (normalizedKey.startsWith('Arrow')) normalizedKey = normalizedKey.replace('Arrow', 'Arrow ')
  if (normalizedKey.length === 1) normalizedKey = normalizedKey.toUpperCase()

  parts.push(normalizedKey)
  return parts.join(' + ')
}

function createProfileCopy(profile, profiles) {
  return {
    ...cloneMacroDraft(profile),
    id: createMacroProfile().id,
    name: `${profile.name || getNextMacroProfileName(profiles)} Copy`
  }
}

function MacrosHeaderIcon() {
  return (
    <svg viewBox="0 0 86 86" aria-hidden="true">
      <path d="M18 12h34l16 16v46H18z" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M52 12v16h16" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M28 58V34l15 13 15-13v24" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function MacrosPage() {
  const initialStateRef = useRef(null)
  if (!initialStateRef.current) {
    initialStateRef.current = loadMacrosState()
  }

  const [savedState, setSavedState] = useState(initialStateRef.current)
  const [draftState, setDraftState] = useState(() => cloneMacroDraft(initialStateRef.current))
  const [selectedActionId, setSelectedActionId] = useState(null)
  const [panelMode, setPanelMode] = useState('placeholder')
  const [isRecording, setIsRecording] = useState(false)
  const [isInsertMenuOpen, setIsInsertMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [historyPast, setHistoryPast] = useState([])
  const [historyFuture, setHistoryFuture] = useState([])
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const toolbarRef = useRef(null)
  const lastRecordedAtRef = useRef(null)

  const currentProfile = useMemo(
    () => draftState.profiles.find((profile) => profile.id === draftState.selectedProfileId) || draftState.profiles[0] || null,
    [draftState]
  )

  const selectedAction = useMemo(
    () => currentProfile?.actions.find((action) => action.id === selectedActionId) || null,
    [currentProfile, selectedActionId]
  )

  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(draftState.profiles) !== JSON.stringify(savedState.profiles),
    [draftState.profiles, savedState.profiles]
  )

  const connectedDevice = useMemo(
    () => MACRO_COMPATIBLE_DEVICES.find((device) => device.id === currentProfile?.deviceId) || MACRO_COMPATIBLE_DEVICES[0],
    [currentProfile?.deviceId]
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(ARMOURY_MACROS_STORAGE_KEY, JSON.stringify(savedState))
  }, [savedState])

  useEffect(() => {
    function handleWindowClick(event) {
      if (!toolbarRef.current?.contains(event.target)) {
        setIsInsertMenuOpen(false)
        setIsProfileMenuOpen(false)
      }
    }

    window.addEventListener('mousedown', handleWindowClick)
    return () => window.removeEventListener('mousedown', handleWindowClick)
  }, [])

  useEffect(() => {
    if (!selectedActionId) return
    if (currentProfile?.actions.some((action) => action.id === selectedActionId)) return

    setSelectedActionId(null)
    if (panelMode === 'action') {
      setPanelMode('placeholder')
    }
  }, [currentProfile, selectedActionId, panelMode])

  useEffect(() => {
    if (!feedbackMessage) return undefined
    const timeoutId = window.setTimeout(() => setFeedbackMessage(''), 2600)
    return () => window.clearTimeout(timeoutId)
  }, [feedbackMessage])

  useEffect(() => {
    if (!isRecording) return undefined

    lastRecordedAtRef.current = Date.now()

    function handleRecording(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setIsRecording(false)
        setFeedbackMessage('Macro recording stopped.')
        return
      }

      if (isEditableTarget(event.target)) return

      const combo = formatRecordedCombo(event)
      if (!combo) return

      event.preventDefault()

      let inserted = false
      const now = Date.now()
      const delayMs = Math.min(Math.max(40, now - (lastRecordedAtRef.current || now)), 3000)
      const action = createRecordedKeystrokeAction(combo, delayMs)

      setDraftState((previous) => {
        const previousSnapshot = cloneMacroDraft(previous)
        const nextDraft = cloneMacroDraft(previous)
        const profileIndex = nextDraft.profiles.findIndex((profile) => profile.id === nextDraft.selectedProfileId)
        if (profileIndex === -1) return previous

        const profile = nextDraft.profiles[profileIndex]
        if (profile.actions.length >= MACRO_ACTION_LIMIT) {
          setIsRecording(false)
          setFeedbackMessage('Macro action limit reached. Recording stopped.')
          return previous
        }

        profile.actions.push(action)
        inserted = true
        setHistoryPast((history) => [...history.slice(-39), previousSnapshot])
        setHistoryFuture([])
        return nextDraft
      })

      if (inserted) {
        lastRecordedAtRef.current = now
        setSelectedActionId(action.id)
        setPanelMode('action')
        setFeedbackMessage(`Recorded ${combo}.`)
      }
    }

    window.addEventListener('keydown', handleRecording)
    return () => window.removeEventListener('keydown', handleRecording)
  }, [isRecording, panelMode])

  function applyDraftMutation(mutator) {
    setDraftState((previous) => {
      const previousSnapshot = cloneMacroDraft(previous)
      const nextDraft = mutator(cloneMacroDraft(previous))

      if (!nextDraft || JSON.stringify(previousSnapshot) === JSON.stringify(nextDraft)) {
        return previous
      }

      setHistoryPast((history) => [...history.slice(-39), previousSnapshot])
      setHistoryFuture([])
      return nextDraft
    })
  }

  function updateCurrentProfile(profileMutator) {
    applyDraftMutation((draft) => {
      const profileIndex = draft.profiles.findIndex((profile) => profile.id === draft.selectedProfileId)
      if (profileIndex === -1) return draft

      draft.profiles[profileIndex] = profileMutator(cloneMacroDraft(draft.profiles[profileIndex]))
      return draft
    })
  }

  function insertAction(type) {
    const newAction = createMacroAction(type)
    let inserted = false

    applyDraftMutation((draft) => {
      const profileIndex = draft.profiles.findIndex((profile) => profile.id === draft.selectedProfileId)
      if (profileIndex === -1) return draft

      const profile = draft.profiles[profileIndex]
      if (profile.actions.length >= MACRO_ACTION_LIMIT) return draft

      const selectedIndex = profile.actions.findIndex((action) => action.id === selectedActionId)
      const insertIndex = selectedIndex >= 0 ? selectedIndex + 1 : profile.actions.length
      profile.actions.splice(insertIndex, 0, newAction)
      inserted = true
      return draft
    })

    setIsInsertMenuOpen(false)

    if (!inserted) {
      setFeedbackMessage('Macro action limit reached. Remove an action before inserting another one.')
      return
    }

    setSelectedActionId(newAction.id)
    setPanelMode('action')
    setFeedbackMessage(`${newAction.label} inserted into ${currentProfile?.name || 'macro'}.`)
  }

  function deleteAction(actionId) {
    let nextSelectedActionId = null
    let deleted = false

    applyDraftMutation((draft) => {
      const profileIndex = draft.profiles.findIndex((profile) => profile.id === draft.selectedProfileId)
      if (profileIndex === -1) return draft

      const profile = draft.profiles[profileIndex]
      const actionIndex = profile.actions.findIndex((action) => action.id === actionId)
      if (actionIndex === -1) return draft

      profile.actions.splice(actionIndex, 1)
      nextSelectedActionId = profile.actions[actionIndex]?.id || profile.actions[actionIndex - 1]?.id || null
      deleted = true
      return draft
    })

    if (!deleted) return

    setSelectedActionId(nextSelectedActionId)
    setPanelMode(nextSelectedActionId ? 'action' : 'placeholder')
    setFeedbackMessage('Macro action removed.')
  }

  function updateSelectedAction(patch) {
    if (!selectedActionId) return

    updateCurrentProfile((profile) => ({
      ...profile,
      actions: profile.actions.map((action) => (action.id === selectedActionId ? { ...action, ...patch } : action))
    }))
  }

  function moveSelectedAction(direction) {
    if (!selectedActionId) return

    let moved = false
    applyDraftMutation((draft) => {
      const profileIndex = draft.profiles.findIndex((profile) => profile.id === draft.selectedProfileId)
      if (profileIndex === -1) return draft

      const actions = draft.profiles[profileIndex].actions
      const currentIndex = actions.findIndex((action) => action.id === selectedActionId)
      if (currentIndex === -1) return draft

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
      if (targetIndex < 0 || targetIndex >= actions.length) return draft

      const [action] = actions.splice(currentIndex, 1)
      actions.splice(targetIndex, 0, action)
      moved = true
      return draft
    })

    if (moved) {
      setFeedbackMessage(`Action moved ${direction}.`)
    }
  }

  function updateProfileSettings(patch) {
    updateCurrentProfile((profile) => ({
      ...profile,
      ...patch
    }))
  }

  function handleClearAll() {
    if (!currentProfile?.actions.length) return

    updateCurrentProfile((profile) => ({
      ...profile,
      actions: []
    }))
    setSelectedActionId(null)
    setPanelMode('placeholder')
    setFeedbackMessage(`${currentProfile.name} cleared.`)
  }

  function handleUndo() {
    if (!historyPast.length) return
    const previousSnapshot = historyPast[historyPast.length - 1]
    setHistoryPast((history) => history.slice(0, -1))
    setHistoryFuture((history) => [...history, cloneMacroDraft(draftState)])
    setDraftState(previousSnapshot)
    setSelectedActionId(null)
    setPanelMode('placeholder')
    setFeedbackMessage('Last macro edit undone.')
  }

  function handleRedo() {
    if (!historyFuture.length) return
    const nextSnapshot = historyFuture[historyFuture.length - 1]
    setHistoryFuture((history) => history.slice(0, -1))
    setHistoryPast((history) => [...history, cloneMacroDraft(draftState)])
    setDraftState(nextSnapshot)
    setSelectedActionId(null)
    setPanelMode('placeholder')
    setFeedbackMessage('Macro edit restored.')
  }

  function handleSave() {
    const savedSnapshot = cloneMacroDraft(draftState)
    setSavedState(savedSnapshot)
    setHistoryPast([])
    setHistoryFuture([])
    setFeedbackMessage(`${currentProfile?.name || 'Macro'} saved.`)
  }

  function handleCancel() {
    setDraftState(cloneMacroDraft(savedState))
    setHistoryPast([])
    setHistoryFuture([])
    setSelectedActionId(null)
    setPanelMode('placeholder')
    setIsRecording(false)
    setFeedbackMessage('Unsaved macro changes discarded.')
  }

  function handleCreateProfile() {
    const nextProfile = createMacroProfile(getNextMacroProfileName(draftState.profiles))
    applyDraftMutation((draft) => {
      draft.profiles.push(nextProfile)
      draft.selectedProfileId = nextProfile.id
      return draft
    })
    setSelectedActionId(null)
    setPanelMode('profile')
    setIsProfileMenuOpen(false)
    setFeedbackMessage(`${nextProfile.name} created.`)
  }

  function handleDuplicateProfile() {
    if (!currentProfile) return
    const duplicatedProfile = createProfileCopy(currentProfile, draftState.profiles)
    applyDraftMutation((draft) => {
      draft.profiles.push(duplicatedProfile)
      draft.selectedProfileId = duplicatedProfile.id
      return draft
    })
    setSelectedActionId(null)
    setPanelMode('profile')
    setIsProfileMenuOpen(false)
    setFeedbackMessage(`${currentProfile.name} duplicated.`)
  }

  function handleDeleteProfile() {
    if (draftState.profiles.length <= 1) {
      setFeedbackMessage('At least one macro profile must remain.')
      setIsProfileMenuOpen(false)
      return
    }

    const removedProfileName = currentProfile?.name || 'Macro profile'
    applyDraftMutation((draft) => {
      draft.profiles = draft.profiles.filter((profile) => profile.id !== draft.selectedProfileId)
      draft.selectedProfileId = draft.profiles[0]?.id || createDefaultMacrosState().selectedProfileId
      return draft
    })
    setSelectedActionId(null)
    setPanelMode('placeholder')
    setIsProfileMenuOpen(false)
    setFeedbackMessage(`${removedProfileName} deleted.`)
  }

  return (
    <section className="armoury-crate-macros-page">
      <header className="armoury-crate-macros-header">
        <div className="armoury-crate-macros-header-copy">
          <h1>Macros</h1>
          <div className="armoury-crate-macros-header-status">
            <span>{connectedDevice.label}</span>
            <span>{summarizeMacroProfile(currentProfile)}</span>
            <span>{hasUnsavedChanges ? 'Unsaved edits' : 'Saved locally'}</span>
          </div>
        </div>

        <div className="armoury-crate-device-header-tools armoury-crate-macros-header-tools" aria-hidden="true">
          <MacrosHeaderIcon />
        </div>
      </header>

      <div className="armoury-crate-macros-controls" ref={toolbarRef}>
        <MacroEditorToolbar
          profiles={draftState.profiles}
          selectedProfileId={draftState.selectedProfileId}
          isRecording={isRecording}
          isInsertMenuOpen={isInsertMenuOpen}
          isProfileMenuOpen={isProfileMenuOpen}
          canUndo={historyPast.length > 0}
          canRedo={historyFuture.length > 0}
          canClear={Boolean(currentProfile?.actions.length)}
          onSelectProfile={(profileId) => {
            setDraftState((previous) => ({ ...previous, selectedProfileId: profileId }))
            setSelectedActionId(null)
            setPanelMode('placeholder')
            setIsProfileMenuOpen(false)
            setIsInsertMenuOpen(false)
          }}
          onToggleRecord={() => {
            setIsRecording((previous) => !previous)
            setIsInsertMenuOpen(false)
            setIsProfileMenuOpen(false)
            setFeedbackMessage(isRecording ? 'Macro recording stopped.' : 'Recording keystrokes. Press Esc to stop.')
          }}
          onToggleInsertMenu={() => {
            setIsInsertMenuOpen((previous) => !previous)
            setIsProfileMenuOpen(false)
          }}
          onInsertAction={insertAction}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onOpenProfileSettings={() => {
            setPanelMode('profile')
            setIsProfileMenuOpen(false)
            setIsInsertMenuOpen(false)
          }}
          onClearAll={handleClearAll}
          onToggleProfileMenu={() => {
            setIsProfileMenuOpen((previous) => !previous)
            setIsInsertMenuOpen(false)
          }}
          onCreateProfile={handleCreateProfile}
          onDuplicateProfile={handleDuplicateProfile}
          onDeleteProfile={handleDeleteProfile}
        />
      </div>

      {feedbackMessage ? <div className="armoury-crate-macros-feedback">{feedbackMessage}</div> : null}

      <div className="armoury-crate-macros-workspace">
        <MacroActionList
          actions={currentProfile?.actions || []}
          isRecording={isRecording}
          selectedActionId={selectedActionId}
          onSelectAction={(actionId) => {
            setSelectedActionId(actionId)
            setPanelMode('action')
          }}
          onDeleteAction={deleteAction}
          onOpenProfileSettings={() => setPanelMode('profile')}
        />

        <MacroPropertiesPanel
          panelMode={panelMode}
          selectedAction={selectedAction}
          currentProfile={currentProfile}
          onProfileChange={updateProfileSettings}
          onActionChange={updateSelectedAction}
          onDeleteAction={() => deleteAction(selectedActionId)}
          onMoveAction={moveSelectedAction}
          onSave={handleSave}
          onCancel={handleCancel}
          hasUnsavedChanges={hasUnsavedChanges}
        />
      </div>
    </section>
  )
}
