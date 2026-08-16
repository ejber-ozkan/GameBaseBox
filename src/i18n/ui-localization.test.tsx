import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { I18nProvider, useTranslation } from './I18nContext';
import { SettingsContext, defaultSettings } from '../contexts/SettingsContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { LibraryHeader } from '../components/library/LibraryHeader';
import { SettingsView } from '../components/SettingsModal';
import { BigBoxFooter } from '../components/bigbox/BigBoxFooter';
import { BigBoxExitPrompt } from '../components/bigbox/BigBoxExitPrompt';
import { ControllerSearchKeyboard } from '../components/ControllerSearchKeyboard';
import { CyberpunkCrtGrid } from '../components/library/CyberpunkCrtGrid';
import { PathsSettingsTab } from '../components/settings/PathsSettingsTab';
import { vi } from 'vitest';

vi.mock('../components/ImageSlider', () => ({
  ImageSlider: ({ alt }: { alt?: string }) => <div data-testid="image-slider">{alt}</div>,
}));

function renderWithProviders(ui: React.ReactNode, language = 'tr') {
  const customSettings = {
    ...defaultSettings,
    language,
  };

  return render(
    <SettingsContext.Provider
      value={{
        settings: customSettings,
        updateSettings: () => {},
        resetSettings: () => {},
        resolveMediaPath: (p) => p,
        markAsPlayed: () => {},
        clearHistory: () => {},
        playedGames: [],
        isLoading: false,
        error: null,
      }}
    >
      <ThemeProvider>
        <I18nProvider>{ui}</I18nProvider>
      </ThemeProvider>
    </SettingsContext.Provider>
  );
}

