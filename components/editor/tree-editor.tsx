'use client';

import { useMemo, useRef, type ChangeEvent, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import type { Diagnostic } from '@/lib/tree/types';

interface TreeEditorProps {
  value: string;
  onChange: (next: string) => void;
  diagnostics: Diagnostic[];
  className?: string;
}

/**
 * A textarea with a synchronised gutter. CodeMirror's real value is
 * multi-language highlighting, which this input format does not have — so this
 * keeps the bundle small and the caret behaviour native.
 */
export function TreeEditor({ value, onChange, diagnostics, className }: TreeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const lineCount = useMemo(() => Math.max(value.split('\n').length, 1), [value]);

  const markedLines = useMemo(() => {
    const map = new Map<number, 'error' | 'warning'>();
    for (const item of diagnostics) {
      if (item.line === null) continue;
      if (item.severity === 'error' || !map.has(item.line)) map.set(item.line, item.severity);
    }
    return map;
  }, [diagnostics]);

  const syncScroll = () => {
    if (gutterRef.current && textareaRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  /** Tab inserts two spaces: this format is indentation, so a focus jump here
   *  would be more surprising than trapping the key. Shift+Tab outdents. */
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Tab') return;
    event.preventDefault();

    const target = event.currentTarget;
    const { selectionStart, selectionEnd } = target;

    if (event.shiftKey) {
      const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
      const removable = value.slice(lineStart, lineStart + 2) === '  ' ? 2 : 0;
      if (!removable) return;
      const next = value.slice(0, lineStart) + value.slice(lineStart + removable);
      onChange(next);
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = Math.max(lineStart, selectionStart - removable);
      });
      return;
    }

    const next = `${value.slice(0, selectionStart)}  ${value.slice(selectionEnd)}`;
    onChange(next);
    requestAnimationFrame(() => {
      target.selectionStart = target.selectionEnd = selectionStart + 2;
    });
  };

  return (
    <div className={cn('relative flex min-h-0 overflow-hidden bg-surface', className)}>
      <div
        ref={gutterRef}
        aria-hidden="true"
        className="w-11 shrink-0 select-none overflow-hidden border-r border-rail bg-paper py-3 text-right font-mono text-2xs leading-6 text-muted/70"
      >
        {Array.from({ length: lineCount }, (_, index) => {
          const line = index + 1;
          const mark = markedLines.get(line);
          return (
            <div
              key={line}
              className={cn(
                'relative pr-2 tabular-nums',
                mark === 'error' && 'bg-danger-wash font-semibold text-danger',
                mark === 'warning' && 'text-folder',
              )}
            >
              {line}
            </div>
          );
        })}
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
        onScroll={syncScroll}
        onKeyDown={onKeyDown}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        aria-label="Folder tree"
        placeholder={'app/\n  layout.tsx\n  page.tsx'}
        className="min-h-0 w-full flex-1 resize-none bg-transparent px-3 py-3 font-mono text-xs leading-6 text-ink outline-none placeholder:text-muted/50"
      />
    </div>
  );
}
