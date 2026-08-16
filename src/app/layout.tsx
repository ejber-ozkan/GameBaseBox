import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GBBox",
  description: "GameBase Box frontend for browsing, importing, and launching GameBase-style libraries.",
};

import { SettingsProvider } from '@/contexts/SettingsContext';
import { I18nProvider } from '@/i18n';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ThemeDecorator } from '@/components/ThemeDecorator';
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
          <I18nProvider>
            <ThemeProvider>
              <ThemeDecorator>
                <UiSoundRuntime />
                {children}
              </ThemeDecorator>
            </ThemeProvider>
          </I18nProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
