'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Panel } from '@/components/ui/surface';
import { Field, TextInput, FormError } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { GithubIcon, CopyIcon, CheckIcon } from '@/components/ui/icons';
import { importRepoAction, type ImportedTree } from '@/app/actions/import';

export function ImportForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ImportedTree | null>(null);
  const [copied, setCopied] = useState(false);

  function onSubmit(formData: FormData) {
    setError(null);
    setFieldErrors({});
    setResult(null);
    startTransition(async () => {
      const response = await importRepoAction(formData);
      if (!response.ok) {
        setError(response.error);
        setFieldErrors(response.fieldErrors ?? {});
        return;
      }
      setResult(response.data);
    });
  }

  function openInEditor() {
    if (!result) return;
    try {
      sessionStorage.setItem('zipster:import', result.text);
      router.push('/?from=import');
    } catch {
      setError('The browser could not prepare the editor. Copy the tree manually instead.');
    }
  }

  async function copyText() {
    if (!result) return;
    if (!(await copyToClipboard(result.text))) {
      toast.error('Could not copy the tree. Select the text manually.');
      return;
    }
    setCopied(true);
    toast.success('Tree copied — paste it into a README.');
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="space-y-4">
      <Panel>
        <form action={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Field label="GitHub repository" error={fieldErrors.repo} hint="e.g. vercel/next.js or a full URL.">
              {({ id, describedBy, invalid }) => (
                <TextInput
                  id={id}
                  name="repo"
                  placeholder="owner/repository"
                  required
                  aria-describedby={describedBy}
                  invalid={invalid}
                />
              )}
            </Field>
          </div>
          <Button type="submit" loading={pending} className="shrink-0">
            <GithubIcon width={15} height={15} />
            Fetch structure
          </Button>
        </form>
        <FormError message={error} />
      </Panel>

      {result ? (
        <Panel flush aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rail px-4 py-3">
            <div className="min-w-0">
              <p className="truncate font-mono text-sm text-ink">
                {result.owner}/{result.repo}
              </p>
              <p className="mt-0.5 text-2xs text-muted">
                {result.files} files · {result.folders} folders on {result.branch}
                {result.truncated ? ' · truncated at GitHub\u2019s limit' : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={copyText}>
                {copied ? <CheckIcon width={14} height={14} /> : <CopyIcon width={14} height={14} />}
                Copy tree
              </Button>
              <Button size="sm" onClick={openInEditor}>
                Open in editor
              </Button>
            </div>
          </div>
          <pre className="max-h-96 overflow-auto px-4 py-3 font-mono text-2xs leading-relaxed text-ink-soft">
            {result.text}
          </pre>
        </Panel>
      ) : null}
    </div>
  );
}

async function copyToClipboard(value: string) {
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Fall through to the selection-based fallback.
    }
  }

  const input = document.createElement('textarea');
  input.value = value;
  input.setAttribute('readonly', '');
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.appendChild(input);
  input.select();
  let copied = false;
  try {
    copied = document.execCommand('copy');
  } finally {
    document.body.removeChild(input);
  }
  return copied;
}
