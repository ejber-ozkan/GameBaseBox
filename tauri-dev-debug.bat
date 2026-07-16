@echo off
setlocal enabledelayedexpansion

:: Enable GBBox debug logging in the backend (checked by init_debug_mode in lib.rs)
set GAMEBASEBOX_DEBUG=1

:: Ensure Cargo/Rust binaries added by Rustup are available in this shell session
set PATH=%USERPROFILE%\.cargo\bin;%PATH%

:: Check for node_modules in a clean clone
if not exist "node_modules\" (
    echo [GBBox] ERROR: node_modules folder not found.
    echo [GBBox] Please run 'npm install' before starting the development server.
    pause
    exit /b 1
)

echo [GBBox] Using Rust:
rustc --version
cargo --version

call :frontend_ready
if errorlevel 1 (
    netstat -ano | find "LISTENING" | find ":3000" > nul
    if not errorlevel 1 (
        echo [GBBox] ERROR: A process is listening on port 3000 but is not serving the frontend.
        echo [GBBox] Close the stale frontend process, then run this launcher again.
        exit /b 1
    )

    echo [GBBox] Frontend is not running.
    echo [GBBox] Launching 'npm run dev' in a separate window...
    start "GBBox-Frontend" cmd /c "npm run dev"
)

call :wait_for_frontend
if errorlevel 1 exit /b 1

echo [GBBox] Starting Tauri in debug mode (GAMEBASEBOX_DEBUG=1)...
npx tauri dev --no-dev-server-wait --config tauri.dev-override.json
exit /b %errorlevel%

:frontend_ready
powershell.exe -NoProfile -NonInteractive -Command "$ErrorActionPreference = 'Stop'; $response = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:3000/' -TimeoutSec 2; if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) { exit 0 } else { exit 1 }" > nul 2>&1
exit /b %errorlevel%

:wait_for_frontend
for /l %%i in (1,1,30) do (
    call :frontend_ready
    if not errorlevel 1 exit /b 0
    timeout /t 1 /nobreak > nul
)

echo [GBBox] ERROR: Frontend did not become ready at http://127.0.0.1:3000 within 30 seconds.
exit /b 1
