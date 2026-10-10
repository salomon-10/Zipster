import { requireUser } from '@/lib/auth/current-user';
import { listProjectsByUser } from '@/lib/db/projects';
import { countGenerationsByUser, listGenerationsByUser } from '@/lib/db/generations';
import { formatBytes, formatCount, formatRelative } from '@/lib/utils';
import { Panel, PanelHeader, EmptyState } from '@/components/ui/surface';
import { ButtonLink } from '@/components/ui/button';
import { ProjectRow } from '@/components/project/project-row';
import { ArchiveIcon, DownloadIcon, PlusIcon } from '@/components/ui/icons';

export const metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const user = await requireUser();
  const [projects, generations, generationTotals] = await Promise.all([
    listProjectsByUser(user.id),
    listGenerationsByUser(user.id, 8),
    countGenerationsByUser(user.id),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-lg text-ink">Your trees</h1>
          <p className="mt-1 text-xs text-muted">Saved trees, ready to reopen, edit or share.</p>
        </div>
        <ButtonLink href="/" size="sm">
          <PlusIcon width={15} height={15} />
          New tree
        </ButtonLink>
      </div>

      <Panel flush>
        <p className="border-b border-rail px-4 py-3 font-mono text-2xs text-muted sm:px-5">
          {formatCount(projects.length, 'project')} · {formatCount(generationTotals.total, 'ZIP')} ·{' '}
          {formatCount(generationTotals.files, 'file')} created
        </p>

        {projects.length === 0 ? (
          <EmptyState
            icon={<ArchiveIcon width={20} height={20} />}
            title="No saved trees yet"
            body="Build one in the editor and save it — or paste a tree and download it right away without saving anything."
            action={
              <ButtonLink href="/" size="sm">
                Open the editor
              </ButtonLink>
            }
          />
        ) : (
          <ul>
            {projects.map((project) => (
              <ProjectRow key={project.id} project={project} />
            ))}
          </ul>
        )}
      </Panel>

      <Panel flush>
        <PanelHeader
          title="Recent downloads"
          description="The last few ZIPs generated from your account, saved or anonymous."
          className="px-4 py-3.5 sm:px-5"
        />
        {generations.length === 0 ? (
          <EmptyState
            icon={<DownloadIcon width={20} height={20} />}
            title="Nothing downloaded yet"
            body="Generated ZIPs will show up here once you download one while signed in."
          />
        ) : (
          <ul className="divide-y divide-rail border-t border-rail">
            {generations.map((generation) => (
              <li key={generation.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-xs sm:px-5">
                <span className="font-mono text-ink-soft">
                  {generation.projectName ?? 'Untitled tree'}
                </span>
                <span className="text-muted">
                  {formatCount(generation.fileCount, 'file')} · {formatBytes(generation.sizeBytes)}
                </span>
                <span className="ml-auto text-muted">{formatRelative(generation.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
