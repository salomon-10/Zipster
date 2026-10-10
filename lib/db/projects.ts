import { getSql } from './client';
import type { Project, SharedProject } from './types';

interface ProjectRow {
  id: string;
  user_id: string;
  name: string;
  raw_tree: string;
  is_public: boolean;
  share_slug: string | null;
  view_count: number;
  file_count: number;
  folder_count: number;
  created_at: string;
  updated_at: string;
}

function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    rawTree: row.raw_tree,
    isPublic: row.is_public,
    shareSlug: row.share_slug,
    viewCount: row.view_count,
    fileCount: row.file_count,
    folderCount: row.folder_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listProjectsByUser(userId: string): Promise<Project[]> {
  const sql = getSql();
  const rows = (await sql`
    select id, user_id, name, raw_tree, is_public, share_slug, view_count,
           file_count, folder_count, created_at, updated_at
    from projects
    where user_id = ${userId}
    order by updated_at desc
  `) as ProjectRow[];
  return rows.map(mapProject);
}

export async function findProjectById(id: string): Promise<Project | null> {
  const sql = getSql();
  const rows = (await sql`
    select id, user_id, name, raw_tree, is_public, share_slug, view_count,
           file_count, folder_count, created_at, updated_at
    from projects
    where id = ${id}
    limit 1
  `) as ProjectRow[];
  const row = rows[0];
  return row ? mapProject(row) : null;
}

export async function findProjectBySlug(slug: string): Promise<SharedProject | null> {
  const sql = getSql();
  const rows = (await sql`
    select p.id, p.user_id, p.name, p.raw_tree, p.is_public, p.share_slug, p.view_count,
           p.file_count, p.folder_count, p.created_at, p.updated_at,
           u.username as owner_username
    from projects p
    join users u on u.id = p.user_id
    where p.share_slug = ${slug} and p.is_public
    limit 1
  `) as (ProjectRow & { owner_username: string })[];

  const row = rows[0];
  if (!row) return null;
  return { ...mapProject(row), ownerUsername: row.owner_username };
}

export async function createProject(input: {
  userId: string;
  name: string;
  rawTree: string;
  fileCount: number;
  folderCount: number;
}): Promise<Project> {
  const sql = getSql();
  const rows = (await sql`
    insert into projects (user_id, name, raw_tree, file_count, folder_count)
    values (${input.userId}, ${input.name}, ${input.rawTree}, ${input.fileCount}, ${input.folderCount})
    returning id, user_id, name, raw_tree, is_public, share_slug, view_count,
              file_count, folder_count, created_at, updated_at
  `) as ProjectRow[];

  const row = rows[0];
  if (!row) throw new Error('The project could not be saved.');
  return mapProject(row);
}

/** Scoped by user_id so a mismatched owner updates zero rows instead of leaking. */
export async function updateProject(
  id: string,
  userId: string,
  input: { name: string; rawTree: string; fileCount: number; folderCount: number },
): Promise<Project | null> {
  const sql = getSql();
  const rows = (await sql`
    update projects
    set name = ${input.name}, raw_tree = ${input.rawTree},
        file_count = ${input.fileCount}, folder_count = ${input.folderCount}
    where id = ${id} and user_id = ${userId}
    returning id, user_id, name, raw_tree, is_public, share_slug, view_count,
              file_count, folder_count, created_at, updated_at
  `) as ProjectRow[];

  const row = rows[0];
  return row ? mapProject(row) : null;
}

export async function deleteProject(id: string, userId: string): Promise<boolean> {
  const sql = getSql();
  const rows = (await sql`
    delete from projects where id = ${id} and user_id = ${userId} returning id
  `) as { id: string }[];
  return rows.length > 0;
}

export async function setProjectVisibility(
  id: string,
  userId: string,
  isPublic: boolean,
  slug: string | null,
): Promise<Project | null> {
  const sql = getSql();
  const rows = (await sql`
    update projects
    set is_public = ${isPublic},
        share_slug = case when ${isPublic} then coalesce(share_slug, ${slug}) else share_slug end
    where id = ${id} and user_id = ${userId}
    returning id, user_id, name, raw_tree, is_public, share_slug, view_count,
              file_count, folder_count, created_at, updated_at
  `) as ProjectRow[];

  const row = rows[0];
  return row ? mapProject(row) : null;
}

export async function incrementViewCount(slug: string): Promise<void> {
  const sql = getSql();
  await sql`update projects set view_count = view_count + 1 where share_slug = ${slug} and is_public`;
}

export async function slugExists(slug: string): Promise<boolean> {
  const sql = getSql();
  const rows = (await sql`select 1 as hit from projects where share_slug = ${slug} limit 1`) as unknown[];
  return rows.length > 0;
}

export async function listPublicProjects(limit = 24): Promise<SharedProject[]> {
  const sql = getSql();
  const rows = (await sql`
    select p.id, p.user_id, p.name, p.raw_tree, p.is_public, p.share_slug, p.view_count,
           p.file_count, p.folder_count, p.created_at, p.updated_at,
           u.username as owner_username
    from projects p
    join users u on u.id = p.user_id
    where p.is_public
    order by p.view_count desc, p.updated_at desc
    limit ${limit}
  `) as (ProjectRow & { owner_username: string })[];

  return rows.map((row) => ({ ...mapProject(row), ownerUsername: row.owner_username }));
}
