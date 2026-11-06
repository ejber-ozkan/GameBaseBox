"use client";
import { cleanMetadataValue } from '../../../lib/game-display';
import { ImageSlider } from '../../ImageSlider';
import { ExtrasDetail } from '../../ExtrasDetail';
import { MusicPlayer } from '../../MusicPlayer';
import { DetailTitleBanner } from '../DetailTitleBanner';
import type { DetailZone } from '../../../hooks/useDetailNavigation';
import { AmigaDownloadBadge, formatVersionLabel } from '../detailParts';
import type { DetailViewModel } from '../useUnifiedDetailViewModel';

/** Commodore 64 Edition theme layout (bevelled monitor panels, F-key tabs). */
export function C64DetailLayout({ vm }: { vm: DetailViewModel }) {
  const {
    game,
    nav,
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
    c64TitlePanelHeight,
    showSoundtrack,
    extraAvailability,
    handleDownloadExtra,
    selectVersion,
    handlePlayWeb,
    handleLaunchVersion,
  } = vm;
    const loadCommand = `LOAD "${game.name.substring(0, 16).replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}",8,1`;
    const publisher = cleanMetadataValue(game.publisher?.name) || 'UNKNOWN';
    const developer = cleanMetadataValue(game.developer?.name) || 'UNKNOWN';
    const year = game.year || '----';
    const genre = [game.parentGenre, game.subGenre].filter(Boolean).join(' / ') || 'GENRE';
    const metadataStr = `PUBLISHER: ${publisher} _ DEVELOPER: ${developer} // ${year} // ${genre}`;
    
    return (
      <div
        className="grid h-full min-h-0"
        style={{ gap: panelGap, gridTemplateRows: `${c64TitlePanelHeight}px minmax(0, 1fr)` }}
      >
        
        {/* Game Title Header (Internal retro monitor bezel header) */}
        <DetailTitleBanner
          artUrl={boxArtUrl}
          className="border-8 border-t-theme-secondary border-l-theme-secondary border-b-theme-outline-variant border-r-theme-outline-variant bg-[#1f1f1f] shrink-0 select-none"
          contentClassName="h-full"
          dataTestId="c64-detail-title-panel"
        >
          <div className="flex h-full items-center justify-between p-4">
            <div className="flex min-w-0 flex-1 flex-col pr-4">
              <h1 className="font-mono text-[30px] font-black text-theme-primary tracking-tighter uppercase leading-none truncate flex items-center gap-2">
                <span>{game.name}</span>
                {game.isClassic && <span title="Legendary Classic" className="text-xl">🏆</span>}
              </h1>
              <p className="font-mono text-[10px] text-theme-text-muted mt-1.5 uppercase font-bold tracking-wider">{loadCommand}</p>
              <p className="font-mono text-[10px] text-theme-text mt-2 uppercase font-bold tracking-wide border-t border-theme-outline-variant/30 pt-1.5 truncate">
                {metadataStr}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 font-mono shrink-0">
              <div className="flex items-center gap-1 bg-theme-primary px-2 py-0.5 text-black font-black text-[10px] uppercase font-bold">
                READY. <span className="theme-cursor-blink"></span>
              </div>
              <div className="text-[8px] text-theme-text-muted opacity-70">SYS 64738</div>
            </div>
          </div>
        </DetailTitleBanner>

        {/* Two-Column Grid */}
        <div className="grid min-h-0 items-stretch pb-16" style={{ gap: panelGap, gridTemplateColumns: `minmax(0, 1.4fr) 1fr` }}>
          
          {/* Left Column (Play buttons + Hero/Extras Viewport) */}
          <div className="flex flex-col min-h-0" style={{ gap: panelGap }}>
            {/* Retro Bevel Play Buttons */}
            <div className="flex gap-4 shrink-0 font-mono">
              <button
                type="button"
                id="play-game-btn"
                onClick={() => handleLaunchVersion(selectedVersion)}
                onMouseEnter={() => nav.hoverZone('play')}
                className={`flex-1 py-3 px-4 flex items-center justify-between transition-all cursor-pointer border-6 text-xs font-bold uppercase ${
                  nav.isFocused('play')
                    ? 'bg-theme-tertiary border-t-white border-l-white border-b-black border-r-black text-black font-black'
                    : 'bg-theme-primary border-t-white border-l-white border-b-[#07006c] border-r-[#07006c] text-[#1100a9]'
                }`}
              >
                <span className="flex items-center gap-1.5">🚀 {t('detail.playGame').toUpperCase()}</span>
                <span className="text-[9px] opacity-75">{settings.activePlatformId.toUpperCase()}</span>
              </button>

              {canPlayEmbedded && (
                <button
                  type="button"
                  id="play-browser-btn"
                  onClick={() => document.getElementById('play-browser-btn-hidden')?.click()}
                  onMouseEnter={() => nav.hoverZone('play-web')}
                  className={`flex-1 py-3 px-4 flex items-center justify-between transition-all cursor-pointer border-6 text-xs font-bold uppercase ${
                    nav.isFocused('play-web')
                      ? 'bg-theme-tertiary border-t-white border-l-white border-b-black border-r-black text-black font-black'
                      : 'bg-[#1f1f1f] border-t-theme-primary border-l-theme-primary border-b-black border-r-black text-theme-primary'
                  }`}
                >
                  <span className="flex items-center gap-1.5">🎮 {t('detail.playEmbedded').toUpperCase()}</span>
                  <span className="text-[9px] opacity-75">EMBEDDED</span>
                </button>
              )}
              {/* Hidden plays in default render DOM to link correctly */}
              <div style={{ display: 'none' }}>
                <button id="play-browser-btn-hidden" onClick={handlePlayWeb} />
              </div>
            </div>

            {visibleTab === 'game' ? (
              /* Hero container */
              <div className="flex-1 min-h-0 overflow-hidden bg-black relative border-8 border-t-theme-secondary border-l-theme-secondary border-b-theme-outline-variant border-r-theme-outline-variant">
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
                      className="h-full w-full object-contain mx-auto"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center font-mono text-xs text-theme-text-muted">NO COVER IMAGE</div>
                  )
                ) : (
                  <ImageSlider
                    type="screenshot"
                    filename={activeMedia === 'titlescreen' ? game.titlescreenFilename : game.screenshotFilename}
                    alt={game.name}
                    className="h-full w-full object-contain"
                  />
                )}
                
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent">
                  <span className="font-mono text-[10px] text-theme-tertiary uppercase font-bold tracking-wider">
                    {t('detail.developer').toUpperCase()}: {cleanMetadataValue(game.developer?.name) || 'UNKNOWN'}
                  </span>
                </div>
              </div>
            ) : (
              /* Extras Viewport */
              <div
                onMouseEnter={() => nav.hoverZone('media-extras')}
                className={`flex-1 min-h-0 overflow-hidden bg-black flex flex-col p-4 border-8 border-t-theme-secondary border-l-theme-secondary border-b-theme-outline-variant border-r-theme-outline-variant ${
                  nav.isFocused('media-extras') ? 'ring-2 ring-theme-primary' : ''
                }`}
              >
                <div className="flex items-center justify-between border-b-4 border-theme-outline-variant pb-1.5 mb-2 select-none font-mono">
                  <span className="text-[10px] font-bold text-theme-primary">SYSTEM {'//'} {t('extras.title').toUpperCase()}</span>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar font-mono">
                  <ExtrasDetail
                    game={game}
                    extras={archiveExtras}
                    visibleCategories={['visual', 'docs', 'media']}
                    hideEmptyState
                    enableBigscreenGalleryUX={true}
                    layoutSpec={detailLayout}
                    onRegisterBigscreenNavigation={(navigation) => {
                      extrasNavigationRef.current = navigation;
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Column (Gallery + Soundtrack + Sidebar tabbed content) */}
          <div className="flex flex-col min-h-0" style={{ gap: panelGap }}>
            
            {/* Gallery Row */}
            <div className="h-[76px] grid grid-cols-4 gap-2 shrink-0 select-none">
              {availableMedia.map((mediaItem) => {
                const zone = ('media-' + mediaItem.id) as DetailZone;
                const isActive = activeMedia === mediaItem.id;
                
                return (
                  <button
                    key={mediaItem.id}
                    type="button"
                    onClick={() => setSelectedMedia(mediaItem.id)}
                    onMouseEnter={() => nav.hoverZone(zone)}
                    className={`h-full overflow-hidden bg-black flex items-center justify-center transition-all cursor-pointer ${
                      isActive
                        ? 'border-4 border-theme-tertiary scale-102 ring-2 ring-theme-primary'
                        : 'border-4 border-theme-outline-variant hover:border-theme-primary/60'
                    } ${nav.isFocused(zone) ? 'border-4 border-theme-tertiary brightness-110' : ''}`}
                  >
                    {mediaItem.id === 'videosna' && game.videoSnapFilename ? (
                      <div className="text-[9px] font-mono font-bold text-theme-primary leading-none">VIDEO</div>
                    ) : mediaItem.id === 'boxfront' ? (
                      boxArtUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={boxArtUrl} alt="Cover preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-[9px] font-mono font-bold text-theme-text-muted leading-none">COVER</div>
                      )
                    ) : (
                      <ImageSlider
                        type="screenshot"
                        filename={mediaItem.id === 'titlescreen' ? game.titlescreenFilename : game.screenshotFilename}
                        alt="Gallery preview"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Soundtrack Module */}
            {showSoundtrack && (
              <div onMouseEnter={() => nav.hoverZone('sid')} className={`shrink-0 ${nav.focusCls('sid')}`}>
                <MusicPlayer platformId={settings.activePlatformId} filename={game.sidFilename} compact={true} />
              </div>
            )}

            {/* Consolidated Tabbed Panel */}
            <div className="flex-1 min-h-0 flex flex-col bg-[#1f1f1f] border-8 border-t-theme-secondary border-l-theme-secondary border-b-theme-outline-variant border-r-theme-outline-variant">
              {/* Tabs Bar */}
              <div className="flex border-b-4 border-theme-outline-variant bg-[#131313] shrink-0 select-none">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSidebarTab('files');
                    nav.setFocusedZone('sidebar-tabs');
                  }}
                  onMouseEnter={() => nav.hoverZone('sidebar-tabs')}
                  className={`flex-1 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-center border-r-4 border-theme-outline-variant transition-colors cursor-pointer ${
                    activeSidebarTab === 'files'
                      ? 'bg-theme-secondary text-[#131313]'
                      : 'bg-[#131313] text-theme-primary hover:bg-[#1f1f1f]'
                  } ${nav.focusedZone === 'sidebar-tabs' && activeSidebarTab === 'files' ? 'outline-none ring-2 ring-inset ring-theme-tertiary' : ''}`}
                >
                  [F1] {t('detail.files').toUpperCase()}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSidebarTab('notes');
                    nav.setFocusedZone('sidebar-tabs');
                  }}
                  onMouseEnter={() => nav.hoverZone('sidebar-tabs')}
                  className={`flex-1 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-center border-r-4 border-theme-outline-variant transition-colors cursor-pointer ${
                    activeSidebarTab === 'notes'
                      ? 'bg-theme-secondary text-[#131313]'
                      : 'bg-[#131313] text-theme-primary hover:bg-[#1f1f1f]'
                  } ${nav.focusedZone === 'sidebar-tabs' && activeSidebarTab === 'notes' ? 'outline-none ring-2 ring-inset ring-theme-tertiary' : ''}`}
                >
                  [F3] {t('detail.info').toUpperCase()}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSidebarTab('credits');
                    nav.setFocusedZone('sidebar-tabs');
                  }}
                  onMouseEnter={() => nav.hoverZone('sidebar-tabs')}
                  className={`flex-1 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-center transition-colors cursor-pointer ${
                    activeSidebarTab === 'credits'
                      ? 'bg-theme-secondary text-[#131313]'
                      : 'bg-[#131313] text-theme-primary hover:bg-[#1f1f1f]'
                  } ${nav.focusedZone === 'sidebar-tabs' && activeSidebarTab === 'credits' ? 'outline-none ring-2 ring-inset ring-theme-tertiary' : ''}`}
                >
                  [F5] {t('detail.credits').toUpperCase()}
                </button>
              </div>

              {/* Content viewport */}
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 font-mono">
                
                {/* FILES TAB */}
                {activeSidebarTab === 'files' && (
                  <div className="space-y-1.5" id="sidebar-files-container">
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
                          onDoubleClick={() => {
                            void handleLaunchVersion(version);
                          }}
                          onMouseEnter={() => {
                            setFocusedFileIndex(index);
                            nav.hoverZone('sidebar-content');
                          }}
                          className={`w-full p-2 text-left flex justify-between items-center transition-all cursor-pointer border-4 text-xs ${
                            isSelected
                              ? 'bg-theme-secondary-container border-theme-primary text-theme-primary font-bold'
                              : 'bg-black/25 border-theme-outline-variant text-theme-text-muted hover:border-theme-primary/50 hover:text-theme-text'
                          } ${
                            isFocused
                              ? 'border-theme-tertiary bg-theme-primary/5 scale-[1.01] z-10'
                              : ''
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-[11px] font-bold truncate">{version.label}</div>
                            <div className="text-[9px] uppercase tracking-wider text-theme-text-muted truncate mt-0.5">
                              {version.subtitle}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <span className="text-[8px] border border-theme-outline/50 px-1 text-theme-text-muted">
                              {version.tag}
                            </span>
                            {version.source === 'extras' && settings.activePlatformId === 'amiga' && (
                              <AmigaDownloadBadge
                                version={version}
                                isAvailable={extraAvailability[version.id] === true}
                                onDownload={() => void handleDownloadExtra(version)}
                              />
                            )}
                            {isSelected && (
                              <span className="text-[8px] bg-theme-tertiary text-black px-1 font-bold">
                                {t('common.active').toUpperCase()}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* INFO TAB */}
                {activeSidebarTab === 'notes' && (
                  <div className="flex flex-col h-full min-h-0" style={{ gap: panelGap }}>
                    {/* Technical stats grid */}
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 border-4 border-theme-outline-variant bg-[#131313] p-2 text-[10px]">
                      <div className="flex justify-between border-b border-theme-outline-variant pb-0.5">
                        <span className="text-theme-text-muted">PAL/NTSC:</span>
                        <span className="text-theme-primary font-bold">{(cleanMetadataValue(game.vPalNtsc) || formatVersionLabel(game)).toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between border-b border-theme-outline-variant pb-0.5">
                        <span className="text-theme-text-muted">SIZE:</span>
                        <span className="text-theme-primary font-bold">{cleanMetadataValue(game.vLength) ? `${game.vLength} BLKS` : 'UNKNOWN'}</span>
                      </div>
                      <div className="flex justify-between border-b border-theme-outline-variant pb-0.5">
                        <span className="text-theme-text-muted">TRAINERS:</span>
                        <span className="text-theme-primary font-bold">{cleanMetadataValue(game.vTrainers) || '0'}</span>
                      </div>
                      <div className="flex justify-between border-b border-theme-outline-variant pb-0.5">
                        <span className="text-theme-text-muted">LOAD SCR:</span>
                        <span className="text-theme-primary font-bold">{game.vLoadingScreen ? 'YES' : 'NO'}</span>
                      </div>
                      <div className="flex justify-between pb-0.5">
                        <span className="text-theme-text-muted">HI-SCORE:</span>
                        <span className="text-theme-primary font-bold">{game.vHighScoreSaver ? 'YES' : 'NO'}</span>
                      </div>
                      <div className="flex justify-between pb-0.5">
                        <span className="text-theme-text-muted">TRUE DRV:</span>
                        <span className="text-theme-primary font-bold">{game.vTrueDriveEmu ? 'YES' : 'NO'}</span>
                      </div>
                    </div>
                    {/* Notes text */}
                    <div
                      ref={sidebarNotesScrollRef}
                      className="text-theme-text/85 overflow-y-auto custom-scrollbar leading-relaxed text-[11px] select-text flex-1 font-mono uppercase"
                    >
                      <p className="text-theme-primary mb-2 font-bold">&gt;&gt; SYSTEM ARCHIVE MEMO:</p>
                      <p className="uppercase">{archiveNotes}</p>
                      <div className="mt-4 flex items-center gap-1">
                        <span className="w-1.5 h-3 bg-theme-primary theme-cursor-blink"></span>
                        <span className="text-[10px] text-theme-primary">SYSTEM_READY_FOR_BOOT</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* CREDITS TAB */}
                {activeSidebarTab === 'credits' && (
                  <div
                    ref={sidebarCreditsScrollRef}
                    className="space-y-1 overflow-y-auto custom-scrollbar h-full pr-1"
                  >
                    {personnel.length > 0 ? (
                      personnel.map((entry) => (
                        <div key={`${entry.label}-${entry.value}`} className="flex justify-between border-b border-theme-outline-variant pb-1.5 text-xs">
                          <span className="uppercase text-theme-text-muted text-[9px]">{entry.label}</span>
                          <span className="font-bold text-theme-primary text-[11px] uppercase">{entry.value}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-theme-text-muted">No credits metadata available.</div>
                    )}
                  </div>
                )}

              </div>
            </div>

          </div>

        </div>

      </div>
    );
}
