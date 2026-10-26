"use client";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AuthError } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth";
import type { Project, Task } from "@/lib/types";
import { HighVelocityMatrix } from "@/components/dashboard/HighVelocityMatrix";
import { MotivationLayer } from "@/components/dashboard/MotivationLayer";
import { ReviewerPanel, type ReviewAction } from "@/components/dashboard/ReviewerPanel";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TaskDrawer } from "@/components/dashboard/TaskDrawer";

type WorkspaceData = { projects: Project[]; tasks: Task[] };
const queryKey = ["workspace"];

function AuthScreen() {
  const supabase = getSupabase(); const [mode, setMode] = useState<"login" | "signup">("login"); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  if (!supabase) return <main className="auth-wrap"><section className="auth-card"><div className="brand"><span className="brand-mark">M</span> momentum</div><h1>Connect your workspace</h1><p>Add your Supabase URL and anon key to the environment to enable authentication and shared persistence.</p><code>NEXT_PUBLIC_SUPABASE_URL<br />NEXT_PUBLIC_SUPABASE_ANON_KEY</code></section></main>;
  const submit = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true); setError(""); setMessage(""); try { const result = mode === "signup" ? await supabase.auth.signUp({ email: email.trim(), password }) : await supabase.auth.signInWithPassword({ email: email.trim(), password }); if (result.error) throw result.error; if (mode === "signup" && !result.data.session) setMessage("Check your email to confirm your account, then sign in."); } catch (e) { setError((e as AuthError).message ?? "Authentication failed."); } finally { setBusy(false); } };
  const google = async () => { setError(""); const { error: authError } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } }); if (authError) setError(authError.message); };
  return <main className="auth-wrap"><section className="auth-card"><div className="brand"><span className="brand-mark">M</span> momentum</div><h1>{mode === "login" ? "Welcome back" : "Join the workspace"}</h1><p>Sign in to see what the cohort is shipping.</p><div className="auth-toggle"><button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Sign in</button><button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Create account</button></div><form onSubmit={submit}><label className="form-label" htmlFor="auth-email">Email</label><input id="auth-email" className="field" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /><label className="form-label" htmlFor="auth-password">Password</label><input id="auth-password" className="field" type="password" required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} />{error && <div className="auth-error" role="alert">{error}</div>}{message && <div className="error">{message}</div>}<button className="btn" style={{ width: "100%", marginTop: 16 }} disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button></form><div className="auth-divider">or</div><button className="btn btn-quiet" style={{ width: "100%" }} onClick={google}>Continue with Google</button></section></main>;
}

