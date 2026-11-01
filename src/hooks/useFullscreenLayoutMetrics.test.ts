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

  it('preserves appropriate density on Mac Retina laptop screens', () => {
    // 14" MacBook Pro (3024x1964 physical) resolves to standard, avoiding 4K compact
    const macBookPro14 = buildFullscreenLayoutMetrics('auto', {
      dpr: 2,
      height: 982,
      physicalHeight: 1964,
      physicalWidth: 3024,
      width: 1512,
    });
    expect(macBookPro14.densityMode).toBe('standard');

    // 16" MacBook Pro (3456x2234 physical) resolves to standard, avoiding 4K compact
    const macBookPro16 = buildFullscreenLayoutMetrics('auto', {
      dpr: 2,
      height: 1117,
      physicalHeight: 2234,
      physicalWidth: 3456,
      width: 1728,
    });
    // Physical width (3456) is under 3600, so compact 4K density is avoided
    expect(macBookPro16.densityMode).toBe('standard');

    // Windowed mode (800x600, 1600x1200 physical) resolves to comfortable
    const windowedRetina = buildFullscreenLayoutMetrics('auto', {
      dpr: 2,
      height: 600,
      physicalHeight: 1200,
      physicalWidth: 1600,
      width: 800,
    });
    expect(windowedRetina.densityMode).toBe('comfortable');
  });
});
