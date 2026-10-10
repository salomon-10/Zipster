'use client';

import { useState } from 'react';
import type { FileTemplate } from '@/lib/db/types';
import { Switch, TextInput, Field } from '@/components/ui/field';
import { Badge } from '@/components/ui/surface';

interface GenerationPanelProps {
  zipName: string;
  onZipNameChange: (value: string) => void;
  templates: FileTemplate[];
  activeTemplateIds: Set<string>;
  onToggleTemplate: (id: string) => void;
  presentFilenames: Set<string>;
}

/** Only templates whose filename actually appears in the current tree are
 *  offered — no point switching on a package.json template for a tree that has
 *  no package.json. */
export function GenerationPanel({
  zipName,
  onZipNameChange,
  templates,
  activeTemplateIds,
  onToggleTemplate,
  presentFilenames,
}: GenerationPanelProps) {
  const [showAll, setShowAll] = useState(false);

  const applicable = templates.filter((template) =>
    presentFilenames.has(template.filePattern.toLowerCase()),
  );
  const list = showAll ? templates : applicable;

  return (
    <div className="space-y-4">
      <Field label="Archive name" hint="The .zip extension is added automatically.">
        {({ id, describedBy }) => (
          <TextInput
            id={id}
            aria-describedby={describedBy}
            value={zipName}
            onChange={(event) => onZipNameChange(event.target.value)}
            placeholder="my-project"
          />
        )}
      </Field>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-ink-soft">Starter content</span>
          {templates.length > applicable.length ? (
            <button
              type="button"
              onClick={() => setShowAll((value) => !value)}
              className="text-2xs text-muted underline decoration-dotted underline-offset-2 hover:text-ink"
            >
              {showAll ? 'Show matching only' : `Show all (${templates.length})`}
            </button>
          ) : null}
        </div>

        {list.length === 0 ? (
          <p className="rounded-control border border-dashed border-rail px-3 py-2.5 text-2xs text-muted">
            No filenames in this tree match an official template yet. Try adding{' '}
            <code className="font-mono">package.json</code> or <code className="font-mono">.gitignore</code>.
          </p>
        ) : (
          <div className="space-y-1.5">
            {list.map((template) => (
              <Switch
                key={template.id}
                checked={activeTemplateIds.has(template.id)}
                onChange={() => onToggleTemplate(template.id)}
                label={template.name}
                description={template.framework ? `For ${template.framework}` : 'Generic'}
              />
            ))}
          </div>
        )}
      </div>

      {activeTemplateIds.size > 0 ? (
        <Badge tone="success">{activeTemplateIds.size} template{activeTemplateIds.size === 1 ? '' : 's'} active</Badge>
      ) : null}
    </div>
  );
}
