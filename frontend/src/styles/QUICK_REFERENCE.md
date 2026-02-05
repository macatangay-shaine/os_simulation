# CSS Quick Reference Guide

## File-to-Component Mapping

| File | Component | Key Classes |
|------|-----------|------------|
| **variables.css** | Theme System | `--win-bg`, `--win-surface`, `--win-accent` |
| **global.css** | Base Reset | `*`, `body`, `#app` |
| **boot.css** | BootScreen.jsx | `.boot-screen`, `.boot-logo`, `.boot-progress` |
| **auth.css** | LoginScreen.jsx, LockScreen.jsx | `.login-screen`, `.lock-avatar`, `.login-button` |
| **desktop.css** | Desktop.jsx, AppLauncher.jsx | `.desktop`, `.app-launcher`, `.app-icon`, `.context-menu` |
| **taskbar.css** | Taskbar.jsx, StartMenu.jsx | `.taskbar`, `.start-menu`, `.start-menu-app` |
| **windows.css** | Window.jsx | `.os-window`, `.os-window-header`, `.os-window-btn` |
| **file-explorer.css** | FileExplorer.jsx | `.files-list`, `.files-item`, `.files-context-menu` |
| **apps.css** | Apps/ folder | `.app-terminal`, `.app-notes`, `.app-settings`, `.app-monitor` |

## When to Edit Each File

### Want to change...

**Colors/Theme?**
→ Edit `variables.css` - Update CSS custom properties

**Boot screen look?**
→ Edit `boot.css` - Modify `.boot-*` classes

**Login page design?**
→ Edit `auth.css` - Adjust `.login-*` or `.lock-*` classes

**Desktop wallpaper/icons?**
→ Edit `desktop.css` - Change `.desktop-*` and `.app-*` classes

**Taskbar or Start menu?**
→ Edit `taskbar.css` - Modify `.taskbar-*` or `.start-menu-*` classes

**Window chrome (title bar, buttons)?**
→ Edit `windows.css` - Adjust `.os-window-*` classes

**File explorer layout/styling?**
→ Edit `file-explorer.css` - Update `.files-*` classes

**Terminal, Notes, Settings, Monitor apps?**
→ Edit `apps.css` - Modify `.app-*` or specific app classes

---

## Common Modifications

### Add a New Color Variable
Edit `variables.css`:
```css
--win-new-color: #yourcolor;
```

### Change Icon Size
Edit the relevant file (e.g., `desktop.css`):
```css
.app-icon-svg {
  width: 24px;  /* was 22px */
  height: 24px;
}
```

### Adjust Spacing
Edit component file:
```css
.files-list {
  gap: 10px;  /* was 6px */
}
```

### Change Button Hover Effect
Edit component file:
```css
.login-button:hover {
  background: rgba(37, 99, 235, 1);  /* Darker on hover */
}
```

### Update Border Radius (Roundness)
```css
.app-icon {
  border-radius: 20px;  /* was 16px - more rounded */
}
```

---

## CSS Variable Reference

```css
/* Background */
--win-bg              Light blue-gray main background
--win-surface         White surface (86% opacity)
--win-surface-strong  Stronger white (94% opacity)
--win-surface-dark    Slight gray variant

/* Text */
--win-text            Dark text color
--win-muted           Secondary/muted text

/* Interactive */
--win-accent          Blue action color (#2563eb)
--win-accent-soft     Light blue background
--win-border          Soft gray borders

/* Effects */
--win-shadow          Drop shadow
```

---

## Quick Class Naming Convention

- `.boot-*` → Boot screen elements
- `.login-*` → Login screen elements
- `.lock-*` → Lock screen elements
- `.desktop-*` → Desktop environment
- `.app-*` → App launcher and apps
- `.taskbar-*` → Taskbar elements
- `.start-menu-*` → Start menu elements
- `.os-window-*` → Window management
- `.files-*` → File explorer
- `.terminal-*` → Terminal app
- `.notes-*` → Notes app
- `.settings-*` → Settings app
- `.monitor-*` → Monitor app

---

## Tips

✅ **DO:**
- Use CSS variables for colors
- Keep styles organized by component
- Update import order when adding files
- Test after making changes

❌ **DON'T:**
- Hardcode colors (use variables)
- Mix styles from different components
- Import CSS in individual components
- Forget to rebuild after CSS changes

---

## Build & Test

```bash
# Build CSS (via Vite)
npm run build

# Development server with hot reload
npm run dev

# Check for CSS errors
npm run build -- --errorReport=verbose
```

After modifying CSS, rebuild and refresh browser to see changes.

