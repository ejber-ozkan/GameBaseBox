import { useCallback, useState } from 'react';
import type { Settings } from '../contexts/SettingsContext';
import { importPlatformDatabaseFromMdb, type PlatformDatabaseImportResult } from '../lib/tauri-bridge';
import type { PlatformId, PlatformSettings } from '../types/platform';

export type PlatformImportJobState =
  | { status: 'idle'; error: null; result: string | null }
  | { status: 'running'; error: null; result: null }
  | { status: 'failed'; error: string; result: null }
  | { status: 'completed'; error: null; result: string };

export function buildImportedPlatformSettings(
  platformSettings: Record<PlatformId, PlatformSettings>,
  platformId: PlatformId,
  result: PlatformDatabaseImportResult,
  importedAt: string,
): Record<PlatformId, PlatformSettings> {
  return (Object.keys(platformSettings) as PlatformId[]).reduce((next, candidatePlatformId) => {
    const current = platformSettings[candidatePlatformId];
    const imported = candidatePlatformId === platformId;
    next[candidatePlatformId] = {
      ...current,
      library: {
        ...current.library,
        active: imported,
        ...(imported
          ? {
              importStatus: 'imported',
              sqliteScope: result.platformId,
              lastImportedAt: importedAt,
              lastImportError: null,
              gameCount: result.gameCount,
            }
          : {}),
      },
    };
    return next;
  }, {} as Record<PlatformId, PlatformSettings>);
}

export function getMissingRequiredFolderKey(
  platformSettings: PlatformSettings,
  requiredFolderKeys: (keyof PlatformSettings['folders'])[],
): keyof PlatformSettings['folders'] | undefined {
  return requiredFolderKeys.find((folderKey) => !platformSettings.folders[folderKey]?.trim());
}

export function usePlatformImport({
  platformName,
  platformId,
  platformSettings,
  requiredFolderKeys = [],
  updateSettings,
  setPlatformSettings,
}: {
  platformName: string;
  platformId: PlatformId;
  platformSettings: Record<PlatformId, PlatformSettings>;
  requiredFolderKeys?: (keyof PlatformSettings['folders'])[];
  updateSettings: (settings: Partial<Settings>) => void;
  setPlatformSettings?: (settings: Record<PlatformId, PlatformSettings>) => void;
}) {
  const [job, setJob] = useState<PlatformImportJobState>({ status: 'idle', error: null, result: null });

  const updatePlatformSettings = useCallback((next: Record<PlatformId, PlatformSettings>) => {
    setPlatformSettings?.(next);
    updateSettings({ platformSettings: next });
  }, [setPlatformSettings, updateSettings]);

  const setMdbPath = useCallback((mdbPath: string) => {
    const next = {
      ...platformSettings,
      [platformId]: {
        ...platformSettings[platformId],
        library: { ...platformSettings[platformId].library, sourceMdbPath: mdbPath },
      },
    };
    setJob({ status: 'idle', error: null, result: `Selected MDB for ${platformName}.` });
    updatePlatformSettings(next);
  }, [platformId, platformName, platformSettings, updatePlatformSettings]);

  const setFolder = useCallback((folderKey: keyof PlatformSettings['folders'], value: string) => {
    const next = {
      ...platformSettings,
      [platformId]: {
        ...platformSettings[platformId],
        folders: { ...platformSettings[platformId].folders, [folderKey]: value },
      },
    };
    updatePlatformSettings(next);
  }, [platformId, platformSettings, updatePlatformSettings]);

  const reset = useCallback(() => {
    setJob({ status: 'idle', error: null, result: null });
  }, []);

  const importPlatform = useCallback(async () => {
    const current = platformSettings[platformId];
    if (!current.library.sourceMdbPath) {
      setJob({ status: 'failed', error: `Select the ${platformName} MDB file first.`, result: null });
      return null;
    }

    const missingFolder = getMissingRequiredFolderKey(current, requiredFolderKeys);
    if (missingFolder) {
      setJob({
        status: 'failed',
        error: `Select the ${String(missingFolder).replace('Path', '')} folder first.`,
        result: null,
      });
      return null;
    }

    setJob({ status: 'running', error: null, result: null });
    try {
      const result = await importPlatformDatabaseFromMdb({
        platformId,
        mdbPath: current.library.sourceMdbPath,
        folderSettings: {
          gamesPath: current.folders.gamesPath,
          musicPath: current.folders.musicPath,
          photosPath: current.folders.photosPath,
          screenshotsPath: current.folders.screenshotsPath,
          extrasPath: current.folders.extrasPath,
        },
      });
      const next = buildImportedPlatformSettings(platformSettings, platformId, result, new Date().toISOString());
      updateSettings({ activePlatformId: platformId, lastUsedPlatformId: platformId, platformSettings: next });
      setPlatformSettings?.(next);
      setJob({
        status: 'completed',
        error: null,
        result: `Imported ${platformName} and prepared ${result.importedTables} tables at ${result.dbPath}.`,
      });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Platform import failed.';
      const next = {
        ...platformSettings,
        [platformId]: {
          ...platformSettings[platformId],
          library: { ...platformSettings[platformId].library, importStatus: 'failed', lastImportError: message },
        },
      };
      updatePlatformSettings(next);
      setJob({ status: 'failed', error: message, result: null });
      return null;
    }
  }, [
    platformId,
    platformName,
    platformSettings,
    requiredFolderKeys,
    setPlatformSettings,
    updatePlatformSettings,
    updateSettings,
  ]);

  return { importPlatform, job, reset, setFolder, setMdbPath };
}
