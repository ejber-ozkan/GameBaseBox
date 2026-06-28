"use client";

import type { ReactNode } from 'react';

interface DetailTitleBannerProps {
  artUrl?: string | null;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function DetailTitleBanner({
  artUrl,
  children,
  className = '',
  contentClassName = '',
}: DetailTitleBannerProps) {
  const hasArtwork = Boolean(artUrl);

  return (
    <div className={`relative overflow-hidden ${className}`}>
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
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.95)_0%,rgba(2,6,23,0.88)_34%,rgba(2,6,23,0.54)_58%,rgba(2,6,23,0.82)_100%),linear-gradient(180deg,rgba(0,0,0,0.14)_0%,rgba(0,0,0,0.54)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_18%,rgba(255,255,255,0.12),transparent_18%),radial-gradient(circle_at_16%_50%,rgba(0,0,0,0.18),transparent_34%)]" />
        </>
      ) : null}
      <div className={`relative z-10 ${contentClassName}`}>{children}</div>
    </div>
  );
}
