"use client";

import type { ReactNode } from 'react';

interface DetailTitleBannerProps {
  artUrl?: string | null;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  dataTestId?: string;
}

export function DetailTitleBanner({
  artUrl,
  children,
  className = '',
  contentClassName = '',
  dataTestId,
}: DetailTitleBannerProps) {
  const hasArtwork = Boolean(artUrl);

  return (
    <div className={`relative overflow-hidden ${className}`} data-testid={dataTestId}>
      {hasArtwork ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={artUrl ?? ''}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover object-right opacity-100"
            decoding="async"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-theme-background via-theme-background/88 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-theme-background/60 to-transparent" />
        </>
      ) : null}
      <div className={`relative z-10 ${contentClassName}`}>{children}</div>
    </div>
  );
}
