"use client";
import { cleanMetadataValue } from '../../../lib/game-display';
import { ImageSlider } from '../../ImageSlider';
import { ExtrasDetail } from '../../ExtrasDetail';
import { MusicPlayer } from '../../MusicPlayer';
import { PlayButton } from '../../themes/PlayButton';
import type { DetailZone } from '../../../hooks/useDetailNavigation';
import { CyberpunkAmigaDownloadBadge, SectionHeading } from '../detailParts';
import type { DetailViewModel } from '../useUnifiedDetailViewModel';

/** Cyberpunk CRT theme layout. */
export function CyberpunkDetailLayout({ vm }: { vm: DetailViewModel }) {
  const {
    game,
    onBack,
    nav,
    onToggleFavorite,
    fullscreenLayout,
    t,
    settings,
    resolveMediaPath,
    canPlayEmbedded,
    selectedVersionId,
    extrasNavigationRef,
    activeSidebarTab,
    setActiveSidebarTab,
    focusedFileIndex,
    setFocusedFileIndex,
    sidebarNotesScrollRef,
    sidebarCreditsScrollRef,
    boxArtUrl,
    availableMedia,
    setSelectedMedia,
    activeMedia,
    archiveExtras,
    visibleTab,
    archiveNotes,
    versions,
    selectedVersion,
    detailLayout,
    personnel,
    panelGap,
    compactButtons,
    showSoundtrack,
    screenshotFilename,
    extraAvailability,
    handleDownloadExtra,
    selectVersion,
    handleLaunchVersion,
    handleFullscreenMedia,
  } = vm;
  return (
                <div
                  className="grid h-full min-h-0"
                  style={{
                    gap: panelGap,
                    gridTemplateRows: `1.1fr 2fr`,
                  }}
                >
                  {/* Bento Top Row (Game Splash + Technical Sidebar) */}
                  <div className="flex min-h-0 w-full" style={{ gap: panelGap }}>
                    {/* Game Splash */}
                    <div className="relative w-2/3 border border-[#353437] shadow-[2px_2px_0_0_#ff003c] bg-[#141417] overflow-hidden flex flex-col justify-end p-6">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c] via-transparent to-transparent z-10"></div>
                      <div className="absolute top-4 left-6 z-20 flex flex-col items-start">
                        <div className="bg-[#ff003c] text-black font-mono text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 inline-block mb-2">
                          {t('detail.nowLoading')}: 0x{game.id.toString(16).toUpperCase()}
                        </div>
                        <h1 className="font-mono text-3xl md:text-4xl uppercase italic text-white font-black tracking-tighter flex items-center gap-2">
                          {game.name} {game.isClassic && <span title="Classic Title">🏆</span>}
                        </h1>
                        <p className="font-mono text-[10px] uppercase text-[#ffb3b2] tracking-[0.2em] mt-1">
                          {game.parentGenre}{' // '}{game.subGenre || 'ACTION'}
                        </p>
                        <p className="font-mono text-[10px] uppercase text-white/60 tracking-wider mt-1">
                          {cleanMetadataValue(game.publisher?.name) || 'Unknown'}{' _ '}{cleanMetadataValue(game.developer?.name) || 'Unknown'}{' // '}{game.year || '----'}
                        </p>
                      </div>
                      <div className="absolute bottom-4 left-6 z-20 flex gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            document.getElementById('play-game-btn')?.click();
                          }}
                          onMouseEnter={() => nav.hoverZone('play')}
                          className={`bg-[#ff003c] hover:bg-white text-black px-6 py-2.5 font-mono font-black text-xs transition-all flex items-center gap-2 border-0 uppercase rounded-none cursor-pointer ${
                            nav.isFocused('play') ? 'ring-2 ring-[#00f0ff] shadow-[0_0_12px_#00f0ff]' : ''
                          }`}
                        >
                          ▶ {t('detail.bootGame')}
                        </button>
                        {canPlayEmbedded && (
                          <button
                            type="button"
                            onClick={() => {
                              document.getElementById('play-browser-btn')?.click();
                            }}
                            onMouseEnter={() => nav.hoverZone('play-web')}
                            className={`border border-[#00f0ff]/40 hover:border-[#00f0ff] text-[#00f0ff] px-6 py-2.5 font-mono font-black text-xs transition-all bg-transparent rounded-none cursor-pointer ${
                              nav.isFocused('play-web') ? 'ring-2 ring-[#00f0ff] shadow-[0_0_12px_#00f0ff]' : ''
                            }`}
                          >
                            ▶ {t('detail.implantedLaunch')}
                          </button>
                        )}
                      </div>
                      <div className="absolute inset-0 grayscale opacity-45 hover:grayscale-0 transition-all duration-700">
                        {boxArtUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={boxArtUrl}
                            alt={game.name}
                            className="w-full h-full object-cover"
                          />
                        ) : screenshotFilename ? (
                          <ImageSlider
                            type="screenshot"
                            filename={screenshotFilename}
                            alt={game.name}
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                      </div>
                    </div>

                    {/* Technical Sidebar */}
                    <div className="w-1/3 border border-[#353437] shadow-[2px_2px_0_0_#ff003c] bg-[#141417] p-4 flex flex-col justify-between relative rounded-none overflow-hidden">
                      <div className="flex justify-between items-start font-mono shrink-0">
                        <div>
                          <div className="text-[10px] text-theme-text-muted/60">{t('detail.systemId')}</div>
                          <div className="font-bold text-[#ffb3b2]">{settings.activePlatformId.toUpperCase()}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-theme-text-muted/60">{t('detail.region')}</div>
                          <div className="font-bold text-[#ffb787]">{(cleanMetadataValue(game.vPalNtsc) || (game.isPal ? 'PAL' : 'NTSC')).toUpperCase()}</div>
                        </div>
                      </div>

                      {/* Main Scrollable details info */}
                      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar my-2 font-mono text-xs space-y-1.5 pr-1">
                        <div className="flex justify-between border-b border-white/5 pb-1">
                          <span className="text-theme-text-muted/60">{t('detail.versionBy')}</span>
                          <span className="font-bold text-right truncate max-w-[130px]">{cleanMetadataValue(game.versionBy) || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-1">
                          <span className="text-theme-text-muted/60">PAL/NTSC</span>
                          <span className="font-bold">{cleanMetadataValue(game.vPalNtsc) || (game.isPal ? 'PAL' : 'NTSC')}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-1">
                          <span className="text-theme-text-muted/60">{t('detail.size')}</span>
                          <span className="font-bold">{cleanMetadataValue(game.vLength) ? `${game.vLength} ${t('detail.blocks')}` : '---'}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-1">
                          <span className="text-theme-text-muted/60">{t('detail.trainers')}</span>
                          <span className="font-bold">{cleanMetadataValue(game.vTrainers) || '0'}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-1">
                          <span className="text-theme-text-muted/60">{t('detail.releaseYear')}</span>
                          <span className="font-bold">{game.year || '---'}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-1">
                          <span className="text-theme-text-muted/60">{t('detail.developer')}</span>
                          <span className="font-bold text-[#ffb3b2] truncate max-w-[130px]" title={cleanMetadataValue(game.developer?.name) || '---'}>
                            {cleanMetadataValue(game.developer?.name) || '---'}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-1">
                          <span className="text-theme-text-muted/60">{t('detail.soundtrack')}</span>
                          <span className="font-bold truncate max-w-[130px]" title={cleanMetadataValue(game.musician?.name) || '---'}>
                            {cleanMetadataValue(game.musician?.name) || '---'}
                          </span>
                        </div>
                      </div>

                      {/* Status indicators from screenshot */}
                      <div className="border border-white/10 bg-black/30 p-2 text-[9px] font-mono grid grid-cols-2 gap-x-2 gap-y-1 shrink-0 mb-2">
                        <div className="flex justify-between items-center">
                          <span className="text-theme-text-muted/60">{t('detail.loadingScreen')}</span>
                          <span className={game.vLoadingScreen === true ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            {game.vLoadingScreen === true ? `✓ ${t('common.yes').toUpperCase()}` : `✗ ${t('common.no').toUpperCase()}`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-theme-text-muted/60">{t('detail.highScoreSaver')}</span>
                          <span className={game.vHighScoreSaver === true ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            {game.vHighScoreSaver === true ? `✓ ${t('common.yes').toUpperCase()}` : `✗ ${t('common.no').toUpperCase()}`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-theme-text-muted/60">{t('detail.includedDocs')}</span>
                          <span className={game.vIncludedDocs === true ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            {game.vIncludedDocs === true ? `✓ ${t('common.yes').toUpperCase()}` : `✗ ${t('common.no').toUpperCase()}`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-theme-text-muted/60">{t('detail.trueDriveEmul')}</span>
                          <span className={game.vTrueDriveEmu === true ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            {game.vTrueDriveEmu === true ? `✓ ${t('common.yes').toUpperCase()}` : `✗ ${t('common.no').toUpperCase()}`}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 font-mono shrink-0">
                        <div className="bg-black/40 p-1.5 border-l-2 border-[#ff003c]">
                          <div className="text-[8px] uppercase text-theme-text-muted/60">{t('detail.integrity')}</div>
                          <div className="text-[10px] font-bold text-[#ff003c]">{t('detail.verified')}</div>
                        </div>
                        <div className="bg-black/40 p-1.5 border-l-2 border-[#ff8000]">
                          <div className="text-[8px] uppercase text-theme-text-muted/60">{t('detail.rarity')}</div>
                          <div className="text-[10px] font-bold text-[#ff8000]">CLASS-A</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bento Bottom Row (Media Gallery or Extras + Tabs & Music Player) */}
                  <div className="flex min-h-0 w-full pb-16" style={{ gap: panelGap }}>
                    {/* Media Gallery / Extras Left Panel */}
                    {visibleTab === 'game' ? (
                      /* Media Gallery */
                      <div className="w-1/2 border border-[#353437] shadow-[2px_2px_0_0_#ff003c] bg-[#141417] p-4 flex flex-col gap-2 rounded-none">
                        <div className="border-b border-white/10 pb-2 flex items-center justify-between">
                          <SectionHeading title={t('detail.media')} />
                          <div className="flex gap-1.5 flex-wrap">
                            {availableMedia.map((mediaItem) => {
                              const zone = ('media-' + mediaItem.id) as DetailZone;
                              const isActive = activeMedia === mediaItem.id;
                              return (
                                <button
                                  key={mediaItem.id}
                                  type="button"
                                  onClick={() => setSelectedMedia(mediaItem.id)}
                                  onMouseEnter={() => nav.hoverZone(zone)}
                                  className={`rounded-none border px-2 py-0.5 text-[9px] font-mono font-black uppercase tracking-wider transition-all ${
                                    isActive
                                      ? 'bg-[#ff003c] text-black border-[#ff003c]'
                                      : 'border-white/10 bg-black/30 text-theme-text-muted hover:border-[#ff003c] hover:text-white'
                                  } ${nav.focusCls(zone)}`}
                                >
                                  {mediaItem.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Main Preview */}
                        <div className="min-h-0 flex-1 relative">
                          <button
                            type="button"
                            onClick={handleFullscreenMedia}
                            onMouseEnter={() => nav.hoverZone(('media-' + activeMedia) as DetailZone)}
                            className={`w-full h-full overflow-hidden flex items-center justify-center rounded-none border border-white/5 transition-all ${
                              nav.isFocused(('media-' + activeMedia) as DetailZone) ? 'ring-2 ring-[#00f0ff] shadow-[0_0_12px_#00f0ff]' : ''
                            }`}
                          >
                            <div className="w-full h-full bg-black/45 flex items-center justify-center relative">
                              <div className="absolute top-2 left-2 z-10 bg-black/60 px-2 py-1 text-[10px] font-mono border border-[#ff003c]/30">
                                {t('detail.imgBuffer')}: {activeMedia.toUpperCase()}
                              </div>
                              {activeMedia === 'videosna' && game.videoSnapFilename ? (
                                <video
                                  autoPlay
                                  className="h-full w-full object-contain"
                                  loop
                                  muted
                                  playsInline
                                  src={resolveMediaPath('screenshot', game.videoSnapFilename)}
                                />
                              ) : activeMedia === 'boxfront' ? (
                                boxArtUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={boxArtUrl}
                                    alt={`${game.name} box art`}
                                    className="h-full w-full object-contain"
                                  />
                                ) : (
                                  <span className="text-xs font-mono text-theme-text-muted">{t('media.noScreenshots')}</span>
                                )
                              ) : (
                                <ImageSlider
                                  type="screenshot"
                                  filename={activeMedia === 'titlescreen' ? game.titlescreenFilename : game.screenshotFilename}
                                  alt={game.name}
                                  className="h-full w-full object-contain"
                                />
                              )}
                            </div>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Extras Detail */
                      <div
                        onMouseEnter={() => nav.hoverZone('media-extras')}
                        className={`w-1/2 border border-[#353437] shadow-[2px_2px_0_0_#ff003c] bg-[#141417] p-4 flex flex-col min-h-0 rounded-none overflow-hidden transition-all ${
                          nav.isFocused('media-extras') ? 'ring-2 ring-[#00f0ff] shadow-[0_0_12px_#00f0ff]' : ''
                        }`}
                      >
                        <SectionHeading title={t('detail.extras')} />
                        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar mt-2 pr-1">
                          <ExtrasDetail
                            game={game}
                            extras={archiveExtras}
                            visibleCategories={['visual', 'docs', 'media']}
                            hideEmptyState
                            enableBigscreenGalleryUX={Boolean(fullscreenLayout)}
                            layoutSpec={detailLayout}
                            onRegisterBigscreenNavigation={(navigation) => {
                              extrasNavigationRef.current = navigation;
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Tabs & Music Player */}
                    <div className="w-1/2 flex flex-col" style={{ gap: panelGap }}>
                      {/* Tabbed Utility */}
                      <div className="flex-1 border border-[#353437] shadow-[2px_2px_0_0_#ff003c] bg-[#141417] flex flex-col rounded-none overflow-hidden">
                        <div className="flex border-b border-white/10 shrink-0">
                          {(['files', 'notes', 'credits'] as const).map((tab) => (
                            <button
                              key={tab}
                              type="button"
                              onClick={() => {
                                setActiveSidebarTab(tab);
                                nav.setFocusedZone('sidebar-tabs');
                              }}
                              onMouseEnter={() => nav.hoverZone('sidebar-tabs')}
                              className={`flex-1 py-3 text-[10px] font-mono font-black uppercase tracking-[0.2em] text-center border-r border-white/10 last:border-r-0 transition-colors ${
                                activeSidebarTab === tab
                                  ? 'bg-[#ff003c]/10 text-[#ff003c] border-t-2 border-t-[#ff003c]'
                                  : 'bg-black/10 text-theme-text-muted hover:bg-black/20 hover:text-white'
                              } ${nav.focusedZone === 'sidebar-tabs' && activeSidebarTab === tab ? 'outline-none ring-2 ring-inset ring-[#00f0ff]' : ''}`}
                            >
                              {tab === 'files' ? t('detail.files') : tab === 'notes' ? t('detail.notes') : t('detail.credits')}
                            </button>
                          ))}
                        </div>

                        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 font-mono text-sm leading-relaxed text-theme-text-muted">
                          {activeSidebarTab === 'files' && (
                            <div className="space-y-2" id="sidebar-files-container">
                              {versions.map((version, index) => {
                                const isSelected = selectedVersionId === version.id;
                                const isFocused = nav.isFocused('sidebar-content') && focusedFileIndex === index;
                                return (
                                  <button
                                    key={version.id}
                                    type="button"
                                    onClick={() => {
                                      if (isSelected) {
                                        void handleLaunchVersion(version);
                                      } else {
                                        selectVersion(version.id);
                                        setFocusedFileIndex(index);
                                        nav.setFocusedZone('sidebar-content');
                                      }
                                    }}
                                    onMouseEnter={() => {
                                      setFocusedFileIndex(index);
                                      nav.hoverZone('sidebar-content');
                                    }}
                                    className={`w-full p-2.5 rounded-none border text-left flex justify-between items-center transition-all ${
                                      isSelected
                                        ? 'bg-[#ff003c]/10 border-[#ff003c] text-[#ff003c]'
                                        : 'bg-black/20 border-[#353437] text-theme-text-muted hover:border-white/40 hover:text-white'
                                    } ${
                                      isFocused
                                        ? 'ring-2 ring-[#00f0ff] shadow-[0_0_12px_#00f0ff] scale-[1.01] brightness-110 z-10'
                                        : ''
                                    }`}
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="text-xs font-bold truncate text-white">{version.label}</div>
                                      <div className="text-[9px] uppercase tracking-wider text-theme-text-muted truncate mt-0.5">
                                        {version.subtitle}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                      <span className="text-[9px] font-mono border border-white/20 px-1 text-theme-text-muted">
                                        {version.tag}
                                      </span>
                                      {settings.activePlatformId === 'amiga' && version.source === 'extras' && (
                                        <CyberpunkAmigaDownloadBadge
                                          version={version}
                                          isAvailable={extraAvailability[version.id] === true}
                                          onDownload={() => void handleDownloadExtra(version)}
                                        />
                                      )}
                                      {isSelected && (
                                        <span className="text-[8px] bg-[#ff003c] text-black px-1 py-0.5 font-black uppercase tracking-wider">
                                          {t('common.active')}
                                        </span>
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {activeSidebarTab === 'notes' && (
                            <div
                              ref={sidebarNotesScrollRef}
                              className={`text-theme-text/85 overflow-y-auto custom-scrollbar leading-relaxed h-full pr-1 p-2 rounded-none transition-all ${
                                nav.isFocused('sidebar-content') ? 'ring-1 ring-[#00f0ff] bg-black/30' : ''
                              }`}
                            >
                              <p className="mb-4">&gt;&gt; {t('detail.criticalEntry')}: {game.name.toUpperCase()}</p>
                              {archiveNotes}
                            </div>
                          )}

                          {activeSidebarTab === 'credits' && (
                            <div
                              ref={sidebarCreditsScrollRef}
                              className={`space-y-1.5 overflow-y-auto custom-scrollbar h-full pr-1 p-2 rounded-none transition-all ${
                                nav.isFocused('sidebar-content') ? 'ring-1 ring-[#00f0ff] bg-black/30' : ''
                              }`}
                            >
                              {personnel.length > 0 ? (
                                personnel.map((entry) => (
                                  <div key={`${entry.label}-${entry.value}`} className="flex justify-between border-b border-white/5 pb-1 text-xs">
                                    <span className="uppercase tracking-wider text-theme-text-muted/60 text-[10px]">{entry.label}</span>
                                    <span className="font-bold text-[#ffb3b2] text-[12px]">{entry.value}</span>
                                  </div>
                                ))
                              ) : (
                                <div className="text-xs text-theme-text-muted">No credits metadata available.</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Soundtrack Module */}
                      {showSoundtrack && (
                        <div className="h-40 shrink-0 border border-[#353437] shadow-[2px_2px_0_0_#ff003c] bg-[#141417] p-4 flex items-center gap-6 overflow-hidden rounded-none relative">
                          <div className="w-24 h-24 bg-black/30 flex items-center justify-center relative border border-white/5 shrink-0">
                            {/* CD Disc Pulsing SVG Icon */}
                            <svg className="w-14 h-14 text-[#ff003c] animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <circle cx="12" cy="12" r="10" />
                              <circle cx="12" cy="12" r="7" strokeDasharray="4 2" />
                              <circle cx="12" cy="12" r="4" />
                              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                            </svg>
                            <div className="absolute bottom-1 right-1 text-[8px] text-theme-text-muted/60 font-mono">VOL: 88%</div>
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-1">
                            <div>
                              <div className="text-[10px] text-[#ffb787] uppercase tracking-widest mb-1 font-mono">{t('media.nowPlaying').toUpperCase()}{' // '}SID_CHIP</div>
                              <h3 className="font-bold text-base truncate font-mono text-white" title={game.musician?.name || 'Unknown'}>
                                {game.name}
                              </h3>
                            </div>
                            
                            <div onMouseEnter={() => nav.hoverZone('sid')} className={`w-full ${nav.focusCls('sid')}`}>
                              <MusicPlayer platformId={settings.activePlatformId} filename={game.sidFilename} compact={true} />
                            </div>

                            {/* Bouncing Visualizer Bars */}
                            <div className="flex gap-1 h-3 items-end">
                              <div className="w-1 bg-[#ff003c] h-full animate-[bounce_1s_infinite]"></div>
                              <div className="w-1 bg-[#ff003c] h-2/3 animate-[bounce_1.2s_infinite]"></div>
                              <div className="w-1 bg-[#ff003c] h-1/2 animate-[bounce_0.8s_infinite]"></div>
                              <div className="w-1 bg-[#ff003c] h-3/4 animate-[bounce_1.5s_infinite]"></div>
                              <div className="w-1 bg-[#ff003c] h-1/3 animate-[bounce_1.1s_infinite]"></div>
                              <div className="w-1 bg-[#ff003c] h-full animate-[bounce_0.9s_infinite]"></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hidden standard play button for action bridging */}
                  <div style={{ display: 'none' }}>
                    <PlayButton
                      game={game}
                      launchTarget={
                        selectedVersion?.relativePath
                          ? {
                              label: selectedVersion.label,
                              relativePath: selectedVersion.relativePath,
                              source: selectedVersion.source,
                            }
                          : null
                      }
                      nav={nav}
                      compact={compactButtons}
                    />
                  </div>

                  {/* Bottom Navigation Bar */}
                  <footer className="fixed bottom-0 left-0 w-full z-50 flex justify-start items-center px-8 py-3 gap-6 bg-[#0a0a0c] border-t border-white/10 font-mono text-xs">
                    <div className="flex items-center gap-2 text-[#ffb787]">
                      <span className="border border-[#ffb787]/40 px-1.5 py-0.5 rounded bg-[#ffb787]/10 font-bold text-[9px]">A</span>
                      <span>SELECT</span>
                    </div>
                    <div onClick={onBack} className="flex items-center gap-2 text-theme-text-muted hover:text-white transition-all cursor-pointer">
                      <span className="border border-white/20 px-1.5 py-0.5 rounded bg-white/5 font-bold text-[9px]">B</span>
                      <span>BACK</span>
                    </div>
                    <div onClick={onToggleFavorite} className="flex items-center gap-2 text-theme-text-muted hover:text-white transition-all cursor-pointer">
                      <span className="border border-white/20 px-1.5 py-0.5 rounded bg-white/5 font-bold text-[9px]">Y</span>
                      <span>FAVORITE</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-theme-text-muted/75">
                      <span className="border border-white/20 px-1.5 py-0.5 rounded bg-white/5 font-bold text-[9px]">LB</span>
                      <span>/</span>
                      <span className="border border-white/20 px-1.5 py-0.5 rounded bg-white/5 font-bold text-[9px]">RB</span>
                      <span className="text-[10px]">SWITCH GAME/EXTRAS</span>
                    </div>
                  </footer>
                </div>
  );
}
