import { describe, expect, it } from 'vitest';
import { getThemeListPresentation } from './list-presentations';

describe('theme list presentations', () => {
  it.each([
    ['arcade-void', 'arcade-dashboard'],
    ['cyberpunk-crt', 'cyberpunk-terminal'],
    ['c64-edition', 'c64-workspace'],
  ] as const)('keeps the %s visual language in the shared list contract', (themeId, layout) => {
    const presentation = getThemeListPresentation(themeId);

    expect(presentation.layout).toBe(layout);
    expect(presentation.columns).toEqual(['index', 'title', 'year', 'publisher', 'genre', 'system']);
    expect(presentation.bigBox).toBeDefined();
  });

  it('uses the Arcade Void presenter as a safe fallback for custom or unknown themes', () => {
    expect(getThemeListPresentation('community-theme').id).toBe('arcade-void');
  });
});
