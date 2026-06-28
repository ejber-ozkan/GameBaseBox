export interface NeonArchiveDetailStyle {
  id: string;
  accent: string;
  accentStrong: string;
  accentSoft: string;
  border: string;
  panel: string;
  panelRaised: string;
  panelMuted: string;
  mutedText: string;
  titleText: string;
}

export const NEON_ARCHIVE_DETAIL_STYLES: Record<string, NeonArchiveDetailStyle> = {
  cyan: {
    id: 'cyan',
    accent: '#81ecff',
    accentStrong: '#00e3fd',
    accentSoft: 'rgba(129, 236, 255, 0.16)',
    border: 'rgba(129, 236, 255, 0.18)',
    panel: 'rgba(14, 20, 30, 0.72)',
    panelRaised: 'rgba(20, 28, 40, 0.84)',
    panelMuted: 'rgba(11, 16, 24, 0.88)',
    mutedText: 'rgba(209, 221, 240, 0.7)',
    titleText: '#f4f9ff',
  },
};

export function getNeonArchiveDetailStyle(styleId = 'cyan') {
  return NEON_ARCHIVE_DETAIL_STYLES[styleId] ?? NEON_ARCHIVE_DETAIL_STYLES.cyan;
}
