'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useParsedTree } from '@/hooks/use-parsed-tree';
import { generateZip, downloadBlob, toArchiveName } from '@/lib/zip/generate';
import { flattenTree } from '@/lib/tree/parser';
import type { FileTemplate } from '@/lib/db/types';
import type { Project } from '@/lib/db/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TextInput } from '@/components/ui/field';
import { TreeEditor } from './tree-editor';
import { TreePreview } from '../tree/tree-preview';
import { Diagnostics } from '../tree/diagnostics';
import { StatsBar } from './stats-bar';
import { GenerationPanel } from './generation-panel';
import { UploadIcon, DownloadIcon, SaveIcon, LinkIcon, SpinnerIcon } from '@/components/ui/icons';
import { saveProjectAction, recordGenerationAction, toggleShareAction } from '@/app/actions/projects';

interface WorkbenchProps {
  initialTree?: string;
  initialName?: string;
  templates: FileTemplate[];
  isAuthenticated: boolean;
  project?: Project;
}

export function Workbench({ initialTree, initialName, templates, isAuthenticated, project }: WorkbenchProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [source, setSource] = useState(initialTree ?? project?.rawTree ?? '');
  const [name, setName] = useState(project?.name ?? initialName ?? '');
  const [zipName, setZipName] = useState(project?.name ?? initialName ?? '');
  const [activeTemplateIds, setActiveTemplateIds] = useState<Set<string>>(new Set());
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [saving, startSaving] = useTransition();
  const [sharing, startSharing] = useTransition();
  const [shareUrl, setShareUrl] = useState<string | null>(
    project?.isPublic && project.shareSlug ? `/s/${project.shareSlug}` : null,
  );

  // Picks up a tree handed off from the GitHub importer, which cannot pass a
  // large payload through a URL. Only relevant for the anonymous, unsaved editor.
  useEffect(() => {
    if (project) return;
    try {
      const handoff = sessionStorage.getItem('zipster:import');
      if (handoff) {
        sessionStorage.removeItem('zipster:import');
        setSource(handoff);
      }
    } catch {
      // Ignore — private browsing or storage disabled.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { result, pending } = useParsedTree(source);
  const { roots, diagnostics, stats } = result;

  const presentFilenames = useMemo(() => {
    const set = new Set<string>();
    for (const entry of flattenTree(roots)) {
      if (entry.type !== 'file') continue;
      const filename = entry.path.split('/').pop();
      if (filename) set.add(filename.toLowerCase());
    }
    return set;
  }, [roots]);

  const activeTemplates = useMemo(
    () => templates.filter((template) => activeTemplateIds.has(template.id)),
    [templates, activeTemplateIds],
  );

  const errorCount = diagnostics.filter((d) => d.severity === 'error').length;
  const hasBlockingDiagnostics = errorCount > 0;
  const hasContent = stats.files + stats.folders > 0;

  async function handleDownload() {
    if (!hasContent) {
      toast.error('Add at least one file or folder first.');
      return;
    }
    if (hasBlockingDiagnostics) {
      toast.error('Fix the highlighted errors before downloading.');
      return;
    }
    setDownloading(true);
    try {
      const result = await generateZip(roots, { templates: activeTemplates });
      downloadBlob(result.blob, toArchiveName(zipName || name || 'architecture'));
      toast.success(
        `Downloaded ${result.fileCount} file${result.fileCount === 1 ? '' : 's'} in ${result.folderCount} folder${result.folderCount === 1 ? '' : 's'}.`,
      );
      void recordGenerationAction({
        projectId: project?.id ?? null,
        fileCount: result.fileCount,
        folderCount: result.folderCount,
        sizeBytes: result.sizeBytes,
        source: project ? 'project' : 'editor',
      });
    } catch {
      toast.error('The ZIP could not be built. Check the console for details.');
    } finally {
      setDownloading(false);
    }
  }

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 2_000_000) {
      toast.error('That file is larger than 2 MB — paste the tree instead.');
      return;
    }
    file.text().then((text) => {
      setSource(text);
      setMobileView('editor');
      toast.success(`Loaded ${file.name}.`);
    });
  }

  function handleSave() {
    if (!name.trim()) {
      toast.error('Give the project a name first.');
      return;
    }
    const formData = new FormData();
    formData.set('name', name);
    formData.set('rawTree', source);
    if (project) formData.set('projectId', project.id);

    startSaving(async () => {
      const result = await saveProjectAction(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(project ? 'Project updated.' : 'Project saved.');
      if (!project) router.push(`/editor/${result.data.id}`);
      else router.refresh();
    });
  }

  function handleShare(makePublic: boolean) {
    if (!project) return;
    startSharing(async () => {
      const result = await toggleShareAction(project.id, makePublic);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setShareUrl(result.data.url ? new URL(result.data.url).pathname : null);
      if (result.data.url) {
        if (await copyToClipboard(result.data.url)) {
          toast.success('Share link copied to your clipboard.');
        } else {
          toast.success('Share link created. Copy it from the project view.');
        }
      } else {
        toast.success('This project is private again.');
      }
      router.refresh();
    });
  }

  const toggleTemplate = (id: string) =>
    setActiveTemplateIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* One quiet toolbar: name on the left, actions on the right */}
      <div className="flex flex-wrap items-center gap-1.5 px-4 pb-3 sm:px-6">
        <TextInput
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (!zipName || zipName === name) setZipName(event.target.value);
          }}
          placeholder="Untitled"
          aria-label="Project name"
          className="h-8 max-w-[200px] border-transparent bg-transparent px-1.5 text-sm hover:border-rail focus:border-rail-strong"
        />

        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <input ref={fileInputRef} type="file" accept=".txt,.md" className="hidden" onChange={handleFile} />
          <Button variant="ghost" size="sm" onClick={handleUploadClick} aria-label="Upload a tree file">
            <UploadIcon width={15} height={15} />
            <span className="hidden sm:inline">Upload</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOptionsOpen((value) => !value)}
            aria-expanded={optionsOpen}
            aria-controls="generation-options"
          >
            Options
            {activeTemplateIds.size > 0 ? <span className="font-mono text-2xs text-muted">{activeTemplateIds.size}</span> : null}
          </Button>

          {isAuthenticated ? (
            <>
              {project ? (
                <ShareControl
                  isPublic={Boolean(shareUrl)}
                  shareUrl={shareUrl}
                  onToggle={handleShare}
                  loading={sharing}
                />
              ) : null}
              <Button variant="ghost" size="sm" onClick={handleSave} loading={saving}>
                <SaveIcon width={15} height={15} />
                <span className="hidden sm:inline">Save</span>
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => router.push('/register')}>
              <SaveIcon width={15} height={15} />
              <span className="hidden sm:inline">Sign in to save</span>
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={handleDownload}
            loading={downloading}
            disabled={!hasContent || hasBlockingDiagnostics}
            title={hasBlockingDiagnostics ? 'Fix parsing errors before downloading' : undefined}
          >
            <DownloadIcon width={15} height={15} />
            Download ZIP
          </Button>
        </div>
      </div>

      {/* Mobile view switch */}
      <div className="flex border-b border-rail md:hidden" role="tablist" aria-label="Editor views">
        {(['editor', 'preview'] as const).map((view) => (
          <button
            key={view}
            type="button"
            onClick={() => setMobileView(view)}
            id={`${view}-tab`}
            role="tab"
            aria-selected={mobileView === view}
            aria-controls={`${view}-panel`}
            tabIndex={mobileView === view ? 0 : -1}
            className={cn(
              'min-h-11 flex-1 border-b-2 py-2 text-center text-xs font-medium capitalize transition-colors duration-[120ms]',
              mobileView === view ? 'border-ink text-ink' : 'border-transparent text-muted',
            )}
          >
            {view === 'preview' && errorCount > 0 ? `Preview (${errorCount})` : view}
          </button>
        ))}
      </div>

      {/* Main split: a single hairline between the two panes */}
      <div className="grid min-h-0 flex-1 grid-cols-1 border-y border-rail md:grid-cols-2">
        <div
          id="editor-panel"
          role="tabpanel"
          aria-labelledby="editor-tab"
          className={cn('flex min-h-0 flex-col border-rail md:border-r', mobileView !== 'editor' && 'hidden md:flex')}
        >
          <TreeEditor value={source} onChange={setSource} diagnostics={diagnostics} className="min-h-[320px] flex-1" />
        </div>

        <div
          id="preview-panel"
          role="tabpanel"
          aria-labelledby="preview-tab"
          className={cn('flex min-h-0 flex-col', mobileView !== 'preview' && 'hidden md:flex')}
        >
          <div className="flex items-center justify-between gap-3 px-4 py-2.5">
            <StatsBar stats={stats} />
            {pending ? <SpinnerIcon className="animate-spin text-muted" width={14} height={14} /> : null}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
            {hasContent ? (
              <TreePreview roots={roots} />
            ) : (
              <p className="px-2 py-8 text-center text-xs text-muted">Nothing to preview yet.</p>
            )}
          </div>

          {diagnostics.length > 0 ? (
            <div className="border-t border-rail px-4 py-2.5">
              <Diagnostics items={diagnostics} />
            </div>
          ) : null}
        </div>
      </div>

      {/* Archive options stay out of sight until asked for */}
      {optionsOpen ? (
        <div id="generation-options" className="mx-auto w-full max-w-prose px-4 py-5 sm:px-6">
          <GenerationPanel
            zipName={zipName}
            onZipNameChange={setZipName}
            templates={templates}
            activeTemplateIds={activeTemplateIds}
            onToggleTemplate={toggleTemplate}
            presentFilenames={presentFilenames}
          />
        </div>
      ) : null}
    </div>
  );
}

