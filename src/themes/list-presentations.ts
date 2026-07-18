import { Theme } from './types';
import { arcadeVoidTheme } from './arcade-void';
import { cyberpunkCrtTheme } from './cyberpunk-crt';
import { c64EditionTheme } from './c64-edition';

export type ThemeListPresentation = {
  id: string;
  layout: 'arcade-dashboard' | 'cyberpunk-terminal' | 'c64-workspace';
  columns: readonly ['index', 'title', 'year', 'publisher', 'genre', 'system'];
  bigBox: {
    railStyle: 'acrylic' | 'terminal' | 'basic';
  };
};

const sharedColumns = ['index', 'title', 'year', 'publisher', 'genre', 'system'] as const;

const staticThemes = [arcadeVoidTheme, cyberpunkCrtTheme, c64EditionTheme];

/**
 * The list data contract is dynamically derived from theme layout tokens,
 * laying the groundwork for a future user UI Theme Maker.
 */
export function getThemeListPresentation(themeId?: string): ThemeListPresentation {
  const matchedTheme = staticThemes.find(t => t.id === themeId) || arcadeVoidTheme;

  let layoutPreset: ThemeListPresentation['layout'] = 'arcade-dashboard';
  if (matchedTheme.layout.structure === 'flat-alphabet') {
    layoutPreset = matchedTheme.id === 'c64-edition' ? 'c64-workspace' : 'cyberpunk-terminal';
  }

  return {
    id: matchedTheme.id,
    layout: layoutPreset,
    columns: sharedColumns,
    bigBox: {
      railStyle: matchedTheme.layout.railStyle,
    },
  };
}

