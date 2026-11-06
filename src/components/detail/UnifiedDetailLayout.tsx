"use client";
import { buildPlatformAssetPath } from '../../lib/platform-launch';
import { C64GameSettings } from '../settings/C64GameSettings';
import { WasmPlayer } from '../WasmPlayer';
import type { DetailLayoutProps } from '../DetailView';
import { C64ShaderBackground } from './C64ShaderBackground';
import { BigBoxFooter } from '../bigbox/BigBoxFooter';
import { useUnifiedDetailViewModel } from './useUnifiedDetailViewModel';
import { CyberpunkDetailLayout } from './layouts/CyberpunkDetailLayout';
import { C64DetailLayout } from './layouts/C64DetailLayout';
import { StandardDetailLayout } from './layouts/StandardDetailLayout';

export function UnifiedDetailLayout(props: DetailLayoutProps) {
  const vm = useUnifiedDetailViewModel(props);
  const {
    game,
    onBack,
    nav,
    isFavorite,
    onToggleFavorite,
    fullscreenLayout,
    t,
    settings,
    launchWarning,
    setLaunchWarning,
    isC64,
    isCyberpunk,
    isArcade,
    availableTabs,
    visibleTab,
    selectTab,
    selectedVersion,
    detailLayout,
    shellMaxWidth,
    topBarPaddingX,
    topBarPaddingY,
    topBarHeight,
    designWidth,
    designHeight,
    renderScale,
    surfaceWidth,
    surfaceHeight,
    showWasm,
    setShowWasm,
    bgStyle,
  } = vm;

  return (
    <div
      className="relative isolate h-full w-full overflow-hidden text-theme-text font-sans selection:bg-theme-primary/30 selection:text-theme-text"
      style={{
        background: bgStyle,
        backgroundColor: isC64 ? 'transparent' : 'var(--theme-background)',
      }}
    >
      {isC64 && settings.c64RasterLines !== false && <C64ShaderBackground />}
      {/* Mesh lines for Arcade void, scanlines for Cyberpunk/others */}
      {isArcade && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(255,255,255,0.018) 0, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 100%), linear-gradient(180deg, rgba(255,255,255,0.018) 0, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 100%)',
            backgroundSize: '88px 88px',
            maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.5), rgba(0,0,0,0.12))',
          }}
        />
      )}

      {isCyberpunk && <div className="scanlines-overlay opacity-60"></div>}

      <div className="relative z-10 flex h-full w-full items-start justify-center overflow-hidden">
        <div
          className="relative"
          style={{
            height: renderScale === 1 ? '100%' : `${surfaceHeight}px`,
            width: renderScale === 1 ? '100%' : `${surfaceWidth}px`,
            maxHeight: '100%',
            maxWidth: '100%',
          }}
        >
          <div
            className={renderScale === 1 ? 'relative h-full w-full' : 'absolute left-0 top-0'}
            style={
              renderScale === 1
                ? undefined
                : {
                    height: `${designHeight}px`,
                    transform: `scale(${renderScale})`,
                    transformOrigin: 'top left',
                    width: `${designWidth}px`,
                  }
            }
          >
            <header
              className={`relative z-10 border-b border-theme-outline/20 backdrop-blur-xl ${
                isC64 ? 'bg-theme-secondary/20' : 'bg-theme-background/88'
              }`}
              style={{ minHeight: topBarHeight }}
            >
              <div
                className="mx-auto flex h-full items-center gap-4"
                style={{ maxWidth: shellMaxWidth, paddingInline: topBarPaddingX, paddingBlock: topBarPaddingY }}
              >
                <div className="flex min-w-0 items-center gap-4">
                  <button
                    onClick={onBack}
                    className={`rounded-theme-xl border border-theme-outline/30 bg-white/[0.04] px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-theme-text/70 transition-colors hover:border-theme-primary/60 hover:text-theme-text`}
                  >
                    {t('navigation.library')}
                  </button>
                  <div className="hidden h-8 w-px bg-theme-outline/20 md:block" />
                  <div className="flex min-w-0 flex-col">
                    <h1
                      className="font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-theme-primary to-theme-secondary leading-none"
                      style={{ fontSize: 'clamp(1.9rem,2.35vw,2.9rem)' }}
                    >
                      GBBox
                    </h1>
                    <div
                      className="ml-1 text-[10px] font-bold uppercase tracking-[0.3em] text-theme-text-muted"
                    >
                      GameBase Box
                    </div>
                  </div>
                </div>

                <nav className="ml-auto flex min-w-0 items-center justify-end gap-2 sm:gap-3">
                  {availableTabs.map((tab) => {
                    const active = visibleTab === tab;
                    const label = tab === 'game' ? t('detail.info') : t('detail.extras');
                    return (
                      <button
                        key={tab}
                        onClick={() => selectTab(tab)}
                        className={`rounded-theme-xl border px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] transition-all sm:text-[11px]`}
                        style={{
                          borderColor: active ? 'var(--theme-primary)' : 'var(--theme-outline)',
                          background: active ? 'var(--theme-primary-container)' : 'rgba(255,255,255,0.03)',
                          color: active ? 'var(--theme-primary)' : 'var(--theme-text-muted)',
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </nav>

                {settings.activePlatformId === 'c64' && <C64GameSettings key={String(game.id)} gameId={String(game.id)} onMouseEnter={() => nav.hoverZone('emulation-settings')} className={nav.focusCls('emulation-settings')} />}
                <button
                  onClick={onToggleFavorite}
                  onMouseEnter={() => nav.hoverZone('favorite')}
                  className={`ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-theme-xl border text-xl transition-all ${nav.focusCls('favorite')}`}
                  style={{
                    borderColor: isFavorite ? 'rgba(244, 114, 182, 0.54)' : 'var(--theme-outline)',
                    background: isFavorite ? 'rgba(236, 72, 153, 0.18)' : 'rgba(255,255,255,0.04)',
                    color: isFavorite ? '#f9a8d4' : 'var(--theme-primary)',
                  }}
                  title={isFavorite ? t('detail.unfavorite') : t('detail.favorite')}
                >
                  {isFavorite ? '♥' : '♡'}
                </button>
              </div>
            </header>

            <div
              className="relative z-10 mx-auto overflow-hidden"
              style={{
                height: `calc(100% - ${topBarHeight}px)`,
                maxWidth: shellMaxWidth,
                paddingInline: detailLayout?.shellPaddingX ?? fullscreenLayout?.contentPaddingX ?? 18,
                paddingBlock: detailLayout?.shellPaddingY ?? fullscreenLayout?.contentGap ?? 18,
              }}
            >
              {isCyberpunk ? (
                <CyberpunkDetailLayout vm={vm} />
              ) : isC64 ? (
                <C64DetailLayout vm={vm} />
              ) : (
                <StandardDetailLayout vm={vm} />
              )}
            </div>
          </div>
        </div>
      </div>

      {detailLayout ? (
        <div className="pointer-events-none absolute bottom-3 right-4 z-20 rounded-full border border-theme-outline/20 bg-black/45 px-3 py-1 text-[10px] font-bold tracking-[0.18em] text-theme-text-muted backdrop-blur-md">
          {detailLayout.debugLabel}
        </div>
      ) : null}

      {launchWarning && (
        <div className="fixed bottom-12 right-6 z-[300] flex max-w-md items-center gap-3 rounded-theme-xl border border-amber-500/60 bg-black/95 px-5 py-3.5 text-xs text-amber-200 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-4 duration-300">
          <span className="text-base shrink-0">⚠️</span>
          <span className="flex-1 leading-relaxed">{launchWarning}</span>
          <button
            type="button"
            onClick={() => setLaunchWarning(null)}
            className="shrink-0 rounded-theme p-1 text-xs text-theme-text-muted hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {showWasm && (
        <WasmPlayer
          romPath={buildPlatformAssetPath(
            settings,
            selectedVersion?.source ?? 'roms',
            selectedVersion?.relativePath || game.filename || game.gameFilename || ''
          )}
          platformId={settings.activePlatformId}
          onClose={() => setShowWasm(false)}
        />
      )}

      {/* Game Detail View Gamepad Footer */}
      <BigBoxFooter context="detail" />
    </div>
  );
}
