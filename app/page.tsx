import { getCurrentUser } from '@/lib/auth/current-user';
import { listOfficialTemplates } from '@/lib/db/templates';
import { SAMPLE_TREE } from '@/lib/tree/sample';
import { SiteHeader } from '@/components/layout/site-header';
import { Workbench } from '@/components/editor/workbench';

export default async function HomePage() {
  const [user, templates] = await Promise.all([getCurrentUser(), listOfficialTemplates()]);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader user={user} />

      <div className="mx-auto w-full max-w-shell px-4 pb-4 pt-8 sm:px-6 sm:pt-10">
        <h1 className="text-xl text-ink sm:text-2xl">Paste a tree. Download a ZIP.</h1>
        <p className="mt-1.5 max-w-prose text-sm text-muted">
          Runs in your browser — nothing leaves it until you choose to save.
        </p>
      </div>

      <main className="mx-auto flex min-h-0 w-full max-w-shell flex-1 flex-col">
        <Workbench initialTree={SAMPLE_TREE} templates={templates} isAuthenticated={Boolean(user)} />
      </main>
    </div>
  );
}
