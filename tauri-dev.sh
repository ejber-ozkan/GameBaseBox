#!/bin/bash

# Ensure Cargo/Rust binaries added by Rustup are available in this shell session
export PATH="$HOME/.cargo/bin:$PATH"

# Check for node_modules in a clean clone
if [ ! -d "node_modules" ]; then
    echo "[GBBox] ERROR: node_modules folder not found."
    echo "[GBBox] Please run 'npm install' before starting the development server."
    exit 1
fi

echo "[GBBox] Using Rust:"
rustc --version
cargo --version

# Check if port 3000 is listening
if ! lsof -i :3000 -t >/dev/null 2>&1; then
    echo "[GBBox] Frontend port 3000 not detected."
    echo "[GBBox] Launching 'npm run dev' in the background..."
    npm run dev &
    FRONTEND_PID=$!
    
    echo "[GBBox] Waiting 5 seconds for server to initialize..."
    sleep 5
else
    echo "[GBBox] Frontend already running on port 3000."
    FRONTEND_PID=""
fi

echo "[GBBox] Starting Tauri (connecting to http://localhost:3000)..."
npx tauri dev --no-dev-server-wait --config tauri.dev-override.json

# If we started the frontend in this script, clean it up when we exit
if [ -n "$FRONTEND_PID" ]; then
    kill "$FRONTEND_PID" 2>/dev/null
fi
