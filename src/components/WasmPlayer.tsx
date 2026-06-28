"use client";

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { readFileBytes } from '../lib/tauri-bridge';
import { useInputMode } from '../hooks/useInputMode';

interface WasmPlayerProps {
  romPath: string;
  onClose: () => void;
  core?: string;
}

export function WasmPlayer({ romPath, onClose, core = 'vice_x64' }: WasmPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<string>('Reading ROM file...');
  const { showMouse } = useInputMode();

  useEffect(() => {
    async function init() {
      try {
        console.log('[WasmPlayer] Reading bytes for:', romPath);
        const bytes = await readFileBytes(romPath);
        console.log('[WasmPlayer] Bytes read, length:', bytes.length);
        setLoadingStatus('Initializing WASM Emulator...');

        // Post message immediately or retry a few times
        const tryPost = setInterval(() => {
          if (iframeRef.current && iframeRef.current.contentWindow) {
            console.log('[WasmPlayer] Attempting postMessage to iframe...');
            setLoadingStatus('Streaming data to emulator core...');
            iframeRef.current.contentWindow.postMessage({
              type: 'START_EMULATOR',
              core: core,
              fileData: bytes,
              fileName: romPath.split(/[/\\]/).pop() || 'game.zip'
            }, '*');
            clearInterval(tryPost);
            
            // Allow child some time to react before parent stops reporting progress
            setTimeout(() => setLoadingStatus(''), 2000);
          }
        }, 500);
        
        // Timeout after 5 seconds
        setTimeout(() => clearInterval(tryPost), 5000);
        
      } catch (e) {
        setError(String(e));
        setLoadingStatus('');
      }
    }
    init();
  }, [romPath, core]);

  const content = (
    <div className={`fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center transition-all ${!showMouse ? 'cursor-none' : ''}`}>
      <div className="w-full h-full relative group">
        <button 
          onClick={onClose}
          className={`absolute top-4 right-4 z-[10000] px-4 py-2 bg-red-600/80 hover:bg-red-500 text-white rounded font-bold shadow-lg transition-all ${showMouse ? 'opacity-0 group-hover:opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          Exit Game [B]
        </button>
        {error ? (
          <div className="text-white p-8 text-center bg-red-900/50 w-full h-full flex items-center justify-center">
             Error loading ROM: {error}
          </div>
        ) : (
          <>
            {loadingStatus && (
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-blue-400 font-mono text-sm animate-pulse z-20">
                {loadingStatus}
              </div>
            )}
            <iframe 
              ref={iframeRef}
              src="/emulator.html" 
              className={`w-full h-full border-0 transition-opacity duration-500 ${loadingStatus ? 'opacity-0' : 'opacity-100'}`}
              allow="fullscreen; autoplay; gamepad"
              onLoad={(e) => {
                e.currentTarget.focus();
                // We also add a listener specifically tailored to click events to reclaim focus if they click out
                e.currentTarget.addEventListener('mouseover', () => e.currentTarget?.focus());
              }}
            />
          </>
        )}
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(content, document.body);
}
