import { describe, expect, it } from 'vitest';
import { buildFullscreenLayoutMetrics } from './useFullscreenLayoutMetrics';

function viewport(width: number, height: number) {
  return {
    dpr: 1,
    height,
    physicalHeight: height,
    physicalWidth: width,
    width,
  };
}

describe('fullscreen layout metrics', () => {
  it.each([
    ['720p', viewport(1280, 720), 'hd720', 'comfortable'],
    ['1080p', viewport(1920, 1080), 'fhd1080', 'comfortable'],
    ['1440p', viewport(2560, 1440), 'wqhd1440', 'comfortable'],
    ['4K', viewport(3840, 2160), 'uhd2160', 'compact'],
  ] as const)('uses the existing %s detail tier and density contract', (_, snapshot, tier, densityMode) => {
    const metrics = buildFullscreenLayoutMetrics('auto', snapshot);

    expect(metrics.detailResolutionTier).toBe(tier);
    expect(metrics.detailLayoutSpec.tier).toBe(tier);
    expect(metrics.densityMode).toBe(densityMode);
    expect(metrics.detailShellWidth).toBeLessThanOrEqual(snapshot.width);
    expect(metrics.gridColumns).toBeGreaterThanOrEqual(3);
  });

  it('keeps the 4K density decision when DPI scaling compresses the CSS viewport', () => {
    const metrics = buildFullscreenLayoutMetrics('auto', {
      dpr: 2,
      height: 1080,
      physicalHeight: 2160,
      physicalWidth: 3840,
      width: 1920,
    });

    expect(metrics.densityMode).toBe('compact');
    expect(metrics.detailResolutionTier).toBe('wqhd1440');
  });
});
