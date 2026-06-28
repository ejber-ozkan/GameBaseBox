"use client";

import type { CSSProperties } from 'react';
import { useEffect, useState } from "react";
import { useSettings } from "../contexts/SettingsContext";
import { getMediaUrl, resolveMediaPath } from "../lib/tauri-bridge";

interface MusicianPhotoProps {
  photoFilename: string | null;
  musicianName: string;
  className?: string;
  style?: CSSProperties;
}

export function MusicianPhoto({ photoFilename, musicianName, className = "", style }: MusicianPhotoProps) {
  const { settings } = useSettings();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadPhoto() {
      if (!settings.musicianPhotosPath) {
        setPhotoUrl(null);
        return;
      }

      // If no photoFilename is in the DB, try to guess the filename based on the musician's name
      // e.g. "Mark Cooksey" -> "Mark_Cooksey.jpg"
      const nameBasedFilename = musicianName.replace(/\s+/g, '_') + '.jpg';
      const actualPhotoFilename = photoFilename || nameBasedFilename;

      try {
        const resolved = await resolveMediaPath(settings.musicianPhotosPath, actualPhotoFilename);
        if (resolved.exists) {
          const url = await getMediaUrl(resolved.absolute_path);
          setPhotoUrl(url);
          setError(false);
        } else {
          setPhotoUrl(null);
        }
      } catch (err) {
        console.error("Failed to load musician photo:", err);
        setPhotoUrl(null);
      }
    }

    loadPhoto();
  }, [photoFilename, musicianName, settings.musicianPhotosPath]);

  if (!photoUrl || error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-800 text-gray-500 rounded-full border border-gray-700 font-bold ${className}`}
        style={style}
      >
        {musicianName.split(' ').map(n => n[0]).join('')}
      </div>
    );
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- musician photos can come from local runtime-resolved asset URLs */}
      <img
        src={photoUrl}
        alt={musicianName}
        className={`object-cover rounded-full border-2 border-blue-500/50 shadow-lg ${className}`}
        style={style}
        onError={() => setError(true)}
      />
    </>
  );
}
