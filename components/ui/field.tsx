'use client';

import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { AlertIcon, CheckIcon } from './icons';

const CONTROL =
  'w-full rounded-control border bg-surface px-3 text-sm text-ink placeholder:text-muted/70 ' +
  'transition-colors duration-[120ms] disabled:cursor-not-allowed disabled:bg-sunken disabled:text-muted';

interface FieldShellProps {
  label: string;
  hint?: string;
  error?: string;
  children: (props: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
}

export function Field({ label, hint, error, children }: FieldShellProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const describedBy = error || hint ? hintId : undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-medium text-ink-soft">
        {label}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {error ? (
        <p id={hintId} role="alert" className="flex items-start gap-1.5 text-2xs text-danger">
          <AlertIcon width={13} height={13} className="mt-0.5 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-2xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput({
  invalid,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      className={cn(
        CONTROL,
        'h-10',
        invalid ? 'border-danger focus:border-danger' : 'border-rail-strong hover:border-ink/30',
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

export function TextArea({
  invalid,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      className={cn(
        CONTROL,
        'py-2 font-mono text-xs leading-relaxed',
        invalid ? 'border-danger' : 'border-rail-strong hover:border-ink/30',
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-control border border-danger/25 bg-danger-wash px-3 py-2 text-xs text-danger"
    >
      <AlertIcon width={15} height={15} className="mt-0.5 shrink-0" />
      {message}
    </p>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex w-full items-start gap-2.5 rounded-control px-2 py-1.5 text-left transition-colors duration-[120ms] hover:bg-sunken',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <span
        className={cn(
          'mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-[4px] border transition-colors duration-[120ms]',
          checked ? 'border-ink bg-ink text-paper' : 'border-rail-strong bg-surface',
        )}
      >
        {checked ? <CheckIcon width={11} height={11} strokeWidth={2.6} /> : null}
      </span>
      <span className="min-w-0">
        <span className="block font-mono text-xs text-ink">{label}</span>
        {description ? <span className="mt-0.5 block text-2xs text-muted">{description}</span> : null}
      </span>
    </button>
  );
}
