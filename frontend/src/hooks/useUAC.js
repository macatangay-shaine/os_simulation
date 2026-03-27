import { useState } from 'react'

export function useUAC() {
  const [uacPrompt, setUACPrompt] = useState(null)

  const requestPermission = async (action, resource = null) => {
    return new Promise((resolve, reject) => {
      // First check if permission is needed
      fetch('http://localhost:8000/security/check-permission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'session-token': localStorage.getItem('session_token') || ''
        },
        body: JSON.stringify({ action, resource })
      })
        .then(res => res.json())
        .then(data => {
          if (data.allowed) {
            // Permission granted without prompt
            resolve(true)
          } else if (data.requires_elevation) {
            // Show UAC prompt
            setUACPrompt({
              action,
              resource,
              onAllow: () => {
                setUACPrompt(null)
                resolve(true)
              },
              onDeny: () => {
                setUACPrompt(null)
                resolve(false)
              }
            })
          } else {
            // Permission denied
            resolve(false)
          }
        })
        .catch(err => {
          console.error('Permission check failed:', err)
          reject(err)
        })
    })
  }

  return { uacPrompt, requestPermission }
}
