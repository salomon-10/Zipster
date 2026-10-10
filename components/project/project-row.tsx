'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { Project } from '@/lib/db/types';
import { formatCount, formatRelative } from '@/lib/utils';
import { Badge } from '@/components/ui/surface';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/ui/modal';
import { LinkIcon, TrashIcon } from '@/components/ui/icons';
import { deleteProjectAction } from '@/app/actions/projects';

export function ProjectRow({ project }: { project: Project }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, startDeleting] = useTransition();

  function handleDelete() {
    startDeleting(async () => {
      const result = await deleteProjectAction(project.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`"${project.name}" was deleted.`);
      setConfirming(false);
      router.refresh();
    });
  }

  return (
    <li className="flex flex-wrap items-center gap-3 border-b border-rail px-4 py-3 last:border-b-0 sm:px-5">
      <div className="min-w-0 flex-1">
        <Link
          href={`/editor/${project.id}`}
          className="truncate font-mono text-sm text-ink hover:underline underline-offset-2"
        >
          {project.name}
        </Link>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-2xs text-muted">
          <span>{formatCount(project.fileCount, 'file')}</span>
          <span>·</span>
          <span>{formatCount(project.folderCount, 'folder')}</span>
          <span>·</span>
          <span>Updated {formatRelative(project.updatedAt)}</span>
        </div>
      </div>

      {project.isPublic ? (
        <Badge tone="success">
          <LinkIcon width={11} height={11} />
          Shared
        </Badge>
      ) : null}

      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/editor/${project.id}`)}>
          Open
        </Button>
        <Button
          variant="ghost"
          size="sm"
          aria-label={`Delete ${project.name}`}
          onClick={() => setConfirming(true)}
        >
          <TrashIcon width={15} height={15} />
        </Button>
      </div>

      <ConfirmModal
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete this project?"
        body={`"${project.name}" and its share link, if any, will be permanently removed. This does not affect ZIPs you already downloaded.`}
        confirmLabel="Delete project"
      />
    </li>
  );
}
