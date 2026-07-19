"use client";

import React, { useCallback, useState, useEffect, useRef } from 'react';
import { Extra } from '../../types/game';
import {
  convertExtraVideo,
  downloadArchiveExtraVideo,
  getAssetUrl,
  isDebugMode,
  listenExtraVideoDownloadProgress,
  logDebugMessage,
  openFile,
  resolveExtraVideo,
  type ExtraVideoDownloadProgress,
  type ExtraVideoResolution,
} from '../../lib/tauri-bridge';
import { buildExtraAssetPath } from '../../lib/extras';
import { ImageWithFallback } from '../ImageWithFallback';

export const VIDEO_EXTENSIONS = new Set(['avi', 'mp4', 'mov', 'mkv', 'webm']);
export const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'ogg', 'flac', 'sid']);
const VIDEO_SUCCESS_MESSAGE_MS = 4_000;

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTimeRemaining(seconds: number) {
  if (seconds < 60) return `${seconds}s left`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m ${remainder}s left`;
}

function normalizeVideoPath(path: string) {
  return path.replace(/\\/g, '/').toLowerCase();
}

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
  const [fallbackText, setFallbackText] = useState('No Image');
  const [videoFailedPath, setVideoFailedPath] = useState<string | null>(null);
  const [videoResolution, setVideoResolution] = useState<ExtraVideoResolution | null>(null);
  const [videoAction, setVideoAction] = useState<'convert' | 'download' | null>(null);
  const [videoMessage, setVideoMessage] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<ExtraVideoDownloadProgress | null>(null);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isVideo = isVideoExtra(extra);
  const videoFailed = videoFailedPath === videoResolution?.playbackPath;

  const loadVideo = useCallback(async (clearMessage = true) => {
    if (clearMessage) setVideoMessage(null);
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
      getAssetUrl(buildExtraAssetPath(extrasPath, extra.path))
        .then((assetUrl) => {
          if (!cancelled) {
            setUrl(assetUrl);
            setFallbackText('No Image');
          }
        })
        .catch((error) => {
          if (!cancelled) {
            const errorStr = String(error);
            if (errorStr.includes('Asset parent directory does not exist')) {
              setFallbackText('unavailable');
            }
            isDebugMode().then((debug) => {
              if (debug) {
                logDebugMessage(`[DEBUG WARNING] ResolvedExtraMedia: Failed to resolve asset parent directory for "${extra.name}": ${errorStr}`);
              }
            });
          }
        });
    }
    return () => {
      cancelled = true;
    };
  }, [extra.path, extrasPath, isVideo, loadVideo, extra.name]);

  useEffect(() => () => {
    if (successTimer.current) clearTimeout(successTimer.current);
  }, []);

  const runVideoAction = async (action: 'convert' | 'download') => {
    setVideoAction(action);
    setDownloadProgress(null);
    setVideoMessage(action === 'convert' ? 'Creating compatible MP4…' : 'Downloading compatible MP4…');
    let unlisten: (() => void) | undefined;
    try {
      if (action === 'download') {
        unlisten = await listenExtraVideoDownloadProgress((progress) => {
          if (normalizeVideoPath(progress.relativePath) === normalizeVideoPath(extra.path)) {
            setDownloadProgress(progress);
          }
        });
      }
      const result = action === 'convert'
        ? await convertExtraVideo(extrasPath, extra.path)
        : await downloadArchiveExtraVideo(extrasPath, extra.path);
      await loadVideo(false);
      setDownloadProgress(null);
      setVideoMessage(result.message);
      if (successTimer.current) clearTimeout(successTimer.current);
      successTimer.current = setTimeout(() => setVideoMessage(null), VIDEO_SUCCESS_MESSAGE_MS);
    } catch (error) {
      setVideoMessage(String(error));
    } finally {
      unlisten?.();
      setVideoAction(null);
    }
  };

  const renderVideoActions = () => {
    if (!videoResolution) return null;
    const missing = !videoResolution.originalExists;

    return (
      <div data-video-actions className="flex w-full flex-col gap-2">
        {videoAction === 'download' && downloadProgress ? (
          <div className="w-full rounded-lg border border-green-400/30 bg-black/80 px-3 py-2 text-left shadow-[0_0_18px_rgba(74,222,128,0.12)]">
            <div className="mb-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                role="progressbar"
                aria-label="Video download progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={downloadProgress.percent ?? undefined}
                className="h-full rounded-full bg-green-400 transition-[width] duration-300"
                style={{ width: `${downloadProgress.percent ?? 0}%` }}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-wider text-green-100">
              <span>
                {formatBytes(downloadProgress.bytesDownloaded)}
                {downloadProgress.totalBytes ? ` of ${formatBytes(downloadProgress.totalBytes)}` : ''}
                {downloadProgress.percent !== null ? ` · ${downloadProgress.percent}%` : ''}
              </span>
              <span className="text-green-200/70">
                {formatBytes(downloadProgress.bytesPerSecond)}/s
                {downloadProgress.secondsRemaining !== null ? ` · ${formatTimeRemaining(downloadProgress.secondsRemaining)}` : ''}
              </span>
            </div>
          </div>
        ) : null}
        <div className="flex w-full flex-wrap items-center gap-2">
          {videoResolution.originalExists && !videoResolution.compatibleSidecar ? (
            <button
              type="button"
              disabled={videoAction !== null}
              onClick={(event) => {
                event.stopPropagation();
                void runVideoAction('convert');
              }}
              className="rounded-lg border border-cyan-400/50 bg-cyan-500/20 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/30 disabled:opacity-60"
            >
              {videoAction === 'convert' ? 'Creating MP4…' : 'Create compatible MP4 copy'}
            </button>
          ) : null}
          {missing && !videoResolution.compatibleSidecar && videoResolution.archiveCandidate ? (
            <button
              type="button"
              disabled={videoAction !== null}
              onClick={(event) => {
                event.stopPropagation();
                void runVideoAction('download');
              }}
              className="rounded-lg border border-green-400/50 bg-green-500/20 px-3 py-2 text-xs font-semibold text-green-100 hover:bg-green-500/30 disabled:opacity-60"
            >
              {videoAction === 'download' ? 'Downloading MP4…' : 'Download compatible MP4'}
            </button>
          ) : null}
          {videoResolution.originalExists ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                void openFile(videoResolution.originalPath).catch((error) => setVideoMessage(String(error)));
              }}
              className="ml-auto rounded-lg border border-purple-400/50 bg-purple-500/20 px-3 py-2 text-xs font-semibold text-purple-100 hover:bg-purple-500/30"
            >
              Open in video player
            </button>
          ) : null}
        </div>
        {videoMessage ? (
          <p role="status" className="max-w-xl rounded-md bg-black/75 px-2 py-1 text-xs text-amber-200">
            {videoMessage}
          </p>
        ) : null}
      </div>
    );
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
        {renderVideoActions()}
      </div>
    );
  }

  if (isVideo && url && !videoFailed) {
    if (mode === 'thumbnail') {
      return (
        <video
          src={url}
          className={`object-contain object-center ${className}`}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onError={() => setVideoFailedPath(videoResolution?.playbackPath ?? extra.path)}
        />
      );
    }
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
        {videoResolution && (
          videoResolution.originalExists
          || !videoResolution.compatibleSidecar
          || videoMessage
        ) ? (
          <div
            className={`absolute inset-x-3 z-20 flex flex-col items-center gap-2 ${mode === 'fullscreen' ? 'bottom-14' : 'bottom-3'}`}
            onClick={(event) => event.stopPropagation()}
          >
            {renderVideoActions()}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <ImageWithFallback
      src={url}
      alt={extra.name}
      fallbackText={fallbackText}
      fit={fit}
      className={className}
    />
  );
}
