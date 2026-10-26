"use client";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Plus } from "lucide-react";
import type { Project, Status, Task } from "@/lib/types";
import { STATUSES } from "@/lib/types";

export function HighVelocityMatrix({ tasks, projects, selectedProject, onEdit, onAdvance, onCreate, onFilter }: {
  tasks: Task[]; projects: Project[]; selectedProject: string; onEdit: (task: Task) => void; onAdvance: (task: Task) => void; onCreate: () => void; onFilter: () => void;
}) {
  const [view, setView] = useState<"board" | "list">("board"); const [assignee, setAssignee] = useState("all"); const [status, setStatus] = useState("all"); const [project, setProject] = useState(selectedProject);
  const [sort, setSort] = useState<{ key: "title" | "status" | "assignee_identifier" | "priority"; direction: "asc" | "desc" }>({ key: "title", direction: "asc" });
  useEffect(() => { setProject(selectedProject); }, [selectedProject]);
  const assignees = useMemo(() => Array.from(new Set(tasks.map((t) => t.assignee_identifier))).sort(), [tasks]);
  const filtered = useMemo(() => tasks.filter((t) => (assignee === "all" || t.assignee_identifier === assignee) && (status === "all" || t.status === status) && (project === "all" || t.project_id === project)), [tasks, assignee, status, project]);
  const sorted = useMemo(() => [...filtered].sort((a, b) => a[sort.key].localeCompare(b[sort.key]) * (sort.direction === "asc" ? 1 : -1)), [filtered, sort]);
  const toggleSort = (key: typeof sort.key) => setSort((old) => ({ key, direction: old.key === key && old.direction === "asc" ? "desc" : "asc" }));
  const titleByProject = (id: string) => projects.find((p) => p.id === id)?.name ?? "Project";
  const card = (task: Task) => <article className="task-card" key={task.id}>
    <div className="task-title" role="button" tabIndex={0} onClick={() => onEdit(task)} onKeyDown={(e) => { if (e.key === "Enter") onEdit(task); }}>{task.title}</div>
    {task.description && <div className="task-desc">{task.description}</div>}
    <div className="task-meta"><span className="assignee">{task.assignee_identifier}</span><span className={`priority priority-${task.priority}`}>{task.priority}</span></div>
    <div className="task-meta"><span className="assignee">{titleByProject(task.project_id)}</span><div className="task-actions"><button className="icon-btn" title="Edit task" aria-label="Edit task" onClick={() => onEdit(task)}>Edit</button><button className="icon-btn" title="Advance task status" aria-label="Advance task status" disabled={task.status === "DONE"} onClick={() => onAdvance(task)}><ArrowRight size={14} /></button></div></div>
  </article>;
  return <section className="matrix">
    <div className="matrix-head"><div className="matrix-title-row"><div className="matrix-title">Task matrix <span className="count">{filtered.length}</span></div><div style={{ display: "flex", gap: 8, alignItems: "center" }}><div className="toggle"><button className={view === "board" ? "active" : ""} onClick={() => setView("board")}>Board</button><button className={view === "list" ? "active" : ""} onClick={() => setView("list")}>List</button></div><button className="btn btn-small" onClick={onCreate}><Plus size={13} style={{ verticalAlign: "-2px" }} /> Task</button></div></div>
      <div className="filters"><select className="filter" aria-label="Filter by assignee" value={assignee} onChange={(e) => { setAssignee(e.target.value); onFilter(); }}><option value="all">All assignees</option>{assignees.map((a) => <option key={a} value={a}>{a}</option>)}</select><select className="filter" aria-label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value); onFilter(); }}><option value="all">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select><select className="filter" aria-label="Filter by project" value={project} onChange={(e) => { setProject(e.target.value); onFilter(); }}><option value="all">All projects</option>{projects.filter((p) => !p.archived).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
    </div>
    {view === "board" ? <div className="board">{STATUSES.map((s: Status) => <div className="column" key={s}><div className="column-head"><i className={`status-dot ${s === "DONE" ? "status-green" : s === "IN_PROGRESS" ? "status-yellow" : "status-red"}`} />{s}<span className="count">{filtered.filter((t) => t.status === s).length}</span></div>{filtered.filter((t) => t.status === s).map(card)}</div>)}</div> : <div className="list-wrap">{filtered.length ? <table className="task-table"><thead><tr><th><button className="sort-button" onClick={() => toggleSort("title")}>Task {sort.key === "title" ? (sort.direction === "asc" ? "↑" : "↓") : "↕"}</button></th><th>Project</th><th><button className="sort-button" onClick={() => toggleSort("status")}>Status {sort.key === "status" ? (sort.direction === "asc" ? "↑" : "↓") : "↕"}</button></th><th><button className="sort-button" onClick={() => toggleSort("assignee_identifier")}>Assignee {sort.key === "assignee_identifier" ? (sort.direction === "asc" ? "↑" : "↓") : "↕"}</button></th><th><button className="sort-button" onClick={() => toggleSort("priority")}>Priority {sort.key === "priority" ? (sort.direction === "asc" ? "↑" : "↓") : "↕"}</button></th><th /></tr></thead><tbody>{sorted.map((t) => <tr key={t.id}><td><button className="task-link" onClick={() => onEdit(t)}>{t.title}</button></td><td>{titleByProject(t.project_id)}</td><td>{t.status}</td><td>{t.assignee_identifier}</td><td>{t.priority}</td><td><button className="icon-btn" disabled={t.status === "DONE"} onClick={() => onAdvance(t)}>Advance →</button></td></tr>)}</tbody></table> : <div className="empty">No tasks match these filters.</div>}</div>}
    {view === "board" && !filtered.length && <div className="empty">No tasks here yet. Create one and get moving.</div>}
  </section>;
}
