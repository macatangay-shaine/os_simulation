# Jez OS - Virtual Operating System Simulator

A fully-featured virtual operating system built with React and FastAPI, simulating a complete desktop environment with file system, process management, applications, and system utilities.

## 🚀 Features

### Desktop Environment
- **Boot Sequence** - Realistic boot screen with progress indicators
- **Login System** - Multi-user support with authentication
- **Lock Screen** - Screen locking and unlocking functionality
- **Desktop** - Full desktop environment with wallpapers, icons, and context menus
- **Window Management** - Draggable, resizable windows with minimize/maximize/close
- **Taskbar** - Windows-style taskbar with app pinning, system tray, and quick actions
- **Start Menu** - Searchable start menu with app launcher
- **Action Center** - System notifications and quick settings
- **Calendar Widget** - Calendar popup from taskbar with month/year navigation

### Built-in Applications
- **File Explorer** - Complete file management with create, rename, delete, and navigation
- **Terminal** - Command-line interface with command execution
- **Notes App** - Create, edit, and manage text notes
- **Settings** - System configuration (theme, wallpaper, time format, accessibility)
- **System Monitor** - Real-time CPU, memory, and disk usage monitoring
- **Event Viewer** - System event logs and diagnostics
- **System Diagnostics** - Health checks and system information
- **Calculator** - Functional calculator with basic operations
- **Camera App** - Webcam access and photo capture
- **Clock App** - Analog and digital clock display
- **Calendar App** - Full calendar view with date selection
- **Tips App** - System tips and tutorials
- **App Store** - Browse and install additional applications

### System Features
- **Process Management** - View and kill running processes
- **Virtual File System** - Complete file system with permissions
- **User Authentication** - Login/logout with session management
- **Notifications** - System-wide notification system with toast messages
- **Power Management** - Sleep, restart, and shutdown functionality
- **UAC Prompts** - User Access Control for elevated operations
- **App Switcher** - Quick app switching with the built-in switcher
- **Context Menus** - Right-click context menus throughout the UI
- **Accessibility** - High contrast mode and accessibility settings
- **Themes** - Customizable accent colors and wallpapers

## 🛠️ Tech Stack

### Frontend
- **React 18.3** - UI framework
- **Vite** - Build tool and dev server
- **Lucide React** - Icon library
- **CSS3** - Modular styling with custom properties

### Backend
- **Python 3.x** - Backend runtime
- **FastAPI** - RESTful API framework
- **SQLite** - Database for user data, files, and notifications
- **Uvicorn** - ASGI server

## 📦 Installation

### Prerequisites
- Node.js 16+ and npm
- Python 3.8+
- Git

### Clone the Repository
```bash
git clone https://github.com/somarjez/os_simulation.git
cd jez_OS
```

### Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install fastapi uvicorn sqlalchemy pydantic

# Run the backend server
uvicorn main:app --reload
```

The backend will start on `http://localhost:8000`

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```

The frontend will start on `http://localhost:5173`

## 🎮 Usage

1. **Start Backend**: Navigate to the `backend` folder and run `uvicorn main:app --reload`
2. **Start Frontend**: Navigate to the `frontend` folder and run `npm run dev`
3. **Open Browser**: Visit `http://localhost:5173`
4. **Login**: Use default credentials:
   - Username: `admin` / Password: `admin`
    - Username: `user` / Password: `password`

### Default Keyboard Shortcuts
- **Hold `0` + `+` (or `=`)** - Open/cycle the app switcher
- **Release `0`** - Focus selected app from switcher
- **Hold `0` + `Left Arrow`** - Snap active window left
- **Hold `0` + `Right Arrow`** - Snap active window right
- **Hold `0` + `Up Arrow`** - Maximize active window
- Right-click - Context menu

## 📁 Project Structure

