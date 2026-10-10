import { cache } from 'react';
import { notFound } from 'next/navigation';
import { findProjectBySlug, incrementViewCount } from '@/lib/db/projects';
import { getCurrentUser } from '@/lib/auth/current-user';
import { formatCount, formatRelative } from '@/lib/utils';
import { SiteHeader } from '@/components/layout/site-header';
import { Panel } from '@/components/ui/surface';
import { SharePreview } from '@/components/project/share-preview';
import type { Metadata } from 'next';

/** generateMetadata and the page both need the project: one query, not two. */
const getSharedProject = cache(findProjectBySlug);

interface SharePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getSharedProject(slug);
  if (!project) return { title: 'Not found' };
  return {
    title: project.name,
    description: `A folder architecture shared by ${project.ownerUsername} on Zipster — ${formatCount(project.fileCount, 'file')}, ${formatCount(project.folderCount, 'folder')}.`,
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { slug } = await params;
  const [project, user] = await Promise.all([getSharedProject(slug), getCurrentUser()]);

  if (!project) notFound();
  void incrementViewCount(slug);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader user={user} />
      <main className="mx-auto w-full max-w-shell flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg text-ink">{project.name}</h1>
            <p className="mt-1 text-xs text-muted">
              {project.ownerUsername} · {formatRelative(project.updatedAt)}
            </p>
          </div>
        </div>

        <Panel flush>
          <SharePreview
            rawTree={project.rawTree}
            name={project.name}
            projectId={project.id}
            forkHref={`/editor/fork/${project.shareSlug}`}
          />
        </Panel>
      </main>
    </div>
  );
}
