@echo off
echo Starting JezOS...

:: Start backend
start "JezOS Backend" cmd /k "cd backend && venv\Scripts\activate && uvicorn main:app --reload"

:: Wait a moment for backend to start
timeout /t 3 /nobreak > nul

:: Start frontend
start "JezOS Frontend" cmd /k "cd frontend && npm run dev"

:: Wait for frontend to start
timeout /t 3 /nobreak > nul

:: Open browser
start http://localhost:5173