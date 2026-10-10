// Quick connectivity check, nothing else. Run this first whenever something
// database-related isn't working — it answers "is it the network/config, or
// is it the app?" in about a second.
// Usage: npm run db:test  (reads .env.local via --env-file)

import { setDefaultResultOrder } from 'node:dns';
import { neon } from '@neondatabase/serverless';

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
    console.error('✗ DATABASE_URL is not set. Copy .env.example to .env.local first.');
    process.exit(1);
  }

  console.log('Connecting...');
  const started = Date.now();

  try {
    const sql = neon(url);
    const rows = await withRetry(() => sql`select now() as time, current_database() as db`, 'connectivity check');
    const elapsed = Date.now() - started;
    console.log(`✓ Connected in ${elapsed}ms`);
    console.log(`  Database: ${rows[0].db}`);
    console.log(`  Server time: ${rows[0].time}`);

    const tables = await withRetry(
      () => sql`
        select table_name from information_schema.tables
        where table_schema = 'public' order by table_name
      `,
      'table listing',
    );
    if (tables.length === 0) {
      console.log('  Tables: none yet — run "npm run db:migrate" next.');
    } else {
      console.log(`  Tables: ${tables.map((t) => t.table_name).join(', ')}`);
    }
  } catch (error) {
    const elapsed = Date.now() - started;
    console.error(`✗ Failed after ${elapsed}ms`);
    console.error(error);
    process.exit(1);
  }
}

main();
