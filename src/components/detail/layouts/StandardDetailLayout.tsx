"use client";
import { cleanMetadataValue } from '../../../lib/game-display';
import { PLATFORM_PROFILES } from '../../../lib/platform-capabilities';
import { ImageSlider } from '../../ImageSlider';
import { ExtrasDetail } from '../../ExtrasDetail';
import { MusicianPhoto } from '../../MusicianPhoto';
import { MusicPlayer } from '../../MusicPlayer';
import { StatusRow } from '../../StatusRow';
import { PlayButton } from '../../themes/PlayButton';
import { DetailGameTitle } from '../DetailGameTitle';
import { DetailTitleBanner } from '../DetailTitleBanner';
import type { DetailZone } from '../../../hooks/useDetailNavigation';
import { formatVersionLabel, getVersionVisualKind, getVersionVisualLabel, VersionGlyph, InfoRow, SectionHeading, clampTextLines } from '../detailParts';
import type { DetailViewModel } from '../useUnifiedDetailViewModel';
import { ArcadeSidebar } from './ArcadeSidebar';

/** Default and Arcade Void theme layout. */
export function StandardDetailLayout({ vm }: { vm: DetailViewModel }) {
  const {
    game,
    nav,
    fullscreenLayout,
    t,
    settings,
    resolveMediaPath,
    theme,
    extrasNavigationRef,
    FLUSH_HEIGHT_SCALING,
    boxArtUrl,
    showBoxArtPanel,
    isC64,
    isCyberpunk,
    isArcade,
    panelCls,
    insetPanelCls,
    availableMedia,
    setSelectedMedia,
    activeMedia,
    archiveExtras,
    visibleTab,
    archiveNotes,
    versions,
    selectedVersion,
    detailLayout,
    versionColumns,
    personnel,
    useStackedColumns,
    panelGap,
    panelPadding,
    panelInnerGap,
    heroPaddingX,
    heroPaddingY,
    heroMinHeight,
    detailTitleMax,
    compactButtons,
    sidebarWidth,
    mediaRowHeight,
    lowerRowHeight,
    mainColumnHeight,
    showSoundtrack,
    sidebarTemplateRows,
    infoDensity,
    compactLowerPanelGap,
    compactLowerPanelPadding,
    compactInnerCardPadding,
    alternativeButtonSize,
    alternativeGlyphSize,
    largePanelFocusCls,
    sidebarStatusColumns,
    heroMeta,
    heroSupplementalMeta,
    selectVersion,
    handleFullscreenMedia,
  } = vm;
  return (
                <div
                  className="grid h-full min-h-0"
                  style={{
                    gap: panelGap,
                    gridTemplateRows: `${heroMinHeight}px minmax(0, ${FLUSH_HEIGHT_SCALING ? '1fr' : `${mainColumnHeight}px`})`,
                  }}
                >
                  <DetailTitleBanner
                    artUrl={boxArtUrl}
                    className={`shrink-0 rounded-theme-xl ${
                      isC64 
                        ? 'border-8 border-t-theme-secondary border-l-theme-secondary border-b-theme-outline-variant border-r-theme-outline-variant' 
                        : (theme.effects.steppedBorders ? 'stepped-border' : 'border border-theme-outline')
                    } shadow-[0_28px_80px_rgba(0,0,0,0.34)]`}
                    contentClassName="relative h-full"
                  >
                    <div
                      className="grid h-full min-h-0"
                      style={{
                        gap: panelGap,
                        gridTemplateColumns: useStackedColumns ? '1fr' : `minmax(0,1fr) minmax(280px,${detailLayout?.heroActionWidth ?? 340}px)`,
                        paddingInline: heroPaddingX,
                        paddingBlock: heroPaddingY,
                        background: 'linear-gradient(180deg, rgba(5,10,17,0.28), rgba(5,10,17,0.52))',
                      }}
                    >
                      <div className="flex min-w-0 flex-col justify-end">
                        <div className="mb-4 flex flex-wrap gap-2">
                          {heroMeta.slice(0, 4).map((item) => (
                            <span
                              key={item}
                              className="rounded-theme-md border font-black uppercase tracking-[0.18em]"
                              style={{
                                borderColor: 'var(--theme-outline)',
                                background: 'var(--theme-surface)',
                                color: 'var(--theme-primary)',
                                fontSize: `${detailLayout?.chipFontSize ?? 10}px`,
                                paddingInline: `${detailLayout?.chipPaddingX ?? 10}px`,
                                paddingBlock: `${detailLayout?.chipPaddingY ?? 4}px`,
                              }}
                            >
                              {item}
                            </span>
                          ))}
                        </div>

                        {isC64 && (
                          <p className="font-mono text-xs text-theme-primary mb-2">
                            LOAD &quot;{game.name.substring(0, 16).replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}&quot;,8,1
                          </p>
                        )}

                        {isCyberpunk && (
                          <div className="bg-theme-primary text-theme-surface font-mono text-[10px] px-2 py-0.5 inline-block w-fit mb-2">
                            NOW LOADING: 0x{game.id.toString(16).toUpperCase()}
                          </div>
                        )}

                        {heroSupplementalMeta.length > 0 ? (
                          <div
                            className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-theme-text-muted"
                          >
                            {heroSupplementalMeta.map((item, index) => (
                              <span key={item} className="flex items-center gap-3">
                                {index > 0 ? <span className="opacity-20">•</span> : null}
                                <span>{item}</span>
                              </span>
                            ))}
                          </div>
                        ) : null}

                        <div className="flex items-end gap-3 flex-wrap">
                          <DetailGameTitle
                            className="max-w-4xl text-balance font-black leading-[0.92] tracking-[-0.08em] text-theme-text"
                            isClassic={game.isClassic}
                            title={game.name}
                            style={{ fontSize: `clamp(2rem, 4vw, ${detailTitleMax}px)` }}
                          />
                          {isC64 && (
                            <div className="flex items-center gap-1 bg-theme-primary px-2 py-0.5 text-theme-surface font-mono font-bold text-[10px] uppercase rounded-theme-sm">
                              READY. <span className="theme-cursor-blink"></span>
                            </div>
                          )}
                        </div>

                        <div
                          className="mt-4 font-semibold uppercase tracking-[0.18em] text-theme-primary"
                          style={{ fontSize: `${detailLayout?.subtitleSize ?? 16}px` }}
                        >
                          {[
                            cleanMetadataValue(game.publisher?.name),
                            cleanMetadataValue(game.developer?.name),
                          ]
                            .filter(Boolean)
                            .join(' | ') || 'Unknown'}
                        </div>
                      </div>

                      <div className="flex w-full items-end">
                        <div
                          onMouseEnter={() => nav.hoverZone('play')}
                          className="w-full"
                          style={{ maxWidth: `${detailLayout?.heroActionWidth ?? 340}px` }}
                        >
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
                      </div>
                    </div>
                  </DetailTitleBanner>

                  <div
                    /* pb-16 keeps the panels clear of the fixed BigBoxFooter hint bar, as the C64 and Cyberpunk layouts do. */
                    className="grid min-h-0 items-stretch pb-16"
                    style={{
                      gap: panelGap,
                      gridTemplateColumns: useStackedColumns ? '1fr' : `minmax(0,1fr) ${sidebarWidth}px`,
                    }}
                  >
                    <div className="min-h-0">
                      {visibleTab === 'game' ? (
                        <div
                          className="grid h-full min-h-0"
                          style={{
                            gap: panelGap,
                            gridTemplateRows: isArcade
                              ? '1fr'
                              : (FLUSH_HEIGHT_SCALING
                                  ? `${mediaRowHeight}fr ${lowerRowHeight}fr`
                                  : `${mediaRowHeight}px ${lowerRowHeight}px`),
                          }}
                        >
                          <section className={`${panelCls} overflow-hidden`}>
                            <div
                              className="grid h-full min-h-0"
                              style={{
                                gap: panelGap,
                                gridTemplateColumns: showBoxArtPanel
                                  ? `minmax(0,1fr) ${detailLayout?.boxArtWidth ?? 200}px`
                                  : 'minmax(0,1fr)',
                                padding: panelPadding,
                              }}
                            >
                              <div className="flex h-full min-h-0 w-full flex-col">
                                {/* Media Selector Tabs */}
                                <div className="border-b border-theme-outline/20 pb-2 mb-2 flex items-center justify-between">
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
                                          className={`rounded-theme-sm border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider transition-all ${
                                            isActive
                                              ? 'bg-theme-primary text-theme-surface border-theme-primary shadow-sm shadow-theme-primary/30'
                                              : 'border-theme-outline/20 bg-theme-surface/30 text-theme-text-muted hover:border-theme-primary/60 hover:text-theme-text'
                                          } ${nav.focusCls(zone)}`}
                                        >
                                          {mediaItem.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Media Display Viewport */}
                                <div className="min-h-0 flex-1" style={{ padding: detailLayout?.screenshotViewportPadding ?? 4 }}>
                                  <button
                                    type="button"
                                    onClick={handleFullscreenMedia}
                                    onMouseEnter={() => nav.hoverZone(('media-' + activeMedia) as DetailZone)}
                                    className={`group w-full h-full overflow-hidden flex items-center justify-center rounded-theme-md transition-colors ${nav.focusCls(('media-' + activeMedia) as DetailZone)}`}
                                  >
                                    <div className="w-full h-full rounded-theme-md overflow-hidden bg-black/45 flex items-center justify-center">
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
                                        <div className="h-full w-full flex items-center justify-center">
                                          {boxArtUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                              src={boxArtUrl}
                                              alt={`${game.name} box art`}
                                              className="h-full w-full object-contain"
                                            />
                                          ) : (
                                            <span className="text-xs text-theme-text-muted">No Image</span>
                                          )}
                                        </div>
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

                              {/* Direct Box Art Panel (Only shown in Standard / non-compact layout) */}
                              {showBoxArtPanel && activeMedia !== 'boxfront' ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedMedia('boxfront')}
                                  onMouseEnter={() => nav.hoverZone('media-boxfront')}
                                  className={`${insetPanelCls} overflow-hidden hover:border-theme-primary/50 text-left transition-all ${nav.focusCls('media-boxfront')}`}
                                >
                                  <div className="flex h-full min-h-0 w-full flex-col" style={{ padding: Math.max(10, panelPadding - 4) }}>
                                    <div className="text-[9px] font-black uppercase tracking-[0.24em] text-theme-primary mb-2">
                                      {t('detail.boxArt')}
                                    </div>
                                    <div className="mt-1 flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-theme-md bg-black/35">
                                      {boxArtUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={boxArtUrl} alt={`${game.name} box art`} className="h-full w-full object-contain object-center" />
                                      ) : null}
                                    </div>
                                  </div>
                                </button>
                              ) : null}
                            </div>
                          </section>

                          {!isArcade && (
                            <section className={panelCls}>
                              <div className="flex h-full min-h-0 flex-col" style={{ gap: compactLowerPanelGap, padding: compactLowerPanelPadding }}>
                                <SectionHeading title={t('detail.archiveNotes')} />
                                <div className={insetPanelCls} style={{ padding: compactInnerCardPadding }}>
                                  <div
                                    className="text-theme-text/85 overflow-y-auto"
                                    style={{
                                      ...clampTextLines(detailLayout?.notesLineClamp ?? 4),
                                      fontSize: `${detailLayout?.notesFontSize ?? 13}px`,
                                      lineHeight: 1.5,
                                    }}
                                  >
                                    {archiveNotes}
                                  </div>
                                  {isC64 && (
                                    <div className="mt-2 flex items-center gap-2">
                                      <span className="w-1.5 h-3 bg-theme-primary theme-cursor-blink"></span>
                                      <span className="text-theme-primary font-mono text-[10px]">{t('detail.systemReadyForBoot')}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </section>
                          )}
                        </div>
                      ) : (
                        <section
                          className={`${panelCls} flex h-full min-h-0 min-w-0 flex-col ${largePanelFocusCls} overflow-hidden`}
                        >
                          <div onMouseEnter={() => nav.hoverZone('media-extras')} className="h-full min-h-0 min-w-0 overflow-y-auto custom-scrollbar" style={{ padding: panelPadding }}>
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
                        </section>
                      )}
                    </div>

                    {isArcade ? (
                      <ArcadeSidebar vm={vm} />
                    ) : (
                      <aside className="grid min-h-0" style={{ gap: panelGap, gridTemplateRows: sidebarTemplateRows }}>
                        <section className={panelCls}>
                          <div className="flex h-full min-h-0 flex-col" style={{ gap: compactLowerPanelGap, padding: compactLowerPanelPadding }}>
                            <SectionHeading title={t('detail.alternativeVersions')} />
                            <div
                              className="grid items-center justify-items-start"
                              style={{
                                columnGap: Math.max(10, panelPadding - 2),
                                gridTemplateColumns: `repeat(${Math.max(versionColumns, 1)}, minmax(0, ${alternativeButtonSize}px))`,
                                rowGap: 10,
                              }}
                            >
                              {versions.map((version) => {
                                const selected = selectedVersion?.id === version.id;
                                const visualKind = getVersionVisualKind(version);
                                const visualLabel = getVersionVisualLabel(visualKind);

                                return (
                                  <button
                                    key={version.id}
                                    type="button"
                                    aria-label={`${visualLabel.label}: ${version.label}`}
                                    title={`${visualLabel.label}: ${version.label}`}
                                    onClick={() => {
                                      selectVersion(version.id);
                                      nav.setFocusedZone('versions');
                                    }}
                                    onMouseEnter={() => {
                                      selectVersion(version.id);
                                      nav.hoverZone('versions');
                                    }}
                                    className={`flex items-center justify-center rounded-theme-md border transition-all ${
                                      selected && nav.isFocused('versions') 
                                        ? 'bg-theme-primary/10 border-theme-primary shadow-sm shadow-theme-primary/35' 
                                        : 'border-theme-outline/20 bg-theme-surface/10 hover:border-theme-primary/60'
                                    }`}
                                    style={{
                                      width: `${alternativeButtonSize}px`,
                                      height: `${alternativeButtonSize}px`,
                                    }}
                                  >
                                    <span
                                      className="flex items-center justify-center"
                                      style={{ height: `${alternativeGlyphSize}px`, width: `${alternativeGlyphSize}px` }}
                                    >
                                      <VersionGlyph
                                        kind={visualKind}
                                        accent={selected ? 'var(--theme-primary)' : 'var(--theme-text-muted)'}
                                        className="h-full w-full"
                                      />
                                    </span>
                                  </button>
                                );
                              })}
                            </div>

                            {selectedVersion ? (
                              <div
                                className={insetPanelCls}
                                style={{ paddingInline: compactInnerCardPadding, paddingBlock: Math.max(8, compactInnerCardPadding - 1) }}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div
                                      className="font-black uppercase tracking-[0.24em] text-theme-primary"
                                      style={{ fontSize: `${detailLayout?.alternativeHintFontSize ?? 11}px` }}
                                    >
                                      {getVersionVisualLabel(getVersionVisualKind(selectedVersion)).label}
                                    </div>
                                    <div
                                      className="font-semibold text-theme-text"
                                      style={{ ...clampTextLines(2), lineHeight: 1.3 }}
                                    >
                                      {selectedVersion.label}
                                    </div>
                                  </div>
                                  <div
                                    className="rounded-full border border-theme-primary bg-theme-primary/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.22em] text-theme-primary"
                                  >
                                    {t('common.active')}
                                  </div>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </section>

                        {showSoundtrack && (
                          <section className={panelCls}>
                            <div className="flex h-full min-h-0 flex-col" style={{ gap: Math.max(6, panelInnerGap - 8), padding: Math.max(8, panelPadding - 4) }}>
                              <SectionHeading title={t('detail.soundtrackModule')} />
                              {game.musician ? (
                                <div className="flex items-center gap-2">
                                  {PLATFORM_PROFILES[settings.activePlatformId]?.mediaCapabilities.photos ? (
                                    <MusicianPhoto
                                      className="shrink-0"
                                      musicianName={game.musician.name}
                                      photoFilename={game.musician.photoPath}
                                      style={{ height: `${Math.max(28, (detailLayout?.musicianAvatarSize ?? 40) - 8)}px`, width: `${Math.max(28, (detailLayout?.musicianAvatarSize ?? 40) - 8)}px` }}
                                    />
                                  ) : null}
                                  <div className="min-w-0">
                                    <div className="truncate font-black text-theme-text" style={{ fontSize: `${Math.max(11, (detailLayout?.infoValueFontSize ?? 13) - 1)}px` }}>{game.musician.name}</div>
                                    <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-theme-text-muted">
                                      {settings.activePlatformId === 'c64' ? t('detail.sidComposer') : t('detail.musician')}
                                    </div>
                                  </div>
                                </div>
                              ) : null}
                              <div onMouseEnter={() => nav.hoverZone('sid')} className={nav.focusCls('sid')}>
                                <MusicPlayer platformId={settings.activePlatformId} filename={game.sidFilename} compact={true} />
                              </div>
                            </div>
                          </section>
                        )}

                        <section className={panelCls}>
                          <div className="flex h-full min-h-0 flex-col" style={{ gap: Math.max(10, panelPadding - 2), padding: panelPadding }}>
                            <SectionHeading title={t('detail.versionDetails')} />
                            <div className="grid gap-1.5">
                              <InfoRow label={t('detail.versionBy')} value={cleanMetadataValue(game.versionBy) ?? 'Unknown'} layout={infoDensity} />
                              <InfoRow label="PAL/NTSC" value={cleanMetadataValue(game.vPalNtsc) ?? formatVersionLabel(game)} layout={infoDensity} />
                              <InfoRow label={t('detail.size')} value={cleanMetadataValue(game.vLength) ? `${game.vLength} ${t('detail.blocks')}` : 'Unknown'} layout={infoDensity} />
                              <InfoRow label={t('detail.trainers')} value={cleanMetadataValue(game.vTrainers) ?? '0'} layout={infoDensity} />
                            </div>
                            <div
                              className={`grid rounded-theme-md ${
                                isC64 
                                  ? 'border-8 border-t-theme-outline-variant border-l-theme-outline-variant border-b-theme-secondary border-r-theme-secondary bg-black/45' 
                                  : 'border border-theme-outline/20 bg-black/20'
                              }`}
                              style={{
                                columnGap: 10,
                                gridTemplateColumns: `repeat(${sidebarStatusColumns}, minmax(0,1fr))`,
                                padding: Math.max(8, panelPadding - 2),
                                rowGap: 6,
                              }}
                            >
                              <StatusRow label={t('detail.loadingScreen')} value={game.vLoadingScreen} />
                              <StatusRow label={t('detail.highScoreSaver')} value={game.vHighScoreSaver} />
                              <StatusRow label={t('detail.includedDocs')} value={game.vIncludedDocs} />
                              <StatusRow label={t('detail.trueDriveEmul')} value={game.vTrueDriveEmu} />
                            </div>
                          </div>
                        </section>

                        <section className={panelCls}>
                          <div className="flex h-full min-h-0 flex-col" style={{ gap: Math.max(10, panelPadding - 2), padding: panelPadding }}>
                            <SectionHeading title={t('detail.credits')} />
                            <div className="grid gap-1.5">
                              {personnel.length > 0 ? (
                                personnel.map((entry) => (
                                  <InfoRow
                                    key={`${entry.label}-${entry.value}`}
                                    label={entry.label}
                                    value={entry.value}
                                    layout={infoDensity}
                                  />
                                ))
                              ) : (
                                <div className="rounded-theme-md border border-theme-outline/20 bg-black/20 px-4 py-3 text-sm text-theme-text-muted">
                                  {t('detail.noCreditsAvailable')}
                                </div>
                              )}
                            </div>
                          </div>
                        </section>
                      </aside>
                    )}
                  </div>
                </div>
  );
}
