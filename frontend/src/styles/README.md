# CSS Architecture - Modular Component Styles

This document explains the organized CSS structure for the jez_OS frontend.

## Directory Structure

```
src/
├── styles/
│   ├── index.css              # Main import file - aggregates all styles
│   ├── variables.css          # Theme colors and design tokens
│   ├── global.css             # Global reset and base styles
│   ├── boot.css               # Boot screen styles
│   ├── auth.css               # Login and lock screen styles
│   ├── desktop.css            # Desktop environment and app launcher
│   ├── taskbar.css            # Taskbar and start menu
│   ├── windows.css            # Window management and controls
│   ├── file-explorer.css      # File explorer app (largest component)
│   └── apps.css               # Built-in apps (Notes, Settings, Monitor, Terminal)
├── main.jsx                   # Updated to import from styles/index.css
└── ...other components
```

## File Descriptions

### 1. **variables.css** (20 lines)
**Purpose:** Central theme definition and design tokens

Contains:
- Font family definitions (Segoe UI, Inter)
- Color palette:
  - `--win-bg`: Main background (#e9eef6)
  - `--win-surface`: Primary surface (white with 86% opacity)
  - `--win-accent`: Action color (#2563eb - professional blue)
  - `--win-text`: Text color (#0f172a - dark)
  - `--win-muted`: Secondary text (60% opacity)
  - `--win-border`: Border color (28% opacity gray)
  - `--win-shadow`: Drop shadow effect

**When to modify:** Adjust theme colors, update design tokens, or change primary branding

---

### 2. **global.css** (20 lines)
**Purpose:** Global reset and base styling

Contains:
- Box-sizing reset
- Body/HTML height setup
- Root element initialization
- 100vh viewport height

**When to modify:** Base font sizes, global spacing, or HTML structure changes

---

### 3. **boot.css** (130 lines)
**Purpose:** Boot screen styling

Contains:
- `.boot-screen` - Container with gradient background
- `.boot-panel` - Center panel with shadow
- `.boot-logo` - 2x2 grid of blue tiles
- `.boot-title` - "VirtuOS" heading
- `.boot-logs` - System log output
- `.boot-progress` - Loading progress bar
- `.boot-error` - Error display
- `.boot-retry` - Retry button

**When to modify:** Change boot screen appearance, update logo, adjust progress colors

---

### 4. **auth.css** (180 lines)
**Purpose:** Authentication screens (login and lock)

Contains:
- **Login Screen:**
  - `.login-screen` - Full-screen container
  - `.login-panel` - Center panel
  - `.login-logo` - VirtuOS branding
  - `.login-form` - Form layout
  - `.login-input` - Input fields
  - `.login-button` - Submit button
  
- **Lock Screen:**
  - `.lock-screen` - Full-screen container
  - `.lock-avatar` - User avatar circle
  - `.lock-input` - Password input
  - `.lock-button` - Unlock button
  
- **Power Menu:**
  - `.power-menu` - User menu dropdown
  - `.power-menu-item` - Menu items (Lock, Sign out)

**When to modify:** Change login/lock screen colors, adjust button styles, modify avatar appearance

---

### 5. **desktop.css** (160 lines)
**Purpose:** Desktop environment and app launcher

Contains:
- `.desktop` - Main container
- `.desktop-wallpaper` - Light blue radial gradient background
- `.desktop-content` - Content area
- `.app-launcher` - Grid layout for app icons
- `.app-icon` - Individual app button
- `.app-icon-badge` - Icon circle background
- `.app-icon-svg` - SVG icon sizing (22px)
- `.app-icon-label` - App name text
- `.context-menu` - Right-click menu

**When to modify:** Adjust app icon size/spacing, change wallpaper gradient, update context menu styling

---

### 6. **taskbar.css** (280 lines)
**Purpose:** Bottom taskbar and start menu

Contains:
- **Taskbar:**
  - `.taskbar` - Bottom bar (48px height)
  - `.taskbar-left` - Start button
  - `.taskbar-center` - Running apps
  - `.taskbar-app` - App buttons
  - `.taskbar-user` - User menu
  
- **Start Menu:**
  - `.start-menu` - Popup panel
  - `.start-menu-header` - Title area
  - `.start-menu-apps` - 3-column app grid
  - `.start-menu-app` - App tiles
  - `.start-menu-search` - Search bar
  - `.start-menu-footer` - Power buttons
  - `.start-menu-recent` - Recent apps section

**When to modify:** Adjust taskbar height, change start menu width, update grid layout, modify button hover states

---

### 7. **windows.css** (70 lines)
**Purpose:** Window management (draggable, minimizable)

Contains:
- `.os-window` - Window container
- `.os-window-header` - Title bar (40px height)
- `.os-window-title` - Window title text
- `.os-window-btn` - Control buttons (minimize, close)
- `.os-window-icon` - Button icon sizing (14px)
- `.os-window-body` - Content area with scroll

**When to modify:** Change window chrome appearance, adjust title bar height, modify button sizes

---

### 8. **file-explorer.css** (500+ lines)
**Purpose:** Comprehensive file manager styling

Organized into sections:

- **Toolbar** - Navigation buttons, address bar
  - `.files-toolbar` - Button bar
  - `.files-nav-btn` - Up/Back buttons
  - `.files-address-bar` - Location display
  
- **Breadcrumb** - Path navigation
  - `.files-breadcrumb` - Breadcrumb container
  - `.files-breadcrumb-btn` - Path segments
  
- **File List** - Main content area
  - `.files-list` - Grid of files/folders
  - `.files-item` - Individual file/folder
  - `.files-item-icon` - File icon (24px)
  - `.files-name` - File name text
  - `.files-type` - File type label
  
- **Context Menu** - Right-click options
  - `.files-context-menu` - Menu container
  - `.files-context-item` - Menu items (copy, cut, delete, etc.)
  - `.files-context-icon` - Icon in menu (16px)
  
- **Dialog** - Modals for actions
  - `.files-dialog-overlay` - Backdrop
  - `.files-dialog` - Modal container
  - `.files-dialog-btn` - Dialog buttons (primary, danger)
  
- **Properties** - File details
  - `.files-properties` - Properties grid
  - `.files-prop-label` - Property name
  - `.files-prop-value` - Property value
  
- **Local FS Panel** - Desktop file access
  - `.localfs-panel` - Panel container
  - `.localfs-list` - Folder list
  - `.localfs-preview` - File preview area

**When to modify:** Change file list grid layout, adjust icon sizes, update context menu options, modify dialog styling

---

### 9. **apps.css** (300+ lines)
**Purpose:** Built-in applications styling

Organized by app:

- **Terminal App** - Command-line interface
  - `.app-terminal` - Container
  - `.terminal-output` - Output area
  - `.terminal-line` - Single output line
  - `.terminal-input` - Input field
  
- **Notes App** - Text editor
  - `.app-notes` - Container
  - `.notes-toolbar` - Button bar
  - `.notes-filename` - File name input
  - `.notes-editor` - Text area
  
- **Settings App** - System configuration
  - `.app-settings` - Container
  - `.settings-section` - Settings groups
  - `.settings-item` - Individual settings
  - `.settings-select` - Dropdown menus
  - `.settings-user-list` - User list
  
- **Monitor App** - Resource monitoring
  - `.app-monitor` - Container
  - `.monitor-stats` - CPU/Memory stats
  - `.monitor-stat-bar` - Progress bar
  - `.monitor-stat-fill` - Colored fill
  - `.monitor-process-table` - Process list
  - `.monitor-process-row` - Process item
  - `.monitor-state-badge` - Status badges (running, terminated)
  - `.monitor-kill-btn` - Kill button

**When to modify:** Change app layout, adjust colors, update fonts, modify button styles

---

## How to Use

### Importing Styles in Components

All styles are automatically loaded via `styles/index.css` in `main.jsx`. No need to import individual CSS files in components.

Simply use the CSS class names defined in these files:

```jsx
// In a component
<div className="app-launcher">
  <div className="app-icon">
    <div className="app-icon-badge">
      <Terminal className="app-icon-svg" />
    </div>
    <span className="app-icon-label">Terminal</span>
  </div>
</div>
```

### Modifying Styles

1. **Color Changes:** Edit `variables.css` and update CSS custom properties
   ```css
   --win-accent: #0066cc;  /* Change accent color */
   ```

2. **Component Styling:** Edit the relevant component file
   - Change icons? → `file-explorer.css` or `apps.css`
   - Adjust layout? → `desktop.css` or `taskbar.css`
   - Modify buttons? → Specific app or component file

3. **Theme-wide Changes:** Edit `variables.css` for colors, `global.css` for base styles

### Adding New Styles

1. Create a new file in `src/styles/` (e.g., `new-component.css`)
2. Add `@import './new-component.css';` to `src/styles/index.css`
3. Use the class names in your components

---

## Design System

### Color Palette

```
Primary Background:    #e9eef6  (light blue-gray)
Surface:              rgba(255, 255, 255, 0.86)
Surface Strong:       rgba(255, 255, 255, 0.94)
Text:                 #0f172a  (dark)
Muted Text:           rgba(30, 41, 59, 0.6)
Accent:               #2563eb  (professional blue)
Border:               rgba(100, 116, 139, 0.28)
```

### Icon Sizes

```
Taskbar icons:        16px
Menu icons:           16px
Item icons:           24px
Logo icons:           28-44px
Badge icons:          22px
```

### Spacing

- Grid gaps: 6px - 18px
- Padding: 8px - 32px
- Border radius: 8px - 18px
- Font sizes: 11px - 32px

---

## Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

The design uses modern CSS features like:
- CSS Custom Properties
- Grid & Flexbox
- Backdrop Filter (blur effect)
- Gradients
- CSS Variables

---

## Tips for Maintenance

1. **Keep component styles together** - Don't split app styles across files
2. **Use CSS variables** - Don't hardcode colors; use `var(--win-*)` 
3. **Maintain import order** - Import variables first, then global, then components
4. **Document changes** - Add comments above style blocks explaining their purpose
5. **Test responsiveness** - Styles should work on various window sizes

---

## Build Information

- Build tool: Vite
- CSS bundling: Automatic via Vite
- Final CSS size: ~23.5 kB (4.5 kB gzipped)
- All styles are tree-shaken and optimized for production

---

## Troubleshooting

### Build Failure: "Could not resolve" errors on styles

**Problem:** Local build works fine, but Vercel/CI build fails with import errors.

**Cause:** Barrel export files (`index.css` in style domains) weren't committed to git.

**Solution:**
1. Ensure all `index.css` files are created in each domain folder:
   - `src/styles/base/index.css`
   - `src/styles/layout/index.css`
   - `src/styles/auth/index.css`
   - `src/styles/ui/index.css`
   - `src/styles/system/index.css`
   - `src/styles/apps/index.css`

2. Each barrel export should follow the pattern:
   ```css
   /* Example: src/styles/layout/index.css */
   @import './desktop.css';
   @import './taskbar.css';
   @import './windows.css';
   @import './boot.css';
   ```

3. Commit all files to git:
   ```bash
   git add frontend/src/styles/
   git commit -m "fix: Include barrel exports for all style domains"
   git push
   ```

**Note:** If styles work locally but fail in deployment, verify that barrel export files are staged and committed in git. The build tool has access to the filesystem cache but remote deployments only see committed files.

---

## Recent Updates (March 27, 2026)

### Style Organization Refactoring
- Reorganized 23 CSS files into 6 domain-based folders (base, layout, auth, ui, system, apps)
- Created barrel export `index.css` files for cleaner imports
- Updated main `src/styles/index.css` to import from domain indices
- Resolved Vercel build failures by ensuring all barrel export files are committed to git
- Verified production build: 1753 modules, 358KB JS, 146KB CSS (with gzip compression)

