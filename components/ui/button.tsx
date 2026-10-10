'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { SpinnerIcon } from './icons';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const BASE =
  'inline-flex select-none items-center justify-center gap-2 rounded-control font-medium ' +
  'transition-colors duration-[120ms] ' +
  'disabled:pointer-events-none disabled:opacity-45';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-ink text-paper hover:bg-ink/85 border border-ink',
  secondary: 'bg-transparent text-ink border border-rail-strong hover:border-ink/40 hover:bg-sunken',
  ghost: 'text-ink-soft hover:bg-sunken hover:text-ink border border-transparent',
  danger: 'bg-danger-wash text-danger border border-danger/30 hover:bg-danger hover:text-white',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-2.5 text-xs',
  md: 'h-10 px-3.5 text-sm',
  lg: 'h-12 px-5 text-sm',
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children?: ReactNode;
  className?: string;
}

export function buttonClasses({ variant = 'primary', size = 'md', className }: CommonProps = {}) {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={buttonClasses({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <SpinnerIcon className="animate-spin" width={16} height={16} /> : null}
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = 'secondary',
  size = 'md',
  className,
  children,
  ...props
}: CommonProps & { href: string } & Omit<React.ComponentProps<typeof Link>, 'href' | 'className'>) {
  return (
    <Link href={href} className={buttonClasses({ variant, size, className })} {...props}>
      {children}
    </Link>
  );
}
