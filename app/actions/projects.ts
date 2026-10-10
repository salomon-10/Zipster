'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/current-user';
import {
  createProject,
  deleteProject,
  findProjectById,
  setProjectVisibility,
  slugExists,
  updateProject,
} from '@/lib/db/projects';
import { recordGeneration } from '@/lib/db/generations';
import { parseTree } from '@/lib/tree/parser';
import { generationSchema, projectSchema } from '@/lib/validation/schemas';
import { actionError, actionOk, appUrl, fieldErrorsFrom, randomSlug, type ActionResult } from '@/lib/utils';

/** The tree is re-parsed on the server: the counters stored against a project
 *  never come from client-supplied numbers. */
function countsFor(rawTree: string) {
  const { stats } = parseTree(rawTree);
  return { fileCount: stats.files, folderCount: stats.folders };
}

export async function saveProjectAction(
  formData: FormData,
): Promise<ActionResult<{ id: string; name: string }>> {
  const user = await getCurrentUser();
  if (!user) return actionError('Sign in to save an architecture.');

  const parsed = projectSchema.safeParse({
    name: formData.get('name'),
    rawTree: formData.get('rawTree'),
  });
  if (!parsed.success) {
    return actionError('Check the highlighted fields.', fieldErrorsFrom(parsed.error.issues));
  }

  const id = formData.get('projectId');
  const counts = countsFor(parsed.data.rawTree);

  try {
    if (typeof id === 'string' && id.length > 0) {
      const updated = await updateProject(id, user.id, { ...parsed.data, ...counts });
      if (!updated) return actionError('That project was not found in your account.');
      revalidatePath('/dashboard');
      revalidatePath(`/editor/${id}`);
      return actionOk({ id: updated.id, name: updated.name });
    }

    const created = await createProject({ userId: user.id, ...parsed.data, ...counts });
    revalidatePath('/dashboard');
    return actionOk({ id: created.id, name: created.name });
  } catch {
    return actionError('The project could not be saved. Try again.');
  }
}

export async function deleteProjectAction(projectId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return actionError('Sign in first.');

  try {
    const deleted = await deleteProject(projectId, user.id);
    if (!deleted) return actionError('That project was not found in your account.');
    revalidatePath('/dashboard');
    return actionOk();
  } catch {
    return actionError('The project could not be deleted. Try again.');
  }
}

export async function toggleShareAction(
  projectId: string,
  makePublic: boolean,
): Promise<ActionResult<{ url: string | null }>> {
  const user = await getCurrentUser();
  if (!user) return actionError('Sign in first.');

  try {
    const project = await findProjectById(projectId);
    if (!project || project.userId !== user.id) {
      return actionError('That project was not found in your account.');
    }

    let slug = project.shareSlug;
    if (makePublic && !slug) {
      // Retry a handful of times; the unique index is the real guarantee.
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const candidate = randomSlug();
        if (!(await slugExists(candidate))) {
          slug = candidate;
          break;
        }
      }
      if (!slug) return actionError('Could not create a share link. Try again.');
    }

    const updated = await setProjectVisibility(projectId, user.id, makePublic, slug);
    if (!updated) return actionError('That project was not found in your account.');

    revalidatePath('/dashboard');
    return actionOk({
      url: updated.isPublic && updated.shareSlug ? appUrl(`/s/${updated.shareSlug}`) : null,
    });
  } catch {
    return actionError('The share setting could not be changed. Try again.');
  }
}

/** Called after a successful browser-side download, purely for the activity
 *  log. Anonymous downloads are logged with a null user. */
export async function recordGenerationAction(input: {
  projectId: string | null;
  fileCount: number;
  folderCount: number;
  sizeBytes: number;
  source: 'editor' | 'project' | 'shared' | 'import';
}): Promise<ActionResult> {
  const parsed = generationSchema.safeParse(input);
  if (!parsed.success) return actionError('Invalid generation data.');

  const user = await getCurrentUser();

  try {
    let projectId = parsed.data.projectId;
    if (projectId) {
      const project = await findProjectById(projectId);
      // Never attribute a download to a project the caller does not own.
      if (!project || project.userId !== user?.id) projectId = null;
    }

    await recordGeneration({
      userId: user?.id ?? null,
      projectId,
      fileCount: parsed.data.fileCount,
      folderCount: parsed.data.folderCount,
      sizeBytes: parsed.data.sizeBytes,
      source: parsed.data.source,
    });

    if (user) revalidatePath('/dashboard');
    return actionOk();
  } catch {
    // A missing log entry must never break a download the user already got.
    return actionOk();
  }
}
