import { listOfficialTemplates } from '@/lib/db/templates';
import { Panel, EmptyState, Badge } from '@/components/ui/surface';
import { ButtonLink } from '@/components/ui/button';
import { FileIcon } from '@/components/ui/icons';

export const metadata = { title: 'Templates' };

export default async function TemplatesPage() {
  const templates = await listOfficialTemplates();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg text-ink">Official templates</h1>
        <p className="mt-1 max-w-prose text-xs text-muted sm:text-sm">
          Starter content for filenames you create by hand anyway. Switch any of these on from
          the generation panel in the editor when the matching filename is present in your tree.
        </p>
      </div>

      {templates.length === 0 ? (
        <Panel>
          <EmptyState
            title="No templates available"
            body="There are no starter files to show yet. You can still create a ZIP from your own tree."
            action={<ButtonLink href="/">Open the editor</ButtonLink>}
          />
        </Panel>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {templates.map((template) => (
          <Panel key={template.id} flush className="overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-rail bg-sunken/60 px-4 py-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <FileIcon width={14} height={14} className="shrink-0 text-file" />
                <span className="truncate font-mono text-xs text-ink">{template.name}</span>
              </div>
              {template.framework ? <Badge>{template.framework}</Badge> : <Badge>generic</Badge>}
            </div>
            <pre className="max-h-40 overflow-auto px-4 py-3 font-mono text-2xs leading-relaxed text-ink-soft">
              {template.content}
            </pre>
          </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
