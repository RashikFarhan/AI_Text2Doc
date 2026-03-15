@echo off
echo ============================================
echo  AI DOCX App - Installing Dependencies
echo ============================================
echo.

echo [1/2] Installing frontend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Frontend install failed.
    pause
    exit /b 1
)
echo Frontend dependencies installed successfully.
echo.

echo [2/2] Installing backend dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Backend install failed.
    cd ..
    pause
    exit /b 1
)
cd ..
echo Backend dependencies installed successfully.
echo.

echo ============================================
echo  Installation complete!
echo.
echo  IMPORTANT: Pandoc must be installed separately.
echo  Download from: https://pandoc.org/installing.html
echo.
echo  To run locally:      run.bat
echo  To build for Vercel: npm run build
echo  To build for GitHub Pages: npm run build:ghpages
echo ============================================
pause
