import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GBBox",
  description: "GameBase Box frontend for browsing, importing, and launching GameBase-style libraries.",
};

import { SettingsProvider } from '@/contexts/SettingsContext';
import { UiSoundRuntime } from '@/components/UiSoundRuntime';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script src="/jsSID.js" defer></script>
      </head>
      <body className="antialiased">
        <SettingsProvider>
          <UiSoundRuntime />
          {children}
        </SettingsProvider>
      </body>
    </html>
  );
}
