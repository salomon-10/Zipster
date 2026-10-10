export interface BuiltinTemplate {
  name: string;
  filePattern: string;
  framework: string | null;
  content: string;
}

/**
 * Starter content for filenames everybody creates by hand anyway. Seeded into
 * `file_templates` and used as the fallback when the database has not been
 * seeded yet, so the editor is never empty of options.
 */
export const BUILTIN_TEMPLATES: BuiltinTemplate[] = [
  {
    name: 'README.md',
    filePattern: 'README.md',
    framework: null,
    content: `# Project name

One sentence on what this does.

## Getting started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Structure

Describe the folders a newcomer will need to find their way around.
`,
  },
  {
    name: '.gitignore (Node)',
    filePattern: '.gitignore',
    framework: 'node',
    content: `node_modules/
dist/
build/
coverage/

.env
.env*.local

*.log
.DS_Store
Thumbs.db
`,
  },
  {
    name: 'package.json',
    filePattern: 'package.json',
    framework: 'node',
    content: `{
  "name": "project-name",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node index.js",
    "test": "echo \\"no tests yet\\" && exit 0"
  },
  "dependencies": {},
  "devDependencies": {}
}
`,
  },
  {
    name: 'tsconfig.json',
    filePattern: 'tsconfig.json',
    framework: null,
    content: `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules"]
}
`,
  },
  {
    name: '.env.example',
    filePattern: '.env.example',
    framework: null,
    content: `# Copy to .env.local and fill in. Never commit real values.
DATABASE_URL=""
`,
  },
  {
    name: 'Dockerfile (Node)',
    filePattern: 'Dockerfile',
    framework: 'node',
    content: `FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 3000
CMD ["node", "index.js"]
`,
  },
  {
    name: 'LICENSE (MIT)',
    filePattern: 'LICENSE',
    framework: null,
    content: `MIT License

Copyright (c) ${new Date().getFullYear()} <your name>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
`,
  },
  {
    name: 'GitHub Actions CI',
    filePattern: 'ci.yml',
    framework: 'node',
    content: `name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test
`,
  },
];
