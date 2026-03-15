@echo off
echo ============================================
echo  AI DOCX App - Starting Local Dev Server
echo ============================================
echo.
echo Starting backend server on http://localhost:5000 ...
start cmd /k "title AI-DOCX Backend && cd /d %~dp0server && npm start"

echo Starting frontend dev server on http://localhost:3000 ...
start cmd /k "title AI-DOCX Frontend && cd /d %~dp0 && npm run dev"

echo.
echo Both servers are starting in separate windows.
echo.
echo  Frontend : http://localhost:3000
echo  Backend  : http://localhost:5000
echo.
echo Close those windows to stop the servers.
echo ============================================
