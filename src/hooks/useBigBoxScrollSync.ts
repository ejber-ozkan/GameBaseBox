"use client";

import { useCallback, useEffect, useRef } from 'react';
import { exitApp } from '../lib/tauri-bridge';

interface UseBigBoxScrollSyncProps {
  activeRailIndex: number;
  currentFocusedIndex: number;
  currentRailId: string | null;
  currentRailType: string | null;
  onSectionJumpHandled: () => void;
  sectionJumpDirection: 'up' | 'down' | null;
}

const HEADER_HEIGHT_FALLBACK = 320;
const GRID_FOOTER_BUFFER = 80;
const GRID_CENTER_PADDING = 24;

export function useBigBoxScrollSync({
  activeRailIndex,
  currentFocusedIndex,
  currentRailId,
  currentRailType,
  onSectionJumpHandled,
  sectionJumpDirection,
}: UseBigBoxScrollSyncProps) {
  const scrollContainerRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const lastEscTime = useRef<number>(0);
  const lastRail = useRef(activeRailIndex);

  const getHeaderHeight = useCallback(() => {
    return headerRef.current?.offsetHeight ?? HEADER_HEIGHT_FALLBACK;
  }, []);

  const scrollElementBelowHeader = useCallback((element: HTMLElement, extraOffset = 0) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const headerHeight = getHeaderHeight();
    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    const targetTop =
      container.scrollTop + elementRect.top - containerRect.top - headerHeight - extraOffset;

    container.scrollTo({
      top: Math.max(0, targetTop),
      behavior: 'smooth',
    });
  }, [getHeaderHeight]);

  const scrollAlphabetTileToCenterBand = useCallback((tile: HTMLElement, force = false) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const headerHeight = getHeaderHeight();
    const containerRect = container.getBoundingClientRect();
    const tileRect = tile.getBoundingClientRect();
    const visibleTop = containerRect.top + headerHeight + GRID_CENTER_PADDING;
    const visibleBottom = containerRect.bottom - GRID_FOOTER_BUFFER;
    const visibleHeight = visibleBottom - visibleTop;

    if (visibleHeight <= 0) {
      scrollElementBelowHeader(tile, 12);
      return;
    }

    const bandTop = visibleTop + visibleHeight * 0.25;
    const bandBottom = visibleTop + visibleHeight * 0.75;
    const tileCenter = tileRect.top + tileRect.height / 2;

    if (!force && tileCenter >= bandTop && tileCenter <= bandBottom) {
      return;
    }

    const targetCenter = visibleTop + visibleHeight / 2;
    const targetTop =
      container.scrollTop + tileCenter - targetCenter;

    container.scrollTo({
      top: Math.max(0, targetTop),
      behavior: 'smooth',
    });
  }, [getHeaderHeight, scrollElementBelowHeader]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        const now = Date.now();
        if (now - lastEscTime.current < 1000) {
          exitApp();
        }
        lastEscTime.current = now;
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    if (!scrollContainerRef.current) {
      return;
    }

    if (activeRailIndex === -1) {
      onSectionJumpHandled();
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const railElement = currentRailId
      ? scrollContainerRef.current.querySelector(`[data-rail-id="${currentRailId}"]`) as HTMLElement | null
      : null;
    const fallbackRailElement = scrollContainerRef.current.children[activeRailIndex] as HTMLElement | undefined;
    const resolvedRailElement = railElement ?? fallbackRailElement;
    if (!resolvedRailElement) {
      return;
    }

    const anchorElement = resolvedRailElement.querySelector('[data-rail-anchor]') as HTMLElement | null;
    const gridElement = resolvedRailElement.querySelector('.grid');
    const tile = gridElement?.children[currentFocusedIndex] as HTMLElement | undefined;

    if (tile && currentRailType === 'alphabet') {
      scrollAlphabetTileToCenterBand(tile, sectionJumpDirection !== null);
    } else {
      scrollElementBelowHeader(anchorElement ?? resolvedRailElement);
    }

    onSectionJumpHandled();
  }, [
    activeRailIndex,
    currentFocusedIndex,
    currentRailId,
    currentRailType,
    onSectionJumpHandled,
    scrollAlphabetTileToCenterBand,
    scrollElementBelowHeader,
    sectionJumpDirection,
  ]);

  useEffect(() => {
    const isJump = lastRail.current !== activeRailIndex;
    lastRail.current = activeRailIndex;

    if (isJump || activeRailIndex === -1) return;
    if (currentRailType !== 'alphabet' || !scrollContainerRef.current || !currentRailId) return;

    const headerHeight = getHeaderHeight();
    const containerRect = scrollContainerRef.current.getBoundingClientRect();
    const railElement = currentRailId
      ? scrollContainerRef.current.querySelector(`[data-rail-id="${currentRailId}"]`) as HTMLElement | null
      : null;
    const fallbackRailElement = scrollContainerRef.current.children[activeRailIndex] as HTMLElement | undefined;
    const gridElement = (railElement ?? fallbackRailElement)?.querySelector('.grid');
    const tile = gridElement?.children[currentFocusedIndex] as HTMLElement | undefined;

    if (!tile) return;

    const rect = tile.getBoundingClientRect();
    const visibleTop = containerRect.top + headerHeight + GRID_CENTER_PADDING;
    const footerBuffer = GRID_FOOTER_BUFFER;

    if (rect.top < visibleTop) {
      scrollAlphabetTileToCenterBand(tile);
    } else if (rect.bottom > containerRect.bottom - footerBuffer) {
      scrollAlphabetTileToCenterBand(tile);
    }
  }, [
    activeRailIndex,
    currentFocusedIndex,
    currentRailId,
    currentRailType,
    getHeaderHeight,
    scrollAlphabetTileToCenterBand,
    scrollElementBelowHeader,
  ]);

  return {
    scrollContainerRef,
    headerRef,
  };
}
