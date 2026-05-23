@echo off
REM AI Study Navigator Backend Setup Script (Windows)

echo.
echo 🚀 AI Study Navigator Backend Setup
echo ====================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js v18 or higher.
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do echo ✅ Node.js found: %%i

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm is not installed.
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do echo ✅ npm found: %%i
echo.

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install dependencies
    exit /b 1
)

echo ✅ Dependencies installed
echo.

REM Check if .env exists
if not exist .env (
    echo 📝 Creating .env file from .env.example...
    copy .env.example .env
    echo ⚠️  Please configure your .env file with the required credentials:
    echo    - MONGODB_URI
    echo    - EMAIL_USER and EMAIL_PASS (Gmail or Mailtrap)
    echo    - GEMINI_API_KEY
    echo    - JWT_SECRET
    echo.
)

echo ✅ Setup complete!
echo.
echo 📝 Next steps:
echo    1. Edit .env file with your credentials
echo    2. Run: npm run dev (for development)
echo    3. Server will start on http://localhost:5000
echo.
echo 📚 Documentation: See README.md
echo.
pause
