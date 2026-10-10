// Seeds the official file templates. Safe to re-run: uses the unique index on
// (file_pattern, framework) for official rows to upsert instead of duplicate.
// The content here mirrors lib/templates/builtin.ts, which is also the
// in-app fallback used if this script has not been run yet.
// Usage: npm run db:seed  (reads .env.local via --env-file)

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

const TEMPLATES = [
  {
    name: 'README.md',
    filePattern: 'README.md',
    framework: null,
    content: `# Project name\n\nOne sentence on what this does.\n\n## Getting started\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n`,
  },
  {
    name: '.gitignore (Node)',
    filePattern: '.gitignore',
    framework: 'node',
    content: `node_modules/\ndist/\nbuild/\ncoverage/\n\n.env\n.env*.local\n\n*.log\n.DS_Store\nThumbs.db\n`,
  },
  {
    name: 'package.json',
    filePattern: 'package.json',
    framework: 'node',
    content: `{\n  "name": "project-name",\n  "version": "0.1.0",\n  "private": true,\n  "type": "module",\n  "scripts": {\n    "dev": "node index.js"\n  }\n}\n`,
  },
  {
    name: 'tsconfig.json',
    filePattern: 'tsconfig.json',
    framework: null,
    content: `{\n  "compilerOptions": {\n    "target": "ES2022",\n    "strict": true,\n    "esModuleInterop": true,\n    "skipLibCheck": true,\n    "noEmit": true\n  }\n}\n`,
  },
  {
    name: '.env.example',
    filePattern: '.env.example',
    framework: null,
    content: `# Copy to .env.local and fill in. Never commit real values.\nDATABASE_URL=""\n`,
  },
  {
    name: 'Dockerfile (Node)',
    filePattern: 'Dockerfile',
    framework: 'node',
    content: `FROM node:22-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --omit=dev\nCOPY . .\nEXPOSE 3000\nCMD ["node", "index.js"]\n`,
  },
  {
    name: 'LICENSE (MIT)',
    filePattern: 'LICENSE',
    framework: null,
    content: `MIT License\n\nCopyright (c) ${new Date().getFullYear()} <your name>\n\nPermission is hereby granted, free of charge...\n`,
  },
  {
    name: 'GitHub Actions CI',
    filePattern: 'ci.yml',
    framework: 'node',
    content: `name: CI\non:\n  push:\n    branches: [main]\n  pull_request:\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 22\n      - run: npm ci\n      - run: npm test\n`,
  },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set. Copy .env.example to .env.local first.');
    process.exit(1);
  }

  const sql = neon(url);

  for (const template of TEMPLATES) {
    await withRetry(
      () => sql`
        insert into file_templates (name, file_pattern, framework, content, is_official)
        values (${template.name}, ${template.filePattern}, ${template.framework}, ${template.content}, true)
        on conflict (file_pattern, coalesce(framework, ''))
        where is_official
        do update set name = excluded.name, content = excluded.content
      `,
      template.name,
    );
    console.log(`Seeded: ${template.name}`);
  }

  console.log(`Done. ${TEMPLATES.length} official templates in place.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
