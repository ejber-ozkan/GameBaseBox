import { describe, expect, it } from 'vitest';
import {
  buildDetailLayoutSpec,
  resolveDetailResolutionTier,
  type DetailResolutionTier,
  type DetailViewportSnapshot,
} from './detail-layout';

function makeViewport(
  width: number,
  height: number,
  physicalWidth = width,
  physicalHeight = height,
  dpr = 1,
): DetailViewportSnapshot {
  return {
    dpr,
    height,
    physicalHeight,
    physicalWidth,
    width,
  };
}

describe('detail layout tier resolution', () => {
  const cases: Array<[DetailResolutionTier, DetailViewportSnapshot]> = [
    ['hd720', makeViewport(1280, 720)],
    ['hdPlus900', makeViewport(1600, 900)],
    ['fhd1080', makeViewport(1920, 1080)],
    ['wqhd1440', makeViewport(2560, 1440)],
    ['qhdPlus1800', makeViewport(3200, 1800)],
    ['uhd2160', makeViewport(3840, 2160)],
  ];

  it.each(cases)('resolves %s for native viewport', (expectedTier, viewport) => {
    expect(resolveDetailResolutionTier(viewport)).toBe(expectedTier);
  });

  it('resolves WQHD tier from a 200% scaled 4K viewport', () => {
    const scaled4k = makeViewport(1920, 1080, 3840, 2160, 2);
    expect(resolveDetailResolutionTier(scaled4k)).toBe('wqhd1440');
  });

  it('resolves WQHD tier from a 300% scaled 4K viewport', () => {
    const scaled4k = makeViewport(1280, 720, 3840, 2160, 3);
    expect(resolveDetailResolutionTier(scaled4k)).toBe('wqhd1440');
  });
});

describe('detail layout spec budgets', () => {
  const viewports = [
    makeViewport(1280, 720),
    makeViewport(1600, 900),
    makeViewport(1920, 1080),
    makeViewport(2560, 1440),
    makeViewport(3200, 1800),
    makeViewport(1920, 1080, 3840, 2160, 2),
    makeViewport(1280, 720, 3840, 2160, 3),
  ];

  it.each(viewports)('keeps main and sidebar body budgets aligned for %o', (viewport) => {
    const spec = buildDetailLayoutSpec(viewport);
    const mainBodyHeight = spec.mediaRowHeight + spec.lowerRowHeight + spec.panelGap;
    const sidebarBodyHeight = spec.sidebarRowHeights.reduce((sum, value) => sum + value, 0) + spec.panelGap * 3;

    expect(mainBodyHeight).toBe(sidebarBodyHeight);
    expect(spec.shellMaxWidth).toBeLessThanOrEqual(spec.designWidth - spec.shellPaddingX * 2);
    expect(spec.mediaRowHeight).toBeGreaterThan(0);
    expect(spec.lowerRowHeight).toBeGreaterThan(0);
    expect(spec.sidebarRowHeights.every((value) => value > 0)).toBe(true);
    expect(spec.alternativeColumns).toBe(4);
    expect(spec.surfaceWidth).toBe(viewport.width);
    expect(spec.surfaceHeight).toBe(viewport.height);
  });

  it('includes a debug label with native resolution, viewport, and tier name', () => {
    const spec = buildDetailLayoutSpec(makeViewport(1920, 1080, 3840, 2160, 2));

    expect(spec.debugLabel).toContain('3840x2160');
    expect(spec.debugLabel).toContain('vp 1920x1080');
    expect(spec.debugLabel).toContain('layout 2880x1620');
    expect(spec.debugLabel).toContain('WQHD');
  });

  it('uses render scaling when the CSS viewport is compressed by DPI scaling', () => {
    const spec = buildDetailLayoutSpec(makeViewport(1280, 720, 3840, 2160, 3));

    expect(spec.designWidth).toBe(2560);
    expect(spec.designHeight).toBe(1440);
    expect(spec.renderScale).toBe(0.5);
    expect(spec.debugLabel).toContain('WQHD');
  });

  it('does not downscale on Mac Retina laptop screens (dpr=2, non-4K resolution)', () => {
    // 14" MacBook Pro fullscreen (1512x982 CSS, 3024x1964 physical, dpr 2)
    const macBookPro14 = makeViewport(1512, 982, 3024, 1964, 2);
    const spec14 = buildDetailLayoutSpec(macBookPro14);

    expect(spec14.displayScale).toBe(1);
    expect(spec14.renderScale).toBe(1);
    expect(spec14.designWidth).toBe(1512);
    expect(spec14.designHeight).toBe(982);

    // 13" MacBook Air fullscreen (1440x900 CSS, 2880x1800 physical, dpr 2)
    const macBookAir13 = makeViewport(1440, 900, 2880, 1800, 2);
    const specAir = buildDetailLayoutSpec(macBookAir13);

    expect(specAir.displayScale).toBe(1);
    expect(specAir.renderScale).toBe(1);
  });

  it('does not downscale or overflow in windowed mode on high-DPI screens', () => {
    // 800x600 window on a Retina Mac laptop
    const windowedViewport = makeViewport(800, 600, 1600, 1200, 2);
    const spec = buildDetailLayoutSpec(windowedViewport);

    expect(spec.displayScale).toBe(1);
    expect(spec.renderScale).toBe(1);
    expect(spec.designWidth).toBe(800);
    expect(spec.designHeight).toBe(600);
    expect(spec.shellMaxWidth).toBeLessThanOrEqual(spec.designWidth - spec.shellPaddingX * 2);
    expect(spec.useStackedColumns).toBe(true);
  });
});
