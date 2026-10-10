import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createUser: vi.fn(),
  emailExists: vi.fn(),
  findUserByEmail: vi.fn(),
  usernameExists: vi.fn(),
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
  createSessionCookie: vi.fn(),
  clearSessionCookie: vi.fn(),
}));

vi.mock('@/lib/db/users', () => ({
  createUser: mocks.createUser,
  emailExists: mocks.emailExists,
  findUserByEmail: mocks.findUserByEmail,
  usernameExists: mocks.usernameExists,
}));
vi.mock('@/lib/auth/password', () => ({
  hashPassword: mocks.hashPassword,
  verifyPassword: mocks.verifyPassword,
}));
vi.mock('@/lib/auth/session', () => ({
  createSessionCookie: mocks.createSessionCookie,
  clearSessionCookie: mocks.clearSessionCookie,
}));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

import { loginAction, registerAction } from '@/app/actions/auth';

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe('auth actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_EMAIL = 'admin@example.com';
    mocks.emailExists.mockResolvedValue(false);
    mocks.usernameExists.mockResolvedValue(false);
    mocks.hashPassword.mockResolvedValue('hashed-password');
    mocks.createUser.mockResolvedValue({ id: 'user-1', role: 'user' });
  });

  it('never elevates a newly registered account based on its email', async () => {
    const result = await registerAction(form({
      email: 'admin@example.com',
      username: 'admin',
      password: 'Correct7Horse',
    }));

    expect(result.ok).toBe(true);
    expect(mocks.createUser).toHaveBeenCalledWith({
      email: 'admin@example.com',
      username: 'admin',
      passwordHash: 'hashed-password',
      role: 'user',
    });
  });

  it('performs a password comparison for an unknown user', async () => {
    mocks.findUserByEmail.mockResolvedValue(null);
    mocks.verifyPassword.mockResolvedValue(false);

    const result = await loginAction(form({ email: 'missing@example.com', password: 'Correct7Horse' }));

    expect(result.ok).toBe(false);
    expect(mocks.verifyPassword).toHaveBeenCalledWith('Correct7Horse', expect.stringMatching(/^\$2[aby]\$/));
  });
});