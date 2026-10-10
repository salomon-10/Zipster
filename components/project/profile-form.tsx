'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import type { User } from '@/lib/db/types';
import { Field, TextInput, FormError } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { updateProfileAction } from '@/app/actions/profile';

export function ProfileForm({ user }: { user: User }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  function onSubmit(formData: FormData) {
    setError(null);
    setFieldErrors({});
    setSaved(false);
    startTransition(async () => {
      let result;
      try {
        result = await updateProfileAction(formData);
      } catch {
        setError('Unable to save your profile right now. Check your connection and try again.');
        return;
      }
      if (!result.ok) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      setSaved(true);
      toast.success('Profile updated.');
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <Field label="Email">
        {({ id }) => <TextInput id={id} value={user.email} disabled />}
      </Field>

      <Field label="Username" error={fieldErrors.username}>
        {({ id, describedBy, invalid }) => (
          <TextInput
            id={id}
            name="username"
            defaultValue={user.username}
            required
            aria-describedby={describedBy}
            invalid={invalid}
          />
        )}
      </Field>

      <Field label="Avatar URL" error={fieldErrors.avatarUrl} hint="Optional. Leave blank to use your initial.">
        {({ id, describedBy, invalid }) => (
          <TextInput
            id={id}
            name="avatarUrl"
            type="url"
            defaultValue={user.avatarUrl ?? ''}
            placeholder="https://…"
            aria-describedby={describedBy}
            invalid={invalid}
          />
        )}
      </Field>

      <FormError message={error} />
      {saved ? <p role="status" className="text-xs text-success">Profile saved.</p> : null}

      <Button type="submit" loading={pending} size="sm">
        Save changes
      </Button>
    </form>
  );
}
