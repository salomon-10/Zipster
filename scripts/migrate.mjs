// Runs every .sql file in /migrations against DATABASE_URL, in filename order.
// Usage: npm run db:migrate  (reads .env.local via --env-file)

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { setDefaultResultOrder } from 'node:dns';
import { neon } from '@neondatabase/serverless';

// See lib/db/client.ts for why this is needed — without it, this script can
// time out on networks where IPv6 has no route, even though the host is
// reachable over IPv4.
setDefaultResultOrder('ipv4first');

const RETRYABLE = /fetch failed|ConnectTimeout|UND_ERR_CONNECT_TIMEOUT|ECONNRESET|ETIMEDOUT|EAI_AGAIN/i;

function errorChainMessage(error) {
  const parts = [];
  let current = error;
  for (let depth = 0; current && depth < 5; depth += 1) {
    if (current instanceof Error) {
      parts.push(current.message, current.name);
      current = current.cause;
    } else {
      parts.push(String(current));
      break;
    }
  }
  return parts.join(' | ');
}

async function withRetry(run, label) {
  const attempts = 3;
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      lastError = error;
      if (attempt === attempts || !RETRYABLE.test(errorChainMessage(error))) throw error;
      console.log(`  connection hiccup on ${label}, retrying (${attempt}/${attempts - 1})...`);
      await new Promise((resolve) => setTimeout(resolve, attempt * 400));
    }
  }
  throw lastError;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set. Copy .env.example to .env.local first.');
    process.exit(1);
  }

  const sql = neon(url);
  const dir = path.join(process.cwd(), 'migrations');
  const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();

  if (files.length === 0) {
    console.log('No migration files found.');
    return;
  }

  for (const file of files) {
    console.log(`Applying ${file}...`);
    const content = await readFile(path.join(dir, file), 'utf8');
    // Neon's HTTP driver runs one statement per call, so split on statement
    // boundaries. Simple splitter: safe here because the migrations contain no
    // semicolons inside string literals or dollar-quoted bodies except the
    // trigger functions, which are kept as single statements below.
    const statements = splitStatements(content);
    for (const statement of statements) {
      if (!statement.trim()) continue;
      // Raw, non-parameterized SQL from a file — sql.query() runs it as-is.
      // The tagged-template form (sql`...`) only accepts literal template
      // strings, not a runtime string variable.
      await withRetry(() => sql.query(statement), file);
    }
    console.log(`  done (${statements.length} statements).`);
  }

  console.log('All migrations applied.');
}

/** Splits on `;` at the top level, but keeps `$$ ... $$` function bodies (used
 *  by the updated_at trigger) intact as single statements. */
function splitStatements(content) {
  const statements = [];
  let current = '';
  let inDollar = false;

  const lines = content.split('\n');
  for (const line of lines) {
    if (line.trim().startsWith('--')) continue;
    current += `${line}\n`;
    if (line.includes('$$')) inDollar = !inDollar;
    if (!inDollar && line.trim().endsWith(';')) {
      statements.push(current.trim());
      current = '';
    }
  }
  if (current.trim()) statements.push(current.trim());
  return statements;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
