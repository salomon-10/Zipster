import { unstable_cache } from 'next/cache';
import { BUILTIN_TEMPLATES } from '../templates/builtin';
import { getSql } from './client';
import type { FileTemplate } from './types';

interface TemplateRow {
  id: string;
  name: string;
  file_pattern: string;
  framework: string | null;
  content: string;
  is_official: boolean;
  created_at: string;
}

function mapTemplate(row: TemplateRow): FileTemplate {
  return {
    id: row.id,
    name: row.name,
    filePattern: row.file_pattern,
    framework: row.framework,
    content: row.content,
    isOfficial: row.is_official,
    createdAt: row.created_at,
  };
}

/** Fallback used when the database has not been seeded yet, so the editor
 *  always has something to offer. Ids are deterministic and prefixed. */
function fallbackTemplates(): FileTemplate[] {
  return BUILTIN_TEMPLATES.map((template, index) => ({
    id: `builtin-${index}`,
    name: template.name,
    filePattern: template.filePattern,
    framework: template.framework,
    content: template.content,
    isOfficial: true,
    createdAt: new Date(0).toISOString(),
  }));
}

/** Official templates change a few times a year, but every editor page needs
 *  them. Cached for an hour and invalidated by the `templates` tag when an
 *  admin saves or deletes one. Throws on failure so an error is never cached. */
const queryOfficialTemplates = unstable_cache(
  async (): Promise<FileTemplate[]> => {
    const sql = getSql();
    const rows = (await sql`
      select id, name, file_pattern, framework, content, is_official, created_at
      from file_templates
      where is_official
      order by name
    `) as TemplateRow[];
    return rows.map(mapTemplate);
  },
  ['official-templates'],
  { revalidate: 3600, tags: ['templates'] },
);

export async function listOfficialTemplates(): Promise<FileTemplate[]> {
  try {
    const templates = await queryOfficialTemplates();
    return templates.length === 0 ? fallbackTemplates() : templates;
  } catch {
    return fallbackTemplates();
  }
}

export async function findTemplateById(id: string): Promise<FileTemplate | null> {
  const sql = getSql();
  const rows = (await sql`
    select id, name, file_pattern, framework, content, is_official, created_at
    from file_templates where id = ${id} limit 1
  `) as TemplateRow[];
  const row = rows[0];
  return row ? mapTemplate(row) : null;
}

export async function createTemplate(input: {
  name: string;
  filePattern: string;
  framework: string | null;
  content: string;
  createdBy: string;
}): Promise<FileTemplate> {
  const sql = getSql();
  const rows = (await sql`
    insert into file_templates (name, file_pattern, framework, content, is_official, created_by)
    values (${input.name}, ${input.filePattern}, ${input.framework}, ${input.content}, true, ${input.createdBy})
    returning id, name, file_pattern, framework, content, is_official, created_at
  `) as TemplateRow[];

  const row = rows[0];
  if (!row) throw new Error('The template could not be created.');
  return mapTemplate(row);
}

export async function updateTemplate(
  id: string,
  input: { name: string; filePattern: string; framework: string | null; content: string },
): Promise<FileTemplate | null> {
  const sql = getSql();
  const rows = (await sql`
    update file_templates
    set name = ${input.name}, file_pattern = ${input.filePattern},
        framework = ${input.framework}, content = ${input.content}
    where id = ${id}
    returning id, name, file_pattern, framework, content, is_official, created_at
  `) as TemplateRow[];

  const row = rows[0];
  return row ? mapTemplate(row) : null;
}

export async function deleteTemplate(id: string): Promise<boolean> {
  const sql = getSql();
  const rows = (await sql`delete from file_templates where id = ${id} returning id`) as { id: string }[];
  return rows.length > 0;
}
