@echo off
echo Starting Book Bridge Server...
echo.

:: Kill anything on port 5000
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000"') do taskkill /F /PID %%a >nul 2>&1

:: Start the server
cd server
start cmd /k "npm run dev"

echo.
echo Server is starting...
echo Open index.html with Live Server in VS Code
echo.
pause
