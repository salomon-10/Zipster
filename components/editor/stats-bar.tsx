import type { TreeStats } from '@/lib/tree/types';
import { formatCount } from '@/lib/utils';

export function StatsBar({ stats }: { stats: TreeStats }) {
  return (
    <p className="font-mono text-2xs text-muted tabular-nums">
      {formatCount(stats.files, 'file')} · {formatCount(stats.folders, 'folder')}
      {stats.depth ? ` · ${stats.depth} deep` : ''}
    </p>
  );
}
