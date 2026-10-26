-- Run in the Supabase SQL editor. Authenticated cohort members share workspaces.
create extension if not exists "uuid-ossp";

create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  archived boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'BACKLOG' check (status in ('BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE')),
  priority text not null default 'MEDIUM' check (priority in ('LOW', 'MEDIUM', 'HIGH')),
  assignee_identifier text not null,
  created_at timestamptz default now()
);

alter table public.projects enable row level security;
alter table public.tasks enable row level security;

create policy "Authenticated members can read projects" on public.projects for select to authenticated using (true);
create policy "Authenticated members can create projects" on public.projects for insert to authenticated with check (true);
create policy "Authenticated members can update projects" on public.projects for update to authenticated using (true) with check (true);
create policy "Authenticated members can delete projects" on public.projects for delete to authenticated using (true);
create policy "Authenticated members can read tasks" on public.tasks for select to authenticated using (true);
create policy "Authenticated members can create tasks" on public.tasks for insert to authenticated with check (true);
create policy "Authenticated members can update tasks" on public.tasks for update to authenticated using (true) with check (true);
create policy "Authenticated members can delete tasks" on public.tasks for delete to authenticated using (true);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.projects, public.tasks to authenticated;

-- Realtime updates are shared across authenticated cohort members.
do $$ begin
  alter publication supabase_realtime add table public.projects;
exception when duplicate_object then null;
when undefined_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.tasks;
exception when duplicate_object then null;
when undefined_object then null;
end $$;
