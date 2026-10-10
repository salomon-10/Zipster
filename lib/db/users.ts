import { getSql } from './client';
import type { AdminUserRow, User, UserRole, UserWithSecret } from './types';

interface UserRow {
  id: string;
  email: string;
  username: string;
  avatar_url: string | null;
  role: string;
  created_at: string;
  password_hash?: string;
}

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    avatarUrl: row.avatar_url,
    role: row.role === 'admin' ? 'admin' : 'user',
    createdAt: row.created_at,
  };
}

export async function findUserByEmail(email: string): Promise<UserWithSecret | null> {
  const sql = getSql();
  const rows = (await sql`
    select id, email, username, avatar_url, role, created_at, password_hash
    from users
    where email_norm = lower(${email})
    limit 1
  `) as UserRow[];

  const row = rows[0];
  if (!row || !row.password_hash) return null;
  return { ...mapUser(row), passwordHash: row.password_hash };
}

export async function findUserById(id: string): Promise<User | null> {
  const sql = getSql();
  const rows = (await sql`
    select id, email, username, avatar_url, role, created_at
    from users
    where id = ${id}
    limit 1
  `) as UserRow[];

  const row = rows[0];
  return row ? mapUser(row) : null;
}

export async function findUserWithSecretById(id: string): Promise<UserWithSecret | null> {
  const sql = getSql();
  const rows = (await sql`
    select id, email, username, avatar_url, role, created_at, password_hash
    from users
    where id = ${id}
    limit 1
  `) as UserRow[];

  const row = rows[0];
  if (!row || !row.password_hash) return null;
  return { ...mapUser(row), passwordHash: row.password_hash };
}

export async function emailExists(email: string): Promise<boolean> {
  const sql = getSql();
  const rows = (await sql`select 1 as hit from users where email_norm = lower(${email}) limit 1`) as unknown[];
  return rows.length > 0;
}

export async function usernameExists(username: string, excludeUserId?: string): Promise<boolean> {
  const sql = getSql();
  const rows = (await sql`
    select 1 as hit from users
    where lower(username) = lower(${username})
      and (${excludeUserId ?? null}::uuid is null or id <> ${excludeUserId ?? null}::uuid)
    limit 1
  `) as unknown[];
  return rows.length > 0;
}

export async function createUser(input: {
  email: string;
  username: string;
  passwordHash: string;
  role?: UserRole;
}): Promise<User> {
  const sql = getSql();
  const rows = (await sql`
    insert into users (email, username, password_hash, role)
    values (${input.email}, ${input.username}, ${input.passwordHash}, ${input.role ?? 'user'})
    returning id, email, username, avatar_url, role, created_at
  `) as UserRow[];

  const row = rows[0];
  if (!row) throw new Error('The account could not be created.');
  return mapUser(row);
}

export async function updateProfile(
  userId: string,
  input: { username: string; avatarUrl: string | null },
): Promise<User> {
  const sql = getSql();
  const rows = (await sql`
    update users
    set username = ${input.username}, avatar_url = ${input.avatarUrl}
    where id = ${userId}
    returning id, email, username, avatar_url, role, created_at
  `) as UserRow[];

  const row = rows[0];
  if (!row) throw new Error('This account no longer exists.');
  return mapUser(row);
}

export async function updatePassword(userId: string, passwordHash: string): Promise<void> {
  const sql = getSql();
  await sql`update users set password_hash = ${passwordHash} where id = ${userId}`;
}

export async function deleteUser(userId: string): Promise<void> {
  const sql = getSql();
  await sql`delete from users where id = ${userId}`;
}

export async function listUsers(limit = 100): Promise<AdminUserRow[]> {
  const sql = getSql();
  const rows = (await sql`
    select u.id, u.email, u.username, u.avatar_url, u.role, u.created_at,
           count(distinct p.id)::int as project_count,
           count(distinct g.id)::int as generation_count
    from users u
    left join projects p on p.user_id = u.id
    left join generations g on g.user_id = u.id
    group by u.id
    order by u.created_at desc
    limit ${limit}
  `) as (UserRow & { project_count: number; generation_count: number })[];

  return rows.map((row) => ({
    ...mapUser(row),
    projectCount: row.project_count,
    generationCount: row.generation_count,
  }));
}

export async function setUserRole(userId: string, role: UserRole): Promise<void> {
  const sql = getSql();
  await sql`update users set role = ${role} where id = ${userId}`;
}

export async function countAdmins(): Promise<number> {
  const sql = getSql();
  const rows = (await sql`select count(*)::int as total from users where role = 'admin'`) as { total: number }[];
  return rows[0]?.total ?? 0;
}
