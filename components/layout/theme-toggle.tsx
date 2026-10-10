'use client';

import { useEffect, useState } from 'react';
import { MoonIcon, SunIcon } from '@/components/ui/icons';

export function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('zipster-theme', next ? 'dark' : 'light');
    } catch {
      // Private browsing blocks storage; the theme still applies for this visit.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="grid h-8 w-8 place-items-center rounded-control text-muted transition-colors duration-[120ms] hover:bg-sunken hover:text-ink"
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {dark ? <MoonIcon width={16} height={16} /> : <SunIcon width={16} height={16} />}
    </button>
  );
}
