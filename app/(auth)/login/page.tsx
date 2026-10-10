'use client';

import { Suspense, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Panel } from '@/components/ui/surface';
import { Field, TextInput, FormError } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { loginAction } from '@/app/actions/auth';

/** Only same-site paths: `//evil.com` and `https://evil.com` would otherwise
 *  turn the post-login redirect into a phishing hop. */
function safeNext(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return '/dashboard';
  return value;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-72 rounded-panel border border-rail bg-surface" />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function onSubmit(formData: FormData) {
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      let result;
      try {
        result = await loginAction(formData);
      } catch {
        setError('Unable to sign in right now. Check your connection and try again.');
        return;
      }
      if (!result.ok) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      router.push(safeNext(params.get('next')));
      router.refresh();
    });
  }

  return (
    <Panel>
      <h1 className="text-base font-semibold text-ink">Sign in</h1>
      <p className="mt-1 text-xs text-muted">Save trees and share them by link.</p>

      <form action={onSubmit} className="mt-5 space-y-4">
        <Field label="Email" error={fieldErrors.email}>
          {({ id, describedBy, invalid }) => (
            <TextInput id={id} name="email" type="email" autoComplete="email" required
              aria-describedby={describedBy} invalid={invalid} />
          )}
        </Field>

        <Field label="Password" error={fieldErrors.password}>
          {({ id, describedBy, invalid }) => (
            <TextInput id={id} name="password" type="password" autoComplete="current-password" required
              aria-describedby={describedBy} invalid={invalid} />
          )}
        </Field>

        <FormError message={error} />

        <Button type="submit" className="w-full" loading={pending}>
          Sign in
        </Button>
      </form>

      <p className="mt-5 text-center text-xs text-muted">
        No account yet?{' '}
        <Link href="/register" className="text-ink underline decoration-dotted underline-offset-2">
          Create one
        </Link>
      </p>
    </Panel>
  );
}