function ShareControl({
  isPublic,
  shareUrl,
  onToggle,
  loading,
}: {
  isPublic: boolean;
  shareUrl: string | null;
  onToggle: (makePublic: boolean) => void;
  loading: boolean;
}) {
  if (isPublic && shareUrl) {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          loading={loading}
          onClick={async () => {
            const copied = await copyToClipboard(new URL(shareUrl, window.location.origin).toString());
            if (copied) toast.success('Share link copied.');
            else toast.error('Could not copy the share link.');
          }}
          aria-label="Copy share link"
        >
          <LinkIcon width={15} height={15} />
          <span className="hidden sm:inline">Copy link</span>
        </Button>
        <Button variant="ghost" size="sm" disabled={loading} onClick={() => onToggle(false)}>
          Unshare
        </Button>
      </>
    );
  }

  return (
    <Button variant="ghost" size="sm" loading={loading} onClick={() => onToggle(true)} aria-label="Share project">
      <LinkIcon width={15} height={15} />
      <span className="hidden sm:inline">Share</span>
    </Button>
  );
}

async function copyToClipboard(value: string) {
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Fall through to the selection-based fallback.
    }
  }

  const input = document.createElement('textarea');
  input.value = value;
  input.setAttribute('readonly', '');
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.appendChild(input);
  input.select();
  let copied = false;
  try {
    copied = document.execCommand('copy');
  } finally {
    document.body.removeChild(input);
  }
  return copied;
}
