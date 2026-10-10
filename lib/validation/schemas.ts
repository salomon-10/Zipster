import { z } from 'zod';
import { LIMITS } from '../tree/constants';

/** Shared by the sign-up form and the server action, so the rules cannot drift. */
export const passwordSchema = z
  .string()
  .min(10, 'Use at least 10 characters.')
  .refine((value) => new TextEncoder().encode(value).length <= 72, 'That password must be 72 bytes or fewer.')
  .regex(/[a-z]/, 'Include at least one lowercase letter.')
  .regex(/[A-Z]/, 'Include at least one uppercase letter.')
  .regex(/[0-9]/, 'Include at least one number.');

export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Use at least 3 characters.')
  .max(32, 'Keep it under 32 characters.')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Letters, numbers, hyphens and underscores only.');

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Enter a valid email address.').max(254));

export const registerSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password.'),
});

export const profileSchema = z.object({
  username: usernameSchema,
  avatarUrl: z
    .union([
      z.literal(''),
      z
        .url('Enter a full URL starting with https://')
        .refine((value) => value.startsWith('https://'), 'Avatar URLs must use https://.'),
    ])
    .transform((value) => (value === '' ? null : value))
    .nullable(),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password.'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'The two passwords do not match.',
    path: ['confirmPassword'],
  });

export const projectSchema = z.object({
  name: z.string().trim().min(1, 'Give the project a name.').max(120, 'Keep the name under 120 characters.'),
  rawTree: z
    .string()
    .min(1, 'The tree is empty.')
    .max(LIMITS.maxInputChars, 'This tree is too large to save.'),
});

export const templateSchema = z.object({
  name: z.string().trim().min(1, 'Give the template a name.').max(120),
  filePattern: z
    .string()
    .trim()
    .min(1, 'Enter the filename this template fills.')
    .max(120)
    .regex(/^[^/\\]+$/, 'Use a filename without a path.'),
  framework: z.string().trim().max(40).nullable(),
  content: z.string().max(20000, 'Template content is limited to 20,000 characters.'),
});

export const generationSchema = z.object({
  projectId: z.string().uuid().nullable(),
  fileCount: z.number().int().min(0).max(LIMITS.maxNodes),
  folderCount: z.number().int().min(0).max(LIMITS.maxNodes),
  sizeBytes: z.number().int().min(0).max(100_000_000),
  source: z.enum(['editor', 'project', 'shared', 'import']),
});

export const importRepoSchema = z.object({
  repo: z
    .string()
    .trim()
    .min(1, 'Paste a GitHub repository URL or owner/name.')
    .max(200),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type TemplateInput = z.infer<typeof templateSchema>;
