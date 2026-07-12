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

:: Check if port 3000 is listening
netstat -ano | find "LISTENING" | find ":3000" > nul
if errorlevel 1 (
    echo [GBBox] Frontend port 3000 not detected.
    echo [GBBox] Launching 'npm run dev' in a separate window...
    start "GBBox-Frontend" cmd /c "npm run dev"

    echo [GBBox] Waiting 5 seconds for server to initialize...
    timeout /t 5 /nobreak > nul
) else (
    echo [GBBox] Frontend already running on port 3000.
)

echo [GBBox] Starting Tauri in debug mode (GAMEBASEBOX_DEBUG=1)...
npx tauri dev --no-dev-server-wait --config tauri.dev-override.json
