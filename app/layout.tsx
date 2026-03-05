import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { GatekeeperProvider } from '@/components/providers/GatekeeperProvider';
import { Navigation } from '@/components/Navigation';
import './globals.css';

export const metadata: Metadata = {
  title: 'Einkaufs- & Rezeptplaner',
  description: 'Einkaufsliste und Rezeptverwaltung',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 antialiased">
        <ThemeProvider>
          <GatekeeperProvider>
            <main className="pb-20 min-h-screen">
              {children}
            </main>
            <Navigation />
          </GatekeeperProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
