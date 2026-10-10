'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { parseTree } from '@/lib/tree/parser';
import type { ParseResult } from '@/lib/tree/types';

const DEBOUNCE_MS = 180;

/**
 * Parsing is cheap but re-rendering a 2000-node preview is not, so the tree is
 * only rebuilt once typing pauses. `pending` drives the subtle busy state.
 */
export function useParsedTree(source: string): { result: ParseResult; pending: boolean } {
  const [settled, setSettled] = useState(source);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSettled(source), DEBOUNCE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [source]);

  const result = useMemo(() => parseTree(settled), [settled]);

  return { result, pending: settled !== source };
}
