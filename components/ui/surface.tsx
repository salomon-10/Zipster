import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Panel({
  children,
  className,
  flush = false,
}: {
  children: ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <section
      className={cn(
        'rounded-panel border border-rail bg-surface',
        !flush && 'p-4 sm:p-5',
        className,
      )}
    >
      {children}
    </section>
  );
}

export function PanelHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {description ? <p className="mt-0.5 max-w-prose text-xs text-muted">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

type Tone = 'neutral' | 'folder' | 'file' | 'danger' | 'success';

const TONES: Record<Tone, string> = {
  neutral: 'border-rail-strong text-muted',
  folder: 'border-folder/30 text-folder',
  file: 'border-rail-strong text-muted',
  danger: 'border-danger/30 text-danger',
  success: 'border-success/30 text-success',
};

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-[4px] border px-1.5 py-px font-mono text-2xs',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Counter({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0">
      <div className="text-lg font-semibold tabular-nums text-ink">{value}</div>
      <div className="truncate text-2xs text-muted">{label}</div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-control', className)} />;
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {icon ? (
        <div className="mb-3 text-muted">{icon}</div>
      ) : null}
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-[40ch] text-xs text-muted">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cn('border-t border-rail', className)} />;
}
