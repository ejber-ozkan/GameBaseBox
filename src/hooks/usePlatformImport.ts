import { useCallback, useRef, useState } from 'react';
import type { Settings } from '../contexts/SettingsContext';
import { cancelPlatformImport, importPlatformDatabaseFromMdb, type PlatformDatabaseImportResult } from '../lib/tauri-bridge';
import type { PlatformId, PlatformSettings } from '../types/platform';

export type PlatformImportJobState =
  | { status: 'idle'; error: null; result: string | null }
  | { status: 'running'; error: null; result: null; id: string; progress: { percent: number; stage: string } }
  | { status: 'failed'; error: string; result: null }
  | { status: 'cancelled'; error: null; result: string }
  | { status: 'completed'; error: null; result: string };

export function createPlatformImportJobId(platformId: PlatformId): string {
  const randomId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `platform-import:${platformId}:${randomId}`;
}

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
  const activeJobIdRef = useRef<string | null>(null);

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
    activeJobIdRef.current = null;
    setJob({ status: 'idle', error: null, result: null });
  }, []);

  const cancelImport = useCallback(async () => {
    if (!activeJobIdRef.current || job.status !== 'running') {
      return;
    }

    const jobId = activeJobIdRef.current;
    setJob({ status: 'running', error: null, result: null, id: jobId, progress: { percent: job.progress.percent, stage: 'Cancelling import safely…' } });
    try {
      await cancelPlatformImport(jobId);
    } catch (error) {
      setJob({ status: 'failed', error: typeof error === 'string' ? error : (error instanceof Error ? error.message : 'Unable to cancel platform import.'), result: null });
    }
  }, [job]);

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

    const jobId = createPlatformImportJobId(platformId);
    const startedAt = new Date().toISOString();
    activeJobIdRef.current = jobId;
    const nextRunning = {
      ...platformSettings,
      [platformId]: {
        ...current,
        library: {
          ...current.library,
          importStatus: 'importing' as const,
          lastImportError: null,
          lastImportJob: { id: jobId, status: 'running' as const, stage: 'Exporting MDB tables', percent: 15, startedAt, finishedAt: null },
        },
      },
    };
    updatePlatformSettings(nextRunning);
    setJob({ status: 'running', error: null, result: null, id: jobId, progress: { percent: 15, stage: 'Exporting MDB tables' } });
    try {
      setJob({ status: 'running', error: null, result: null, id: jobId, progress: { percent: 55, stage: 'Importing database tables' } });
      const result = await importPlatformDatabaseFromMdb({
        platformId,
        jobId,
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
      next[platformId].library.lastImportJob = { id: jobId, status: 'completed', stage: 'Import complete', percent: 100, startedAt, finishedAt: new Date().toISOString() };
      updateSettings({ activePlatformId: platformId, lastUsedPlatformId: platformId, platformSettings: next });
      setPlatformSettings?.(next);
      setJob({
        status: 'completed',
        error: null,
        result: `Imported ${platformName} and prepared ${result.importedTables} tables at ${result.dbPath}.`,
      });
      return result;
    } catch (error) {
      const message = typeof error === 'string' ? error : (error instanceof Error ? error.message : 'Platform import failed.');
      const cancelled = message === 'Platform import cancelled.';
      const next = {
        ...platformSettings,
        [platformId]: {
          ...platformSettings[platformId],
          library: {
            ...platformSettings[platformId].library,
            importStatus: cancelled ? current.library.importStatus : 'failed',
            lastImportError: cancelled ? null : message,
            lastImportJob: {
              id: jobId,
              status: cancelled ? 'cancelled' : 'failed',
              stage: cancelled ? 'Cancelled before database merge' : 'Import failed',
              percent: cancelled ? 0 : 55,
              startedAt,
              finishedAt: new Date().toISOString(),
            },
          },
        },
      };
      updatePlatformSettings(next);
      setJob(cancelled
        ? { status: 'cancelled', error: null, result: 'Import cancelled before the database merge.' }
        : { status: 'failed', error: message, result: null });
      return null;
    } finally {
      activeJobIdRef.current = null;
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

  return { cancelImport, importPlatform, job, reset, setFolder, setMdbPath };
}
