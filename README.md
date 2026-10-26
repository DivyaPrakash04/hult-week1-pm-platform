# Momentum — Hult Cohort Project Workspace

A single-page project and task dashboard for the Hult Cohort Fall 2026. It combines a shared project sidebar, Kanban and list views, client-side filters, task assignment, status movement, and lightweight shipping metrics.

## Run locally

1. Install Node.js 20 or later.
2. Copy `.env.example` to `.env.local` and set the Supabase URL, Supabase anon key, and (optionally) an OpenAI API key.
3. In the Supabase SQL editor, run [`supabase/schema.sql`](supabase/schema.sql). Configure Supabase Auth email/password and the Google provider if OAuth is wanted. Add the local and production origins to Supabase Auth's allowed redirect URLs.
4. Install dependencies with `npm install`.
5. Start the app with `npm run dev` and open `http://localhost:3000`.

## Production deployment

Import this repository into Vercel and set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and optionally `OPENAI_API_KEY` and `OPENAI_MODEL` in the project's environment variables. Deploy with Vercel's detected Next.js framework. Configure the production origin in Supabase Auth. The production URL is assigned by Vercel after deployment.

## Architecture

- Next.js App Router and TypeScript provide one dashboard page and one Edge API route for the description expander.
- Supabase Auth provides email/password and Google sign-in. Postgres persists projects and tasks; authenticated users share the cohort workspace under row-level security. Supabase Realtime invalidates the TanStack Query cache when another member changes data.
- TanStack Query owns server data, client-side filtering is performed against its cached task list, and task edits use optimistic cache updates.
- The SQL schema contains only the requested `projects` and `tasks` tables and their specified fields. RLS policies allow authenticated cohort members to read and change shared rows.
- The AI route accepts a task title from a signed-in user and uses the server-side `OPENAI_API_KEY`; generated text is returned as a markdown description and is not persisted until the user saves the task.

## Motivation and reviewer flow

The dashboard surfaces project completion, cohort completions for the current week, today's shipped tasks, and a recommended high-priority TODO. A compact reviewer checklist tracks project creation, task creation, movement, assignment, and filtering during the current browser session.

## Known limitations

- The database is intentionally shared: the frozen schema has no project owner or user membership fields. Any authenticated cohort member can edit or archive any project and task.
- A task assignee is an email or username string, not a foreign key. The UI does not verify that the identifier belongs to a registered account.
- Weekly and daily shipped metrics infer completion from tasks' `created_at`; the schema has no `completed_at`, so they are approximate and do not record status-change time.
- Reviewer checklist state is in memory and resets when the page reloads.
- AI description expansion requires an OpenAI API key. Without it, all project management features continue to work and the AI button reports that it is not configured.
- Supabase email confirmation behavior depends on the project's Auth configuration. Confirmed sign-up requires the reviewer to use an inbox they can access.

## Security notes

Never expose the OpenAI API key in a `NEXT_PUBLIC_` variable. Keep `.env.local` out of git. Supabase anon credentials are intended for browser use only when all table permissions are protected by the included RLS policies.
