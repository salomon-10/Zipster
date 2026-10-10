'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { User } from '@/lib/db/types';
import { Button, ButtonLink } from '@/components/ui/button';
import { LogOutIcon, MenuIcon, CloseIcon, ShieldIcon } from '@/components/ui/icons';
import { logoutAction } from '@/app/actions/auth';
import { ThemeToggle } from './theme-toggle';
import { Logo } from './logo';

const LINKS = [
  { href: '/', label: 'Editor', exact: true },
  { href: '/templates', label: 'Templates' },
  { href: '/import', label: 'Import a repo' },
];

export function SiteHeader({ user }: { user: User | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = user
    ? [{ href: '/dashboard', label: 'Dashboard' }, ...LINKS]
    : LINKS;

  return (
    <header className="sticky top-0 z-40 border-b border-rail/70 bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-shell items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex min-h-11 items-center" aria-label="Zipster home">
          <Logo />
        </Link>

        <nav className="ml-2 hidden items-center gap-0.5 md:flex">
          {nav.map((link) => {
            const active =
              'exact' in link && link.exact
                ? pathname === link.href
                : pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-control px-2.5 py-1.5 text-xs transition-colors duration-[120ms]',
                  active ? 'text-ink' : 'text-muted hover:text-ink',
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />

          {user ? (
            <div className="hidden items-center gap-2 md:flex">
              {user.role === 'admin' ? (
                <ButtonLink href="/admin" variant="ghost" size="sm">
                  <ShieldIcon width={15} height={15} />
                  Admin
                </ButtonLink>
              ) : null}
              <Link
                href="/settings"
                className="flex items-center gap-2 rounded-control px-2 py-1 text-xs text-ink-soft transition-colors duration-[120ms] hover:bg-sunken"
              >
                <Avatar user={user} />
                {user.username}
              </Link>
              <form action={logoutAction}>
                <Button type="submit" variant="ghost" size="sm" aria-label="Sign out">
                  <LogOutIcon width={15} height={15} />
                </Button>
              </form>
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <ButtonLink href="/login" variant="ghost" size="sm">
                Sign in
              </ButtonLink>
              <ButtonLink href="/register" variant="secondary" size="sm">
                Create account
              </ButtonLink>
            </div>
          )}

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="grid h-11 w-11 place-items-center rounded-control text-ink-soft transition-colors duration-[120ms] hover:bg-sunken md:hidden"
          >
            {open ? <CloseIcon width={17} height={17} /> : <MenuIcon width={17} height={17} />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-rail bg-surface px-4 py-3 md:hidden">
          <ul className="rail-list space-y-1">
            {nav.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block py-1.5 text-sm text-ink-soft"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            {user ? (
              <>
                <li>
                  <Link href="/settings" onClick={() => setOpen(false)} className="block py-1.5 text-sm text-ink-soft">
                    Settings
                  </Link>
                </li>
                {user.role === 'admin' ? (
                  <li>
                    <Link href="/admin" onClick={() => setOpen(false)} className="block py-1.5 text-sm text-ink-soft">
                      Admin
                    </Link>
                  </li>
                ) : null}
              </>
            ) : null}
          </ul>

          <div className="mt-3 flex gap-2">
            {user ? (
              <form action={logoutAction} className="w-full">
                <Button type="submit" variant="secondary" size="sm" className="w-full">
                  Sign out
                </Button>
              </form>
            ) : (
              <>
                <ButtonLink href="/login" variant="secondary" size="sm" className="flex-1">
                  Sign in
                </ButtonLink>
                <ButtonLink href="/register" variant="primary" size="sm" className="flex-1">
                  Create account
                </ButtonLink>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}

function Avatar({ user }: { user: User }) {
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt=""
        width={22}
        height={22}
        className="h-[22px] w-[22px] rounded-full border border-rail object-cover"
      />
    );
  }
  return (
    <span className="grid h-[22px] w-[22px] place-items-center rounded-full border border-rail bg-sunken font-mono text-2xs text-ink-soft">
      {user.username.slice(0, 1).toUpperCase()}
    </span>
  );
}
