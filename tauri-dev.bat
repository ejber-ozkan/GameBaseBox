@echo off
setlocal enabledelayedexpansion

:: Enable launch logging to console during development
set VIC40_DEBUG_LAUNCH=1

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

powershell.exe -NoProfile -NonInteractive -Command "$ErrorActionPreference = 'Stop'; $response = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:3000/' -TimeoutSec 2; if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) { exit 0 } else { exit 1 }" > nul 2>&1
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

powershell.exe -NoProfile -NonInteractive -Command "$ErrorActionPreference = 'Stop'; for ($attempt = 1; $attempt -le 30; $attempt++) { try { $response = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:3000/' -TimeoutSec 2; if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) { exit 0 } } catch {}; Start-Sleep -Seconds 1 }; exit 1" > nul 2>&1
if errorlevel 1 (
    echo [GBBox] ERROR: Frontend did not become ready at http://127.0.0.1:3000 within 30 seconds.
    exit /b 1
)

echo [GBBox] Starting Tauri (connecting to http://localhost:3000)...
npx tauri dev --no-dev-server-wait --config tauri.dev-override.json
exit /b %errorlevel%
