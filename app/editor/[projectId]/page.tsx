import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth/current-user';
import { findProjectById } from '@/lib/db/projects';
import { listOfficialTemplates } from '@/lib/db/templates';
import { SiteHeader } from '@/components/layout/site-header';
import { Workbench } from '@/components/editor/workbench';

export default async function ProjectEditorPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await requireUser();
  const [project, templates] = await Promise.all([
    findProjectById(projectId),
    listOfficialTemplates(),
  ]);

  if (!project || project.userId !== user.id) notFound();

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader user={user} />
      <main className="mx-auto flex min-h-0 w-full max-w-shell flex-1 flex-col">
        <Workbench project={project} templates={templates} isAuthenticated />
      </main>
    </div>
  );
}
