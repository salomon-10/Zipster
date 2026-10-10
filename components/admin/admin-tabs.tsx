'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/templates', label: 'Templates' },
];

export function AdminTabs() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 border-b border-rail">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'border-b-2 px-3 py-2 text-xs font-medium transition-colors duration-[120ms]',
              active ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink',
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
