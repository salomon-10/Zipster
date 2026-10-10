'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/ui/modal';
import { deleteAccountAction } from '@/app/actions/profile';

export function DangerZone() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteAccountAction();
      // A successful deletion redirects server-side and never returns here.
      if (result && !result.ok) {
        toast.error(result.error);
        setOpen(false);
      }
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-ink-soft">Delete your account and every saved project.</p>
          <p className="mt-0.5 text-2xs text-muted">This cannot be undone.</p>
        </div>
        <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
          Delete account
        </Button>
      </div>

      <ConfirmModal
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleDelete}
        loading={pending}
        title="Delete your account?"
        body="This permanently removes your account, every saved project, and any active share links. There is no way back."
        confirmLabel="Delete everything"
      />
    </>
  );
}
