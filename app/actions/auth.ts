'use server';

import { redirect } from 'next/navigation';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { clearSessionCookie, createSessionCookie } from '@/lib/auth/session';
import { createUser, emailExists, findUserByEmail, usernameExists } from '@/lib/db/users';
import { loginSchema, registerSchema } from '@/lib/validation/schemas';
import { actionError, actionOk, fieldErrorsFrom, type ActionResult } from '@/lib/utils';

// Same bcrypt cost as hashPassword() (12), so an unknown email takes as long as a wrong password.
const DUMMY_PASSWORD_HASH = '$2b$12$BcRHL/jGj5sz8qNDts3PQuLQoJdDzZtjNZ6nGViyaecDEst32WhzG';

/**
 * Turns a caught error into a message that actually helps during setup,
 * instead of a blanket "something went wrong". The real error is always
 * logged server-side first — check the terminal running `next dev` (or the
 * hosting provider's function logs in production) if this still isn't
 * enough to diagnose the issue.
 */
function describeAuthError(error: unknown): string {
  console.error('[auth]', error);
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('AUTH_SECRET')) {
    return 'AUTH_SECRET is missing or too short. Set it in .env.local (32+ random characters) and restart the dev server.';
  }
  if (message.includes('DATABASE_URL')) {
    return message;
  }
  if (message.includes('does not exist') && message.includes('relation')) {
    return 'The database tables are not set up yet. Run "npm run db:migrate" against your Neon database, then try again.';
  }
  if (message.includes('duplicate key') || message.includes('unique constraint')) {
    return 'That email or username was just taken by someone else. Try again with different details.';
  }
  if (
    message.includes('fetch failed') ||
    message.includes('ENOTFOUND') ||
    message.includes('ECONNREFUSED') ||
    message.includes('timeout')
  ) {
    return 'The database could not be reached. Check that DATABASE_URL is correct and your Neon project is active.';
  }

  return 'Something went wrong on our side. Try again in a moment.';
}

export async function registerAction(formData: FormData): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    email: formData.get('email'),
    username: formData.get('username'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return actionError('Check the highlighted fields.', fieldErrorsFrom(parsed.error.issues));
  }

  const { email, username, password } = parsed.data;

  try {
    if (await emailExists(email)) {
      return actionError('Check the highlighted fields.', {
        email: 'An account already uses this email.',
      });
    }
    if (await usernameExists(username)) {
      return actionError('Check the highlighted fields.', { username: 'This username is taken.' });
    }

    const user = await createUser({ email, username, passwordHash: await hashPassword(password), role: 'user' });

    try {
      await createSessionCookie({ userId: user.id, role: user.role });
    } catch (sessionError) {
      // The account was created even though the session cookie failed — say
      // so explicitly rather than implying registration itself failed.
      console.error('[auth] account created but session cookie failed:', sessionError);
      return actionError(
        `${describeAuthError(sessionError)} Your account was created — sign in once this is fixed.`,
      );
    }

    return actionOk();
  } catch (error) {
    return actionError(describeAuthError(error));
  }
}

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return actionError('Check the highlighted fields.', fieldErrorsFrom(parsed.error.issues));
  }

  try {
    const user = await findUserByEmail(parsed.data.email);
    // One message for both cases, so the form does not confirm which emails exist.
    const generic = 'That email and password do not match an account.';
    const valid = await verifyPassword(parsed.data.password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
    if (!valid) return actionError(generic);

    if (!user) return actionError(generic);

    await createSessionCookie({ userId: user.id, role: user.role });
    return actionOk();
  } catch (error) {
    return actionError(describeAuthError(error));
  }
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect('/');
}