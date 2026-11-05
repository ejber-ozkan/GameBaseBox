@echo off
setlocal enabledelayedexpansion

:: Enable GBBox debug logging in the backend (checked by init_debug_mode in lib.rs)
set GAMEBASEBOX_DEBUG=1

:: Expose the Tauri WebView DevTools protocol locally for runtime inspection.
:: This is loopback-only and exists only while the development app is running.
set "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-address=127.0.0.1 --remote-debugging-port=9222"

:: Ensure Cargo/Rust binaries added by Rustup are available in this shell session
set PATH=%USERPROFILE%\.cargo\bin;%PATH%

:: Check for node_modules in a clean clone
if not exist "node_modules\" (
    echo [GBBox] node_modules folder not found.
    echo [GBBox] Installing dependencies via 'npm install'...
    call npm install
    if errorlevel 1 (
        echo [GBBox] ERROR: npm install failed.
        pause
        exit /b 1
    )
)

echo [GBBox] Using Rust:
rustc --version
cargo --version

powershell.exe -NoProfile -NonInteractive -Command "$ErrorActionPreference = 'Stop'; $response = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:3000/' -TimeoutSec 2; if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) { if ($response.Content -match 'Open WebUI') { exit 2 } else { exit 0 } } else { exit 1 }" > nul 2>&1
if errorlevel 2 (
    echo [GBBox] ERROR: Port 3000 is occupied by Open WebUI ^(e.g. running in Docker^).
    echo [GBBox] Stop the conflicting Open WebUI service or Docker container, then run this launcher again.
    exit /b 1
)
if errorlevel 1 (
    netstat -ano | find "LISTENING" | find ":3000" > nul
    if not errorlevel 1 (
        echo [GBBox] ERROR: A process is listening on port 3000 but is not serving the frontend.
        echo [GBBox] Close the stale frontend process ^(or Docker container^), then run this launcher again.
        exit /b 1
    )

    echo [GBBox] Frontend is not running.
    echo [GBBox] Launching 'npm run dev' in a separate window...
    start "GBBox-Frontend" cmd /c "npm run dev"
) else (
    echo [GBBox] An active service was already detected on http://127.0.0.1:3000.
    echo [GBBox] WARNING: Ensure port 3000 is serving GameBase Box. If an unexpected screen appears ^(such as Open WebUI or another web app^), check for conflicting background services or Docker containers on port 3000.
)

powershell.exe -NoProfile -NonInteractive -Command "$ErrorActionPreference = 'Stop'; for ($attempt = 1; $attempt -le 30; $attempt++) { try { $response = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:3000/' -TimeoutSec 2; if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) { exit 0 } } catch {}; Start-Sleep -Seconds 1 }; exit 1" > nul 2>&1
if errorlevel 1 (
    echo [GBBox] ERROR: Frontend did not become ready at http://127.0.0.1:3000 within 30 seconds.
    exit /b 1
)

echo [GBBox] Starting Tauri in debug mode (GAMEBASEBOX_DEBUG=1; WebView debug: 127.0.0.1:9222)...
npx tauri dev --no-dev-server-wait --config tauri.dev-override.json
exit /b %errorlevel%
