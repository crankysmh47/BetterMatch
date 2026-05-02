import type { Metadata } from 'next';
import { Space_Grotesk, IBM_Plex_Mono, Outfit } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import ToastViewport from '@/components/ui/ToastViewport';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-sans' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' });
const ibmPlexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'BetterMatch — Sequence Alignment Platform',
  description:
    'Where sequences meet. Educational white-box visualizer for sequence alignment algorithms.',
  icons: {
    icon: '/genalign-favicon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${outfit.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable} min-h-screen bg-[var(--bg-deep)] text-[var(--text-primary)] font-sans theme-transition`}>
        <div className="genalign-enter-shell-1">
          <Navbar />
        </div>
        <main className="genalign-enter-shell-2 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <div className="genalign-enter-shell-3">
          <Footer />
        </div>
        <ToastViewport />
      </body>
    </html>
  );
}
