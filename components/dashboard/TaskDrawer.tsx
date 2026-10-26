"use client";
import { useEffect, useState } from "react";
import { Sparkles, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import type { Priority, Project, Status, Task } from "@/lib/types";
import { PRIORITIES, STATUSES } from "@/lib/types";
import { getSupabase } from "@/lib/supabase";

export function TaskDrawer({ task, projects, open, onOpenChange, onSave, onDelete, onCreated }: {
  task: Task | null; projects: Project[]; open: boolean; onOpenChange: (value: boolean) => void;
  onSave: (values: Partial<Task> & { id?: string }) => Promise<void>; onDelete: (task: Task) => Promise<void>; onCreated: () => void;
}) {
  const [title, setTitle] = useState(""); const [description, setDescription] = useState(""); const [projectId, setProjectId] = useState("");
  const [status, setStatus] = useState<Status>("BACKLOG"); const [priority, setPriority] = useState<Priority>("MEDIUM"); const [assignee, setAssignee] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [aiBusy, setAiBusy] = useState(false);
  useEffect(() => { setTitle(task?.title ?? ""); setDescription(task?.description ?? ""); setProjectId(task?.project_id ?? projects.find((p) => !p.archived)?.id ?? ""); setStatus(task?.status ?? "BACKLOG"); setPriority(task?.priority ?? "MEDIUM"); setAssignee(task?.assignee_identifier ?? ""); setError(""); }, [task, projects, open]);
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); if (!title.trim() || !projectId || !assignee.trim()) { setError("Title, project, and assignee are required."); return; }
    setBusy(true); setError(""); try { await onSave({ ...(task ? { id: task.id } : {}), title: title.trim(), description: description.trim() || null, project_id: projectId, status, priority, assignee_identifier: assignee.trim() }); onOpenChange(false); if (!task) onCreated(); } catch (e) { setError(e instanceof Error ? e.message : "Could not save task."); } finally { setBusy(false); }
  };
  const expand = async () => { if (!title.trim()) { setError("Add a task title first."); return; } setAiBusy(true); setError(""); try { const supabase = getSupabase(); const { data: { session } } = supabase ? await supabase.auth.getSession() : { data: { session: null } }; if (!session) throw new Error("Sign in again to use AI description expansion."); const response = await fetch("/api/ai/expand", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ title: title.trim() }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Description generation failed."); setDescription(data.description); } catch (e) { setError(e instanceof Error ? e.message : "Description generation failed."); } finally { setAiBusy(false); } };
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent><SheetTitle className="drawer-title">{task ? "Edit task" : "Create a task"}</SheetTitle><SheetDescription className="drawer-subtitle">Keep the next step clear and easy to ship.</SheetDescription>
    <form onSubmit={handleSave}>
      <label className="form-label" htmlFor="task-title">Title</label><input id="task-title" className="field" maxLength={180} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to get done?" />
      <label className="form-label" htmlFor="task-description">Description</label><div className="ai-row"><span className="drawer-subtitle" style={{ margin: 0 }}>Add useful context and acceptance criteria.</span><button className="btn btn-quiet btn-small" type="button" onClick={expand} disabled={aiBusy}><Sparkles size={12} style={{ verticalAlign: "-2px" }} /> {aiBusy ? "Writing…" : "AI Sparkle"}</button></div><textarea id="task-description" className="field textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Context, links, and acceptance criteria" />
      <label className="form-label" htmlFor="task-project">Project</label><select id="task-project" className="field" value={projectId} onChange={(e) => setProjectId(e.target.value)}>{projects.filter((p) => !p.archived).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      <label className="form-label" htmlFor="task-status">Status</label><select id="task-status" className="field" value={status} onChange={(e) => setStatus(e.target.value as Status)}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
      <label className="form-label" htmlFor="task-priority">Priority</label><select id="task-priority" className="field" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select>
      <label className="form-label" htmlFor="task-assignee">Assignee email or username</label><input id="task-assignee" className="field" maxLength={254} value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="name@example.com or @username" />
      {error && <div className="error" role="alert">{error}</div>}
      <div className="drawer-actions">{task ? <button type="button" className="btn btn-ghost btn-small" onClick={async () => { setBusy(true); try { await onDelete(task); onOpenChange(false); } catch (e) { setError(e instanceof Error ? e.message : "Could not delete task."); } finally { setBusy(false); } }}><Trash2 size={13} style={{ verticalAlign: "-2px" }} /> Delete</button> : <span /> }<div style={{ display: "flex", gap: 8 }}><button type="button" className="btn btn-ghost btn-small" onClick={() => onOpenChange(false)}>Cancel</button><button type="submit" className="btn btn-small" disabled={busy}>{busy ? "Saving…" : task ? "Save changes" : "Create task"}</button></div></div>
    </form>
  </SheetContent></Sheet>;
}