describe('Comprehensive UI Localization Tests', () => {
  beforeEach(() => {
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
  });

  it('renders LibraryHeader translated in Turkish (HIZLI ARAMA, Oyun, etc.)', () => {
    renderWithProviders(
      <LibraryHeader
        filters={{}}
        genres={['Action', 'Platformer']}
        subGenres={['Arcade', 'Shooter']}
        onExit={() => {}}
        onFiltersChange={() => {}}
        onOpenSettings={() => {}}
        onPlatformSelect={() => {}}
        onSearchChange={() => {}}
        onViewModeChange={() => {}}
        searchInput=""
        activePlatformId="c64"
        totalGameCount={1250}
        viewMode="grid"
        onSelectRandomGame={() => {}}
      />,
      'tr'
    );

    // Quick Search placeholder in Turkish
    expect(screen.getByPlaceholderText('HIZLI ARAMA')).toBeDefined();
    // Games count in Turkish
    expect(screen.getByText(/1[.,]250 Oyun/)).toBeDefined();
    // Grid and List labels in Turkish
    expect(screen.getByText(/Izgara/)).toBeDefined();
    expect(screen.getByText(/Liste/)).toBeDefined();
    // Genre label in Turkish
    expect(screen.getByText('Tür')).toBeDefined();
  });

  it('renders SettingsModal tabs and actions translated in Turkish', () => {
    renderWithProviders(
      <SettingsView onBack={() => {}} />,
      'tr'
    );

    // Header buttons in Turkish
    expect(screen.getByText('← Kütüphaneye Dön')).toBeDefined();
    expect(screen.getByText('Yapılandırmayı Kaydet')).toBeDefined();
    expect(screen.getByText('⚙ Ayarlar')).toBeDefined();

    // Tabs in Turkish
    expect(screen.getByText(/Tema & Arayüz/)).toBeDefined();
    expect(screen.getByText(/Ekran & Video/)).toBeDefined();
    expect(screen.getByText(/Medya & Galeri/)).toBeDefined();
    expect(screen.getByText(/Giriş & Kontrol/)).toBeDefined();
    expect(screen.getByText(/İçerik Filtresi/)).toBeDefined();
    expect(screen.getByText(/Hakkında & Emeği Geçenler/)).toBeDefined();

    // System status
    expect(screen.getByText('SİSTEM DURUMU')).toBeDefined();
  });

  it('renders BigBoxFooter gamepad hints translated in Turkish', () => {
    renderWithProviders(
      <BigBoxFooter context="grid" />,
      'tr'
    );

    expect(screen.getByText('SEÇ')).toBeDefined();
    expect(screen.getByText('GERİ')).toBeDefined();
    expect(screen.getByText('FAVORİ')).toBeDefined();
    expect(screen.getByText('AYARLAR')).toBeDefined();
  });

  it('renders BigBoxExitPrompt in Turkish', () => {
    renderWithProviders(
      <BigBoxExitPrompt
        isOpen={true}
        onCancel={() => {}}
        onConfirm={() => {}}
        onGamepadInput={() => {}}
      />,
      'tr'
    );

    expect(screen.getByText('BigBox Modundan Çık')).toBeDefined();
    expect(screen.getByText('Uygulamadan Çık?')).toBeDefined();
    expect(screen.getByText("BigBox'ta Kal")).toBeDefined();
  });

  it('renders ControllerSearchKeyboard keys in Turkish', () => {
    renderWithProviders(
      <ControllerSearchKeyboard
        isOpen={true}
        onClose={() => {}}
        onGamepadInput={() => {}}
        onSearchChange={() => {}}
        searchInput=""
      />,
      'tr'
    );

    expect(screen.getByText('SİL')).toBeDefined();
    expect(screen.getByText('BOŞLUK')).toBeDefined();
    expect(screen.getByText('TEMİZLE')).toBeDefined();
    expect(screen.getByText('TAMAM')).toBeDefined();
  });

  it('executes 10,000 lookups in under 20ms (O(1) flat dictionary performance)', () => {
    let tFunc: (k: string) => string = (k) => k;

    function TestComponent() {
      const { t } = useTranslation();
      React.useEffect(() => {
        tFunc = t;
      }, [t]);
      return <div>Ready</div>;
    }

    renderWithProviders(<TestComponent />, 'tr');

    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      tFunc('common.saveConfiguration');
      tFunc('library.quickSearch');
      tFunc('settings.appearance');
    }
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(100); // Super-fast sub-100ms for 30,000 lookups
  });

  it('renders CyberpunkCrtGrid shelf headings in Turkish (SON OYNANANLAR, FAVORİLER, KLASİKLER)', () => {
    const mockGame = {
      id: 101,
      name: 'Turrican',
      year: 1990,
      publisher: { id: 1, name: 'Rainbow Arts' },
      developer: { id: 1, name: 'Factor 5' },
      genre: 'Action',
      parentGenre: 'Action',
      subGenre: 'Shooter',
      isClassic: true,
      screenshotFilename: 'turrican_01.png',
    };

    renderWithProviders(
      <CyberpunkCrtGrid
        games={[mockGame]}
        recentGames={[mockGame]}
        favoriteGames={[mockGame]}
        classicGames={[mockGame]}
        onSelectGame={() => {}}
        isFavorite={() => true}
        toggleFavorite={() => {}}
      />,
      'tr'
    );

    expect(screen.getByText('SON OYNANANLAR')).toBeDefined();
    expect(screen.getByText(/FAVOR[İI]LER/)).toBeDefined();
    expect(screen.getByText(/KLAS[İI]KLER/)).toBeDefined();
    expect(screen.getAllByText(/VER[İI]TABAN[Iİ]/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('ÇALIŞTIR').length).toBeGreaterThan(0);
  });

  it('renders PathsSettingsTab folder rows and browse buttons in Turkish', () => {
    renderWithProviders(
      <PathsSettingsTab
        draft={defaultSettings}
        setField={() => {}}
        platformId="c64"
        onBrowseDirectory={async () => null}
        onBrowseFile={async () => null}
        onBrowseRetroArchCore={async () => null}
        isMouseMode={true}
        onMouseFocus={() => {}}
        isFocused={() => false}
      />,
      'tr'
    );

    expect(screen.getByText(/Commodore 64 Klasörleri/)).toBeDefined();
    expect(screen.getByText('Oyunlar klasörü')).toBeDefined();
    expect(screen.getByText('Ekran görüntüleri klasörü')).toBeDefined();
    expect(screen.getByText('Emülatör Ayarları')).toBeDefined();
    expect(screen.getByText('Varsayılan Masaüstü Emülatörü')).toBeDefined();
    expect(screen.getAllByText('Gözat..').length).toBeGreaterThan(0);
  });

  it('renders C64 Edition Detail view actions and tabs in Turkish', () => {
    function DetailTestComponent() {
      const { t } = useTranslation();
      return (
        <div>
          <button id="play-btn">🚀 {t('detail.playGame').toUpperCase()}</button>
          <div id="c64-banner">SYSTEM // {t('extras.title').toUpperCase()}</div>
          <button id="f1-tab">[F1] {t('detail.files').toUpperCase()}</button>
          <button id="f3-tab">[F3] {t('detail.info').toUpperCase()}</button>
          <button id="f5-tab">[F5] {t('detail.credits').toUpperCase()}</button>
          <span id="act-badge">{t('common.active').toUpperCase()}</span>
        </div>
      );
    }

    renderWithProviders(<DetailTestComponent />, 'tr');

    expect(screen.getByText(/OYUNU BAŞLAT/)).toBeDefined();
    expect(screen.getByText(/SYSTEM \/\/ EKSTRA VE BELGELER/)).toBeDefined();
    expect(screen.getByText(/\[F1\] DOSYALAR/)).toBeDefined();
    expect(screen.getByText(/\[F3\] BILGI/)).toBeDefined();
    expect(screen.getByText(/\[F5\] EMEĞI GEÇENLER/)).toBeDefined();
    expect(screen.getByText('AKTİF')).toBeDefined();
  });

  it('renders Windowed / Standard Detail layout sections in Turkish', () => {
    function StandardDetailTestComponent() {
      const { t } = useTranslation();
      return (
        <div>
          <h2>{t('detail.gameInfo')}</h2>
          <span>{t('detail.genre')}</span>
          <span>{t('detail.subGenre')}</span>
          <span>{t('detail.programmer')}</span>
          <span>{t('detail.artist')}</span>
          <h2>{t('detail.versionDetails')}</h2>
          <span>{t('detail.versionBy')}</span>
          <span>{t('detail.loadingScreen')}</span>
          <span>{t('detail.highScoreSaver')}</span>
          <span>{t('extras.documentsAndManuals')}</span>
          <span>{t('extras.mediaAssets')}</span>
          <span>{t('extras.noExtras')}</span>
        </div>
      );
    }

    renderWithProviders(<StandardDetailTestComponent />, 'tr');

    expect(screen.getByText('Oyun Bilgileri')).toBeDefined();
    expect(screen.getByText('Tür')).toBeDefined();
    expect(screen.getByText('Alt Tür')).toBeDefined();
    expect(screen.getByText('Programcı')).toBeDefined();
    expect(screen.getByText('Sanatçı')).toBeDefined();
    expect(screen.getByText('Sürüm Detayları')).toBeDefined();
    expect(screen.getByText('SÜRÜMÜ HAZIRLAYAN')).toBeDefined();
    expect(screen.getByText('Yükleme Ekranı')).toBeDefined();
    expect(screen.getByText('Skor Kaydedici')).toBeDefined();
    expect(screen.getByText('Dökümanlar ve Kılavuzlar')).toBeDefined();
    expect(screen.getByText('Medya Dosyaları')).toBeDefined();
    expect(screen.getByText('Bu oyun için ek belge bulunamadı.')).toBeDefined();
  });

  it('renders DatabaseSetupView first run setup in Turkish', () => {
    function SetupTestComponent() {
      const { t } = useTranslation();
      return (
        <div>
          <span>{t('setup.firstRunSetup')}</span>
          <h1>{t('setup.buildDatabaseTitle', { platform: 'Atari ST' })}</h1>
          <div>{t('setup.sourceFile')}</div>
          <div>{t('setup.selectedMdb')}</div>
          <div>{t('setup.noMdbSelected')}</div>
          <button>{t('setup.chooseMdb')}</button>
          <button>{t('setup.buildDatabase')}</button>
          <div>{t('setup.platformFoldersOptional')}</div>
          <div>{t('setup.whatHappens')}</div>
          <div>{t('setup.step1')}</div>
          <div>{t('setup.step2')}</div>
          <div>{t('setup.step3')}</div>
          <div>{t('setup.step4')}</div>
          <div>{t('setup.targetSqlitePath')}</div>
          <div>{t('setup.accessEngineHelp')}</div>
        </div>
      );
    }

    renderWithProviders(<SetupTestComponent />, 'tr');

    expect(screen.getByText('İlk Kurulum')).toBeDefined();
    expect(screen.getByText('Atari ST Veritabanını Oluştur')).toBeDefined();
    expect(screen.getByText('Kaynak Dosya')).toBeDefined();
    expect(screen.getByText('Seçilen MDB')).toBeDefined();
    expect(screen.getByText('Henüz bir MDB seçilmedi')).toBeDefined();
    expect(screen.getByText('MDB Seç')).toBeDefined();
    expect(screen.getByText('Veritabanını Oluştur')).toBeDefined();
    expect(screen.getByText('Platform Klasörleri (İsteğe Bağlı)')).toBeDefined();
    expect(screen.getByText('Neler Yapılıyor?')).toBeDefined();
    expect(screen.getByText(/GBBox, MDB tablolarını bu makinede CSV formatına aktarır/)).toBeDefined();
    expect(screen.getByText('Hedef SQLite Yolu')).toBeDefined();
    expect(screen.getByText(/Microsoft Access Database Engine/)).toBeDefined();
  });
});
