#!/bin/bash

# Enable GBBox debug logging in the backend (checked by init_debug_mode in lib.rs)
export GAMEBASEBOX_DEBUG=1

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

frontend_ready() {
    curl -fsS --max-time 2 http://127.0.0.1:3000/ >/dev/null 2>&1
}

FRONTEND_PID=""
if ! frontend_ready; then
    if lsof -i :3000 -t >/dev/null 2>&1; then
        echo "[GBBox] ERROR: A process is listening on port 3000 but is not serving the frontend."
        echo "[GBBox] Close the stale frontend process, then run this launcher again."
        exit 1
    fi

    echo "[GBBox] Frontend is not running."
    echo "[GBBox] Launching 'npm run dev' in the background..."
    npm run dev &
    FRONTEND_PID=$!
fi

for attempt in $(seq 1 30); do
    if frontend_ready; then
        break
    fi
    sleep 1
done

if ! frontend_ready; then
    echo "[GBBox] ERROR: Frontend did not become ready at http://127.0.0.1:3000 within 30 seconds."
    if [ -n "$FRONTEND_PID" ]; then
        kill "$FRONTEND_PID" 2>/dev/null
    fi
    exit 1
fi

echo "[GBBox] Starting Tauri in debug mode (GAMEBASEBOX_DEBUG=1)..."
npx tauri dev --no-dev-server-wait --config tauri.dev-override.json

# If we started the frontend in this script, clean it up when we exit
if [ -n "$FRONTEND_PID" ]; then
    kill "$FRONTEND_PID" 2>/dev/null
fi
