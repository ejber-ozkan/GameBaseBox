#!/bin/bash
set -e

# If run under pure POSIX sh (e.g. dash on Ubuntu), re-exec with bash if available
if [ -z "$BASH_VERSION" ] && command -v bash >/dev/null 2>&1; then
    exec bash "$0" "$@"
fi

# Navigate to project root directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Ensure Cargo/Rust and package manager binaries are available
# Checks Rustup standard directory, Homebrew paths (Apple Silicon / Intel / Linuxbrew)
export PATH="$HOME/.cargo/bin:/opt/homebrew/bin:/home/linuxbrew/.linuxbrew/bin:/usr/local/bin:$PATH"

# Ensure node_modules dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "[GBBox] node_modules folder not found. Installing dependencies via 'npm install'..."
    npm install
fi

# Ensure Rust toolchain is available
if ! command -v cargo >/dev/null 2>&1 || ! command -v rustc >/dev/null 2>&1; then
    echo "[GBBox] ERROR: Rust toolchain (cargo/rustc) not found."
    echo "[GBBox] Please install Rust via https://rustup.rs/ and ensure cargo is in your PATH."
    exit 1
fi

# Ensure Node.js and npm are available
if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
    echo "[GBBox] ERROR: Node.js and npm are required but not found in PATH."
    exit 1
fi

echo "[GBBox] Using Rust:"
rustc --version
cargo --version

echo "[GBBox] Using Node.js:"
node --version
npm --version

# Platform-specific pre-flight checks and diagnostics
OS="$(uname -s)"
case "$OS" in
    Darwin)
        echo "[GBBox] Building for macOS ($(uname -m))..."
        if ! xcode-select -p >/dev/null 2>&1; then
            echo "[GBBox] WARNING: Xcode Command Line Tools not detected."
            echo "[GBBox] If the build fails, run 'xcode-select --install'."
        fi
        ;;
    Linux)
        echo "[GBBox] Building for Linux ($(uname -m))..."
        if command -v pkg-config >/dev/null 2>&1; then
            MISSING_DEPS=""
            for pkg in gtk+-3.0 librsvg-2.0; do
                if ! pkg-config --exists "$pkg" 2>/dev/null; then
                    MISSING_DEPS="$MISSING_DEPS $pkg"
                fi
            done
            if ! pkg-config --exists webkit2gtk-4.1 2>/dev/null && ! pkg-config --exists webkit2gtk-4.0 2>/dev/null; then
                MISSING_DEPS="$MISSING_DEPS webkit2gtk-4.1"
            fi
            if ! pkg-config --exists ayatana-appindicator3-0.1 2>/dev/null && ! pkg-config --exists appindicator3-0.1 2>/dev/null; then
                MISSING_DEPS="$MISSING_DEPS libayatana-appindicator3"
            fi
            if [ -n "$MISSING_DEPS" ]; then
                echo "[GBBox] WARNING: Some recommended Linux system libraries might be missing:$MISSING_DEPS"
                echo "[GBBox] On Debian/Ubuntu, install them with:"
                echo "[GBBox]   sudo apt-get update && sudo apt-get install -y \\"
                echo "[GBBox]     build-essential curl file patchelf \\"
                echo "[GBBox]     libwebkit2gtk-4.1-dev libgtk-3-dev librsvg2-dev libayatana-appindicator3-dev"
            fi
        fi
        ;;
    *)
        echo "[GBBox] Building on $OS..."
        ;;
esac

echo "[GBBox] Building production release..."
npm run build && npx tauri build "$@"

echo "[GBBox] Build complete! Release bundles are located in:"
echo "        src-tauri/target/release/bundle/"
