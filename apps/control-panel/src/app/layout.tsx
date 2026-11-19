import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ReactGrab } from '@/components/react-grab';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

/*
 * The share card is a baked PNG in public/, not a runtime ImageResponse.
 * It never changes per page, and generating it on the edge would put a
 * font loader and a rasteriser in the request path for a file that is the
 * same every time. Rebuild it with scripts/build-og.mjs.
 */
export const metadata: Metadata = {
  metadataBase: new URL(process.env.BETTER_AUTH_URL ?? 'http://localhost:3317'),
  title: 'Sequel',
  description: 'One MCP server for image, video and audio generation models.',
  openGraph: {
    type: 'website',
    siteName: 'Sequel',
    title: 'Generative media stack for agents',
    description: 'Image, video and audio · 100+ models · one integration',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Sequel — generative media stack for agents' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Generative media stack for agents',
    description: 'Image, video and audio · 100+ models · one integration',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      {/* The shell moved into (dashboard): login and onboarding have no nav. */}
      <body className="min-h-screen font-sans antialiased">
        {children}
        <ReactGrab />
      </body>
    </html>
  );
}
