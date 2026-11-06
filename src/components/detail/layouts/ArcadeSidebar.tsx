"use client";
import { cleanMetadataValue } from '../../../lib/game-display';
import { PLATFORM_PROFILES } from '../../../lib/platform-capabilities';
import { MusicianPhoto } from '../../MusicianPhoto';
import { MusicPlayer } from '../../MusicPlayer';
import { StatusRow } from '../../StatusRow';
import { AmigaDownloadBadge, formatVersionLabel, InfoRow, SectionHeading } from '../detailParts';
import type { DetailViewModel } from '../useUnifiedDetailViewModel';

/** Arcade Void right-hand sidebar: soundtrack, version details and the files/notes/credits tabs. */
export function ArcadeSidebar({ vm }: { vm: DetailViewModel }) {
  const {
    game,
    nav,
    t,
    settings,
    selectedVersionId,
    activeSidebarTab,
    setActiveSidebarTab,
    focusedFileIndex,
    setFocusedFileIndex,
    sidebarNotesScrollRef,
    sidebarCreditsScrollRef,
    panelCls,
    archiveNotes,
    versions,
    detailLayout,
    personnel,
    panelGap,
    panelPadding,
    panelInnerGap,
    sidebarWidth,
    showSoundtrack,
    infoDensity,
    sidebarStatusColumns,
    extraAvailability,
    handleDownloadExtra,
    selectVersion,
  } = vm;
    return (
      <aside className="flex flex-col min-h-0 h-full shrink-0" style={{ gap: panelGap, width: `${sidebarWidth}px` }}>
        {showSoundtrack && (
          <section className={panelCls + " shrink-0"}>
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

        <section className={panelCls + " min-h-0 shrink overflow-y-auto custom-scrollbar"}>
          <div className="flex h-full min-h-0 flex-col" style={{ gap: Math.max(10, panelPadding - 2), padding: panelPadding }}>
            <SectionHeading title={t('detail.versionDetails')} />
            <div className="grid gap-1.5 mt-2">
              <InfoRow label={t('detail.versionBy')} value={cleanMetadataValue(game.versionBy) ?? 'Unknown'} layout={infoDensity} />
              <InfoRow label="PAL/NTSC" value={cleanMetadataValue(game.vPalNtsc) ?? formatVersionLabel(game)} layout={infoDensity} />
              <InfoRow label={t('detail.size')} value={cleanMetadataValue(game.vLength) ? `${game.vLength} ${t('detail.blocks')}` : 'Unknown'} layout={infoDensity} />
              <InfoRow label={t('detail.trainers')} value={cleanMetadataValue(game.vTrainers) ?? '0'} layout={infoDensity} />
            </div>
            <div
              className="grid rounded-theme-md border border-theme-primary/20 bg-black/20 mt-3"
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

        {/* Tabbed Panel */}
        <section className={panelCls + " flex-1 min-h-[132px] flex flex-col"}>
          <div className="flex border-b border-theme-outline/20 shrink-0 select-none">
            <button
              type="button"
              onClick={() => {
                setActiveSidebarTab('files');
                nav.setFocusedZone('sidebar-tabs');
              }}
              onMouseEnter={() => nav.hoverZone('sidebar-tabs')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] border-r border-theme-outline/20 text-center transition-colors ${
                activeSidebarTab === 'files'
                  ? 'bg-theme-primary/10 border-t-2 border-t-theme-primary text-theme-primary'
                  : 'bg-black/10 text-theme-text-muted hover:bg-black/20 hover:text-theme-text'
              } ${nav.focusedZone === 'sidebar-tabs' && activeSidebarTab === 'files' ? 'outline-none ring-2 ring-inset ring-theme-tertiary' : ''}`}
            >
              {t('detail.files').toUpperCase()}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveSidebarTab('notes');
                nav.setFocusedZone('sidebar-tabs');
              }}
              onMouseEnter={() => nav.hoverZone('sidebar-tabs')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] border-r border-theme-outline/20 text-center transition-colors ${
                activeSidebarTab === 'notes'
                  ? 'bg-theme-primary/10 border-t-2 border-t-theme-primary text-theme-primary'
                  : 'bg-black/10 text-theme-text-muted hover:bg-black/20 hover:text-theme-text'
              } ${nav.focusedZone === 'sidebar-tabs' && activeSidebarTab === 'notes' ? 'outline-none ring-2 ring-inset ring-theme-tertiary' : ''}`}
            >
              {t('detail.notes').toUpperCase()}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveSidebarTab('credits');
                nav.setFocusedZone('sidebar-tabs');
              }}
              onMouseEnter={() => nav.hoverZone('sidebar-tabs')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-center transition-colors ${
                activeSidebarTab === 'credits'
                  ? 'bg-theme-primary/10 border-t-2 border-t-theme-primary text-theme-primary'
                  : 'bg-black/10 text-theme-text-muted hover:bg-black/20 hover:text-theme-text'
              } ${nav.focusedZone === 'sidebar-tabs' && activeSidebarTab === 'credits' ? 'outline-none ring-2 ring-inset ring-theme-tertiary' : ''}`}
            >
              {t('detail.credits').toUpperCase()}
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3">
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
                        selectVersion(version.id);
                        setFocusedFileIndex(index);
                        nav.setFocusedZone('sidebar-content');
                      }}
                      onMouseEnter={() => {
                        setFocusedFileIndex(index);
                        nav.hoverZone('sidebar-content');
                      }}
                      className={`w-full p-2.5 rounded-lg border text-left flex justify-between items-center transition-all ${
                        isSelected
                          ? 'bg-theme-primary/10 border-theme-primary/40 text-theme-primary'
                          : 'bg-black/20 border-theme-outline/30 text-theme-text-muted hover:border-theme-outline/65 hover:text-theme-text'
                      } ${
                        isFocused
                          ? 'ring-2 ring-[var(--theme-tertiary)] shadow-[0_0_12px_var(--theme-tertiary)] scale-[1.01] brightness-110 z-10'
                          : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate text-theme-text">{version.label}</div>
                        <div className="text-[9px] uppercase tracking-wider text-theme-text-muted truncate mt-0.5">
                          {version.subtitle}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span className="text-[9px] font-mono border border-theme-outline/50 px-1 rounded text-theme-text-muted">
                          {version.tag}
                        </span>
                        {settings.activePlatformId === 'amiga' && version.source === 'extras' && (
                          <AmigaDownloadBadge
                            version={version}
                            isAvailable={extraAvailability[version.id] === true}
                            onDownload={() => void handleDownloadExtra(version)}
                          />
                        )}
                        {isSelected && (
                          <span className="text-[8px] bg-theme-primary text-[#00363e] px-1 py-0.5 rounded font-black uppercase tracking-wider">
                            ACT
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
                className="text-theme-text/85 overflow-y-auto custom-scrollbar leading-relaxed h-full"
                style={{
                  fontSize: `${detailLayout?.notesFontSize ?? 13}px`,
                }}
              >
                {archiveNotes}
              </div>
            )}

            {activeSidebarTab === 'credits' && (
              <div
                ref={sidebarCreditsScrollRef}
                className="space-y-1.5 overflow-y-auto custom-scrollbar h-full"
              >
                {personnel.length > 0 ? (
                  personnel.map((entry) => (
                    <div key={`${entry.label}-${entry.value}`} className="flex justify-between border-b border-theme-outline/20 pb-1 text-xs">
                      <span className="font-mono uppercase tracking-wider text-theme-text-muted text-[10px]">{entry.label}</span>
                      <span className="font-bold text-theme-primary text-[12px]">{entry.value}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-theme-text-muted">No credits metadata available.</div>
                )}
              </div>
            )}
          </div>
        </section>
      </aside>
    );
}
