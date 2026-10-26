# Agent guide

## Project boundaries

- This repository is the Week 1 Momentum project management app. Keep the reviewer workflow inside the single dashboard at `/` and the AI description endpoint at `/api/ai/expand`.
- Do not add nested product pages, modal workflows, extra task/item types, or schema fields/tables. The schema freeze in `supabase/schema.sql` is authoritative.
- Keep credentials in environment variables. Never print or commit secrets; only the Supabase URL and anon key may use the documented `NEXT_PUBLIC_` variables. The OpenAI key must remain server-side.
- The database is a shared cohort workspace because the frozen schema has no ownership fields. Preserve RLS and do not add service-role credentials to browser code.

## Structure and workflow

- `app/page.tsx` owns the authenticated dashboard composition and TanStack Query data/mutations.
- `components/dashboard/` contains the sidebar, matrix, drawer, motivation metrics, and reviewer checklist.
- `context/auth.tsx` owns the browser auth session. `lib/supabase.ts` creates the singleton browser client; `lib/types.ts` mirrors the SQL schema.
- `app/api/ai/expand/route.ts` is the sole AI capability. It validates the signed-in user and title and keeps provider credentials server-side.
- Apply SQL changes explicitly in Supabase. Realtime subscriptions rely on the `supabase_realtime` publication.

## Verification and operations

- Use `npm run dev` for local development and `npm run build` before deployment.
- Configure `.env.local` from `.env.example`; do not commit `.env.local`.
- Configure Supabase Auth email/password and optional Google OAuth, allowed redirect URLs, and the `schema.sql` policies before review.
- When changing persistence, verify that projects and tasks survive a browser refresh and a redeployment. Keep README setup, architecture, production URL, and limitations accurate.
