@echo off
:: Ensure Cargo/Rust binaries added by Rustup are available in this shell session
set PATH=%USERPROFILE%\.cargo\bin;%PATH%
echo [GBBox] Using Rust: && rustc --version && cargo --version
echo [GBBox] Building production release...
npm run build && npx tauri build
