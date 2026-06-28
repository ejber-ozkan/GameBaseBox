export type DetailResolutionTier =
  | 'hd720'
  | 'hdPlus900'
  | 'fhd1080'
  | 'wqhd1440'
  | 'qhdPlus1800'
  | 'uhd2160';

export interface DetailViewportSnapshot {
  dpr: number;
  height: number;
  physicalHeight: number;
  physicalWidth: number;
  width: number;
}

export interface DetailLayoutSpec {
  tier: DetailResolutionTier;
  tierLabel: string;
  debugLabel: string;
  nativeWidth: number;
  nativeHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  designWidth: number;
  designHeight: number;
  displayScale: number;
  renderScale: number;
  surfaceWidth: number;
  surfaceHeight: number;
  useStackedColumns: boolean;
  shellMaxWidth: number;
  shellPaddingX: number;
  shellPaddingY: number;
  panelGap: number;
  topBarHeight: number;
  topBarPaddingX: number;
  topBarPaddingY: number;
  heroHeight: number;
  heroActionWidth: number;
  mediaRowHeight: number;
  lowerRowHeight: number;
  sidebarWidth: number;
  boxArtWidth: number;
  alternativesWidth: number;
  sidebarRowHeights: [number, number, number, number];
  panelPadding: number;
  panelInnerGap: number;
  titleSize: number;
  chipFontSize: number;
  chipPaddingX: number;
  chipPaddingY: number;
  subtitleSize: number;
  notesFontSize: number;
  notesLineClamp: number;
  infoLabelFontSize: number;
  infoValueFontSize: number;
  infoRowGap: number;
  infoRowPaddingY: number;
  statusColumns: 1 | 2;
  statusFontSize: number;
  musicianAvatarSize: number;
  soundtrackCompact: boolean;
  sidCompact: boolean;
  personnelAvatarSize: number;
  personnelGlyphFontSize: number;
  personnelLabelFontSize: number;
  personnelValueFontSize: number;
  alternativeIconButtonSize: number;
  alternativeIconGlyphSize: number;
  alternativeHintFontSize: number;
  alternativeColumns: number;
  screenshotAspectRatio: number;
  screenshotViewportPadding: number;
  boxArtAspectRatio: number;
  boxArtViewportPadding: number;
  extrasPreviewHeight: number;
  extrasThumbColumns: number;
  extrasDocSlots: number;
  extrasMediaSlots: number;
}

interface TrackDefinition {
  min: number;
  max: number;
  weight: number;
}

interface DetailTierDefinition {
  label: string;
  minPhysicalHeight: number;
  minPhysicalWidth: number;
  shellMaxWidth: number;
  shellPaddingX: number;
  shellPaddingY: number;
  panelGap: number;
  topBarHeight: number;
  topBarPaddingX: number;
  topBarPaddingY: number;
  hero: TrackDefinition;
  heroActionWidth: number;
  sidebarWidth: number;
  boxArtWidth: number;
  alternativesWidth: number;
  panelPadding: number;
  panelInnerGap: number;
  titleSize: number;
  chipFontSize: number;
  chipPaddingX: number;
  chipPaddingY: number;
  subtitleSize: number;
  notesFontSize: number;
  notesLineClamp: number;
  infoLabelFontSize: number;
  infoValueFontSize: number;
  infoRowGap: number;
  infoRowPaddingY: number;
  statusColumns: 1 | 2;
  statusFontSize: number;
  musicianAvatarSize: number;
  soundtrackCompact: boolean;
  sidCompact: boolean;
  personnelAvatarSize: number;
  personnelGlyphFontSize: number;
  personnelLabelFontSize: number;
  personnelValueFontSize: number;
  alternativeIconButtonSize: number;
  alternativeIconGlyphSize: number;
  alternativeHintFontSize: number;
  alternativeColumns: number;
  screenshotViewportPadding: number;
  boxArtViewportPadding: number;
  extrasPreviewHeight: TrackDefinition;
  extrasThumbColumns: number;
  extrasDocSlots: number;
  extrasMediaSlots: number;
  mainRows: [TrackDefinition, TrackDefinition];
  sidebarRows: [TrackDefinition, TrackDefinition, TrackDefinition, TrackDefinition];
}

