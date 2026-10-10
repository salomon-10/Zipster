'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/current-user';
import { countAdmins, setUserRole } from '@/lib/db/users';
import { createTemplate, deleteTemplate, updateTemplate } from '@/lib/db/templates';
import { templateSchema } from '@/lib/validation/schemas';
import { actionError, actionOk, fieldErrorsFrom, type ActionResult } from '@/lib/utils';

/** Every admin action re-reads the session server-side. The middleware redirect
 *  is a convenience; this is the actual permission check. */
async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return null;
  return user;
}

export async function setRoleAction(userId: string, role: 'user' | 'admin'): Promise<ActionResult> {
  const admin = await assertAdmin();
  if (!admin) return actionError('You do not have access to this.');

  if (userId === admin.id && role === 'user' && (await countAdmins()) <= 1) {
    return actionError('You are the only administrator. Promote someone else first.');
  }

  try {
    await setUserRole(userId, role);
    revalidatePath('/admin');
    return actionOk();
  } catch {
    return actionError('The role could not be changed. Try again.');
  }
}

export async function saveTemplateAction(formData: FormData): Promise<ActionResult> {
  const admin = await assertAdmin();
  if (!admin) return actionError('You do not have access to this.');

  const framework = formData.get('framework');
  const parsed = templateSchema.safeParse({
    name: formData.get('name'),
    filePattern: formData.get('filePattern'),
    framework: typeof framework === 'string' && framework.trim() ? framework.trim() : null,
    content: formData.get('content') ?? '',
  });
  if (!parsed.success) {
    return actionError('Check the highlighted fields.', fieldErrorsFrom(parsed.error.issues));
  }

  const id = formData.get('templateId');

  try {
    if (typeof id === 'string' && id.length > 0) {
      const updated = await updateTemplate(id, parsed.data);
      if (!updated) return actionError('That template no longer exists.');
    } else {
      await createTemplate({ ...parsed.data, createdBy: admin.id });
    }
    revalidateTag('templates');
    revalidatePath('/admin/templates');
    revalidatePath('/templates');
    return actionOk();
  } catch {
    return actionError('The template could not be saved. A template for this filename may already exist.');
  }
}

export async function deleteTemplateAction(templateId: string): Promise<ActionResult> {
  const admin = await assertAdmin();
  if (!admin) return actionError('You do not have access to this.');

  try {
    const deleted = await deleteTemplate(templateId);
    if (!deleted) return actionError('That template no longer exists.');
    revalidateTag('templates');
    revalidatePath('/admin/templates');
    revalidatePath('/templates');
    return actionOk();
  } catch {
    return actionError('The template could not be deleted. Try again.');
  }
}
