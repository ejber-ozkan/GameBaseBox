"use client";

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { readFileBytes } from '../lib/tauri-bridge';
import { useInputMode } from '../hooks/useInputMode';

interface WasmPlayerProps {
  romPath: string;
  onClose: () => void;
  platformId?: string;
  core?: string;
}

const PLATFORM_CORE_MAP: Record<string, { core: string; system: string; biosUrl?: string }> = {
  c64: { core: 'vice_x64', system: 'c64' },
  atari2600: { core: 'stella2014', system: 'atari2600' },
  zxspectrum: { core: 'fuse', system: 'zxspectrum' },
  vic20: { core: 'vice_xvic', system: 'vic20' },
};

export function WasmPlayer({ romPath, onClose, platformId = 'c64', core: customCore }: WasmPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<string>('Reading ROM file...');
  const { showMouse } = useInputMode();

  const mapping = PLATFORM_CORE_MAP[platformId] || { core: customCore || 'vice_x64', system: platformId };
  const targetCore = customCore || mapping.core;
  const targetSystem = mapping.system;
  const targetBiosUrl = mapping.biosUrl;

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data && e.data.type === 'EMULATOR_CLOSED') {
        console.log('[WasmPlayer] Received EMULATOR_CLOSED signal. Closing player.');
        onClose();
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        console.log('[WasmPlayer] Escape key pressed. Closing player.');
        onClose();
      }
    }
    window.addEventListener('message', handleMessage);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    async function init() {
      try {
        console.log('[WasmPlayer] Reading bytes for:', romPath, 'Platform:', platformId, 'Core:', targetCore, 'Bios:', targetBiosUrl);
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
              core: targetCore,
              system: targetSystem,
              biosUrl: targetBiosUrl,
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
  }, [romPath, platformId, targetCore, targetSystem, targetBiosUrl]);

  const content = (
    <div className={`fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center transition-all ${!showMouse ? 'cursor-none' : ''}`}>
      <div className="w-full h-full relative group">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-[10000] px-4 py-2 bg-red-600/90 hover:bg-red-500 text-white rounded font-bold shadow-xl transition-all opacity-80 hover:opacity-100 group-hover:opacity-100 cursor-pointer flex items-center gap-2"
          title="Exit Emulator (ESC)"
        >
          <span>✕ Exit Game [ESC]</span>
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
