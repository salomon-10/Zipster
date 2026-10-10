import type { Diagnostic } from '@/lib/tree/types';
import { AlertIcon, InfoIcon } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { useState } from 'react';

/** Problems never block the preview — the tree keeps rendering while the user
 *  is still typing, and these explain what was adjusted. */
export function Diagnostics({ items, className }: { items: Diagnostic[]; className?: string }) {
  const visible = items.filter((item) => item.code !== 'empty-input');
  const [expanded, setExpanded] = useState(false);
  if (visible.length === 0) return null;

  return (
    <div className={cn('space-y-1', className)}>
      <p className="sr-only" aria-live="polite">
        {visible.length} parsing issue{visible.length === 1 ? '' : 's'}: {visible.filter((item) => item.severity === 'error').length} error{visible.filter((item) => item.severity === 'error').length === 1 ? '' : 's'}.
      </p>
      <ul className="space-y-1">
      {(expanded ? visible : visible.slice(0, 6)).map((item, index) => (
        <li
          key={`${item.code}-${item.line}-${index}`}
          className={cn(
            'flex items-start gap-2 border-l-2 px-2.5 py-1.5 text-2xs',
            item.severity === 'error'
              ? 'border-danger text-danger'
              : 'border-rail-strong text-ink-soft',
          )}
        >
          {item.severity === 'error' ? (
            <AlertIcon width={13} height={13} className="mt-px shrink-0" />
          ) : (
            <InfoIcon width={13} height={13} className="mt-px shrink-0 text-muted" />
          )}
          <span className="min-w-0">
            {item.line !== null ? (
              <span className="mr-1 font-mono text-muted">L{item.line}</span>
            ) : null}
            {item.message}
          </span>
        </li>
      ))}
      </ul>
      {visible.length > 6 ? (
        <button
          type="button"
          className="px-2.5 text-2xs text-muted underline-offset-2 hover:text-ink hover:underline"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
        >
          {expanded ? 'Show fewer issues' : `Show ${visible.length - 6} more issue${visible.length - 6 === 1 ? '' : 's'}`}
        </button>
      ) : null}
    </div>
  );
}
