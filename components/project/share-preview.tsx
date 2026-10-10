'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { parseTree } from '@/lib/tree/parser';
import { generateZip, downloadBlob, toArchiveName } from '@/lib/zip/generate';
import { TreePreview } from '@/components/tree/tree-preview';
import { StatsBar } from '@/components/editor/stats-bar';
import { Button, ButtonLink } from '@/components/ui/button';
import { DownloadIcon, SpinnerIcon } from '@/components/ui/icons';
import { recordGenerationAction } from '@/app/actions/projects';

export function SharePreview({
  rawTree,
  name,
  projectId,
  forkHref,
}: {
  rawTree: string;
  name: string;
  projectId: string;
  forkHref: string;
}) {
  const [downloading, setDownloading] = useState(false);
  const { roots, stats } = parseTree(rawTree);

  async function handleDownload() {
    setDownloading(true);
    try {
      const result = await generateZip(roots);
      downloadBlob(result.blob, toArchiveName(name));
      toast.success(`Downloaded ${result.fileCount} files.`);
      void recordGenerationAction({
        projectId,
        fileCount: result.fileCount,
        folderCount: result.folderCount,
        sizeBytes: result.sizeBytes,
        source: 'shared',
      });
    } catch {
      toast.error('The ZIP could not be built.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rail px-4 py-3 sm:px-5">
        <StatsBar stats={stats} />
        <div className="flex items-center gap-2">
          <ButtonLink href={forkHref} variant="secondary" size="sm">
            Open in editor
          </ButtonLink>
          <Button size="sm" onClick={handleDownload} loading={downloading}>
            {downloading ? <SpinnerIcon className="animate-spin" width={15} height={15} /> : <DownloadIcon width={15} height={15} />}
            Download ZIP
          </Button>
        </div>
      </div>
      <div className="max-h-[60vh] overflow-y-auto px-3 py-3 sm:px-4">
        <TreePreview roots={roots} />
      </div>
    </div>
  );
}
