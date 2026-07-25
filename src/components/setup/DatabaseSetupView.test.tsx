import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PlatformFolderSettings } from '@/types/platform';
import { DatabaseSetupView } from './DatabaseSetupView';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

const atariFolders: PlatformFolderSettings = {
  platformId: 'atari800',
  gamesPath: 'E:/Atari/Games',
  musicPath: 'E:/Atari/Music',
  photosPath: 'E:/Atari/Photos',
  screenshotsPath: 'E:/Atari/Screenshots',
  extrasPath: 'E:/Atari/Extras',
  boxArtPath: '',
  videosPath: '',
};

const atari2600Folders: PlatformFolderSettings = {
  platformId: 'atari2600',
  gamesPath: 'F:/Atari2600/Games',
  musicPath: '',
  photosPath: '',
  screenshotsPath: 'F:/Atari2600/Screenshots',
  extrasPath: 'F:/Atari2600/Extras',
  boxArtPath: '',
  videosPath: '',
};

const zxSpectrumFolders: PlatformFolderSettings = {
  platformId: 'zxspectrum',
  gamesPath: 'E:/ZX/Games',
  musicPath: 'E:/ZX/Music',
  photosPath: 'E:/ZX/Musician Photos',
  screenshotsPath: 'E:/ZX/Screenshots',
  extrasPath: 'E:/ZX/Extras',
  boxArtPath: '',
  videosPath: '',
};

const bbcMicroFolders: PlatformFolderSettings = {
  platformId: 'bbcmicro',
  gamesPath: 'E:/BBC/Games',
  musicPath: 'E:/BBC/Music',
  photosPath: '',
  screenshotsPath: 'E:/BBC/Screenshots',
  extrasPath: 'E:/BBC/Extras',
  boxArtPath: '',
  videosPath: '',
};

const amigaFolders: PlatformFolderSettings = {
  platformId: 'amiga',
  gamesPath: 'E:/Amiga/Games',
  musicPath: 'E:/Amiga/Music',
  photosPath: '',
  screenshotsPath: 'E:/Amiga/Screenshots',
  extrasPath: 'E:/Amiga/Extras',
  boxArtPath: '',
  videosPath: '',
};

const atariStFolders: PlatformFolderSettings = {
  platformId: 'atarist',
  gamesPath: 'E:/AtariST/Games',
  musicPath: 'E:/AtariST/Music',
  photosPath: '',
  screenshotsPath: 'E:/AtariST/Screenshots',
  extrasPath: 'E:/AtariST/Extras',
  boxArtPath: '',
  videosPath: '',
};

const vic20Folders: PlatformFolderSettings = {
  platformId: 'vic20',
  gamesPath: 'E:/VIC20/Games',
  musicPath: 'E:/VIC20/Music',
  photosPath: '',
  screenshotsPath: 'E:/VIC20/Screenshots',
  extrasPath: 'E:/VIC20/Extras',
  boxArtPath: '',
  videosPath: '',
};

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <SettingsProvider>
      <ThemeProvider>
        {ui}
      </ThemeProvider>
    </SettingsProvider>
  );
}

