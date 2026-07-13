"use client";

import { useState, useEffect } from 'react';
import { getAssetUrl, isDebugMode, logDebugMessage } from '../lib/tauri-bridge';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallbackText?: string;
  fit?: 'cover' | 'contain';
}

export function ImageWithFallback({
  src,
  alt,
  className = '',
  fallbackText = 'No Image',
  fit = 'cover',
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(src);
  const fitClass = fit === 'contain' ? 'object-contain' : 'object-cover';

  useEffect(() => {
    async function resolveSource() {
      if (!src) {
        setResolvedSrc(null);
        return;
      }

      // Detect Tauri runtime environment
      const isTauriEnv = typeof window !== 'undefined' && (
        (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ !== undefined || 
        (window as Window & { __TAURI_IPC__?: unknown }).__TAURI_IPC__ !== undefined || 
        (window as Window & { __TAURI__?: unknown }).__TAURI__ !== undefined
      );

      let targetPath = src;
      if (src.startsWith('file://')) {
        targetPath = src.replace('file://', '');
      }

      // Check if it's an absolute path that needs conversion in Tauri
      const isAbsolute = isTauriEnv && (
        /^[a-zA-Z]:[/\\]/.test(targetPath) || 
        targetPath.startsWith('file://') ||
        (targetPath.startsWith('/') && !targetPath.startsWith('/_next') && !targetPath.startsWith('/images/'))
      );

      if (isAbsolute) {
        try {
          const url = await getAssetUrl(targetPath);
          setResolvedSrc(url);
          setHasError(false);
        } catch (e) {
          console.error("Failed to get asset URL for absolute path:", targetPath, e);
          isDebugMode().then(debug => {
            if (debug) {
              logDebugMessage(`[DEBUG WARNING] Failed to get asset URL for absolute path: "${targetPath}"`);
            }
          });
          setResolvedSrc(src); // fallback to original
          setHasError(false);
        }
      } else {
        setResolvedSrc(src);
        setHasError(false);
      }
    }

    resolveSource();
  }, [src]);

  if (!resolvedSrc || hasError) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-800 text-gray-500 rounded border border-gray-700 ${className}`}
        data-testid="image-fallback"
      >
        <span className="text-xs">{fallbackText}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolvedSrc}
      alt={alt}
      className={`${fitClass} ${className}`}
      onError={() => {
        setHasError(true);
        isDebugMode().then(debug => {
          if (debug) {
            logDebugMessage(`[DEBUG WARNING] Image element error for alt: "${alt}", src: "${resolvedSrc}"`);
          }
        });
      }}
      loading="lazy"
      data-testid="image-element"
    />
  );
}
