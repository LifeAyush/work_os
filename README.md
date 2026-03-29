# work_os

Next.js app (App Router) with [Supabase](https://supabase.com) Postgres. This repo is scaffolded for persistent task data later; right now it only verifies the database connection.

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) account

## 1. Supabase project

1. Create a project in the Supabase dashboard.
2. Open **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (keep secret; server-only)
3. In **SQL Editor**, run the script in [`supabase/tasks.sql`](supabase/tasks.sql) to create the `tasks` table and enable RLS (no anon policies yet).

## 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in the three values in `.env.local`. Never commit real keys; `.env.local` is gitignored.

For **Vercel**: in the project → **Settings → Environment Variables**, add the same three names for **Production** and **Preview** (and Development if you use `vercel dev` with pulled env).

## 3. Local development

```bash
npm install
npm run dev
```

- App: [http://localhost:3000](http://localhost:3000)
- DB health check: [http://localhost:3000/api/health/db](http://localhost:3000/api/health/db) — expects `{ "ok": true }` when Supabase is configured and `tasks` exists.

## 4. Deploy on Vercel

1. Push this repository to GitHub (or GitLab / Bitbucket).
2. [Import the repo](https://vercel.com/new) in Vercel as a Next.js project.
3. Set the three Supabase environment variables on Vercel (see above).
4. Deploy, then open `https://<your-deployment>/api/health/db` to confirm the database connection.

## Supabase clients in this app

| Module | Use |
|--------|-----|
| [`src/lib/supabase/client.ts`](src/lib/supabase/client.ts) | Browser / Client Components (`anon` key) |
| [`src/lib/supabase/server.ts`](src/lib/supabase/server.ts) | Server Components, Server Actions (`anon` + cookies) |
| [`src/lib/supabase/admin.ts`](src/lib/supabase/admin.ts) | Route Handlers / server-only code (`service_role`; bypasses RLS) |

[`src/middleware.ts`](src/middleware.ts) refreshes the auth session via [`@supabase/ssr`](https://supabase.com/docs/guides/auth/server-side/nextjs) so you can add Supabase Auth later without restructuring.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase + Next.js](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