describe('DatabaseSetupView', () => {
  it('shows progress and allows a running import to be cancelled', () => {
    const onCancelImport = vi.fn();

    renderWithProviders(
      <DatabaseSetupView
        dbPath="atari800"
        error={null}
        folderSettings={atariFolders}
        importProgress={{ percent: 48, stage: 'Importing tables' }}
        importResult={null}
        isImporting
        mdbPath="E:/Atari/Atari 800 v12.mdb"
        onBrowse={vi.fn()}
        onBrowseFolder={vi.fn()}
        onCancelImport={onCancelImport}
        onFolderChange={vi.fn()}
        onImport={vi.fn()}
        platformName="Atari 800"
        requiredFolderKeys={['gamesPath', 'musicPath', 'photosPath', 'screenshotsPath', 'extrasPath']}
      />,
    );

    expect(screen.getByText('Importing tables')).toBeTruthy();
    expect(screen.getByText('48%')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel Import' }));
    expect(onCancelImport).toHaveBeenCalledOnce();
  });

  it('renders and edits an Atari 800 extras folder field', () => {
    const onFolderChange = vi.fn();
    const onBrowseFolder = vi.fn();

    renderWithProviders(
      <DatabaseSetupView
        dbPath="atari800"
        error={null}
        folderSettings={atariFolders}
        importResult={null}
        isImporting={false}
        mdbPath="E:/Atari/Atari 800 v12.mdb"
        onBrowse={vi.fn()}
        onBrowseFolder={onBrowseFolder}
        onFolderChange={onFolderChange}
        onImport={vi.fn()}
        platformName="Atari 800"
        requiredFolderKeys={['gamesPath', 'musicPath', 'photosPath', 'screenshotsPath', 'extrasPath']}
      />,
    );

    const extrasInput = screen.getByPlaceholderText('Select Extras folder');
    fireEvent.change(extrasInput, { target: { value: 'E:/Atari/More Extras' } });

    expect((extrasInput as HTMLInputElement).value).toBe('E:/Atari/Extras');
    expect(onFolderChange).toHaveBeenCalledWith('extrasPath', 'E:/Atari/More Extras');

    fireEvent.click(screen.getAllByText('Browse').at(-1)!);
    expect(onBrowseFolder).toHaveBeenCalledWith('extrasPath');
  });

  it('renders Atari 2600 import folders without music or photos fields', () => {
    renderWithProviders(
      <DatabaseSetupView
        dbPath="atari2600"
        error={null}
        folderSettings={atari2600Folders}
        importResult={null}
        isImporting={false}
        mdbPath="F:/Atari2600/Atari 2600.mdb"
        onBrowse={vi.fn()}
        onBrowseFolder={vi.fn()}
        onFolderChange={vi.fn()}
        onImport={vi.fn()}
        platformName="Atari 2600"
        requiredFolderKeys={['gamesPath', 'screenshotsPath', 'extrasPath']}
      />,
    );

    expect(screen.getByPlaceholderText('Select Games folder')).toBeTruthy();
    expect(screen.getByPlaceholderText('Select Screenshots folder')).toBeTruthy();
    expect(screen.getByPlaceholderText('Select Extras folder')).toBeTruthy();
    expect(screen.queryByPlaceholderText('Select Music folder')).toBeNull();
    expect(screen.queryByPlaceholderText('Select Photos folder')).toBeNull();
  });

  it('mentions GameBaseZX and SpeccyMania while rendering ZX Spectrum import folders', () => {
    renderWithProviders(
      <DatabaseSetupView
        dbPath="zxspectrum"
        error={null}
        folderSettings={zxSpectrumFolders}
        importResult={null}
        isImporting={false}
        mdbPath="E:/ZX/Sinclair ZX Spectrum v6.mdb"
        onBrowse={vi.fn()}
        onBrowseFolder={vi.fn()}
        onFolderChange={vi.fn()}
        onImport={vi.fn()}
        platformName="ZX Spectrum"
        platformAliases={['GameBaseZX', 'SpeccyMania']}
        requiredFolderKeys={['extrasPath', 'gamesPath', 'screenshotsPath', 'photosPath', 'musicPath']}
      />,
    );

    expect(screen.getByText(/GameBaseZX/)).toBeTruthy();
    expect(screen.getByText(/SpeccyMania/)).toBeTruthy();
    expect(screen.getByPlaceholderText('Select Extras folder')).toBeTruthy();
    expect(screen.getByPlaceholderText('Select Games folder')).toBeTruthy();
    expect(screen.getByPlaceholderText('Select Screenshots folder')).toBeTruthy();
    expect(screen.getByPlaceholderText('Select Musician Photos folder')).toBeTruthy();
    expect(screen.getByPlaceholderText('Select Music folder')).toBeTruthy();
  });

  it('renders BBC Micro import folders without photos', () => {
    renderWithProviders(
      <DatabaseSetupView
        dbPath="bbcmicro"
        error={null}
        folderSettings={bbcMicroFolders}
        importResult={null}
        isImporting={false}
        mdbPath="E:/BBC/BBC Micro.mdb"
        onBrowse={vi.fn()}
        onBrowseFolder={vi.fn()}
        onFolderChange={vi.fn()}
        onImport={vi.fn()}
        platformName="Acorn BBC Micro"
        requiredFolderKeys={['extrasPath', 'gamesPath', 'screenshotsPath', 'musicPath']}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Build Your Acorn BBC Micro Database' })).toBeTruthy();
    expect(screen.getByPlaceholderText('Select Extras folder')).toBeTruthy();
    expect(screen.getByPlaceholderText('Select Games folder')).toBeTruthy();
    expect(screen.getByPlaceholderText('Select Screenshots folder')).toBeTruthy();
    expect(screen.getByPlaceholderText('Select Music folder')).toBeTruthy();
    expect(screen.queryByPlaceholderText('Select Photos folder')).toBeNull();
  });

  it('renders Amiga import folders without photos', () => {
    renderWithProviders(
      <DatabaseSetupView
        dbPath="amiga"
        error={null}
        folderSettings={amigaFolders}
        importResult={null}
        isImporting={false}
        mdbPath="E:/Amiga/Commodore Amiga.mdb"
        onBrowse={vi.fn()}
        onBrowseFolder={vi.fn()}
        onFolderChange={vi.fn()}
        onImport={vi.fn()}
        platformName="Commodore Amiga"
        requiredFolderKeys={['extrasPath', 'gamesPath', 'screenshotsPath', 'musicPath']}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Build Your Commodore Amiga Database' })).toBeTruthy();
    expect(screen.getByPlaceholderText('Select Extras folder')).toBeTruthy();
    expect(screen.getByPlaceholderText('Select Games folder')).toBeTruthy();
    expect(screen.getByPlaceholderText('Select Screenshots folder')).toBeTruthy();
    expect(screen.getByPlaceholderText('Select Music folder')).toBeTruthy();
    expect(screen.queryByPlaceholderText('Select Photos folder')).toBeNull();
  });

  it('renders Atari ST import folders without photos', () => {
    renderWithProviders(
      <DatabaseSetupView
        dbPath="atarist"
        error={null}
        folderSettings={atariStFolders}
        importResult={null}
        isImporting={false}
        mdbPath="E:/AtariST/Atari ST.mdb"
        onBrowse={vi.fn()}
        onBrowseFolder={vi.fn()}
        onFolderChange={vi.fn()}
        onImport={vi.fn()}
        platformName="Atari ST"
        requiredFolderKeys={['extrasPath', 'gamesPath', 'screenshotsPath', 'musicPath']}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Build Your Atari ST Database' })).toBeTruthy();
    expect(screen.getByPlaceholderText('Select Extras folder')).toBeTruthy();
    expect(screen.getByPlaceholderText('Select Games folder')).toBeTruthy();
    expect(screen.getByPlaceholderText('Select Screenshots folder')).toBeTruthy();
    expect(screen.getByPlaceholderText('Select Music folder')).toBeTruthy();
    expect(screen.queryByPlaceholderText('Select Photos folder')).toBeNull();
  });

  it('renders VIC-20 import folders without photos', () => {
    renderWithProviders(
      <DatabaseSetupView
        dbPath="vic20"
        error={null}
        folderSettings={vic20Folders}
        importResult={null}
        isImporting={false}
        mdbPath="E:/VIC20/Commodore VIC-20.mdb"
        onBrowse={vi.fn()}
        onBrowseFolder={vi.fn()}
        onFolderChange={vi.fn()}
        onImport={vi.fn()}
        platformName="Commodore VIC-20"
        requiredFolderKeys={['extrasPath', 'gamesPath', 'screenshotsPath', 'musicPath']}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Build Your Commodore VIC-20 Database' })).toBeTruthy();
    expect(screen.getByPlaceholderText('Select Extras folder')).toBeTruthy();
    expect(screen.getByPlaceholderText('Select Games folder')).toBeTruthy();
    expect(screen.getByPlaceholderText('Select Screenshots folder')).toBeTruthy();
    expect(screen.getByPlaceholderText('Select Music folder')).toBeTruthy();
    expect(screen.queryByPlaceholderText('Select Photos folder')).toBeNull();
  });

  it('displays warning dialog when Build Database is pressed without a Games folder', () => {
    const onImport = vi.fn();
    const emptyGamesFolders: PlatformFolderSettings = {
      ...vic20Folders,
      gamesPath: '',
    };

    renderWithProviders(
      <DatabaseSetupView
        dbPath="vic20"
        error={null}
        folderSettings={emptyGamesFolders}
        importResult={null}
        isImporting={false}
        mdbPath="E:/VIC20/Commodore VIC-20.mdb"
        onBrowse={vi.fn()}
        onBrowseFolder={vi.fn()}
        onFolderChange={vi.fn()}
        onImport={onImport}
        platformName="Commodore VIC-20"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Build Database' }));

    expect(onImport).not.toHaveBeenCalled();
    expect(screen.getByText('No Games Folder Selected')).toBeTruthy();
    expect(screen.getByText(/no games will be launchable/)).toBeTruthy();

    // Click Go Back
    fireEvent.click(screen.getByRole('button', { name: /Go Back/ }));
    expect(screen.queryByText('No Games Folder Selected')).toBeNull();
    expect(onImport).not.toHaveBeenCalled();

    // Open again and click Proceed Anyway
    fireEvent.click(screen.getByRole('button', { name: 'Build Database' }));
    fireEvent.click(screen.getByRole('button', { name: 'Proceed Anyway' }));
    expect(onImport).toHaveBeenCalledOnce();
  });
});
