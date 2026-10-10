'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { FileTemplate } from '@/lib/db/types';
import { Badge, EmptyState } from '@/components/ui/surface';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/ui/modal';
import { FileIcon, PlusIcon, TrashIcon } from '@/components/ui/icons';
import { deleteTemplateAction } from '@/app/actions/admin';
import { TemplateFormModal } from './template-form-modal';

export function TemplatesManager({ templates }: { templates: FileTemplate[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<FileTemplate | null>(null);
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<FileTemplate | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!removing) return;
    startTransition(async () => {
      const result = await deleteTemplateAction(removing.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`"${removing.name}" was deleted.`);
      setRemoving(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setCreating(true)}>
          <PlusIcon width={15} height={15} />
          New template
        </Button>
      </div>

      {templates.length === 0 ? (
        <EmptyState
          icon={<FileIcon width={20} height={20} />}
          title="No templates yet"
          body="Create one and it becomes available to every user as soon as their tree contains a matching filename."
        />
      ) : (
        <ul className="divide-y divide-rail rounded-panel border border-rail bg-surface">
          {templates.map((template) => (
            <li key={template.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
              <FileIcon width={15} height={15} className="shrink-0 text-file" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-xs text-ink">{template.name}</p>
                <p className="mt-0.5 truncate text-2xs text-muted">matches {template.filePattern}</p>
              </div>
              {template.framework ? <Badge>{template.framework}</Badge> : null}
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="sm" onClick={() => setEditing(template)}>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" aria-label={`Delete ${template.name}`} onClick={() => setRemoving(template)}>
                  <TrashIcon width={15} height={15} />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <TemplateFormModal open={creating} onClose={() => setCreating(false)} template={null} />
      <TemplateFormModal open={Boolean(editing)} onClose={() => setEditing(null)} template={editing} />

      <ConfirmModal
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        onConfirm={handleDelete}
        loading={pending}
        title="Delete this template?"
        body={`"${removing?.name}" will no longer be offered to users. Existing downloads are unaffected.`}
        confirmLabel="Delete template"
      />
    </div>
  );
}
