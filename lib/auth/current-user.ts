import { cache } from 'react';
import { redirect } from 'next/navigation';
import { findUserById } from '../db/users';
import type { User } from '../db/types';
import { readSession } from './session';

interface Resolved {
  user: User | null;
  /** A valid cookie whose account no longer exists (deleted, DB reset). */
  stale: boolean;
  /** The lookup itself failed (database unreachable). */
  failed: boolean;
}

/**
 * Resolved once per request. Every server action and protected page reads the
 * user through here, so authorisation is never inferred from client input.
 */
const resolveUser = cache(async (): Promise<Resolved> => {
  const session = await readSession();
  if (!session) return { user: null, stale: false, failed: false };

  try {
    const user = await findUserById(session.userId);
    return { user, stale: user === null, failed: false };
  } catch {
    return { user: null, stale: false, failed: true };
  }
});

/** Public pages degrade to "signed out" if the database hiccups. */
export async function getCurrentUser(): Promise<User | null> {
  return (await resolveUser()).user;
}

/**
 * Protected pages must not bounce to /login while the cookie is still valid:
 * the middleware would send the visitor straight back, and the browser ends up
 * in a redirect loop. A stale cookie is cleared first; a database failure is a
 * real error, not a sign-out.
 */
async function requireResolved(): Promise<User> {
  const { user, stale, failed } = await resolveUser();
  if (user) return user;
  if (failed) throw new Error('The account could not be loaded. Try again in a moment.');
  redirect(stale ? '/api/session/clear' : '/login');
}

export async function requireUser(): Promise<User> {
  return requireResolved();
}

export async function requireAdmin(): Promise<User> {
  const user = await requireResolved();
  if (user.role !== 'admin') redirect('/dashboard');
  return user;
}
