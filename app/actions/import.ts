'use server';

import { importRepoTree, parseRepoInput, ImportError } from '@/lib/github/import';
import { serializeTree } from '@/lib/tree/serialize';
import { collectStats } from '@/lib/tree/parser';
import { importRepoSchema } from '@/lib/validation/schemas';
import { actionError, actionOk, fieldErrorsFrom, type ActionResult } from '@/lib/utils';

export interface ImportedTree {
  text: string;
  owner: string;
  repo: string;
  branch: string;
  files: number;
  folders: number;
  truncated: boolean;
}

export async function importRepoAction(formData: FormData): Promise<ActionResult<ImportedTree>> {
  const parsed = importRepoSchema.safeParse({ repo: formData.get('repo') });
  if (!parsed.success) {
    return actionError('Check the highlighted field.', fieldErrorsFrom(parsed.error.issues));
  }

  const ref = parseRepoInput(parsed.data.repo);
  if (!ref) {
    return actionError('Paste a GitHub URL (github.com/owner/repo) or owner/repo.');
  }

  try {
    const result = await importRepoTree(ref);
    const stats = collectStats(result.roots);
    return actionOk({
      text: serializeTree(result.roots),
      owner: result.owner,
      repo: result.repo,
      branch: result.branch,
      files: stats.files,
      folders: stats.folders,
      truncated: result.truncated,
    });
  } catch (error) {
    if (error instanceof ImportError) return actionError(error.message);
    return actionError('The import failed. Check the repository name and try again.');
  }
}
