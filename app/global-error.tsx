'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-paper px-4 text-center font-sans">
        <p className="font-mono text-sm text-danger">Something went wrong</p>
        <h1 className="text-lg text-ink">The page hit an unexpected error</h1>
        <p className="max-w-[40ch] text-xs text-muted">
          Nothing was lost in your editor tab. Try again, or reload the page.
        </p>
        <Button size="sm" onClick={reset} className="mt-2">
          Try again
        </Button>
      </body>
    </html>
  );
}
