"use client";

import { createContext, useContext } from 'react';
import type { PlatformId } from '../types/platform';

/**
 * Lets the settings screen hand an imported platform back to the import page for a
 * fresh MDB import. Provided by the library shell; null where reimport isn't available
 * (first-run setup, tests).
 */
const PlatformReimportContext = createContext<((platformId: PlatformId) => void) | null>(null);

export const PlatformReimportProvider = PlatformReimportContext.Provider;

export function useRequestPlatformReimport() {
  return useContext(PlatformReimportContext);
}
