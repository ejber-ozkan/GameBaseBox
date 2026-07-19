import type { Settings } from '../../contexts/SettingsContext';
import { PLATFORM_PROFILES, SUPPORTED_PLATFORMS } from '../../lib/platform-capabilities';
import type { PlatformId } from '../../types/platform';

export type SettingsTabId =
  | 'appearance'
  | 'display'
  | 'media'
  | 'interaction'
  | 'content'
  | `platform-paths:${PlatformId}`
  | 'scrapers'
  | 'maintenance'
  | 'about';

export interface SettingsTabOption {
  id: SettingsTabId;
  label: string;
}

const STATIC_SETTINGS_TABS: SettingsTabOption[] = [
  { id: 'appearance', label: '🎨 Theme & UI' },
  { id: 'display', label: '🖥️ Display & Video' },
  { id: 'media', label: '🖼️ Media & Gallery' },
  { id: 'interaction', label: '🖱️ Input & Interaction' },
  { id: 'content', label: '🔞 Content Filter' },
  { id: 'about', label: 'ℹ️ About & Credits' },
];

export function getPlatformPathsTabId(platformId: PlatformId): SettingsTabId {
  return `platform-paths:${platformId}`;
}

export function getPlatformIdFromSettingsTab(tabId: SettingsTabId): PlatformId | null {
  if (!tabId.startsWith('platform-paths:')) {
    return null;
  }

  const platformId = tabId.slice('platform-paths:'.length);
  return platformId in PLATFORM_PROFILES ? (platformId as PlatformId) : null;
}

export function getSettingsTabs(settings: Pick<Settings, 'platformSettings'>): SettingsTabOption[] {
  const platformTabs = SUPPORTED_PLATFORMS
    .filter((platform) => settings.platformSettings[platform.id]?.library.importStatus === 'imported')
    .map((platform) => ({
      id: getPlatformPathsTabId(platform.id),
      label: `${platform.displayName === 'Commodore 64' ? 'C64' : platform.displayName} Platform Paths`,
    }));

  return [
    STATIC_SETTINGS_TABS[0], // appearance
    STATIC_SETTINGS_TABS[1], // display
    STATIC_SETTINGS_TABS[2], // media
    STATIC_SETTINGS_TABS[3], // interaction
    STATIC_SETTINGS_TABS[4], // content
    ...platformTabs,
    STATIC_SETTINGS_TABS[5], // about
  ];
}

export function getSettingsItemCount(tabId: SettingsTabId): number {
  if (getPlatformIdFromSettingsTab(tabId)) {
    return 18;
  }

  switch (tabId) {
    case 'appearance':
      return 4;
    case 'display':
      return 14;
    case 'media':
      return 3;
    case 'interaction':
      return 4;
    case 'content':
      return 1;
    case 'about':
      return 3;
  }

  return 1;
}

export type EditableSettings = Pick<
  Settings,
  | 'emulatorPath'
  | 'emuMoviesUsername'
  | 'emuMoviesPassword'
  | 'scrapedMediaPath'
  | 'hideAdultContent'
  | 'activeScraper'
  | 'screenScraperUsername'
  | 'screenScraperPassword'
  | 'screenScraperDevId'
  | 'screenScraperDevPassword'
  | 'theGamesDbApiKey'
  | 'retroarchPath'
  | 'retroarchCorePath'
  | 'preferredEmulator'
  | 'imageAnimation'
  | 'imageCycling'
  | 'isFullscreen'
  | 'fullscreenDensity'
  | 'displayResolution'
  | 'mouseHoverSelection'
  | 'scrollNavigation'
  | 'menuSoundEffects'
  | 'bigBoxAnimateVertical'
  | 'activePlatformId'
  | 'platformSettings'
>;

export function getEditableSettings(settings: Settings): EditableSettings {
  return {
    emulatorPath: settings.emulatorPath,
    emuMoviesUsername: settings.emuMoviesUsername,
    emuMoviesPassword: settings.emuMoviesPassword,
    scrapedMediaPath: settings.scrapedMediaPath,
    hideAdultContent: settings.hideAdultContent,
    activeScraper: settings.activeScraper,
    screenScraperUsername: settings.screenScraperUsername,
    screenScraperPassword: settings.screenScraperPassword,
    screenScraperDevId: settings.screenScraperDevId,
    screenScraperDevPassword: settings.screenScraperDevPassword,
    theGamesDbApiKey: settings.theGamesDbApiKey,
    retroarchPath: settings.retroarchPath,
    retroarchCorePath: settings.retroarchCorePath,
    preferredEmulator: settings.preferredEmulator,
    imageAnimation: settings.imageAnimation,
    imageCycling: settings.imageCycling,
    isFullscreen: settings.isFullscreen,
    fullscreenDensity: settings.fullscreenDensity,
    displayResolution: settings.displayResolution,
    mouseHoverSelection: settings.mouseHoverSelection,
    scrollNavigation: settings.scrollNavigation,
    menuSoundEffects: settings.menuSoundEffects,
    bigBoxAnimateVertical: settings.bigBoxAnimateVertical,
    activePlatformId: settings.activePlatformId,
    platformSettings: settings.platformSettings,
  };
}

export interface ContentNavProps {
  isMouseMode: boolean;
  onMouseFocus: (index: number) => void;
  isFocused: (index: number) => boolean;
}
