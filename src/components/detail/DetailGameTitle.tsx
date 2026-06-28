"use client";

import type { CSSProperties } from 'react';

interface DetailGameTitleProps {
  className?: string;
  isClassic?: boolean;
  outlined?: boolean;
  style?: CSSProperties;
  title: string;
}

const OUTLINED_TITLE_STYLE = {
  color: '#ffffff',
  textShadow: `
    0 0 2px rgba(0, 0, 0, 0.98),
    1px 1px 0 rgba(0, 0, 0, 0.95),
    -1px 1px 0 rgba(0, 0, 0, 0.95),
    1px -1px 0 rgba(0, 0, 0, 0.95),
    -1px -1px 0 rgba(0, 0, 0, 0.95),
    0 4px 14px rgba(0, 0, 0, 0.82)
  `,
} as const;

export function DetailGameTitle({
  className = '',
  isClassic = false,
  outlined = false,
  style,
  title,
}: DetailGameTitleProps) {
  return (
    <h1 className={className} style={outlined ? { ...OUTLINED_TITLE_STYLE, ...style } : style}>
      {isClassic ? (
        <span aria-hidden="true" className="shrink-0">
          🏆
        </span>
      ) : null}
      <span>{title}</span>
      {isClassic ? (
        <span aria-hidden="true" className="shrink-0">
          🏆
        </span>
      ) : null}
    </h1>
  );
}
