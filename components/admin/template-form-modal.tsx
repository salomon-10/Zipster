'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { FileTemplate } from '@/lib/db/types';
import { Modal } from '@/components/ui/modal';
import { Field, TextInput, TextArea, FormError } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { saveTemplateAction } from '@/app/actions/admin';

export function TemplateFormModal({
  open,
  onClose,
  template,
}: {
  open: boolean;
  onClose: () => void;
  template: FileTemplate | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function onSubmit(formData: FormData) {
    setError(null);
    setFieldErrors({});
    if (template) formData.set('templateId', template.id);

    startTransition(async () => {
      const result = await saveTemplateAction(formData);
      if (!result.ok) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      toast.success(template ? 'Template updated.' : 'Template created.');
      onClose();
      router.refresh();
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={template ? `Edit ${template.name}` : 'New template'}
      description="Content is offered whenever a tree contains a matching filename."
      className="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="template-form" size="sm" loading={pending}>
            {template ? 'Save changes' : 'Create template'}
          </Button>
        </>
      }
    >
      <form id="template-form" action={onSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Display name" error={fieldErrors.name}>
            {({ id, describedBy, invalid }) => (
              <TextInput id={id} name="name" defaultValue={template?.name} required
                aria-describedby={describedBy} invalid={invalid} />
            )}
          </Field>
          <Field label="Filename to match" error={fieldErrors.filePattern} hint="Exact filename, e.g. package.json">
            {({ id, describedBy, invalid }) => (
              <TextInput id={id} name="filePattern" defaultValue={template?.filePattern} required
                aria-describedby={describedBy} invalid={invalid} />
            )}
          </Field>
        </div>

        <Field label="Framework" hint="Optional. Leave blank for a generic template.">
          {({ id }) => <TextInput id={id} name="framework" defaultValue={template?.framework ?? ''} />}
        </Field>

        <Field label="Content" error={fieldErrors.content}>
          {({ id, describedBy, invalid }) => (
            <TextArea id={id} name="content" rows={12} defaultValue={template?.content}
              aria-describedby={describedBy} invalid={invalid} />
          )}
        </Field>

        <FormError message={error} />
      </form>
    </Modal>
  );
}
