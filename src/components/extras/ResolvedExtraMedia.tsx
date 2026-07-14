"use client";

import React, { useCallback, useState, useEffect } from 'react';
import { Extra } from '../../types/game';
import {
  convertExtraVideo,
  downloadArchiveExtraVideo,
  getAssetUrl,
  openFile,
  resolveExtraVideo,
  type ExtraVideoResolution,
} from '../../lib/tauri-bridge';
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
  const [videoResolution, setVideoResolution] = useState<ExtraVideoResolution | null>(null);
  const [videoAction, setVideoAction] = useState<'convert' | 'download' | null>(null);
  const [videoMessage, setVideoMessage] = useState<string | null>(null);
  const isVideo = isVideoExtra(extra);
  const videoFailed = videoFailedPath === videoResolution?.playbackPath;

  const loadVideo = useCallback(async () => {
    setVideoMessage(null);
    setVideoFailedPath(null);
    const resolution = await resolveExtraVideo(extrasPath, extra.path);
    setVideoResolution(resolution);
    setUrl(resolution.playbackPath ? await getAssetUrl(resolution.playbackPath) : '');
  }, [extra.path, extrasPath]);

  useEffect(() => {
    let cancelled = false;
    if (isVideo) {
      loadVideo().catch((error) => {
        if (!cancelled) setVideoMessage(String(error));
      });
    } else {
      getAssetUrl(buildExtraAssetPath(extrasPath, extra.path)).then((assetUrl) => {
        if (!cancelled) setUrl(assetUrl);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [extra.path, extrasPath, isVideo, loadVideo]);

  const runVideoAction = async (action: 'convert' | 'download') => {
    setVideoAction(action);
    setVideoMessage(action === 'convert' ? 'Creating compatible MP4…' : 'Downloading compatible MP4…');
    try {
      const result = action === 'convert'
        ? await convertExtraVideo(extrasPath, extra.path)
        : await downloadArchiveExtraVideo(extrasPath, extra.path);
      setVideoMessage(result.message);
      await loadVideo();
    } catch (error) {
      setVideoMessage(String(error));
    } finally {
      setVideoAction(null);
    }
  };

  if (isVideo && videoResolution && (!videoResolution.playbackPath || videoFailed)) {
    const missing = !videoResolution.originalExists;
    if (mode === 'thumbnail') {
      return (
        <div className={`flex items-center justify-center text-center text-[10px] font-semibold uppercase tracking-wider text-white/60 ${className}`}>
          {missing ? 'Video not downloaded' : 'Open video externally'}
        </div>
      );
    }

    return (
      <div className={`flex flex-col items-center justify-center gap-3 bg-black/80 p-5 text-center ${className}`}>
        <div className="text-3xl" aria-hidden="true">🎬</div>
        <div>
          <p className="text-sm font-semibold text-white">
            {missing ? 'This video file is not available locally.' : 'This video format cannot be previewed in GBBox.'}
          </p>
          <p className="mt-1 text-xs text-white/55">
            {missing
              ? videoResolution.archiveCandidate
                ? 'Download a compatible Archive.org MP4 derivative.'
                : 'Place a compatible same-stem MP4 or WebM beside the database video path.'
              : 'Keep the original and open it externally, or create a compatible MP4 copy.'}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {videoResolution.originalExists ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                void openFile(videoResolution.originalPath).catch((error) => setVideoMessage(String(error)));
              }}
              className="rounded-lg border border-purple-400/50 bg-purple-500/15 px-3 py-2 text-xs font-semibold text-purple-100 hover:bg-purple-500/25"
            >
              Open in video player
            </button>
          ) : null}
          {videoResolution.originalExists && !videoResolution.compatibleSidecar ? (
            <button
              type="button"
              disabled={videoAction !== null}
              onClick={(event) => {
                event.stopPropagation();
                void runVideoAction('convert');
              }}
              className="rounded-lg border border-cyan-400/50 bg-cyan-500/15 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/25 disabled:opacity-50"
            >
              Create compatible MP4 copy
            </button>
          ) : null}
          {missing && videoResolution.archiveCandidate ? (
            <button
              type="button"
              disabled={videoAction !== null}
              onClick={(event) => {
                event.stopPropagation();
                void runVideoAction('download');
              }}
              className="rounded-lg border border-green-400/50 bg-green-500/15 px-3 py-2 text-xs font-semibold text-green-100 hover:bg-green-500/25 disabled:opacity-50"
            >
              Download compatible MP4
            </button>
          ) : null}
        </div>
        {videoMessage ? <p role="status" className="max-w-xl text-xs text-amber-200">{videoMessage}</p> : null}
      </div>
    );
  }

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
          onError={() => setVideoFailedPath(videoResolution?.playbackPath ?? extra.path)}
        />
        {mode === 'fullscreen' && videoResolution?.originalExists ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              void openFile(videoResolution.originalPath).catch((error) => setVideoMessage(String(error)));
            }}
            className="absolute right-3 top-3 rounded-lg border border-white/20 bg-black/70 px-3 py-2 text-xs font-semibold text-white/80 hover:border-purple-400/60 hover:text-purple-200"
          >
            Open original externally
          </button>
        ) : null}
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
