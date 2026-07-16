"use client";

import { useEffect, useMemo, useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import {
  type DetailLayoutSpec,
  buildDetailLayoutSpec,
} from '../lib/detail-layout';

export type ResolvedFullscreenDensity = 'compact' | 'standard' | 'comfortable';

type ViewportSnapshot = {
  dpr: number;
  height: number;
  physicalHeight: number;
  physicalWidth: number;
  width: number;
};

export interface FullscreenLayoutMetrics {
  densityMode: ResolvedFullscreenDensity;
  densityBoost: number;
  viewportWidth: number;
  viewportHeight: number;
  shellWidth: number;
  contentPaddingX: number;
  contentGap: number;
  headerPaddingX: number;
  headerPaddingY: number;
  headerTitleSize: number;
  headerEyebrowSize: number;
  searchWidth: number;
  headerControlSize: number;
  clockSize: number;
  chipFontSize: number;
  chipPaddingX: number;
  chipPaddingY: number;
  jumpButtonSize: number;
  maxVisibleSubGenres: number;
  gridColumns: number;
  gridGap: number;
  railPaddingX: number;
  railSectionGap: number;
  railTitleSize: number;
  tileBorderRadius: number;
  tileFocusScale: number;
  tileMetaPadding: number;
  horizontalRailPaddingX: number;
  horizontalRailGap: number;
  horizontalTileWidth: number;
  horizontalLargeTileWidth: number;
  detailShellWidth: number;
  detailSectionGap: number;
  detailPanelPadding: number;
  detailHeroPaddingX: number;
  detailHeroPaddingY: number;
  detailTitleSize: number;
  detailMetaSize: number;
  detailSidebarWidth: number;
  detailStageMaxWidth: number;
  detailStageMinHeight: number;
  detailStageMaxHeight: number;
  detailUseStackedColumns: boolean;
  detailSecondaryCardMinWidth: number;
  detailTopBarPaddingX: number;
  detailTopBarPaddingY: number;
  detailContentScale: number;
  detailResolutionTier: DetailLayoutSpec['tier'];
  detailResolutionLabel: string;
  detailDebugLabel: string;
  detailLayoutSpec: DetailLayoutSpec;
}

const DEFAULT_VIEWPORT: ViewportSnapshot = {
  dpr: 1,
  height: 900,
  physicalHeight: 900,
  physicalWidth: 1440,
  width: 1440,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number) {
  return Math.round(value);
}

function getViewportSnapshot(): ViewportSnapshot {
  if (typeof window === 'undefined') {
    return DEFAULT_VIEWPORT;
  }

  return {
    dpr: window.devicePixelRatio || 1,
    height: window.innerHeight || DEFAULT_VIEWPORT.height,
    physicalHeight: Math.round((window.screen.height || window.innerHeight || DEFAULT_VIEWPORT.height) * (window.devicePixelRatio || 1)),
    physicalWidth: Math.round((window.screen.width || window.innerWidth || DEFAULT_VIEWPORT.width) * (window.devicePixelRatio || 1)),
    width: window.innerWidth || DEFAULT_VIEWPORT.width,
  };
}

function resolveDensityMode(
  preferredMode: 'auto' | 'compact' | 'standard' | 'comfortable',
  viewport: ViewportSnapshot,
): ResolvedFullscreenDensity {
  if (preferredMode !== 'auto') {
    return preferredMode;
  }

  const physicalWidth = viewport.physicalWidth;
  const physicalHeight = viewport.physicalHeight;

  if (physicalWidth >= 3600 || physicalHeight >= 2000) {
    return 'compact';
  }

  if (physicalWidth >= 3000 || physicalHeight >= 1700) {
    return 'standard';
  }

  return 'comfortable';
}

export function buildFullscreenLayoutMetrics(
  preferredMode: 'auto' | 'compact' | 'standard' | 'comfortable',
  viewport: ViewportSnapshot,
): FullscreenLayoutMetrics {
  const densityMode = resolveDensityMode(preferredMode, viewport);
  const densityBoost = densityMode === 'compact' ? 1.24 : densityMode === 'standard' ? 1.1 : 1;
  const detailLayoutSpec = buildDetailLayoutSpec(viewport);
  const contentPaddingX = round(clamp(viewport.width * 0.018, 18, 34));
  const contentGap = densityMode === 'compact' ? 16 : densityMode === 'standard' ? 20 : 24;

  const shellCap = densityMode === 'compact' ? 1880 : densityMode === 'standard' ? 1720 : 1640;
  const shellWidth = round(clamp(viewport.width - contentPaddingX * 2, 760, shellCap));

  const gridGap = densityMode === 'compact' ? 16 : densityMode === 'standard' ? 18 : 22;
  const minTileWidth = densityMode === 'compact' ? 180 : densityMode === 'standard' ? 210 : 250;
  const gridColumns = clamp(
    Math.floor((shellWidth + gridGap) / (minTileWidth + gridGap)),
    3,
    7,
  );

  return {
    densityMode,
    densityBoost,
    viewportWidth: viewport.width,
    viewportHeight: viewport.height,
    shellWidth,
    contentPaddingX,
    contentGap,
    headerPaddingX: densityMode === 'compact' ? 18 : densityMode === 'standard' ? 20 : 22,
    headerPaddingY: densityMode === 'compact' ? 14 : densityMode === 'standard' ? 16 : 18,
    headerTitleSize: densityMode === 'compact' ? 34 : densityMode === 'standard' ? 36 : 40,
    headerEyebrowSize: densityMode === 'compact' ? 11 : densityMode === 'standard' ? 11 : 12,
    searchWidth: round(clamp(shellWidth * 0.32, 240, densityMode === 'compact' ? 380 : densityMode === 'standard' ? 420 : 480)),
    headerControlSize: densityMode === 'compact' ? 40 : densityMode === 'standard' ? 42 : 44,
    clockSize: densityMode === 'compact' ? 18 : densityMode === 'standard' ? 18 : 20,
    chipFontSize: densityMode === 'compact' ? 10.5 : densityMode === 'standard' ? 11.25 : 12,
    chipPaddingX: densityMode === 'compact' ? 10 : densityMode === 'standard' ? 12 : 14,
    chipPaddingY: densityMode === 'compact' ? 5 : densityMode === 'standard' ? 6 : 7,
    jumpButtonSize: densityMode === 'compact' ? 30 : densityMode === 'standard' ? 30 : 32,
    maxVisibleSubGenres: densityMode === 'compact' ? 10 : densityMode === 'standard' ? 9 : 8,
    gridColumns,
    gridGap,
    railPaddingX: densityMode === 'compact' ? 18 : densityMode === 'standard' ? 24 : 28,
    railSectionGap: densityMode === 'compact' ? 10 : densityMode === 'standard' ? 14 : 18,
    railTitleSize: densityMode === 'compact' ? 20 : densityMode === 'standard' ? 24 : 30,
    tileBorderRadius: densityMode === 'compact' ? 24 : 22,
    tileFocusScale: densityMode === 'compact' ? 1.08 : densityMode === 'standard' ? 1.1 : 1.12,
    tileMetaPadding: densityMode === 'compact' ? 10 : densityMode === 'standard' ? 12 : 14,
    horizontalRailPaddingX: densityMode === 'compact' ? 20 : densityMode === 'standard' ? 24 : 28,
    horizontalRailGap: densityMode === 'compact' ? 10 : densityMode === 'standard' ? 14 : 18,
    horizontalTileWidth: densityMode === 'compact' ? 208 : densityMode === 'standard' ? 238 : 268,
    horizontalLargeTileWidth: densityMode === 'compact' ? 284 : densityMode === 'standard' ? 340 : 380,
    detailShellWidth: detailLayoutSpec.shellMaxWidth,
    detailSectionGap: detailLayoutSpec.panelGap,
    detailPanelPadding: detailLayoutSpec.panelPadding,
    detailHeroPaddingX: detailLayoutSpec.panelPadding,
    detailHeroPaddingY: detailLayoutSpec.panelPadding,
    detailTitleSize: detailLayoutSpec.titleSize,
    detailMetaSize: detailLayoutSpec.subtitleSize,
    detailSidebarWidth: detailLayoutSpec.sidebarWidth,
    detailStageMaxWidth: Math.max(
      detailLayoutSpec.shellMaxWidth - detailLayoutSpec.sidebarWidth - detailLayoutSpec.panelGap,
      520,
    ),
    detailStageMinHeight: Math.max(detailLayoutSpec.mediaRowHeight - detailLayoutSpec.panelPadding * 2, 160),
    detailStageMaxHeight: Math.max(detailLayoutSpec.mediaRowHeight - detailLayoutSpec.panelPadding * 2, 180),
    detailUseStackedColumns: detailLayoutSpec.useStackedColumns,
    detailSecondaryCardMinWidth: detailLayoutSpec.boxArtWidth,
    detailTopBarPaddingX: detailLayoutSpec.topBarPaddingX,
    detailTopBarPaddingY: detailLayoutSpec.topBarPaddingY,
    detailContentScale: 1,
    detailResolutionTier: detailLayoutSpec.tier,
    detailResolutionLabel: detailLayoutSpec.tierLabel,
    detailDebugLabel: detailLayoutSpec.debugLabel,
    detailLayoutSpec,
  };
}

export function useFullscreenLayoutMetrics() {
  const { settings } = useSettings();
  const [viewport, setViewport] = useState<ViewportSnapshot>(() => getViewportSnapshot());

  useEffect(() => {
    const updateViewport = () => {
      const next = getViewportSnapshot();
      setViewport((current) => {
        if (
          current.width === next.width &&
          current.height === next.height &&
          current.dpr === next.dpr &&
          current.physicalWidth === next.physicalWidth &&
          current.physicalHeight === next.physicalHeight
        ) {
          return current;
        }
        return next;
      });
    };

    updateViewport();
    window.addEventListener('resize', updateViewport, { passive: true });
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  return useMemo(
    () => buildFullscreenLayoutMetrics(settings.fullscreenDensity, viewport),
    [settings.fullscreenDensity, viewport],
  );
}
