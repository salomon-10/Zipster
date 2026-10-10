import { ImportForm } from '@/components/project/import-form';

export const metadata = { title: 'Import a repository' };

export default function ImportPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg text-ink">Import a GitHub repository</h1>
        <p className="mt-1 max-w-prose text-xs text-muted sm:text-sm">
          Paste a public repository and get its tree as text — to drop into a README,
          or open straight in the editor to tweak and re-download as a ZIP.
        </p>
      </div>
      <ImportForm />
    </div>
  );
}
