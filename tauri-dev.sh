#!/bin/bash

# Ensure Cargo/Rust binaries added by Rustup are available in this shell session
export PATH="$HOME/.cargo/bin:$PATH"

# Check for node_modules in a clean clone
if [ ! -d "node_modules" ]; then
    echo "[GBBox] node_modules folder not found."
    echo "[GBBox] Installing dependencies via 'npm install'..."
    npm install
fi

echo "[GBBox] Using Rust:"
rustc --version
cargo --version

frontend_ready() {
    curl -fsS --max-time 2 http://127.0.0.1:3000/ >/dev/null 2>&1
}

FRONTEND_PID=""
if frontend_ready; then
    if curl -fsS --max-time 2 http://127.0.0.1:3000/ 2>/dev/null | grep -qi "Open WebUI"; then
        echo "[GBBox] ERROR: Port 3000 is occupied by Open WebUI (e.g. running in Docker)."
        echo "[GBBox] Stop the conflicting Open WebUI service or Docker container, then run this launcher again."
        exit 1
    fi
    echo "[GBBox] An active service was already detected on http://127.0.0.1:3000."
    echo "[GBBox] WARNING: Ensure port 3000 is serving GameBase Box. If an unexpected screen appears (such as Open WebUI or another web app), check for conflicting background services or Docker containers on port 3000."
else
    if lsof -i :3000 -t >/dev/null 2>&1; then
        echo "[GBBox] ERROR: A process is listening on port 3000 but is not serving the frontend."
        echo "[GBBox] Close the stale frontend process (or Docker container), then run this launcher again."
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

for cache_dir in "$HOME/Library/Caches/gamebasebox/WebKit" "$HOME/Library/Caches/com.gamebasebox.desktop/WebKit"; do
    if [ -d "$cache_dir" ] && grep -rql "Open WebUI" "$cache_dir" 2>/dev/null; then
        echo "[GBBox] Clearing stale Open WebUI cache from WebKit ($cache_dir)..."
        rm -rf "$cache_dir"
    fi
done

echo "[GBBox] Starting Tauri (connecting to http://localhost:3000)..."
npx tauri dev --no-dev-server-wait --config tauri.dev-override.json

# If we started the frontend in this script, clean it up when we exit
if [ -n "$FRONTEND_PID" ]; then
    kill "$FRONTEND_PID" 2>/dev/null
fi
