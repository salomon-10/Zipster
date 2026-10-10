'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/current-user';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { clearSessionCookie } from '@/lib/auth/session';
import {
  countAdmins,
  deleteUser,
  findUserWithSecretById,
  updatePassword,
  updateProfile,
  usernameExists,
} from '@/lib/db/users';
import { passwordChangeSchema, profileSchema } from '@/lib/validation/schemas';
import { actionError, actionOk, fieldErrorsFrom, type ActionResult } from '@/lib/utils';

export async function updateProfileAction(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return actionError('Sign in first.');

  const parsed = profileSchema.safeParse({
    username: formData.get('username'),
    avatarUrl: formData.get('avatarUrl') ?? '',
  });
  if (!parsed.success) {
    return actionError('Check the highlighted fields.', fieldErrorsFrom(parsed.error.issues));
  }

  try {
    if (
      parsed.data.username.toLowerCase() !== user.username.toLowerCase() &&
      (await usernameExists(parsed.data.username, user.id))
    ) {
      return actionError('Check the highlighted fields.', { username: 'This username is taken.' });
    }

    await updateProfile(user.id, {
      username: parsed.data.username,
      avatarUrl: parsed.data.avatarUrl,
    });
    revalidatePath('/settings');
    revalidatePath('/dashboard');
    return actionOk();
  } catch {
    return actionError('The profile could not be updated. Try again.');
  }
}

export async function changePasswordAction(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return actionError('Sign in first.');

  const parsed = passwordChangeSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  });
  if (!parsed.success) {
    return actionError('Check the highlighted fields.', fieldErrorsFrom(parsed.error.issues));
  }

  try {
    const stored = await findUserWithSecretById(user.id);
    if (!stored) return actionError('This account no longer exists.');

    const valid = await verifyPassword(parsed.data.currentPassword, stored.passwordHash);
    if (!valid) {
      return actionError('Check the highlighted fields.', {
        currentPassword: 'That is not your current password.',
      });
    }

    await updatePassword(user.id, await hashPassword(parsed.data.newPassword));
    return actionOk();
  } catch {
    return actionError('The password could not be changed. Try again.');
  }
}

export async function deleteAccountAction(): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return actionError('Sign in first.');

  // Refuse to leave the platform without an administrator.
  if (user.role === 'admin' && (await countAdmins()) <= 1) {
    return actionError('You are the only administrator. Promote someone else first.');
  }

  try {
    await deleteUser(user.id);
    await clearSessionCookie();
  } catch {
    return actionError('The account could not be deleted. Try again.');
  }

  redirect('/');
}