export default function Home() {
  const { user, loading: authLoading, signOut } = useAuth(); const supabase = getSupabase(); const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState("all"); const [drawerOpen, setDrawerOpen] = useState(false); const [selectedTask, setSelectedTask] = useState<Task | null>(null); const [toast, setToast] = useState(""); const [reviewer, setReviewer] = useState<ReviewAction[]>([]);
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2600); };
  const mark = (action: ReviewAction) => setReviewer((old) => old.includes(action) ? old : [...old, action]);
  const dataQuery = useQuery({ queryKey, enabled: !!user && !!supabase, queryFn: async (): Promise<WorkspaceData> => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const [projectResult, taskResult] = await Promise.all([supabase.from("projects").select("*").order("created_at"), supabase.from("tasks").select("*").order("created_at", { ascending: false })]);
    if (projectResult.error) throw projectResult.error; if (taskResult.error) throw taskResult.error;
    return { projects: projectResult.data as Project[], tasks: taskResult.data as Task[] };
  } });
  const data = dataQuery.data ?? { projects: [], tasks: [] };
  useEffect(() => { if (!supabase || !user) return; const channel = supabase.channel("workspace-changes").on("postgres_changes", { event: "*", schema: "public", table: "projects" }, () => void queryClient.invalidateQueries({ queryKey })).on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => void queryClient.invalidateQueries({ queryKey })).subscribe(); return () => { void supabase.removeChannel(channel); }; }, [supabase, user, queryClient]);
  const createProject = useMutation({ mutationFn: async (name: string) => { if (!supabase) throw new Error("Supabase is not configured."); const { error } = await supabase.from("projects").insert({ name, archived: false }); if (error) throw error; }, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey }); notify("Project created"); mark("Create Project"); }, onError: (e) => notify(e.message) });
  const updateProject = useMutation({ mutationFn: async ({ id, name }: { id: string; name: string }) => { if (!supabase) throw new Error("Supabase is not configured."); const { error } = await supabase.from("projects").update({ name }).eq("id", id); if (error) throw error; }, onSuccess: () => { void queryClient.invalidateQueries({ queryKey }); notify("Project updated"); }, onError: (e) => notify(e.message) });
  const archiveProject = useMutation({ mutationFn: async (id: string) => { if (!supabase) throw new Error("Supabase is not configured."); const { error } = await supabase.from("projects").update({ archived: true }).eq("id", id); if (error) throw error; }, onSuccess: () => { void queryClient.invalidateQueries({ queryKey }); setSelectedProject("all"); notify("Project archived"); }, onError: (e) => notify(e.message) });
  const saveTask = useMutation({ mutationFn: async (values: Partial<Task> & { id?: string }) => { if (!supabase) throw new Error("Supabase is not configured."); const { id, ...fields } = values; const result = id ? await supabase.from("tasks").update(fields).eq("id", id) : await supabase.from("tasks").insert(fields); if (result.error) throw result.error; }, onMutate: async (values) => { await queryClient.cancelQueries({ queryKey }); const previous = queryClient.getQueryData<WorkspaceData>(queryKey); if (previous) queryClient.setQueryData<WorkspaceData>(queryKey, { ...previous, tasks: values.id ? previous.tasks.map((t) => t.id === values.id ? { ...t, ...values } as Task : t) : previous.tasks }); return { previous }; }, onError: (error, _values, context) => { if (context?.previous) queryClient.setQueryData(queryKey, context.previous); notify(error.message); }, onSuccess: async (_result, values) => { await queryClient.invalidateQueries({ queryKey }); notify(values.id ? "Task saved" : "Task created"); }, onSettled: () => { void queryClient.invalidateQueries({ queryKey }); } });
  const deleteTask = useMutation({ mutationFn: async (task: Task) => { if (!supabase) throw new Error("Supabase is not configured."); const { error } = await supabase.from("tasks").delete().eq("id", task.id); if (error) throw error; }, onSuccess: () => { void queryClient.invalidateQueries({ queryKey }); notify("Task deleted"); }, onError: (e) => notify(e.message) });
  const openNewTask = () => { setSelectedTask(null); setDrawerOpen(true); };
  const editTask = (task: Task) => { setSelectedTask(task); setDrawerOpen(true); };
  if (authLoading) return <main className="loading">Opening your workspace…</main>;
  if (!user) return <AuthScreen />;
  if (dataQuery.isLoading) return <main className="loading">Loading the cohort workspace…</main>;
  if (dataQuery.error) return <main className="auth-wrap"><section className="auth-card"><h1>Could not load workspace</h1><p>{dataQuery.error.message}</p><button className="btn" onClick={() => void dataQuery.refetch()}>Try again</button></section></main>;
  const activeProjectIds = new Set(data.projects.filter((p) => !p.archived).map((p) => p.id));
  const activeTasks = data.tasks.filter((t) => activeProjectIds.has(t.project_id) && (selectedProject === "all" || t.project_id === selectedProject));
  return <main className="app-shell"><div className="snapshot">Workspace for the Hult Cohort · keep the next step visible</div><div className="dashboard">
    <Sidebar projects={data.projects} tasks={data.tasks} selectedProject={selectedProject} onSelect={setSelectedProject} onCreate={(name) => createProject.mutateAsync(name)} onUpdate={(id, name) => updateProject.mutateAsync({ id, name })} onArchive={(id) => archiveProject.mutateAsync(id)} />
    <div className="main"><header className="topline"><div className="heading"><h1>Good work ships here.</h1><p>Your progress, the cohort’s momentum, and the next move.</p></div><div className="user-actions"><span className="user-email">{user.email}</span><button className="btn btn-ghost btn-small" onClick={() => void signOut()}>Sign out</button></div></header>
      <ReviewerPanel completed={reviewer} /><MotivationLayer tasks={data.tasks.filter((t) => activeProjectIds.has(t.project_id))} projects={data.projects} selectedProject={selectedProject} />
      <HighVelocityMatrix tasks={activeTasks} projects={data.projects} selectedProject={selectedProject} onEdit={editTask} onAdvance={(task) => { const next = ["BACKLOG", "TODO", "IN_PROGRESS", "DONE"] as const; const nextStatus = next[next.indexOf(task.status) + 1]; if (nextStatus) void saveTask.mutateAsync({ id: task.id, status: nextStatus }).then(() => { mark("Move Task"); notify(`Moved to ${nextStatus}`); }); }} onCreate={openNewTask} onFilter={() => mark("Filter Tasks")} />
    </div></div>
    <TaskDrawer task={selectedTask} projects={data.projects} open={drawerOpen} onOpenChange={setDrawerOpen} onSave={async (values) => { const changedAssignee = !!selectedTask && values.assignee_identifier !== selectedTask.assignee_identifier; await saveTask.mutateAsync(values); if (changedAssignee || !selectedTask) mark("Assign Task"); }} onDelete={(task) => deleteTask.mutateAsync(task)} onCreated={() => mark("Create Task")} />
    {toast && <div className="toast" role="status">{toast}</div>}
  </main>;
}
