export type ThemeListPresentation = {
  id: 'arcade-void' | 'cyberpunk-crt' | 'c64-edition';
  layout: 'arcade-dashboard' | 'cyberpunk-terminal' | 'c64-workspace';
  columns: readonly ['index', 'title', 'year', 'publisher', 'genre', 'system'];
  bigBox: {
    railStyle: 'acrylic' | 'terminal' | 'basic';
  };
};

const sharedColumns = ['index', 'title', 'year', 'publisher', 'genre', 'system'] as const;

const presentations: Record<ThemeListPresentation['id'], ThemeListPresentation> = {
  'arcade-void': {
    id: 'arcade-void',
    layout: 'arcade-dashboard',
    columns: sharedColumns,
    bigBox: { railStyle: 'acrylic' },
  },
  'cyberpunk-crt': {
    id: 'cyberpunk-crt',
    layout: 'cyberpunk-terminal',
    columns: sharedColumns,
    bigBox: { railStyle: 'terminal' },
  },
  'c64-edition': {
    id: 'c64-edition',
    layout: 'c64-workspace',
    columns: sharedColumns,
    bigBox: { railStyle: 'basic' },
  },
};

/**
 * The list data contract is intentionally shared. A theme only chooses a
 * presenter, so custom themes have one obvious place to define list styling.
 */
export function getThemeListPresentation(themeId?: string): ThemeListPresentation {
  return presentations[themeId as ThemeListPresentation['id']] ?? presentations['arcade-void'];
}
