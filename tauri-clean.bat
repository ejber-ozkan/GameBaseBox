@echo off
echo [GBBox] Cleaning environment...

:: 1. Clear Next.js cache
if exist ".next" (
    echo [GBBox] Removing .next cache...
    rmdir /s /q .next
)

:: 2. Clear Rust/Tauri build artifacts
if exist "src-tauri\target" (
    echo [GBBox] Cleaning Rust target directory...
    cd src-tauri
    cargo clean
    cd ..
)

echo [GBBox] Clean complete.
echo [GBBox] Starting development environment...
call tauri-dev.bat