```
jez_OS/
├── backend/
│   ├── main.py                 # FastAPI application entry point
│   ├── config.py               # Configuration and global state
│   ├── database.py             # Database utilities
│   ├── models.py               # Pydantic models
│   ├── security.py             # Authentication and security
│   ├── event_logger.py         # Event logging system
│   ├── system_health.py        # System health monitoring
│   ├── permission_validator.py # Permission validation
│   └── routers/                # API route handlers
│       ├── users.py            # User management
│       ├── filesystem.py       # File operations
│       ├── processes.py        # Process management
│       ├── terminal.py         # Terminal commands
│       ├── notifications.py    # Notification system
│       ├── system.py           # System resources
│       ├── apps.py             # Application management
│       ├── events.py           # Event logs
│       ├── system_health.py    # Health checks
│       └── security.py         # Security endpoints
│
└── frontend/
    ├── index.html              # HTML entry point
    ├── package.json            # NPM dependencies
    ├── vite.config.js          # Vite configuration
    └── src/
        ├── App.jsx             # Root React component
        ├── main.jsx            # React entry point
        ├── components/         # UI components
        │   ├── Desktop.jsx
        │   ├── Taskbar.jsx
        │   ├── StartMenu.jsx
        │   ├── Window.jsx
        │   ├── Calendar.jsx
        │   └── ...
        ├── apps/               # Application components
        │   ├── FileExplorer.jsx
        │   ├── TerminalApp.jsx
        │   ├── NotesApp.jsx
        │   └── ...
        └── styles/             # CSS modules
            ├── index.css
            ├── desktop.css
            ├── taskbar.css
            └── ...
```

## 🔧 Configuration

### Backend Configuration (`backend/config.py`)
- `MAX_MEMORY`: Maximum simulated memory
- `MEMORY_WARNING_THRESHOLD`: Warning threshold for memory pressure
- `DB_PATH`: Database file location

### Frontend Configuration
- Wallpapers: Place images in `frontend/public/wallpapers/`
- Themes: Modify `frontend/src/styles/variables.css`

## 🎨 Customization

### Adding Custom Wallpapers
1. Add image files to `frontend/public/wallpapers/`
2. Images will automatically appear in Settings

### Adding New Applications
1. Create app component in `frontend/src/apps/YourApp.jsx`
2. Register in `frontend/src/components/Desktop.jsx`
3. Add icon and metadata

## 🐛 Known Issues

- Terminal commands are simulated and may not reflect real system operations
- File system is virtual and isolated from the host OS
- Some features require backend connection

## 📚 Documentation

Comprehensive documentation for the project structure and recent changes:

- **[Refactoring Guide](/docs/REFACTORING.md)** - Complete overview of the file structure reorganization, migration guide, and rollback instructions
- **[Backend Structure](/docs/BACKEND_STRUCTURE.md)** - Backend organization, startup methods, API reference, and troubleshooting
- **[Frontend Structure](/docs/FRONTEND_STRUCTURE.md)** - Component domains, style organization, and guides for adding new features
- **[Style Architecture](/frontend/src/styles/README.md)** - CSS modular architecture, design system, and customization guide

## 🚢 Deployment

### Vercel Deployment

The project is configured for automatic deployment to Vercel on push to the `main` branch.

**Recent Update (March 27, 2026):**
- File structure refactored: 57+ files reorganized into domain-based folders
- Backend: Created `app/` package structure with compatibility wrapper
- Frontend: Organized 20 components and 23 styles into 5 component domains and 6 style domains
- Build verified: 1753 modules, 358KB JS (101KB gzipped), 146KB CSS (22KB gzipped)

### Build Troubleshooting

**Issue: Local build passes but Vercel deployment fails**

**Cause:** Barrel export files (`index.jsx` and `index.css`) weren't committed to git.

**Solution:**
1. Ensure all barrel export files are created:
   ```
   frontend/src/components/*/index.jsx (one per domain)
   frontend/src/styles/*/index.css (one per domain)
   ```

2. Commit and push to GitHub:
   ```bash
   git add -A
   git commit -m "fix: Include barrel exports"
   git push
   ```

3. Vercel will automatically rebuild. Check deployment status at: https://vercel.com/somarjez/os_simulation

**Local Build Verification:**
```bash
cd frontend
npm run build
# Expected: ✓ built in ~5-6s with 1753 modules transformed
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Icons by [Lucide](https://lucide.dev/)
- Inspired by Windows 11 and modern desktop environments
- Built with React and FastAPI

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Note**: This is a virtual operating system simulator for educational and demonstration purposes. It does not provide real OS functionality and runs entirely in a web browser with a simulated backend.
