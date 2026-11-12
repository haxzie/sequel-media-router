import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/sidebar';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Composio Forge',
  description: 'One MCP server for image, video and audio generation models.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans antialiased">
        <div className="flex min-h-screen items-start">
          <Sidebar />
          <main className="min-w-0 flex-1 px-10 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
