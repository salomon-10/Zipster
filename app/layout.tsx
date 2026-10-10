import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Zipster — paste a folder tree, get a ZIP',
    template: '%s — Zipster',
  },
  description:
    'Turn a text folder tree into a downloadable ZIP. Paste tree output or plain indentation, preview the structure, and download the archive. No install, no account needed.',
  openGraph: {
    title: 'Zipster',
    description: 'Paste a folder tree, get a ZIP.',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafaf9' },
    { media: '(prefers-color-scheme: dark)', color: '#111113' },
  ],
};

/** Applies the stored theme before first paint so there is no flash. */
const THEME_SCRIPT = `
try {
  var stored = localStorage.getItem('zipster-theme');
  var dark = stored ? stored === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (dark) document.documentElement.classList.add('dark');
} catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-dvh antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: 'font-sans',
            style: {
              borderRadius: '3px',
              fontSize: '13px',
              background: 'rgb(var(--surface))',
              color: 'rgb(var(--ink))',
              border: '1px solid rgb(var(--rail))',
              boxShadow: 'none',
            },
          }}
        />
      </body>
    </html>
  );
}
