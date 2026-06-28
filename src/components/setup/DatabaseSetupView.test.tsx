import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PlatformFolderSettings } from '@/types/platform';
import { DatabaseSetupView } from './DatabaseSetupView';

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

describe('DatabaseSetupView', () => {
  it('renders and edits an Atari 800 extras folder field', () => {
    const onFolderChange = vi.fn();
    const onBrowseFolder = vi.fn();

    render(
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
    render(
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
});
