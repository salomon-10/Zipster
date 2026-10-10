import Link from 'next/link';
import { ButtonLink } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="font-mono text-sm text-muted">404</p>
      <h1 className="text-lg text-ink">This path does not exist</h1>
      <p className="max-w-[36ch] text-xs text-muted">
        The project or page you were looking for was not found, or is private.
      </p>
      <div className="mt-2 flex gap-2">
        <Link href="/" className="text-xs text-ink underline decoration-dotted underline-offset-2">
          Back to the editor
        </Link>
      </div>
    </div>
  );
}
