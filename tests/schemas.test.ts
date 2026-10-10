import { describe, expect, it } from 'vitest';
import { loginSchema, passwordSchema, profileSchema, registerSchema, usernameSchema } from '@/lib/validation/schemas';

describe('passwordSchema', () => {
  it('accepts a strong password', () => {
    expect(passwordSchema.safeParse('Correct7Horse').success).toBe(true);
  });

  it('rejects a password missing a digit', () => {
    expect(passwordSchema.safeParse('NoDigitsHere').success).toBe(false);
  });

  it('rejects a short password', () => {
    expect(passwordSchema.safeParse('Ab1').success).toBe(false);
  });

  it('limits passwords by bcrypt byte length, including multibyte characters', () => {
    expect(passwordSchema.safeParse(`Aa1${'é'.repeat(34)}`).success).toBe(true);
    const result = passwordSchema.safeParse(`Aa1${'é'.repeat(35)}`);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toContain('72 bytes');
  });
});

describe('usernameSchema', () => {
  it('rejects usernames with spaces or symbols', () => {
    expect(usernameSchema.safeParse('bad name!').success).toBe(false);
  });

  it('accepts hyphens and underscores', () => {
    expect(usernameSchema.safeParse('salo-mon_10').success).toBe(true);
  });
});

describe('registerSchema', () => {
  it('lower-cases and trims the email', () => {
    const result = registerSchema.safeParse({
      email: '  Person@Example.com  ',
      username: 'person',
      password: 'Correct7Horse',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe('person@example.com');
  });
});

describe('loginSchema', () => {
  it('requires a non-empty password without strength rules', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true);
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
  });
});

describe('profileSchema', () => {
  it('accepts only https avatar URLs', () => {
    expect(profileSchema.safeParse({ username: 'person', avatarUrl: 'https://example.com/avatar.png' }).success).toBe(true);
    expect(profileSchema.safeParse({ username: 'person', avatarUrl: 'javascript:alert(1)' }).success).toBe(false);
    expect(profileSchema.safeParse({ username: 'person', avatarUrl: 'data:image/png;base64,abc' }).success).toBe(false);
    expect(profileSchema.safeParse({ username: 'person', avatarUrl: 'http://example.com/avatar.png' }).success).toBe(false);
  });
});
