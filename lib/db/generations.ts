import { getSql } from './client';
import type { ActivityPoint, Generation, PlatformStats } from './types';

interface GenerationRow {
  id: string;
  user_id: string | null;
  project_id: string | null;
  project_name: string | null;
  file_count: number;
  folder_count: number;
  size_bytes: string | number;
  source: string;
  created_at: string;
}

const SOURCES = ['editor', 'project', 'shared', 'import'] as const;
type Source = (typeof SOURCES)[number];

function mapGeneration(row: GenerationRow): Generation {
  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id,
    projectName: row.project_name,
    fileCount: row.file_count,
    folderCount: row.folder_count,
    sizeBytes: Number(row.size_bytes),
    source: (SOURCES as readonly string[]).includes(row.source) ? (row.source as Source) : 'editor',
    createdAt: row.created_at,
  };
}

export async function recordGeneration(input: {
  userId: string | null;
  projectId: string | null;
  fileCount: number;
  folderCount: number;
  sizeBytes: number;
  source: Source;
}): Promise<void> {
  const sql = getSql();
  await sql`
    insert into generations (user_id, project_id, file_count, folder_count, size_bytes, source)
    values (${input.userId}, ${input.projectId}, ${input.fileCount}, ${input.folderCount},
            ${input.sizeBytes}, ${input.source})
  `;
}

export async function listGenerationsByUser(userId: string, limit = 20): Promise<Generation[]> {
  const sql = getSql();
  const rows = (await sql`
    select g.id, g.user_id, g.project_id, p.name as project_name, g.file_count,
           g.folder_count, g.size_bytes, g.source, g.created_at
    from generations g
    left join projects p on p.id = g.project_id
    where g.user_id = ${userId}
    order by g.created_at desc
    limit ${limit}
  `) as GenerationRow[];
  return rows.map(mapGeneration);
}

export async function countGenerationsByUser(userId: string): Promise<{ total: number; files: number }> {
  const sql = getSql();
  const rows = (await sql`
    select count(*)::int as total, coalesce(sum(file_count), 0)::int as files
    from generations where user_id = ${userId}
  `) as { total: number; files: number }[];
  return rows[0] ?? { total: 0, files: 0 };
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const sql = getSql();
  const rows = (await sql`
    select
      (select count(*)::int from users) as users,
      (select count(*)::int from projects) as projects,
      (select count(*)::int from projects where is_public) as public_projects,
      (select count(*)::int from generations) as generations,
      (select coalesce(sum(file_count), 0)::int from generations) as files_created
  `) as {
    users: number;
    projects: number;
    public_projects: number;
    generations: number;
    files_created: number;
  }[];

  const row = rows[0];
  return {
    users: row?.users ?? 0,
    projects: row?.projects ?? 0,
    publicProjects: row?.public_projects ?? 0,
    generations: row?.generations ?? 0,
    filesCreated: row?.files_created ?? 0,
  };
}

/** Thirty-day series, zero-filled so the chart has no gaps. */
export async function getActivitySeries(days = 30): Promise<ActivityPoint[]> {
  const sql = getSql();
  const rows = (await sql`
    select to_char(d.day, 'YYYY-MM-DD') as day,
           count(g.id)::int as generations,
           coalesce(sum(g.file_count), 0)::int as files
    from generate_series(
           current_date - (${days - 1}::int), current_date, interval '1 day'
         ) as d(day)
    left join generations g on g.created_at::date = d.day
    group by d.day
    order by d.day
  `) as { day: string; generations: number; files: number }[];

  return rows;
}
