"use client";

import { useSettings } from '../contexts/SettingsContext';
import { PLATFORM_PROFILES } from '../lib/platform-capabilities';
import type { PlatformId } from '../types/platform';
import { SapPlayer } from './SapPlayer';
import { SidPlayer } from './SidPlayer';

interface MusicPlayerProps {
  platformId: PlatformId;
  filename: string | null;
  audioUrl?: string;
  compact?: boolean;
}

export function MusicPlayer({ platformId, filename, audioUrl, compact = false }: MusicPlayerProps) {
  const { resolveMediaPath } = useSettings();
  const musicCapability = PLATFORM_PROFILES[platformId].mediaCapabilities.music;

  if (musicCapability === 'sid') {
    return <SidPlayer key={`${filename ?? 'none'}:${audioUrl ?? 'none'}`} filename={filename} audioUrl={audioUrl} compact={compact} />;
  }

  if (musicCapability === 'sap') {
    const resolvedAudioUrl = audioUrl ?? (filename ? resolveMediaPath('sound', filename) : undefined);
    return <SapPlayer key={`${filename ?? 'none'}:${resolvedAudioUrl ?? 'none'}`} filename={filename} audioUrl={resolvedAudioUrl} compact={compact} />;
  }

  return null;
}
