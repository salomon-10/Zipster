# Zipster

Zipster turns a plain-text project tree into a downloadable ZIP archive.
Paste a `tree` command output or a simple indented structure, preview the
result, add starter file templates, and download the project in one step.

The basic editor works without an account. Accounts add saved projects,
public sharing, project forking, GitHub repository import, and access to the
template and admin areas.

## Features

- Accepts Unix `tree` output, spaces, tabs, mixed indentation, comments, and
  paths such as `src/app/page.tsx`.
- Shows parsing diagnostics instead of failing on imperfect input.
- Generates ZIP files entirely in the browser with JSZip. The server never
  stores or builds an archive.
- Adds starter content for common files such as `README.md`, `.gitignore`,
  and `package.json`.
- Saves and shares architectures through public links when signed in.
- Imports a repository tree from the public GitHub API.
- Supports light and dark themes, project settings, and an admin area for
  users, activity, and file templates.

## Tech stack

- Next.js 15 App Router and React 19
- TypeScript with strict checking
- Tailwind CSS
- Neon serverless Postgres with raw SQL
- Cookie sessions using `jose` and `bcryptjs`
- JSZip for client-side archive generation
- Zod for shared validation
- Vitest for parser and validation tests

## Requirements

- Node.js 20 or newer
- npm
- A Neon Postgres database for accounts and saved projects

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create `.env.local` at the project root:

```dotenv
DATABASE_URL="postgresql://user:password@host/zipster?sslmode=require"
AUTH_SECRET="replace-with-a-random-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
# Optional: promote a matching new registration to admin.
ADMIN_EMAIL=""
```

Create a strong session secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

The connection string should use Neon’s pooled endpoint in development and
production deployments.

### 3. Initialize the database

Apply the schema and seed the built-in file templates:

```bash
npm run db:migrate
npm run db:seed
```

Both commands read `DATABASE_URL` from `.env.local`. The migration and seed
are safe to run more than once.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Creating the first administrator

Set `ADMIN_EMAIL` before registering the account. A new registration with
that email is promoted to the `admin` role. Clear the variable afterwards;
it only applies to new registrations. Existing administrators can manage
additional users from `/admin`.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Start the production build |
| `npm run lint` | Run Next.js linting |
| `npm run typecheck` | Run TypeScript without emitting files |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run db:migrate` | Apply SQL migrations |
| `npm run db:seed` | Seed official file templates |
| `npm run db:test` | Test the database connection |

## Project structure

```text
app/
  (auth)/                 Login and registration
  (app)/                  Dashboard, settings, and admin pages
  (public)/               Public import and template pages
  editor/                 Saved-project and forked editors
  s/[slug]/               Public shared-project pages
  actions/                Server actions
components/               UI, editor, project, tree, and admin components
lib/
  tree/                   Parser, types, serialization, and samples
  zip/                    Client-side ZIP generation
  db/                     Neon queries and data access
  auth/                   Passwords, sessions, and current-user helpers
  github/                 GitHub repository import
  validation/             Shared Zod schemas
migrations/               Versioned SQL migrations
scripts/                  Database migration and seed scripts
tests/                    Parser, auth, and validation tests
```

## Design notes

The text tree is the source of truth. It is parsed on demand into the same
tree model used by the preview and ZIP generator, so there is no duplicated
serialized tree to become stale.

ZIP generation happens in the browser. The database stores project metadata,
the original tree text, users, templates, and optional generation counters,
but never a ZIP file.

Mutating project queries are scoped to the authenticated owner on the server.
Middleware handles convenient redirects, while protected pages and server
actions verify the session independently.

## Deployment

Zipster can be deployed as a standard Next.js application on Vercel:

1. Import the repository into Vercel.
2. Add `DATABASE_URL`, `AUTH_SECRET`, and `NEXT_PUBLIC_APP_URL` to the
   project environment.
3. Run `npm run db:migrate` and `npm run db:seed` once against the production
   database.
4. Deploy the application.

There is no separate API server, archive storage bucket, worker, or queue to
provision.

## Scope

The current product intentionally does not include real-time collaboration,
team workspaces, billing, or server-side project execution. The public GitHub
importer uses the unauthenticated GitHub REST API and is subject to GitHub’s
normal per-IP rate limit.
