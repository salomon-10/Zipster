import { flattenTree } from '../tree/parser';
import type { TreeNode } from '../tree/types';

export interface TemplateOption {
  id: string;
  name: string;
  filePattern: string;
  framework: string | null;
  content: string;
}

export interface GenerateOptions {
  /** Wraps every entry inside a single top-level folder when set. */
  rootFolder?: string | null;
  /** Templates the user switched on, applied by filename match. */
  templates?: TemplateOption[];
}

export interface GenerateResult {
  blob: Blob;
  fileCount: number;
  folderCount: number;
  sizeBytes: number;
  /** Files that received starter content, for the confirmation message. */
  filledFiles: string[];
}

function sanitiseSegment(segment: string): string {
  return segment.replace(/[<>:"\\|?*\u0000-\u001f]/g, '-').replace(/\.+$/, '');
}

/** Defence in depth: the parser already rejects these, this catches anything
 *  that reached the archive layer through a saved project or an import. */
function safePath(path: string): string | null {
  const segments = path.split('/').filter(Boolean);
  if (segments.some((segment) => segment === '.' || segment === '..')) return null;
  const cleaned = segments.map(sanitiseSegment).filter(Boolean);
  if (cleaned.length === 0) return null;
  return cleaned.join('/');
}

function matchTemplate(path: string, templates: TemplateOption[]): TemplateOption | null {
  const filename = (path.split('/').pop() ?? '').toLowerCase();
  return templates.find((template) => template.filePattern.toLowerCase() === filename) ?? null;
}

export async function generateZip(nodes: TreeNode[], options: GenerateOptions = {}): Promise<GenerateResult> {
  // Loaded on demand: ~100 kB that no page needs until someone clicks Download.
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const templates = options.templates ?? [];
  const root = options.rootFolder ? safePath(options.rootFolder) : null;
  const entries = flattenTree(nodes);

  let fileCount = 0;
  let folderCount = 0;
  const filledFiles: string[] = [];

  for (const entry of entries) {
    const relative = safePath(entry.path);
    if (!relative) continue;
    const full = root ? `${root}/${relative}` : relative;

    if (entry.type === 'folder') {
      zip.folder(full);
      folderCount += 1;
      continue;
    }

    const template = matchTemplate(full, templates);
    zip.file(full, template ? template.content : '');
    if (template) filledFiles.push(relative);
    fileCount += 1;
  }

  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  return { blob, fileCount, folderCount, sizeBytes: blob.size, filledFiles };
}

/** Turns a project name into a safe archive filename. */
export function toArchiveName(input: string): string {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${base || 'architecture'}.zip`;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoke on the next tick so Safari has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
