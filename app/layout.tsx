import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { GatekeeperProvider } from '@/components/providers/GatekeeperProvider';
import { Navigation } from '@/components/Navigation';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rezept- und Einkaufsplaner',
  description: 'Rezepte, Einkaufsliste und Wochenplanung',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Rezeptplaner',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#059669' },
    { media: '(prefers-color-scheme: dark)', color: '#064e3b' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
      </head>
      <body className="bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 antialiased">
        <ServiceWorkerRegistration />
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
