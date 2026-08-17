import type { EditableSettings, ContentNavProps } from './types';
import { PLATFORM_EMULATOR_PROFILES, PLATFORM_PROFILES } from '../../lib/platform-capabilities';
import type { PlatformFolderSettings, PlatformFolderType, PlatformId } from '../../types/platform';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from '../../i18n/I18nContext';

interface PathsSettingsTabProps extends ContentNavProps {
  draft: EditableSettings;
  setField: <K extends keyof EditableSettings>(key: K, value: EditableSettings[K]) => void;
  platformId: PlatformId;
  onBrowseDirectory: () => Promise<string | null>;
  onBrowseFile: () => Promise<string | null>;
  onBrowseRetroArchCore: () => Promise<string | null>;
}

interface PathRowProps extends ContentNavProps {
  label: string;
  value: string;
  placeholder: string;
  inputIndex: number;
  browseIndex?: number;
  onChange: (value: string) => void;
  onBrowse?: () => void;
}

function PathRow({
  label,
  value,
  placeholder,
  inputIndex,
  browseIndex,
  onChange,
  onBrowse,
  isMouseMode,
  onMouseFocus,
  isFocused,
}: PathRowProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-theme-text-muted">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          className={`focus-idx-${inputIndex} flex-1 bg-theme-background px-3 py-2 font-mono text-xs text-theme-text transition-colors focus:outline-none ${
            theme.effects.steppedBorders ? 'border-2' : 'rounded-theme border'
          } ${
            isFocused(inputIndex) ? 'border-theme-primary ring-1 ring-theme-primary/50' : 'border-theme-outline-variant'
          }`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          onMouseEnter={() => isMouseMode && onMouseFocus(inputIndex)}
        />
        {onBrowse && browseIndex !== undefined && (
          <button
            onClick={onBrowse}
            onMouseEnter={() => isMouseMode && onMouseFocus(browseIndex)}
            className={`focus-idx-${browseIndex} shrink-0 px-3 py-2 text-xs transition ${
              isFocused(browseIndex)
                ? 'bg-theme-primary text-theme-surface border border-theme-primary'
                : 'border border-theme-outline-variant bg-theme-surface/50 text-theme-text-muted hover:bg-theme-surface hover:text-theme-text'
            } ${theme.effects.steppedBorders ? 'border-2' : 'rounded-theme'}`}
            title={t('settings.browseDesktopTooltip')}
          >
            {t('common.browse')}..
          </button>
        )}
      </div>
    </div>
  );
}

export function PathsSettingsTab({
  draft,
  setField,
  platformId,
  onBrowseDirectory,
  onBrowseFile,
  onBrowseRetroArchCore,
  isMouseMode,
  onMouseFocus,
  isFocused,
}: PathsSettingsTabProps) {
  const { t } = useTranslation();
  const platformProfile = PLATFORM_PROFILES[platformId];
  const platformSettings = draft.platformSettings[platformId];
  const platformFolders = platformSettings.folders;
  const platformEmulatorSettings = platformSettings.emulator;
  const isC64 = platformId === 'c64';
  const isAtari800 = platformId === 'atari800';
  const isAtari2600 = platformId === 'atari2600';
  const isZxSpectrum = platformId === 'zxspectrum';
  const isBbcMicro = platformId === 'bbcmicro';
  const isAmiga = platformId === 'amiga';
  const isAtariSt = platformId === 'atarist';
  const isVic20 = platformId === 'vic20';
  const isAmstradCpc = platformId === 'amstradcpc';
  const isApple2Gs = platformId === 'apple2gs';
  const isPet = platformId === 'pet';
  const isC128 = platformId === 'c128';
  const isAtari5200 = platformId === 'atari5200';
  const isAtari7800 = platformId === 'atari7800';
  const supportedEmulatorProfileIds = platformProfile.supportedEmulatorProfileIds;
  const preferredEmulatorProfileId =
    platformEmulatorSettings.preferredEmulatorProfileId || platformProfile.defaultEmulatorProfileId;
  const preferredC64Emulator = preferredEmulatorProfileId === 'retroarch-c64' ? 'retroarch' : 'vice';
  const hasFolderType = (folderType: PlatformFolderType) => platformProfile.folderTypes.includes(folderType);

  const setPlatformFolders = (folders: PlatformFolderSettings) => {

    setField('platformSettings', {
      ...draft.platformSettings,
      [platformId]: {
        ...platformSettings,
        folders,
      },
    });
  };

  const setPlatformFolder = (field: keyof PlatformFolderSettings, value: string) => {
    setPlatformFolders({
      ...platformFolders,
      [field]: value,
    });
  };

  const browsePlatformFolder = async (field: keyof PlatformFolderSettings) => {
    const chosen = await onBrowseDirectory();
    if (chosen) {
      setPlatformFolder(field, chosen);
    }
  };

  const browsePlatformExecutable = async (profileId: string) => {
    const chosen = await onBrowseFile();
    if (chosen) {
      setPlatformExecutablePath(profileId, chosen);
      if (profileId === 'vice-c64' && platformId === draft.activePlatformId) setField('emulatorPath', chosen);
      if (profileId === 'retroarch-c64' && platformId === draft.activePlatformId) setField('retroarchPath', chosen);
    }
  };

  const browsePlatformCore = async (profileId: string) => {
    const chosen = await onBrowseRetroArchCore();
    if (chosen) {
      setPlatformCorePath(profileId, chosen);
      if (profileId === 'retroarch-c64' && platformId === draft.activePlatformId) setField('retroarchCorePath', chosen);
    }
  };

  const setPlatformExecutablePath = (profileId: string, value: string) => {
    setField('platformSettings', {
      ...draft.platformSettings,
      [platformId]: {
        ...platformSettings,
        emulator: {
          ...platformEmulatorSettings,
          executablePaths: {
            ...platformEmulatorSettings.executablePaths,
            [profileId]: value,
          },
        },
      },
    });
  };

  const setPlatformCorePath = (profileId: string, value: string) => {
    setField('platformSettings', {
      ...draft.platformSettings,
      [platformId]: {
        ...platformSettings,
        emulator: {
          ...platformEmulatorSettings,
          corePaths: {
            ...platformEmulatorSettings.corePaths,
            [profileId]: value,
          },
        },
      },
    });
  };

  const setPreferredPlatformEmulator = (profileId: string) => {
    if (platformId === 'c64') {
      setField('preferredEmulator', profileId === 'retroarch-c64' ? 'retroarch' : 'vice');
    }

    setField('platformSettings', {
      ...draft.platformSettings,
      [platformId]: {
        ...platformSettings,
        emulator: {
          ...platformEmulatorSettings,
          preferredEmulatorProfileId: profileId,
        },
      },
    });
  };

  const getEmulatorButtonLabel = (profileId: string) => {
    const emulatorType = PLATFORM_EMULATOR_PROFILES[profileId]?.emulatorType;
    if (emulatorType === 'retroarch') return 'RetroArch';
    if (emulatorType === 'altirra') return 'Altirra';
    if (emulatorType === 'spectaculator') return 'Spectaculator';
    if (emulatorType === 'beebem') return 'BeebEm';
    if (emulatorType === 'uae') return 'WinUAE / UAE';
    if (emulatorType === 'steem') return 'STeem';
    if (emulatorType === 'hatari') return 'Hatari';
    if (emulatorType === 'vice') return 'VICE';
    return PLATFORM_EMULATOR_PROFILES[profileId]?.displayName ?? profileId;
  };

  const renderEmulatorSelector = (startIndex: number) => {
    if (supportedEmulatorProfileIds.length < 2) {
      return null;
    }

    return (
      <div className="mb-4 flex items-center justify-between border-b border-theme-outline-variant pb-4">
        <div>
          <span className="block text-sm font-bold uppercase tracking-wider text-theme-text">{t('settings.defaultEmulator')}</span>
          <span className="mt-1 block text-[10px] text-theme-text-muted">{t('settings.defaultEmulatorDescription')}</span>
        </div>
        <div className="flex rounded-theme-lg border border-theme-outline-variant bg-theme-background/60 p-1">
          {supportedEmulatorProfileIds.map((profileId, idx) => (
            <button
              key={profileId}
              onClick={() => setPreferredPlatformEmulator(profileId)}
              onMouseEnter={() => isMouseMode && onMouseFocus(idx + startIndex)}
              className={`focus-idx-${idx + startIndex} rounded-theme px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                (preferredEmulatorProfileId === profileId && ![startIndex, startIndex + 1].some(isFocused)) ||
                isFocused(idx + startIndex)
                  ? 'bg-theme-primary text-theme-surface shadow-lg'
                  : 'text-theme-text-muted hover:text-theme-text'
              }`}
            >
              {getEmulatorButtonLabel(profileId)}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col justify-start gap-4">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column: Folders */}
        <div className="flex flex-col gap-4">
          <div className="border-b border-theme-outline-variant pb-1.5 text-xs font-bold uppercase tracking-widest text-theme-primary font-mono">
            {platformProfile.displayName} {t('settings.folders')}
          </div>
          {hasFolderType('games') && (
            <PathRow
              label={t('settings.gamesFolder')}
              value={platformFolders.gamesPath}
              onChange={(value) => setPlatformFolder('gamesPath', value)}
              placeholder={isC64 ? 'e.g. D:/GB64/Games' : `Select ${platformProfile.displayName} games folder`}
              inputIndex={0}
              browseIndex={1}
              onBrowse={() => void browsePlatformFolder('gamesPath')}
              isMouseMode={isMouseMode}
              onMouseFocus={onMouseFocus}
              isFocused={isFocused}
            />
          )}
          {hasFolderType('screenshots') && (
            <PathRow
              label={t('settings.screenshotsFolder')}
              value={platformFolders.screenshotsPath}
              onChange={(value) => setPlatformFolder('screenshotsPath', value)}
              placeholder={isC64 ? 'e.g. D:/GB64/Screenshots' : `Select ${platformProfile.displayName} screenshots folder`}
              inputIndex={2}
              browseIndex={3}
              onBrowse={() => void browsePlatformFolder('screenshotsPath')}
              isMouseMode={isMouseMode}
              onMouseFocus={onMouseFocus}
              isFocused={isFocused}
            />
          )}
          {hasFolderType('music') && (
            <PathRow
              label={isC64 ? t('settings.c64MusicFolder') : t('settings.musicFolder')}
              value={platformFolders.musicPath}
              onChange={(value) => setPlatformFolder('musicPath', value)}
              placeholder={isC64 ? 'e.g. D:/GB64/C64Music' : `Select ${platformProfile.displayName} music folder`}
              inputIndex={4}
              browseIndex={5}
              onBrowse={() => void browsePlatformFolder('musicPath')}
              isMouseMode={isMouseMode}
              onMouseFocus={onMouseFocus}
              isFocused={isFocused}
            />
          )}
          {hasFolderType('photos') && (
            <PathRow
              label={isC64 || isZxSpectrum || isAmstradCpc ? t('settings.musicianPhotosFolder') : t('settings.photosFolder')}
              value={platformFolders.photosPath}
              onChange={(value) => setPlatformFolder('photosPath', value)}
              placeholder={
                isC64
                  ? 'e.g. D:/GB64/Photos'
                  : isZxSpectrum || isAmstradCpc
                    ? `Select ${platformProfile.displayName} musician photos folder`
                    : `Select ${platformProfile.displayName} photos folder`
              }
              inputIndex={6}
              browseIndex={7}
              onBrowse={() => void browsePlatformFolder('photosPath')}
              isMouseMode={isMouseMode}
              onMouseFocus={onMouseFocus}
              isFocused={isFocused}
            />
          )}
          {hasFolderType('extras') && (
            <PathRow
              label={t('settings.extrasFolder')}
              value={platformFolders.extrasPath}
              onChange={(value) => setPlatformFolder('extrasPath', value)}
              placeholder={isC64 ? 'e.g. D:/GB64/Extras' : `Select ${platformProfile.displayName} extras folder`}
              inputIndex={8}
              browseIndex={9}
              onBrowse={() => void browsePlatformFolder('extrasPath')}
              isMouseMode={isMouseMode}
              onMouseFocus={onMouseFocus}
              isFocused={isFocused}
            />
          )}
        </div>

        {/* Right Column: Emulators */}
        <div className="flex flex-col gap-4">
          <div className="border-b border-theme-outline-variant pb-1.5 text-xs font-bold uppercase tracking-widest text-theme-primary font-mono">
            {t('settings.emulatorSettings')}
          </div>

          {isC64 && (
            <div className="space-y-6 rounded-theme-xl border border-theme-outline-variant bg-theme-surface/30 p-4">
              {renderEmulatorSelector(10)}

              <div className={`space-y-3 transition-opacity ${preferredC64Emulator !== 'vice' ? 'opacity-50' : ''}`}>
                <PathRow
                  label={t('settings.viceExecutable')}
                  value={platformEmulatorSettings.executablePaths['vice-c64'] ?? ''}
                  onChange={(value) => setPlatformExecutablePath('vice-c64', value)}
                  placeholder="e.g. C:/VICE/x64sc.exe"
                  inputIndex={12}
                  browseIndex={13}
                  onBrowse={() => void browsePlatformExecutable('vice-c64')}
                  isMouseMode={isMouseMode}
                  onMouseFocus={onMouseFocus}
                  isFocused={isFocused}
                />
              </div>

              <div className={`space-y-3 transition-opacity ${preferredC64Emulator !== 'retroarch' ? 'opacity-50' : ''}`}>
                <PathRow
                  label={t('settings.retroarchExecutable')}
                  value={platformEmulatorSettings.executablePaths['retroarch-c64'] ?? ''}
                  onChange={(value) => setPlatformExecutablePath('retroarch-c64', value)}
                  placeholder="e.g. C:/RetroArch/retroarch.exe"
                  inputIndex={14}
                  browseIndex={15}
                  onBrowse={() => void browsePlatformExecutable('retroarch-c64')}
                  isMouseMode={isMouseMode}
                  onMouseFocus={onMouseFocus}
                  isFocused={isFocused}
                />
                <PathRow
                  label={t('settings.retroarchCore')}
                  value={platformEmulatorSettings.corePaths['retroarch-c64'] ?? ''}
                  onChange={(value) => setPlatformCorePath('retroarch-c64', value)}
                  placeholder="e.g. C:/RetroArch/cores/vice_x64sc_libretro.dll"
                  inputIndex={16}
                  browseIndex={17}
                  onBrowse={() => void browsePlatformCore('retroarch-c64')}
                  isMouseMode={isMouseMode}
                  onMouseFocus={onMouseFocus}
                  isFocused={isFocused}
                />
              </div>
            </div>
          )}

          {isAtari800 && (
            <div className="space-y-6 rounded-theme-xl border border-theme-outline-variant bg-theme-surface/30 p-4">
              {renderEmulatorSelector(10)}

              <div
                className={`space-y-3 transition-opacity ${
                  preferredEmulatorProfileId !== 'retroarch-atari800' ? 'opacity-50' : ''
                }`}
              >
                <PathRow
                  label={t('settings.retroarchExecutable')}
                  value={platformEmulatorSettings.executablePaths['retroarch-atari800'] ?? ''}
                  onChange={(value) => setPlatformExecutablePath('retroarch-atari800', value)}
                  placeholder="e.g. C:/RetroArch/retroarch.exe"
                  inputIndex={12}
                  browseIndex={13}
                  onBrowse={() => void browsePlatformExecutable('retroarch-atari800')}
                  isMouseMode={isMouseMode}
                  onMouseFocus={onMouseFocus}
                  isFocused={isFocused}
                />
                <PathRow
                  label="RetroArch Atari800 Core"
                  value={platformEmulatorSettings.corePaths['retroarch-atari800'] ?? ''}
                  onChange={(value) => setPlatformCorePath('retroarch-atari800', value)}
                  placeholder="e.g. C:/RetroArch/cores/atari800_libretro.dll"
                  inputIndex={14}
                  browseIndex={15}
                  onBrowse={() => void browsePlatformCore('retroarch-atari800')}
                  isMouseMode={isMouseMode}
                  onMouseFocus={onMouseFocus}
                  isFocused={isFocused}
                />
              </div>

              <div
                className={`space-y-3 transition-opacity ${
                  preferredEmulatorProfileId !== 'altirra-atari800' ? 'opacity-50' : ''
                }`}
              >
                <PathRow
                  label="Altirra Executable (Altirra64.exe)"
                  value={platformEmulatorSettings.executablePaths['altirra-atari800'] ?? ''}
                  onChange={(value) => setPlatformExecutablePath('altirra-atari800', value)}
                  placeholder="e.g. C:/Altirra/Altirra64.exe"
                  inputIndex={16}
                  browseIndex={17}
                  onBrowse={() => void browsePlatformExecutable('altirra-atari800')}
                  isMouseMode={isMouseMode}
                  onMouseFocus={onMouseFocus}
                  isFocused={isFocused}
                />
              </div>
            </div>
          )}

          {isAtari2600 && (
            <div className="space-y-6 rounded-theme-xl border border-theme-outline-variant bg-theme-surface/30 p-4">
              {renderEmulatorSelector(10)}
              <div
                className={`space-y-3 transition-opacity ${
                  preferredEmulatorProfileId !== 'retroarch-atari2600' ? 'opacity-50' : ''
                }`}
              >
                <PathRow
                  label={t('settings.retroarchExecutable')}
                  value={platformEmulatorSettings.executablePaths['retroarch-atari2600'] ?? ''}
                  onChange={(value) => setPlatformExecutablePath('retroarch-atari2600', value)}
                  placeholder="e.g. C:/RetroArch/retroarch.exe"
                  inputIndex={12}
                  browseIndex={13}
                  onBrowse={() => void browsePlatformExecutable('retroarch-atari2600')}
                  isMouseMode={isMouseMode}
                  onMouseFocus={onMouseFocus}
                  isFocused={isFocused}
                />
                <PathRow
                  label="RetroArch Atari 2600 Core"
                  value={platformEmulatorSettings.corePaths['retroarch-atari2600'] ?? ''}
                  onChange={(value) => setPlatformCorePath('retroarch-atari2600', value)}
                  placeholder="e.g. C:/RetroArch/cores/stella_libretro.dll"
                  inputIndex={14}
                  browseIndex={15}
                  onBrowse={() => void browsePlatformCore('retroarch-atari2600')}
                  isMouseMode={isMouseMode}
                  onMouseFocus={onMouseFocus}
                  isFocused={isFocused}
                />
              </div>
            </div>
          )}

          {isZxSpectrum && (
            <div className="space-y-6 rounded-theme-xl border border-theme-outline-variant bg-theme-surface/30 p-4">
              {renderEmulatorSelector(10)}
              <div
                className={`space-y-3 transition-opacity ${
                  preferredEmulatorProfileId !== 'retroarch-zxspectrum' ? 'opacity-50' : ''
                }`}
              >
                <PathRow
                  label={t('settings.retroarchExecutable')}
                  value={platformEmulatorSettings.executablePaths['retroarch-zxspectrum'] ?? ''}
                  onChange={(value) => setPlatformExecutablePath('retroarch-zxspectrum', value)}
                  placeholder="e.g. C:/RetroArch/retroarch.exe"
                  inputIndex={12}
                  browseIndex={13}
                  onBrowse={() => void browsePlatformExecutable('retroarch-zxspectrum')}
                  isMouseMode={isMouseMode}
                  onMouseFocus={onMouseFocus}
                  isFocused={isFocused}
                />
                <PathRow
                  label="RetroArch ZX Spectrum Core"
                  value={platformEmulatorSettings.corePaths['retroarch-zxspectrum'] ?? ''}
                  onChange={(value) => setPlatformCorePath('retroarch-zxspectrum', value)}
                  placeholder="e.g. C:/RetroArch/cores/fuse_libretro.dll"
                  inputIndex={14}
                  browseIndex={15}
                  onBrowse={() => void browsePlatformCore('retroarch-zxspectrum')}
                  isMouseMode={isMouseMode}
                  onMouseFocus={onMouseFocus}
                  isFocused={isFocused}
                />
              </div>
              <div
                className={`space-y-3 transition-opacity ${
                  preferredEmulatorProfileId !== 'spectaculator-zxspectrum' ? 'opacity-50' : ''
                }`}
              >
                <PathRow
                  label="Spectaculator Executable"
                  value={platformEmulatorSettings.executablePaths['spectaculator-zxspectrum'] ?? ''}
                  onChange={(value) => setPlatformExecutablePath('spectaculator-zxspectrum', value)}
                  placeholder="e.g. C:/Spectaculator/Spectaculator.exe"
                  inputIndex={16}
                  browseIndex={17}
                  onBrowse={() => void browsePlatformExecutable('spectaculator-zxspectrum')}
                  isMouseMode={isMouseMode}
                  onMouseFocus={onMouseFocus}
                  isFocused={isFocused}
                />
              </div>
            </div>
          )}

          {isBbcMicro && (
            <div className="space-y-6 rounded-theme-xl border border-theme-outline-variant bg-theme-surface/30 p-4">
              {renderEmulatorSelector(10)}
              <div
                className={`space-y-3 transition-opacity ${
                  preferredEmulatorProfileId !== 'retroarch-bbcmicro' ? 'opacity-50' : ''
                }`}
              >
                <PathRow
                  label={t('settings.retroarchExecutable')}
                  value={platformEmulatorSettings.executablePaths['retroarch-bbcmicro'] ?? ''}
                  onChange={(value) => setPlatformExecutablePath('retroarch-bbcmicro', value)}
                  placeholder="e.g. C:/RetroArch/retroarch.exe"
                  inputIndex={12}
                  browseIndex={13}
                  onBrowse={() => void browsePlatformExecutable('retroarch-bbcmicro')}
                  isMouseMode={isMouseMode}
                  onMouseFocus={onMouseFocus}
                  isFocused={isFocused}
                />
                <PathRow
                  label="RetroArch BBC Micro Core"
                  value={platformEmulatorSettings.corePaths['retroarch-bbcmicro'] ?? ''}
                  onChange={(value) => setPlatformCorePath('retroarch-bbcmicro', value)}
                  placeholder="e.g. C:/RetroArch/cores/b-em_libretro.dll"
                  inputIndex={14}
                  browseIndex={15}
                  onBrowse={() => void browsePlatformCore('retroarch-bbcmicro')}
                  isMouseMode={isMouseMode}
                  onMouseFocus={onMouseFocus}
                  isFocused={isFocused}
                />
              </div>
              <div
                className={`space-y-3 transition-opacity ${
                  preferredEmulatorProfileId !== 'beebem-bbcmicro' ? 'opacity-50' : ''
                }`}
              >
                <PathRow
                  label="BeebEm Executable"
                  value={platformEmulatorSettings.executablePaths['beebem-bbcmicro'] ?? ''}
                  onChange={(value) => setPlatformExecutablePath('beebem-bbcmicro', value)}
                  placeholder="e.g. C:/BeebEm/BeebEm.exe"
                  inputIndex={16}
                  browseIndex={17}
                  onBrowse={() => void browsePlatformExecutable('beebem-bbcmicro')}
                  isMouseMode={isMouseMode}
                  onMouseFocus={onMouseFocus}
                  isFocused={isFocused}
                />
              </div>
            </div>
          )}

          {isAmiga && (
            <div className="space-y-6 rounded-theme-xl border border-theme-outline-variant bg-theme-surface/30 p-4">
              {renderEmulatorSelector(10)}
              <div
                className={`space-y-3 transition-opacity ${
                  preferredEmulatorProfileId !== 'retroarch-amiga' ? 'opacity-50' : ''
                }`}
              >
                <PathRow
                  label={t('settings.retroarchExecutable')}
                  value={platformEmulatorSettings.executablePaths['retroarch-amiga'] ?? ''}
                  onChange={(value) => setPlatformExecutablePath('retroarch-amiga', value)}
                  placeholder="e.g. C:/RetroArch/retroarch.exe"
                  inputIndex={12}
                  browseIndex={13}
                  onBrowse={() => void browsePlatformExecutable('retroarch-amiga')}
                  isMouseMode={isMouseMode}
                  onMouseFocus={onMouseFocus}
                  isFocused={isFocused}
                />
                <PathRow
                  label="RetroArch Amiga Core"
                  value={platformEmulatorSettings.corePaths['retroarch-amiga'] ?? ''}
                  onChange={(value) => setPlatformCorePath('retroarch-amiga', value)}
                  placeholder="e.g. C:/RetroArch/cores/puae_libretro.dll"
                  inputIndex={14}
                  browseIndex={15}
                  onBrowse={() => void browsePlatformCore('retroarch-amiga')}
                  isMouseMode={isMouseMode}
                  onMouseFocus={onMouseFocus}
                  isFocused={isFocused}
                />
              </div>
              <div
                className={`space-y-3 transition-opacity ${
                  preferredEmulatorProfileId !== 'winuae-amiga' ? 'opacity-50' : ''
                }`}
              >
                <PathRow
                  label="WinUAE / UAE Executable"
                  value={platformEmulatorSettings.executablePaths['winuae-amiga'] ?? ''}
                  onChange={(value) => setPlatformExecutablePath('winuae-amiga', value)}
                  placeholder="Windows: C:/WinUAE/WinUAE.exe; Linux/macOS: fs-uae or amiberry executable"
                  inputIndex={16}
                  browseIndex={17}
                  onBrowse={() => void browsePlatformExecutable('winuae-amiga')}
                  isMouseMode={isMouseMode}
                  onMouseFocus={onMouseFocus}
                  isFocused={isFocused}
                />
              </div>
            </div>
          )}

          {isAtariSt && (
            <div className="space-y-6 rounded-theme-xl border border-theme-outline-variant bg-theme-surface/30 p-4">
              {renderEmulatorSelector(10)}
              <div
                className={`space-y-3 transition-opacity ${
                  preferredEmulatorProfileId !== 'retroarch-atarist' ? 'opacity-50' : ''
                }`}
              >
                <PathRow
                  label={t('settings.retroarchExecutable')}
                  value={platformEmulatorSettings.executablePaths['retroarch-atarist'] ?? ''}
                  onChange={(value) => setPlatformExecutablePath('retroarch-atarist', value)}
                  placeholder="e.g. C:/RetroArch/retroarch.exe"
                  inputIndex={12}
                  browseIndex={13}
                  onBrowse={() => void browsePlatformExecutable('retroarch-atarist')}
                  isMouseMode={isMouseMode}
                  onMouseFocus={onMouseFocus}
                  isFocused={isFocused}
                />
                <PathRow
                  label="RetroArch Atari ST Core"
                  value={platformEmulatorSettings.corePaths['retroarch-atarist'] ?? ''}
                  onChange={(value) => setPlatformCorePath('retroarch-atarist', value)}
                  placeholder="e.g. C:/RetroArch/cores/hatari_libretro.dll"
                  inputIndex={14}
                  browseIndex={15}
                  onBrowse={() => void browsePlatformCore('retroarch-atarist')}
                  isMouseMode={isMouseMode}
                  onMouseFocus={onMouseFocus}
                  isFocused={isFocused}
                />
              </div>
              <div
                className={`space-y-3 transition-opacity ${
                  preferredEmulatorProfileId !== 'steem-atarist' ? 'opacity-50' : ''
                }`}
              >
                <PathRow
                  label="STeem Executable"
                  value={platformEmulatorSettings.executablePaths['steem-atarist'] ?? ''}
                  onChange={(value) => setPlatformExecutablePath('steem-atarist', value)}
                  placeholder="e.g. C:/STeem/Steem.exe"
                  inputIndex={16}
                  browseIndex={17}
                  onBrowse={() => void browsePlatformExecutable('steem-atarist')}
                  isMouseMode={isMouseMode}
                  onMouseFocus={onMouseFocus}
                  isFocused={isFocused}
                />
              </div>
              <div
                className={`space-y-3 transition-opacity ${
                  preferredEmulatorProfileId !== 'hatari-atarist' ? 'opacity-50' : ''
                }`}
              >
                <PathRow
                  label="Hatari Executable"
                  value={platformEmulatorSettings.executablePaths['hatari-atarist'] ?? ''}
                  onChange={(value) => setPlatformExecutablePath('hatari-atarist', value)}
                  placeholder="e.g. C:/Hatari/hatari.exe"
                  inputIndex={18}
                  browseIndex={19}
                  onBrowse={() => void browsePlatformExecutable('hatari-atarist')}
                  isMouseMode={isMouseMode}
                  onMouseFocus={onMouseFocus}
                  isFocused={isFocused}
                />
              </div>
            </div>
          )}

          {isVic20 && (
            <div className="space-y-6 rounded-theme-xl border border-theme-outline-variant bg-theme-surface/30 p-4">
              {renderEmulatorSelector(10)}
              <div
                className={`space-y-3 transition-opacity ${
                  preferredEmulatorProfileId !== 'retroarch-vic20' ? 'opacity-50' : ''
                }`}
              >
                <PathRow
                  label={t('settings.retroarchExecutable')}
                  value={platformEmulatorSettings.executablePaths['retroarch-vic20'] ?? ''}
                  onChange={(value) => setPlatformExecutablePath('retroarch-vic20', value)}
                  placeholder="e.g. C:/RetroArch/retroarch.exe"
                  inputIndex={12}
                  browseIndex={13}
                  onBrowse={() => void browsePlatformExecutable('retroarch-vic20')}
                  isMouseMode={isMouseMode}
                  onMouseFocus={onMouseFocus}
                  isFocused={isFocused}
                />
                <PathRow
                  label="RetroArch VIC-20 Core"
                  value={platformEmulatorSettings.corePaths['retroarch-vic20'] ?? ''}
                  onChange={(value) => setPlatformCorePath('retroarch-vic20', value)}
                  placeholder="e.g. C:/RetroArch/cores/vice_xvic_libretro.dll"
                  inputIndex={14}
                  browseIndex={15}
                  onBrowse={() => void browsePlatformCore('retroarch-vic20')}
                  isMouseMode={isMouseMode}
                  onMouseFocus={onMouseFocus}
                  isFocused={isFocused}
                />
              </div>
              <div
                className={`space-y-3 transition-opacity ${
                  preferredEmulatorProfileId !== 'vice-vic20' ? 'opacity-50' : ''
                }`}
              >
                <PathRow
                  label="VICE VIC-20 Executable (xvic.exe)"
                  value={platformEmulatorSettings.executablePaths['vice-vic20'] ?? ''}
                  onChange={(value) => setPlatformExecutablePath('vice-vic20', value)}
                  placeholder="e.g. C:/VICE/xvic.exe"
                  inputIndex={16}
                  browseIndex={17}
                  onBrowse={() => void browsePlatformExecutable('vice-vic20')}
                  isMouseMode={isMouseMode}
                  onMouseFocus={onMouseFocus}
                  isFocused={isFocused}
                />
              </div>
            </div>
          )}

          {isAmstradCpc && (
            <div className="space-y-6 rounded-theme-xl border border-theme-outline-variant bg-theme-surface/30 p-4">
              {renderEmulatorSelector(10)}
              <div
                className={`space-y-3 transition-opacity ${
                  preferredEmulatorProfileId !== 'retroarch-amstradcpc' ? 'opacity-50' : ''
                }`}
              >
                <PathRow
                  label={t('settings.retroarchExecutable')}
                  value={platformEmulatorSettings.executablePaths['retroarch-amstradcpc'] ?? ''}
                  onChange={(value) => setPlatformExecutablePath('retroarch-amstradcpc', value)}
                  placeholder="e.g. C:/RetroArch/retroarch.exe"
                  inputIndex={12}
                  browseIndex={13}
                  onBrowse={() => void browsePlatformExecutable('retroarch-amstradcpc')}
                  isMouseMode={isMouseMode}
                  onMouseFocus={onMouseFocus}
                  isFocused={isFocused}
                />
                <PathRow
                  label="RetroArch Amstrad CPC Core"
                  value={platformEmulatorSettings.corePaths['retroarch-amstradcpc'] ?? ''}
                  onChange={(value) => setPlatformCorePath('retroarch-amstradcpc', value)}
                  placeholder="e.g. C:/RetroArch/cores/cap32_libretro.dll"
                  inputIndex={14}
                  browseIndex={15}
                  onBrowse={() => void browsePlatformCore('retroarch-amstradcpc')}
                  isMouseMode={isMouseMode}
                  onMouseFocus={onMouseFocus}
                  isFocused={isFocused}
                />
              </div>
              <div
                className={`space-y-3 transition-opacity ${
                  preferredEmulatorProfileId !== 'cpce-amstradcpc' ? 'opacity-50' : ''
                }`}
              >
                <PathRow
                  label="Caprice32 / CPC++ Executable"
                  value={platformEmulatorSettings.executablePaths['cpce-amstradcpc'] ?? ''}
                  onChange={(value) => setPlatformExecutablePath('cpce-amstradcpc', value)}
                  placeholder="e.g. C:/Caprice32/cap32.exe or WinAPE.exe"
                  inputIndex={16}
                  browseIndex={17}
                  onBrowse={() => void browsePlatformExecutable('cpce-amstradcpc')}
                  isMouseMode={isMouseMode}
                  onMouseFocus={onMouseFocus}
                  isFocused={isFocused}
                />
              </div>
            </div>
          )}

          {isApple2Gs && (
            <div className="space-y-6 rounded-theme-xl border border-theme-outline-variant bg-theme-surface/30 p-4">
              <div className="rounded-theme-lg border border-theme-outline-variant/60 bg-theme-surface/60 p-3.5 text-xs text-theme-text/90">
                <div className="flex items-center gap-2 font-bold text-theme-primary mb-1.5 font-mono">
                  <span className="text-sm">ℹ️</span>
                  <span>{t('settings.apple2gsInstructionsTitle')}</span>
                </div>
                <p className="leading-relaxed text-theme-text/80">
                  {t('settings.apple2gsInstructions')}
                </p>
              </div>
              {renderEmulatorSelector(10)}
              <div
                className={`space-y-3 transition-opacity ${
                  preferredEmulatorProfileId !== 'retroarch-apple2gs' ? 'opacity-50' : ''
                }`}
              >
                <PathRow
                  label={t('settings.retroarchExecutable')}
                  value={platformEmulatorSettings.executablePaths['retroarch-apple2gs'] ?? ''}
                  onChange={(value) => setPlatformExecutablePath('retroarch-apple2gs', value)}
                  placeholder="e.g. C:/RetroArch/retroarch.exe"
                  inputIndex={12}
                  browseIndex={13}
                  onBrowse={() => void browsePlatformExecutable('retroarch-apple2gs')}
                  isMouseMode={isMouseMode}
                  onMouseFocus={onMouseFocus}
                  isFocused={isFocused}
                />
                <PathRow
                  label="RetroArch Apple 2GS Core"
                  value={platformEmulatorSettings.corePaths['retroarch-apple2gs'] ?? ''}
                  onChange={(value) => setPlatformCorePath('retroarch-apple2gs', value)}
                  placeholder="e.g. C:/RetroArch/cores/mame_libretro.dll"
                  inputIndex={14}
                  browseIndex={15}
                  onBrowse={() => void browsePlatformCore('retroarch-apple2gs')}
                  isMouseMode={isMouseMode}
                  onMouseFocus={onMouseFocus}
                  isFocused={isFocused}
                />
              </div>
              <div
                className={`space-y-3 transition-opacity ${
                  preferredEmulatorProfileId !== 'kegs-apple2gs' ? 'opacity-50' : ''
                }`}
              >
                <PathRow
                  label="KEGS Executable"
                  value={platformEmulatorSettings.executablePaths['kegs-apple2gs'] ?? ''}
                  onChange={(value) => setPlatformExecutablePath('kegs-apple2gs', value)}
                  placeholder="e.g. C:/KEGS/kegs32.exe"
                  inputIndex={16}
                  browseIndex={17}
                  onBrowse={() => void browsePlatformExecutable('kegs-apple2gs')}
                  isMouseMode={isMouseMode}
                  onMouseFocus={onMouseFocus}
                  isFocused={isFocused}
                />
              </div>
            </div>
          )}

          {isPet && (
            <div className="space-y-6 rounded-theme-xl border border-theme-outline-variant bg-theme-surface/30 p-4">
              {renderEmulatorSelector(10)}
              <div
                className={`space-y-3 transition-opacity ${
                  preferredEmulatorProfileId !== 'vice-pet' ? 'opacity-50' : ''
                }`}
              >
                <PathRow
                  label="VICE PET Executable (xpet.exe)"
                  value={platformEmulatorSettings.executablePaths['vice-pet'] ?? ''}
                  onChange={(value) => setPlatformExecutablePath('vice-pet', value)}
                  placeholder="e.g. C:/VICE/xpet.exe"
                  inputIndex={12}
                  browseIndex={13}
                  onBrowse={() => void browsePlatformExecutable('vice-pet')}
                  isMouseMode={isMouseMode}
                  onMouseFocus={onMouseFocus}
                  isFocused={isFocused}
                />
              </div>
              <div
                className={`space-y-3 transition-opacity ${
                  preferredEmulatorProfileId !== 'retroarch-pet' ? 'opacity-50' : ''
                }`}
              >
                <PathRow
                  label={t('settings.retroarchExecutable')}
                  value={platformEmulatorSettings.executablePaths['retroarch-pet'] ?? ''}
                  onChange={(value) => setPlatformExecutablePath('retroarch-pet', value)}
                  placeholder="e.g. C:/RetroArch/retroarch.exe"
                  inputIndex={14}
                  browseIndex={15}
                  onBrowse={() => void browsePlatformExecutable('retroarch-pet')}
                  isMouseMode={isMouseMode}
                  onMouseFocus={onMouseFocus}
                  isFocused={isFocused}
                />
                <PathRow
                  label="RetroArch PET Core"
                  value={platformEmulatorSettings.corePaths['retroarch-pet'] ?? ''}
                  onChange={(value) => setPlatformCorePath('retroarch-pet', value)}
                  placeholder="e.g. C:/RetroArch/cores/vice_xpet_libretro.dll"
                  inputIndex={16}
                  browseIndex={17}
                  onBrowse={() => void browsePlatformCore('retroarch-pet')}
                  isMouseMode={isMouseMode}
                  onMouseFocus={onMouseFocus}
                  isFocused={isFocused}
                />
              </div>
            </div>
          )}

          {isAtari5200 && (
            <div className="space-y-6 rounded-theme-xl border border-theme-outline-variant bg-theme-surface/30 p-4">
              {renderEmulatorSelector(10)}
              <div
                className={`space-y-3 transition-opacity ${
                  preferredEmulatorProfileId !== 'retroarch-atari5200' ? 'opacity-50' : ''
                }`}
              >
                <PathRow
                  label={t('settings.retroarchExecutable')}
                  value={platformEmulatorSettings.executablePaths['retroarch-atari5200'] ?? ''}
                  onChange={(value) => setPlatformExecutablePath('retroarch-atari5200', value)}
                  placeholder="e.g. C:/RetroArch/retroarch.exe"
                  inputIndex={12}
                  browseIndex={13}
                  onBrowse={() => void browsePlatformExecutable('retroarch-atari5200')}
                  isMouseMode={isMouseMode}
                  onMouseFocus={onMouseFocus}
                  isFocused={isFocused}
                />
                <PathRow
                  label="RetroArch Atari 5200 Core"
                  value={platformEmulatorSettings.corePaths['retroarch-atari5200'] ?? ''}
                  onChange={(value) => setPlatformCorePath('retroarch-atari5200', value)}
                  placeholder="e.g. C:/RetroArch/cores/a5200_libretro.dll"
                  inputIndex={14}
                  browseIndex={15}
                  onBrowse={() => void browsePlatformCore('retroarch-atari5200')}
                  isMouseMode={isMouseMode}
                  onMouseFocus={onMouseFocus}
                  isFocused={isFocused}
                />
              </div>
              <div
                className={`space-y-3 transition-opacity ${
                  preferredEmulatorProfileId !== 'altirra-atari5200' ? 'opacity-50' : ''
                }`}
              >
                <PathRow
                  label="Altirra Executable (Altirra64.exe)"
                  value={platformEmulatorSettings.executablePaths['altirra-atari5200'] ?? ''}
                  onChange={(value) => setPlatformExecutablePath('altirra-atari5200', value)}
                  placeholder="e.g. C:/Altirra/Altirra64.exe"
                  inputIndex={16}
                  browseIndex={17}
                  onBrowse={() => void browsePlatformExecutable('altirra-atari5200')}
                  isMouseMode={isMouseMode}
                  onMouseFocus={onMouseFocus}
                  isFocused={isFocused}
                />
              </div>
            </div>
          )}

          {isC128 && (
            <div className="space-y-6 rounded-theme-xl border border-theme-outline-variant bg-theme-surface/30 p-4">
              {renderEmulatorSelector(10)}
              <div
                className={`space-y-3 transition-opacity ${
                  preferredEmulatorProfileId !== 'vice-c128' ? 'opacity-50' : ''
                }`}
              >
                <PathRow
                  label="VICE C128 Executable (x128.exe)"
                  value={platformEmulatorSettings.executablePaths['vice-c128'] ?? ''}
                  onChange={(value) => setPlatformExecutablePath('vice-c128', value)}
                  placeholder="e.g. C:/VICE/x128.exe"
                  inputIndex={12}
                  browseIndex={13}
                  onBrowse={() => void browsePlatformExecutable('vice-c128')}
                  isMouseMode={isMouseMode}
                  onMouseFocus={onMouseFocus}
                  isFocused={isFocused}
                />
              </div>
              <div
                className={`space-y-3 transition-opacity ${
                  preferredEmulatorProfileId !== 'retroarch-c128' ? 'opacity-50' : ''
                }`}
              >
                <PathRow
                  label={t('settings.retroarchExecutable')}
                  value={platformEmulatorSettings.executablePaths['retroarch-c128'] ?? ''}
                  onChange={(value) => setPlatformExecutablePath('retroarch-c128', value)}
                  placeholder="e.g. C:/RetroArch/retroarch.exe"
                  inputIndex={14}
                  browseIndex={15}
                  onBrowse={() => void browsePlatformExecutable('retroarch-c128')}
                  isMouseMode={isMouseMode}
                  onMouseFocus={onMouseFocus}
                  isFocused={isFocused}
                />
                <PathRow
                  label="RetroArch C128 Core"
                  value={platformEmulatorSettings.corePaths['retroarch-c128'] ?? ''}
                  onChange={(value) => setPlatformCorePath('retroarch-c128', value)}
                  placeholder="e.g. C:/RetroArch/cores/vice_x128_libretro.dll"
                  inputIndex={16}
                  browseIndex={17}
                  onBrowse={() => void browsePlatformCore('retroarch-c128')}
                  isMouseMode={isMouseMode}
                  onMouseFocus={onMouseFocus}
                  isFocused={isFocused}
                />
              </div>
            </div>
          )}

          {isAtari7800 && (
            <div className="space-y-6 rounded-theme-xl border border-theme-outline-variant bg-theme-surface/30 p-4">
              {renderEmulatorSelector(10)}
              <div
                className={`space-y-3 transition-opacity ${
                  preferredEmulatorProfileId !== 'retroarch-atari7800' ? 'opacity-50' : ''
                }`}
              >
                <PathRow
                  label={t('settings.retroarchExecutable')}
                  value={platformEmulatorSettings.executablePaths['retroarch-atari7800'] ?? ''}
                  onChange={(value) => setPlatformExecutablePath('retroarch-atari7800', value)}
                  placeholder="e.g. C:/RetroArch/retroarch.exe"
                  inputIndex={12}
                  browseIndex={13}
                  onBrowse={() => void browsePlatformExecutable('retroarch-atari7800')}
                  isMouseMode={isMouseMode}
                  onMouseFocus={onMouseFocus}
                  isFocused={isFocused}
                />
                <PathRow
                  label="RetroArch Atari 7800 Core"
                  value={platformEmulatorSettings.corePaths['retroarch-atari7800'] ?? ''}
                  onChange={(value) => setPlatformCorePath('retroarch-atari7800', value)}
                  placeholder="e.g. C:/RetroArch/cores/prosystem_libretro.dll"
                  inputIndex={14}
                  browseIndex={15}
                  onBrowse={() => void browsePlatformCore('retroarch-atari7800')}
                  isMouseMode={isMouseMode}
                  onMouseFocus={onMouseFocus}
                  isFocused={isFocused}
                />
              </div>
            </div>
          )}

        </div>
      </div>
      <p className="text-[10px] text-theme-text-muted mt-auto pt-2">
        ✅ {t('settings.browseHelp')}
      </p>
    </div>
  );
}
