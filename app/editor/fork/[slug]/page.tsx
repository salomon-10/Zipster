import { notFound } from 'next/navigation';
import { findProjectBySlug } from '@/lib/db/projects';
import { listOfficialTemplates } from '@/lib/db/templates';
import { getCurrentUser } from '@/lib/auth/current-user';
import { SiteHeader } from '@/components/layout/site-header';
import { Workbench } from '@/components/editor/workbench';

export default async function ForkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [project, user, templates] = await Promise.all([
    findProjectBySlug(slug),
    getCurrentUser(),
    listOfficialTemplates(),
  ]);

  if (!project) notFound();

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader user={user} />
      <main className="mx-auto flex min-h-0 w-full max-w-shell flex-1 flex-col">
        {/* No `project` prop: saving here always creates a new project owned by
            the current viewer, rather than overwriting the original author's. */}
        <Workbench
          initialTree={project.rawTree}
          initialName={`${project.name} (fork)`}
          templates={templates}
          isAuthenticated={Boolean(user)}
        />
      </main>
    </div>
  );
}