interface DetailDesignViewport {
  designHeight: number;
  designWidth: number;
  displayScale: number;
}

const TIER_ORDER: DetailResolutionTier[] = [
  'uhd2160',
  'qhdPlus1800',
  'wqhd1440',
  'fhd1080',
  'hdPlus900',
  'hd720',
];

const TIER_DEFINITIONS: Record<DetailResolutionTier, DetailTierDefinition> = {
  hd720: {
    label: 'HD',
    minPhysicalWidth: 1280,
    minPhysicalHeight: 720,
    shellMaxWidth: 1160,
    shellPaddingX: 14,
    shellPaddingY: 10,
    panelGap: 10,
    topBarHeight: 74,
    topBarPaddingX: 14,
    topBarPaddingY: 8,
    hero: { min: 132, max: 150, weight: 0.2 },
    heroActionWidth: 292,
    sidebarWidth: 292,
    boxArtWidth: 285,
    alternativesWidth: 348,
    panelPadding: 10,
    panelInnerGap: 10,
    titleSize: 28,
    chipFontSize: 9.5,
    chipPaddingX: 10,
    chipPaddingY: 4,
    subtitleSize: 14,
    notesFontSize: 13,
    notesLineClamp: 4,
    infoLabelFontSize: 9,
    infoValueFontSize: 12,
    infoRowGap: 10,
    infoRowPaddingY: 4,
    statusColumns: 2,
    statusFontSize: 10,
    musicianAvatarSize: 34,
    soundtrackCompact: true,
    sidCompact: true,
    personnelAvatarSize: 32,
    personnelGlyphFontSize: 9,
    personnelLabelFontSize: 9,
    personnelValueFontSize: 11,
    alternativeIconButtonSize: 40,
    alternativeIconGlyphSize: 24,
    alternativeHintFontSize: 11,
    alternativeColumns: 4,
    screenshotViewportPadding: 10,
    boxArtViewportPadding: 10,
    extrasPreviewHeight: { min: 192, max: 224, weight: 0.58 },
    extrasThumbColumns: 4,
    extrasDocSlots: 2,
    extrasMediaSlots: 2,
    mainRows: [
      { min: 196, max: 228, weight: 0.56 },
      { min: 160, max: 196, weight: 0.44 },
    ],
    sidebarRows: [
      { min: 132, max: 156, weight: 0.25 },
      { min: 118, max: 142, weight: 0.22 },
      { min: 140, max: 166, weight: 0.26 },
      { min: 150, max: 186, weight: 0.27 },
    ],
  },
  hdPlus900: {
    label: 'HD+',
    minPhysicalWidth: 1600,
    minPhysicalHeight: 900,
    shellMaxWidth: 1400,
    shellPaddingX: 16,
    shellPaddingY: 12,
    panelGap: 12,
    topBarHeight: 76,
    topBarPaddingX: 16,
    topBarPaddingY: 8,
    hero: { min: 146, max: 164, weight: 0.2 },
    heroActionWidth: 304,
    sidebarWidth: 304,
    boxArtWidth: 300,
    alternativesWidth: 356,
    panelPadding: 12,
    panelInnerGap: 12,
    titleSize: 31,
    chipFontSize: 9.75,
    chipPaddingX: 10,
    chipPaddingY: 4,
    subtitleSize: 15,
    notesFontSize: 13,
    notesLineClamp: 4,
    infoLabelFontSize: 9,
    infoValueFontSize: 12,
    infoRowGap: 10,
    infoRowPaddingY: 4,
    statusColumns: 2,
    statusFontSize: 10,
    musicianAvatarSize: 36,
    soundtrackCompact: true,
    sidCompact: true,
    personnelAvatarSize: 34,
    personnelGlyphFontSize: 9,
    personnelLabelFontSize: 9,
    personnelValueFontSize: 11,
    alternativeIconButtonSize: 42,
    alternativeIconGlyphSize: 25,
    alternativeHintFontSize: 11,
    alternativeColumns: 4,
    screenshotViewportPadding: 10,
    boxArtViewportPadding: 10,
    extrasPreviewHeight: { min: 220, max: 250, weight: 0.58 },
    extrasThumbColumns: 4,
    extrasDocSlots: 2,
    extrasMediaSlots: 2,
    mainRows: [
      { min: 226, max: 272, weight: 0.57 },
      { min: 176, max: 220, weight: 0.43 },
    ],
    sidebarRows: [
      { min: 144, max: 176, weight: 0.24 },
      { min: 124, max: 150, weight: 0.2 },
      { min: 166, max: 210, weight: 0.28 },
      { min: 168, max: 212, weight: 0.28 },
    ],
  },
  fhd1080: {
    label: 'FHD',
    minPhysicalWidth: 1920,
    minPhysicalHeight: 1080,
    shellMaxWidth: 1680,
    shellPaddingX: 18,
    shellPaddingY: 14,
    panelGap: 12,
    topBarHeight: 78,
    topBarPaddingX: 16,
    topBarPaddingY: 8,
    hero: { min: 156, max: 176, weight: 0.2 },
    heroActionWidth: 320,
    sidebarWidth: 316,
    boxArtWidth: 320,
    alternativesWidth: 376,
    panelPadding: 12,
    panelInnerGap: 12,
    titleSize: 34,
    chipFontSize: 10,
    chipPaddingX: 10,
    chipPaddingY: 4,
    subtitleSize: 16,
    notesFontSize: 13,
    notesLineClamp: 4,
    infoLabelFontSize: 9,
    infoValueFontSize: 12,
    infoRowGap: 12,
    infoRowPaddingY: 4,
    statusColumns: 2,
    statusFontSize: 10,
    musicianAvatarSize: 40,
    soundtrackCompact: true,
    sidCompact: true,
    personnelAvatarSize: 36,
    personnelGlyphFontSize: 10,
    personnelLabelFontSize: 9,
    personnelValueFontSize: 11,
    alternativeIconButtonSize: 44,
    alternativeIconGlyphSize: 26,
    alternativeHintFontSize: 12,
    alternativeColumns: 4,
    screenshotViewportPadding: 12,
    boxArtViewportPadding: 12,
    extrasPreviewHeight: { min: 240, max: 280, weight: 0.58 },
    extrasThumbColumns: 4,
    extrasDocSlots: 2,
    extrasMediaSlots: 2,
    mainRows: [
      { min: 252, max: 312, weight: 0.57 },
      { min: 190, max: 240, weight: 0.43 },
    ],
    sidebarRows: [
      { min: 152, max: 188, weight: 0.23 },
      { min: 132, max: 164, weight: 0.18 },
      { min: 188, max: 236, weight: 0.31 },
      { min: 184, max: 232, weight: 0.28 },
    ],
  },
  wqhd1440: {
    label: 'WQHD',
    minPhysicalWidth: 2560,
    minPhysicalHeight: 1440,
    shellMaxWidth: 2000,
    shellPaddingX: 20,
    shellPaddingY: 16,
    panelGap: 14,
    topBarHeight: 80,
    topBarPaddingX: 18,
    topBarPaddingY: 9,
    hero: { min: 172, max: 208, weight: 0.2 },
    heroActionWidth: 360,
    sidebarWidth: 360,
    boxArtWidth: 358,
    alternativesWidth: 440,
    panelPadding: 14,
    panelInnerGap: 14,
    titleSize: 38,
    chipFontSize: 10.5,
    chipPaddingX: 11,
    chipPaddingY: 5,
    subtitleSize: 17,
    notesFontSize: 14,
    notesLineClamp: 5,
    infoLabelFontSize: 10,
    infoValueFontSize: 13,
    infoRowGap: 12,
    infoRowPaddingY: 5,
    statusColumns: 2,
    statusFontSize: 11,
    musicianAvatarSize: 44,
    soundtrackCompact: true,
    sidCompact: true,
    personnelAvatarSize: 38,
    personnelGlyphFontSize: 10,
    personnelLabelFontSize: 9,
    personnelValueFontSize: 12,
    alternativeIconButtonSize: 46,
    alternativeIconGlyphSize: 28,
    alternativeHintFontSize: 12,
    alternativeColumns: 4,
    screenshotViewportPadding: 10,
    boxArtViewportPadding: 10,
    extrasPreviewHeight: { min: 260, max: 340, weight: 0.58 },
    extrasThumbColumns: 5,
    extrasDocSlots: 2,
    extrasMediaSlots: 2,
    mainRows: [
      { min: 320, max: 470, weight: 0.74 },
      { min: 190, max: 260, weight: 0.26 },
    ],
    sidebarRows: [
      { min: 164, max: 220, weight: 0.22 },
      { min: 140, max: 182, weight: 0.17 },
      { min: 208, max: 290, weight: 0.31 },
      { min: 206, max: 270, weight: 0.3 },
    ],
  },
  qhdPlus1800: {
    label: 'QHD+',
    minPhysicalWidth: 3200,
    minPhysicalHeight: 1800,
    shellMaxWidth: 2300,
    shellPaddingX: 22,
    shellPaddingY: 18,
    panelGap: 16,
    topBarHeight: 84,
    topBarPaddingX: 18,
    topBarPaddingY: 9,
    hero: { min: 186, max: 252, weight: 0.2 },
    heroActionWidth: 390,
    sidebarWidth: 390,
    boxArtWidth: 390,
    alternativesWidth: 500,
    panelPadding: 16,
    panelInnerGap: 16,
    titleSize: 44,
    chipFontSize: 10.5,
    chipPaddingX: 11,
    chipPaddingY: 5,
    subtitleSize: 18,
    notesFontSize: 14,
    notesLineClamp: 6,
    infoLabelFontSize: 10,
    infoValueFontSize: 13,
    infoRowGap: 12,
    infoRowPaddingY: 5,
    statusColumns: 2,
    statusFontSize: 11,
    musicianAvatarSize: 44,
    soundtrackCompact: true,
    sidCompact: true,
    personnelAvatarSize: 38,
    personnelGlyphFontSize: 10,
    personnelLabelFontSize: 9,
    personnelValueFontSize: 12,
    alternativeIconButtonSize: 50,
    alternativeIconGlyphSize: 30,
    alternativeHintFontSize: 12,
    alternativeColumns: 4,
    screenshotViewportPadding: 12,
    boxArtViewportPadding: 12,
    extrasPreviewHeight: { min: 320, max: 420, weight: 0.58 },
    extrasThumbColumns: 5,
    extrasDocSlots: 2,
    extrasMediaSlots: 2,
    mainRows: [
      { min: 360, max: 620, weight: 0.76 },
      { min: 200, max: 320, weight: 0.24 },
    ],
    sidebarRows: [
      { min: 176, max: 240, weight: 0.21 },
      { min: 148, max: 204, weight: 0.17 },
      { min: 226, max: 340, weight: 0.31 },
      { min: 220, max: 304, weight: 0.31 },
    ],
  },
  uhd2160: {
    label: 'UHD 4K',
    minPhysicalWidth: 3840,
    minPhysicalHeight: 2160,
    shellMaxWidth: 2600,
    shellPaddingX: 24,
    shellPaddingY: 18,
    panelGap: 18,
    topBarHeight: 86,
    topBarPaddingX: 18,
    topBarPaddingY: 9,
    hero: { min: 196, max: 320, weight: 0.2 },
    heroActionWidth: 420,
    sidebarWidth: 430,
    boxArtWidth: 423,
    alternativesWidth: 540,
    panelPadding: 18,
    panelInnerGap: 18,
    titleSize: 48,
    chipFontSize: 10.5,
    chipPaddingX: 11,
    chipPaddingY: 5,
    subtitleSize: 19,
    notesFontSize: 15,
    notesLineClamp: 6,
    infoLabelFontSize: 11,
    infoValueFontSize: 14,
    infoRowGap: 14,
    infoRowPaddingY: 5,
    statusColumns: 2,
    statusFontSize: 11,
    musicianAvatarSize: 48,
    soundtrackCompact: true,
    sidCompact: true,
    personnelAvatarSize: 42,
    personnelGlyphFontSize: 10,
    personnelLabelFontSize: 10,
    personnelValueFontSize: 12,
    alternativeIconButtonSize: 52,
    alternativeIconGlyphSize: 31,
    alternativeHintFontSize: 13,
    alternativeColumns: 4,
    screenshotViewportPadding: 12,
    boxArtViewportPadding: 12,
    extrasPreviewHeight: { min: 360, max: 520, weight: 0.58 },
    extrasThumbColumns: 5,
    extrasDocSlots: 2,
    extrasMediaSlots: 2,
    mainRows: [
      { min: 450, max: 840, weight: 0.78 },
      { min: 200, max: 320, weight: 0.22 },
    ],
    sidebarRows: [
      { min: 184, max: 260, weight: 0.21 },
      { min: 156, max: 220, weight: 0.17 },
      { min: 250, max: 420, weight: 0.31 },
      { min: 240, max: 360, weight: 0.31 },
    ],
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number) {
  return Math.round(value);
}

function resolveDetailDesignViewport(viewport: DetailViewportSnapshot): DetailDesignViewport {
  const compression = Math.max(
    viewport.physicalWidth / Math.max(viewport.width, 1),
    viewport.physicalHeight / Math.max(viewport.height, 1),
    viewport.dpr,
  );

  const displayScale = compression >= 2.5 ? 2 : compression >= 1.75 ? 1.5 : 1;

  return {
    designWidth: round(viewport.width * displayScale),
    designHeight: round(viewport.height * displayScale),
    displayScale,
  };
}

function allocateTracks(totalSpace: number, definitions: readonly TrackDefinition[]) {
  const safeTotal = Math.max(totalSpace, 0);
  const totalWeight = definitions.reduce((sum, definition) => sum + definition.weight, 0);
  const totalMax = definitions.reduce((sum, definition) => sum + definition.max, 0);

  if (safeTotal >= totalMax) {
    return definitions.map((definition) => {
      const target = safeTotal * (definition.weight / totalWeight);
      return round(Math.max(definition.min, target));
    });
  }

  const raw = definitions.map((definition) => {
    const target = safeTotal * (definition.weight / totalWeight);
    return clamp(target, definition.min, definition.max);
  });
  const rounded = raw.map((value) => round(value));
  const difference = safeTotal - rounded.reduce((sum, value) => sum + value, 0);

  if (difference !== 0) {
    const step = difference > 0 ? 1 : -1;
    let remaining = Math.abs(difference);
    let index = 0;
    while (remaining > 0 && definitions.length > 0) {
      const slot = index % definitions.length;
      const nextValue = rounded[slot] + step;
      const canGrow = step > 0 && nextValue <= definitions[slot].max;
      const canShrink = step < 0 && nextValue >= definitions[slot].min;
      if (canGrow || canShrink) {
        rounded[slot] = nextValue;
        remaining -= 1;
      }
      index += 1;
      if (index > definitions.length * 100) {
        break;
      }
    }
  }

  const finalDifference = safeTotal - rounded.reduce((sum, value) => sum + value, 0);
  if (finalDifference !== 0 && rounded.length > 0) {
    rounded[rounded.length - 1] += finalDifference;
  }

  return rounded;
}

export function resolveDetailResolutionTier(viewport: DetailViewportSnapshot): DetailResolutionTier {
  const designViewport = resolveDetailDesignViewport(viewport);
  for (const tier of TIER_ORDER) {
    const definition = TIER_DEFINITIONS[tier];
    if (
      designViewport.designWidth >= definition.minPhysicalWidth &&
      designViewport.designHeight >= definition.minPhysicalHeight
    ) {
      return tier;
    }
  }
  return 'hd720';
}

export function buildDetailLayoutSpec(viewport: DetailViewportSnapshot): DetailLayoutSpec {
  const designViewport = resolveDetailDesignViewport(viewport);
  const tier = resolveDetailResolutionTier(viewport);
  const definition = TIER_DEFINITIONS[tier];
  const useStackedColumns = viewport.width < 1100 && designViewport.designWidth < 1500;
  const shellMaxWidth = round(clamp(designViewport.designWidth - definition.shellPaddingX * 2, 960, definition.shellMaxWidth));
  const panelGap = definition.panelGap;
  const usableHeight = Math.max(
    designViewport.designHeight - definition.topBarHeight - definition.shellPaddingY * 2,
    360,
  );
  const heroHeight = round(clamp(usableHeight * definition.hero.weight, definition.hero.min, definition.hero.max));
  const bodyHeight = Math.max(usableHeight - heroHeight - panelGap, 280);
  const mainTrackSpace = Math.max(bodyHeight - panelGap, 120);
  const sidebarTrackSpace = Math.max(bodyHeight - panelGap * 3, 160);
  const [mediaRowHeight, lowerRowHeight] = allocateTracks(mainTrackSpace, definition.mainRows);
  const sidebarTrackValues = allocateTracks(sidebarTrackSpace, definition.sidebarRows) as [number, number, number, number];

  const nativeLabel = `${viewport.physicalWidth}x${viewport.physicalHeight}`;
  const viewportLabel = `${viewport.width}x${viewport.height}`;
  const designLabel = `${designViewport.designWidth}x${designViewport.designHeight}`;
  const debugParts = [nativeLabel];
  if (nativeLabel !== viewportLabel) {
    debugParts.push(`vp ${viewportLabel}`);
  }
  if (designLabel !== viewportLabel) {
    debugParts.push(`layout ${designLabel}`);
  }
  debugParts.push(definition.label);
  const debugLabel = debugParts.join(' • ');

  return {
    tier,
    tierLabel: definition.label,
    debugLabel,
    nativeWidth: viewport.physicalWidth,
    nativeHeight: viewport.physicalHeight,
    viewportWidth: viewport.width,
    viewportHeight: viewport.height,
    designWidth: designViewport.designWidth,
    designHeight: designViewport.designHeight,
    displayScale: designViewport.displayScale,
    renderScale: 1 / designViewport.displayScale,
    surfaceWidth: viewport.width,
    surfaceHeight: viewport.height,
    useStackedColumns,
    shellMaxWidth,
    shellPaddingX: definition.shellPaddingX,
    shellPaddingY: definition.shellPaddingY,
    panelGap,
    topBarHeight: definition.topBarHeight,
    topBarPaddingX: definition.topBarPaddingX,
    topBarPaddingY: definition.topBarPaddingY,
    heroHeight,
    heroActionWidth: definition.heroActionWidth,
    mediaRowHeight,
    lowerRowHeight,
    sidebarWidth: definition.sidebarWidth,
    boxArtWidth: definition.boxArtWidth,
    alternativesWidth: definition.alternativesWidth,
    sidebarRowHeights: sidebarTrackValues,
    panelPadding: definition.panelPadding,
    panelInnerGap: definition.panelInnerGap,
    titleSize: definition.titleSize,
    chipFontSize: definition.chipFontSize,
    chipPaddingX: definition.chipPaddingX,
    chipPaddingY: definition.chipPaddingY,
    subtitleSize: definition.subtitleSize,
    notesFontSize: definition.notesFontSize,
    notesLineClamp: definition.notesLineClamp,
    infoLabelFontSize: definition.infoLabelFontSize,
    infoValueFontSize: definition.infoValueFontSize,
    infoRowGap: definition.infoRowGap,
    infoRowPaddingY: definition.infoRowPaddingY,
    statusColumns: definition.statusColumns,
    statusFontSize: definition.statusFontSize,
    musicianAvatarSize: definition.musicianAvatarSize,
    soundtrackCompact: definition.soundtrackCompact,
    sidCompact: definition.sidCompact,
    personnelAvatarSize: definition.personnelAvatarSize,
    personnelGlyphFontSize: definition.personnelGlyphFontSize,
    personnelLabelFontSize: definition.personnelLabelFontSize,
    personnelValueFontSize: definition.personnelValueFontSize,
    alternativeIconButtonSize: definition.alternativeIconButtonSize,
    alternativeIconGlyphSize: definition.alternativeIconGlyphSize,
    alternativeHintFontSize: definition.alternativeHintFontSize,
    alternativeColumns: definition.alternativeColumns,
    screenshotAspectRatio: 4 / 3,
    screenshotViewportPadding: definition.screenshotViewportPadding,
    boxArtAspectRatio: 0.72,
    boxArtViewportPadding: definition.boxArtViewportPadding,
    extrasPreviewHeight: round(
      clamp(
        bodyHeight * definition.extrasPreviewHeight.weight,
        definition.extrasPreviewHeight.min,
        definition.extrasPreviewHeight.max,
      ),
    ),
    extrasThumbColumns: definition.extrasThumbColumns,
    extrasDocSlots: definition.extrasDocSlots,
    extrasMediaSlots: definition.extrasMediaSlots,
  };
}
