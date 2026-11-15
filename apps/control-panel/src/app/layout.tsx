import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Composio Sequel',
  description: 'One MCP server for image, video and audio generation models.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      {/* The shell moved into (dashboard): login and onboarding have no nav. */}
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
