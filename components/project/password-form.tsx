'use client';

import { useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Field, TextInput, FormError } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { changePasswordAction } from '@/app/actions/profile';

export function PasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
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
        result = await changePasswordAction(formData);
      } catch {
        setError('Unable to change your password right now. Check your connection and try again.');
        return;
      }
      if (!result.ok) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      toast.success('Password changed.');
      setSaved(true);
      formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} action={onSubmit} className="space-y-4">
      <Field label="Current password" error={fieldErrors.currentPassword}>
        {({ id, describedBy, invalid }) => (
          <TextInput id={id} name="currentPassword" type="password" autoComplete="current-password"
            required aria-describedby={describedBy} invalid={invalid} />
        )}
      </Field>

      <Field label="New password" error={fieldErrors.newPassword} hint="At least 10 characters, mixing case and a number.">
        {({ id, describedBy, invalid }) => (
          <TextInput id={id} name="newPassword" type="password" autoComplete="new-password"
            required aria-describedby={describedBy} invalid={invalid} />
        )}
      </Field>

      <Field label="Confirm new password" error={fieldErrors.confirmPassword}>
        {({ id, describedBy, invalid }) => (
          <TextInput id={id} name="confirmPassword" type="password" autoComplete="new-password"
            required aria-describedby={describedBy} invalid={invalid} />
        )}
      </Field>

      <FormError message={error} />
      {saved ? <p role="status" className="text-xs text-success">Password changed.</p> : null}

      <Button type="submit" loading={pending} size="sm">
        Change password
      </Button>
    </form>
  );
}
