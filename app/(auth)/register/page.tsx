'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Panel } from '@/components/ui/surface';
import { Field, TextInput, FormError } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { registerAction } from '@/app/actions/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function onSubmit(formData: FormData) {
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      let result;
      try {
        result = await registerAction(formData);
      } catch {
        setError('Unable to create your account right now. Check your connection and try again.');
        return;
      }
      if (!result.ok) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      router.push('/dashboard');
      router.refresh();
    });
  }

  return (
    <Panel>
      <h1 className="text-base font-semibold text-ink">Create your account</h1>
      <p className="mt-1 text-xs text-muted">Save trees, or download a ZIP without an account.</p>

      <form action={onSubmit} className="mt-5 space-y-4">
        <Field label="Username" error={fieldErrors.username} hint="3–32 characters, letters, numbers, - and _.">
          {({ id, describedBy, invalid }) => (
            <TextInput id={id} name="username" autoComplete="username" required
              aria-describedby={describedBy} invalid={invalid} />
          )}
        </Field>

        <Field label="Email" error={fieldErrors.email}>
          {({ id, describedBy, invalid }) => (
            <TextInput id={id} name="email" type="email" autoComplete="email" required
              aria-describedby={describedBy} invalid={invalid} />
          )}
        </Field>

        <Field label="Password" error={fieldErrors.password} hint="At least 10 characters, mixing case and a number.">
          {({ id, describedBy, invalid }) => (
            <TextInput id={id} name="password" type="password" autoComplete="new-password" required
              aria-describedby={describedBy} invalid={invalid} />
          )}
        </Field>

        <FormError message={error} />

        <Button type="submit" className="w-full" loading={pending}>
          Create account
        </Button>
      </form>

      <p className="mt-5 text-center text-xs text-muted">
        Already have an account?{' '}
        <Link href="/login" className="text-ink underline decoration-dotted underline-offset-2">
          Sign in
        </Link>
      </p>
    </Panel>
  );
}
