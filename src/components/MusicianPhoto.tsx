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
  const photosPath = settings.platformSettings[settings.activePlatformId].folders.photosPath;
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadPhoto() {
      if (!photosPath) {
        setPhotoUrl(null);
        return;
      }

      // If no photoFilename is in the DB, try to guess the filename based on the musician's name
      // e.g. "Mark Cooksey" -> "Mark_Cooksey.jpg"
      const nameBasedFilename = musicianName.replace(/\s+/g, '_') + '.jpg';
      const actualPhotoFilename = photoFilename || nameBasedFilename;

      try {
        const resolved = await resolveMediaPath(photosPath, actualPhotoFilename);
        if (resolved.exists) {
          const url = await getMediaUrl(resolved.absolute_path);
          setPhotoUrl(url);
          setError(false);
        } else {
          setPhotoUrl("/images/unknown-musician.png");
          setError(false);
        }
      } catch (err) {
        console.error("Failed to load musician photo:", err);
        setPhotoUrl("/images/unknown-musician.png");
        setError(false);
      }
    }

    loadPhoto();
  }, [photoFilename, musicianName, photosPath]);

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
      {/* eslint-disable-next-line @next/next/no-img-element -- musician photos can come from local runtime-resolved asset URLs or bundled public assets */}
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
