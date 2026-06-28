"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useGamepad } from '../hooks/useGamepad';
import { useInputMode } from '../hooks/useInputMode';
import { openDirectoryDialog, openFileDialog } from '../lib/tauri-bridge';
import { playUiSoundEffect } from '../lib/ui-sound-effects';
import { AboutSettingsTab } from './settings/AboutSettingsTab';
import { AppearanceSettingsTab } from './settings/AppearanceSettingsTab';
import { ContentSettingsTab } from './settings/ContentSettingsTab';
import { MaintenanceSettingsTab } from './settings/MaintenanceSettingsTab';
import { PathsSettingsTab } from './settings/PathsSettingsTab';
import { ScrapersSettingsTab } from './settings/ScrapersSettingsTab';
import {
  getEditableSettings,
  getPlatformIdFromSettingsTab,
  getSettingsItemCount,
  getSettingsTabs,
  type EditableSettings,
  type SettingsTabId,
} from './settings/types';

interface SettingsViewProps {
  onBack: () => void;
  onOpenTigerHeli?: () => void | Promise<void>;
}

type HeaderZone = 'tabs' | 'content' | 'header';

export function SettingsView({ onBack, onOpenTigerHeli }: SettingsViewProps) {
  const { settings, updateSettings } = useSettings();
  const { isMouseMode, onGamepadInput } = useInputMode();
  const isFullscreenLayout = settings.isFullscreen;
  const [draft, setDraft] = useState<EditableSettings>(() => getEditableSettings(settings));
  const [activeTab, setActiveTab] = useState<SettingsTabId>('appearance');
  const [navZone, setNavZone] = useState<HeaderZone>('tabs');
  const [focusedIdx, setFocusedIdx] = useState(0);
  const settingsTabs = useMemo(() => getSettingsTabs(settings), [settings]);
  const activePlatformPathsId = getPlatformIdFromSettingsTab(activeTab);

  useEffect(() => {
    setDraft(getEditableSettings(settings));
  }, [settings]);

  useEffect(() => {
    if (!settingsTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab('appearance');
      setFocusedIdx(0);
      setNavZone('tabs');
    }
  }, [activeTab, settingsTabs]);

  const setField = useCallback(<K extends keyof EditableSettings>(key: K, value: EditableSettings[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(() => {
    updateSettings(draft);
    onBack();
  }, [draft, onBack, updateSettings]);

  const focusContent = useCallback(
    (index: number) => {
      if (isMouseMode) {
        setNavZone('content');
        setFocusedIdx(index);
      }
    },
    [isMouseMode],
  );

  const isContentFocused = useCallback(
    (index: number) => navZone === 'content' && focusedIdx === index,
    [navZone, focusedIdx],
  );

  const browseDirectory = useCallback(async () => openDirectoryDialog(), []);

  const browseFile = useCallback(async () => openFileDialog(), []);

  const moveFocus = useCallback(
    (dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
      void playUiSoundEffect('menu-move-1', 0.28);

      if (navZone === 'header') {
        if (dir === 'DOWN') {
          setNavZone('tabs');
          setFocusedIdx(0);
          return;
        }
        if (dir === 'RIGHT') {
          setFocusedIdx((prev) => (prev === 0 ? 1 : 0));
          return;
        }
        if (dir === 'LEFT') {
          setFocusedIdx((prev) => (prev === 1 ? 0 : 1));
          return;
        }
        return;
      }

      if (dir === 'UP' && focusedIdx === 0) {
        setNavZone('header');
        setFocusedIdx(0);
        return;
      }

      if (dir === 'RIGHT' && navZone === 'tabs') {
        setNavZone('content');
        setFocusedIdx(0);
        return;
      }
      if (dir === 'LEFT' && navZone === 'content') {
        setNavZone('tabs');
        setFocusedIdx(settingsTabs.findIndex((tab) => tab.id === activeTab));
        return;
      }

      if (navZone === 'tabs') {
        const max = settingsTabs.length - 1;
        if (dir === 'UP') setFocusedIdx((prev) => (prev > 0 ? prev - 1 : max));
        if (dir === 'DOWN') setFocusedIdx((prev) => (prev < max ? prev + 1 : 0));
      } else {
        const max = getSettingsItemCount(activeTab) - 1;
        if (dir === 'UP') setFocusedIdx((prev) => (prev > 0 ? prev - 1 : max));
        if (dir === 'DOWN') setFocusedIdx((prev) => (prev < max ? prev + 1 : 0));
      }
    },
    [activeTab, focusedIdx, navZone, settingsTabs],
  );

  const handleSelect = useCallback(() => {
    if (navZone === 'header') {
      if (focusedIdx === 0) {
        onBack();
      } else {
        handleSave();
      }
      return;
    }

    if (navZone === 'tabs') {
      setActiveTab(settingsTabs[focusedIdx].id);
      setNavZone('content');
      setFocusedIdx(0);
      return;
    }

    const element = document.querySelector(`.focus-idx-${focusedIdx}`) as HTMLElement | null;
    if (element) {
      element.focus();
      element.click();
    }
  }, [focusedIdx, handleSave, navZone, onBack, settingsTabs]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      onGamepadInput();
      if (event.key === 'Escape') {
        event.preventDefault();
        handleSave();
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        moveFocus('UP');
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        moveFocus('DOWN');
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        moveFocus('LEFT');
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        moveFocus('RIGHT');
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        handleSelect();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleSelect, moveFocus, onGamepadInput]);

  useGamepad({
    onButtonDown: (button) => {
      onGamepadInput();
      if (button === 'B' || button === 'START') handleSave();
      if (button === 'UP' || button === 'DOWN' || button === 'LEFT' || button === 'RIGHT') moveFocus(button);
      if (button === 'A') handleSelect();

      if (button === 'RB' || button === 'LB') {
        const tabIds = settingsTabs.map((tab) => tab.id);
        const currentIndex = tabIds.indexOf(activeTab);
        const nextIndex =
          button === 'RB'
            ? (currentIndex + 1) % tabIds.length
            : (currentIndex - 1 + tabIds.length) % tabIds.length;
        setActiveTab(tabIds[nextIndex]);
        if (navZone === 'tabs') {
          setFocusedIdx(nextIndex);
        }
      }
    },
  });

  const contentNavProps = {
    isMouseMode,
    onMouseFocus: focusContent,
    isFocused: isContentFocused,
  };

  return (
    <div className="flex h-full min-h-screen w-full flex-col overflow-hidden bg-gray-950">
      <div
        className={`sticky top-0 z-10 flex items-center justify-between border-b border-gray-800 bg-gray-900 shadow-lg ${
          isFullscreenLayout ? 'px-8 py-5 xl:px-12' : 'p-4'
        }`}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            onMouseEnter={() => isMouseMode && (setNavZone('header'), setFocusedIdx(0))}
            className={`rounded border px-4 py-2 text-sm font-medium uppercase tracking-wider transition-colors ${
              navZone === 'header' && focusedIdx === 0
                ? 'bg-white text-black'
                : 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            ← Back to Library
          </button>
          <h2 className="ml-4 text-xl font-black uppercase tracking-widest text-white">⚙ Settings</h2>
        </div>

        <button
          onClick={handleSave}
          onMouseEnter={() => isMouseMode && (setNavZone('header'), setFocusedIdx(1))}
          className={`rounded px-6 py-2 text-sm font-bold uppercase tracking-widest shadow-lg transition ${
            navZone === 'header' && focusedIdx === 1
              ? 'bg-white text-black'
              : 'bg-blue-600 text-white hover:bg-blue-500'
          }`}
        >
          Save Configuration
        </button>
      </div>

      <div
        className={`flex flex-1 overflow-hidden ${
          isFullscreenLayout
            ? 'w-full gap-8 px-8 py-8 xl:px-12 2xl:gap-10'
            : 'mx-auto max-w-[1600px] gap-6 p-6'
        }`}
      >
        <div
          className={`flex flex-col gap-2 overflow-y-auto pb-10 ${
            isFullscreenLayout ? 'w-[320px] shrink-0 pr-4 2xl:w-[360px]' : 'w-64 pr-2'
          }`}
        >
          <div className="mb-2 px-2 text-xs font-bold uppercase tracking-widest text-gray-500">
            Configuration Categories
          </div>

          {settingsTabs.map((tab, idx) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              onMouseEnter={() => isMouseMode && (setNavZone('tabs'), setFocusedIdx(idx))}
              className={`flex items-center gap-3 rounded-lg border p-4 text-left transition ${
                (activeTab === tab.id && navZone !== 'tabs') || (navZone === 'tabs' && focusedIdx === idx)
                  ? 'border-blue-500 bg-gray-800 text-white shadow-lg shadow-blue-900/20'
                  : 'border-gray-800 bg-gray-900/50 text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              <span className="font-semibold">{tab.label}</span>
            </button>
          ))}
        </div>

        <div
          className={`relative flex flex-1 flex-col overflow-y-auto rounded-xl border border-gray-800 bg-gray-900 shadow-2xl ${
            isFullscreenLayout ? 'min-w-0' : ''
          }`}
        >
          <div className="absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

          <div className={isFullscreenLayout ? 'p-10 xl:p-12 2xl:p-14' : 'p-8'}>
            {activeTab === 'appearance' && (
              <AppearanceSettingsTab draft={draft} setField={setField} {...contentNavProps} />
            )}
            {activeTab === 'content' && (
              <ContentSettingsTab draft={draft} setField={setField} {...contentNavProps} />
            )}
            {activePlatformPathsId && (
              <PathsSettingsTab
                draft={draft}
                setField={setField}
                platformId={activePlatformPathsId}
                onBrowseDirectory={browseDirectory}
                onBrowseFile={browseFile}
                {...contentNavProps}
              />
            )}
            {activeTab === 'scrapers' && (
              <ScrapersSettingsTab draft={draft} setField={setField} {...contentNavProps} />
            )}
            {activeTab === 'maintenance' && <MaintenanceSettingsTab />}
            {activeTab === 'about' && (
              <AboutSettingsTab onOpenTigerHeli={onOpenTigerHeli} {...contentNavProps} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
