#!/bin/bash
set -e

echo "[GBBox] Cleaning environment..."

# 1. Clear Next.js cache
if [ -d ".next" ]; then
    echo "[GBBox] Removing .next cache..."
    rm -rf .next
fi

# 2. Clear macOS WebKit cache for GBBox (clears cached PWAs, service workers, etc.)
for cache_dir in "$HOME/Library/Caches/gamebasebox" "$HOME/Library/Caches/com.gamebasebox.desktop"; do
    if [ -d "$cache_dir" ]; then
        echo "[GBBox] Removing Tauri WebKit cache ($cache_dir)..."
        rm -rf "$cache_dir"
    fi
done

# 3. Clear Rust/Tauri build artifacts
if [ -d "src-tauri/target" ]; then
    echo "[GBBox] Cleaning Rust target directory..."
    (cd src-tauri && cargo clean)
fi

echo "[GBBox] Clean complete."
echo "[GBBox] Starting development environment..."
./tauri-dev.sh
