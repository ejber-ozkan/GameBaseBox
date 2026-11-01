@echo off
:: Ensure Cargo/Rust binaries added by Rustup are available in this shell session
set PATH=%USERPROFILE%\.cargo\bin;%PATH%

:: Ensure node_modules dependencies are installed
if not exist "node_modules\" (
    echo [GBBox] node_modules folder not found.
    echo [GBBox] Installing dependencies via 'npm install'...
    call npm install
    if errorlevel 1 (
        echo [GBBox] ERROR: npm install failed.
        exit /b 1
    )
)

echo [GBBox] Using Rust: && rustc --version && cargo --version
echo [GBBox] Building production release...
npm run build && npx tauri build
