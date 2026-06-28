"use client";

import React, { useState, useEffect } from 'react';
import { Extra } from '../../types/game';
import { getAssetUrl } from '../../lib/tauri-bridge';
import { buildExtraAssetPath } from '../../lib/extras';
import { ImageWithFallback } from '../ImageWithFallback';

export const VIDEO_EXTENSIONS = new Set(['avi', 'mp4', 'mov', 'mkv', 'webm']);
export const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'ogg', 'flac', 'sid']);

export function isVideoExtra(extra: Extra) {
  const extension = extra.path.split('.').pop()?.toLowerCase() ?? '';
  return VIDEO_EXTENSIONS.has(extension) || extra.type.toLowerCase() === 'video';
}

export function isAudioExtra(extra: Extra) {
  const extension = extra.path.split('.').pop()?.toLowerCase() ?? '';
  return AUDIO_EXTENSIONS.has(extension);
}

export function VisualExtraThumb({
  extra,
  extrasPath,
}: {
  extra: Extra;
  extrasPath: string;
}) {
  return (
    <ResolvedExtraMedia
      extra={extra}
      extrasPath={extrasPath}
      fit="contain"
      mode="thumbnail"
      className="aspect-[4/3] w-full bg-black/70 p-2"
    />
  );
}

export function ResolvedExtraMedia({
  extra,
  extrasPath,
  fit = 'contain',
  mode = 'preview',
  className,
}: {
  extra: Extra;
  extrasPath: string;
  fit?: 'cover' | 'contain';
  mode?: 'preview' | 'thumbnail' | 'fullscreen';
  className: string;
}) {
  const [url, setUrl] = useState('');
  const [videoFailedPath, setVideoFailedPath] = useState<string | null>(null);
  const isVideo = isVideoExtra(extra);
  const videoFailed = videoFailedPath === extra.path;

  useEffect(() => {
    getAssetUrl(buildExtraAssetPath(extrasPath, extra.path)).then(setUrl);
  }, [extra.path, extrasPath]);

  if (isVideo && url && !videoFailed) {
    const showControls = mode === 'fullscreen';
    const autoPlay = mode !== 'fullscreen';

    return (
      <div className={`relative ${className}`}>
        <video
          src={url}
          className="h-full w-full object-contain object-center"
          controls={showControls}
          autoPlay={autoPlay}
          muted={!showControls}
          loop
          playsInline
          preload="metadata"
          onError={() => setVideoFailedPath(extra.path)}
        />
        {mode !== 'fullscreen' ? (
          <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-cyan-400/35 bg-black/60 px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-cyan-200">
            Video
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <ImageWithFallback
      src={url}
      alt={extra.name}
      fit={fit}
      className={className}
    />
  );
}
