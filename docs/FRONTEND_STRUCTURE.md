# Frontend Structure Reference

## Quick Navigation

### Component Domains

| Folder | Use When | Examples |
|--------|----------|----------|
| `layout/` | Working on core UI shell, window management, boot/power screens | Desktop orchestrator, resizable windows, taskbar |
| `auth/` | Adding login/authentication features, lock screens | Login flow, session lock, password entry |
| `ui/` | Creating reusable dialog/menu components | Error modals, context menus, toasts, calendar picker |
| `system/` | Building system-wide features and status indicators | Notifications, quick settings panel, system tray |
| `app-management/` | Managing app launching and window switching | App icons, Alt+Tab switcher, app store |

### Finding Code

```
Want to find...                    Look in...
─────────────────────────────────────────────────
Main app entry point              src/core/App.jsx
Desktop environment               src/components/layout/Desktop.jsx
Login screen issues               src/components/auth/LoginScreen.jsx
Button/Dialog styles              src/styles/ui/
Taskbar styling                   src/styles/layout/taskbar.css
Calculator app styles             src/styles/apps/calculator.css
System notification code          src/components/system/NotificationCenter.jsx
```

## Import Cheat Sheet

### Component Imports

```js
// ✅ CLEAN - Use barrel exports
import { Desktop, Taskbar, Window } from '../components'
import { LoginScreen } from '../components/auth'
import { Toast, ErrorDialog } from '../components/ui'

// ✅ ALSO OK - Direct imports when needed
import Desktop from '../components/layout/Desktop.jsx'

// ❌ AVOID - Old scattered imports
import Desktop from '../components/Desktop.jsx'  // Doesn't exist anymore
```

### Style Imports

```js
// ✅ CORRECT - Use domain paths from nested components
// From src/components/ui/ErrorDialog.jsx:
import '../../styles/ui/error-dialog.css'

// ✅ CORRECT - From app files
// From src/apps/Calculator.jsx:
import '../styles/apps/calculator.css'

// ❌ WRONG - Old flat structure
import '../styles/error-dialog.css'  // Path won't resolve
```

## Adding New Components

### Step 1: Determine Domain
```
Is it about... → Folder
─────────────────────
UI layout/shell → layout/
User auth → auth/
Generic UI element → ui/
System feature → system/
App launching → app-management/
```

### Step 2: Create File in Domain
```
frontend/src/components/[domain]/MyComponent.jsx
```

### Step 3: Update Domain Barrel Export
```js
// frontend/src/components/[domain]/index.jsx
export { default as MyComponent } from './MyComponent.jsx'
```

### Step 4: Use It
```js
import { MyComponent } from '../components/[domain]'
```

## Adding New Styles

### Step 1: Create in Domain Folder
```
frontend/src/styles/[domain]/my-component.css
```

### Step 2: Import in Component
```js
// In your component
import '../../styles/[domain]/my-component.css'
```

### Step 3: Main index.css Auto-aggregates
(No additional step needed - main index.css already includes domain folders)

## Common Patterns

### Using Multiple Components
```js
import {
  Desktop,
  Taskbar,
  Window,
  BootScreen
} from '../components'

import {
  LoginScreen,
  LockScreen
} from '../components/auth'

import {
  Toast,
  ErrorDialog,
  Calendar
} from '../components/ui'
```

### Mixing Domains in Complex Component
```js
// src/components/layout/Desktop.jsx
import AppLauncher from '../app-management/AppLauncher.jsx'
import Toast from '../ui/Toast.jsx'
import ContextMenu from '../ui/ContextMenu.jsx'

// Styles from multiple domains
import '../../styles/layout/desktop.css'
import '../../styles/ui/dialog.css'
import '../../styles/apps/file-explorer.css'
```

## Domain Responsibilities

### `layout/`
- Controls viewport regions (desktop, taskbar, windows)
- Manages drag/resize/snap behaviors
- Orchestrates component rendering (Desktop.jsx)
- Boot and power state visual feedback

**Exports:** Desktop, Taskbar, Window, StartMenu, BootScreen, PowerScreen, SleepScreen, ShutdownScreen

### `auth/`
- User identity & session management
- Password entry and validation
- Lock screen (post-login security)
- Login screen (initial entry point)

**Exports:** LoginScreen, LockScreen

### `ui/`
- Reusable generic UI components
- No domain-specific logic
- Works across any feature area
- Dialogs, menus, pickers, notifications

**Exports:** Calendar, ContextMenu, Toast, UACPrompt, ErrorDialog, LocalFsPanel

### `system/`
- System-wide features
- Status indicators
- Control panels
- Multi-app awareness

**Exports:** NotificationCenter, ActionCenter

### `app-management/`
- App lifecycle (launch, switch, close)
- Visual app representations
- Desktop shortcuts
- Alt+Tab interface

**Exports:** AppLauncher, AppSwitcher

## Style Hierarchy

```
Cascades from most general to specific:

base/                    # Applies to everything
├── variables.css       # Design tokens
└── global.css         # Resets, base elements

layout/                  # Shell styles
├── desktop.css
├── taskbar.css
├── windows.css
└── boot.css

auth/                    # Auth-specific
├── auth.css

ui/                      # Reusable components
├── calendar.css
├── error-dialog.css
└── notifications.css

system/                  # System features
├── action-center.css

apps/                    # App-specific
├── [individual app CSS]
```

## Troubleshooting

### Import Not Found
```js
// ❌ Problem
import Desktop from '../components/Desktop.jsx'
// Error: Module not found

// ✅ Solution - Component is now in layout/
import Desktop from '../components/layout/Desktop.jsx'
// OR use barrel
import { Desktop } from '../components'
```

### Style Not Applying
```js
// ❌ Problem - Wrong path
import '../styles/error-dialog.css'

// ✅ Solution - Use domain path
import '../../styles/ui/error-dialog.css'
```

### Circular Dependencies
If you create: `components/layout/MyLayout.jsx` → needs `ui/Dialog.jsx` → needs `layout/Window.jsx`

**Solution:** Keep UI components truly generic. Move shared logic to `src/utils/` if needed.

## Build Output

### Before Refactoring
```
(not tracked - scattered imports)
```

### After Refactoring
```
✓ 1753 modules transformed
✓ dist/index.html           0.45 kB | gzip:  0.30 kB
✓ dist/assets/index.css   146.48 kB | gzip: 22.39 kB
✓ dist/assets/index.js    358.32 kB | gzip:100.99 kB
✓ built in 5.62s
```

Zero warnings, zero errors ✅

---

**Last Updated:** March 27, 2026  
**Status:** ✅ Active & Current
