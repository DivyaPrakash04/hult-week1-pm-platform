"use client";
import { useRef, useState } from "react";
import type { Project, Task } from "@/lib/types";

export function Sidebar({ projects, tasks, selectedProject, onSelect, onCreate, onUpdate, onArchive }: {
  projects: Project[]; tasks: Task[]; selectedProject: string; onSelect: (id: string) => void;
  onCreate: (name: string) => Promise<void>; onUpdate: (id: string, name: string) => Promise<void>; onArchive: (id: string) => Promise<void>;
}) {
  const [name, setName] = useState(""); const [editing, setEditing] = useState(""); const [editName, setEditName] = useState(""); const [createError, setCreateError] = useState(""); const [creating, setCreating] = useState(false); const projectNameInput = useRef<HTMLInputElement>(null);
  const active = projects.filter((p) => !p.archived);
  return <aside className="sidebar">
    <div className="brand"><span className="brand-mark">M</span> momentum</div>
    <section><div className="side-label">Your projects</div><nav>
      <button className={`project-row ${selectedProject === "all" ? "selected" : ""}`} onClick={() => onSelect("all")}><span className="project-name">◉ All projects</span></button>
      {active.map((project) => {
        const list = tasks.filter((t) => t.project_id === project.id); const done = list.filter((t) => t.status === "DONE").length; const pct = list.length ? Math.round(done / list.length * 100) : 0;
        return <div key={project.id}>
          {editing === project.id ? <form className="inline-project" onSubmit={async (e) => { e.preventDefault(); if (editName.trim()) await onUpdate(project.id, editName.trim()); setEditing(""); }}><input aria-label="Project name" value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus /><button className="btn btn-small" type="submit">Save</button></form> : <div className="project-wrap">
            <button className={`project-row ${selectedProject === project.id ? "selected" : ""}`} onClick={() => onSelect(project.id)}><span className="project-name"><i className="project-dot" />{project.name}</span><span className="momentum-mini">{pct}%</span></button>
            <div className="project-tools"><button aria-label={`Edit ${project.name}`} title="Edit project" onClick={() => { setEditing(project.id); setEditName(project.name); }}>✎</button><button aria-label={`Archive ${project.name}`} title="Archive project" onClick={() => void onArchive(project.id)}>⌑</button></div>
          </div>}
          <div className="momentum-track"><div className="momentum-fill" style={{ width: `${pct}%` }} /></div>
        </div>;
      })}
    </nav>
      <form className="inline-project" onSubmit={async (e) => { e.preventDefault(); const projectName = name.trim(); if (!projectName) { setCreateError("Enter a project name, then select Add."); projectNameInput.current?.focus(); return; } setCreating(true); setCreateError(""); try { await onCreate(projectName); setName(""); } catch (error) { setCreateError(error instanceof Error ? error.message : "Project could not be created. Check your connection and try again."); } finally { setCreating(false); } }}><input ref={projectNameInput} aria-label="New project name" placeholder="Name your project" value={name} onChange={(e) => { setName(e.target.value); setCreateError(""); }} maxLength={120} /><button className="btn btn-quiet btn-small" type="submit" disabled={creating}>{creating ? "Adding…" : "Add"}</button></form>
      {createError && <div className="error" role="alert">{createError}</div>}
    </section>
    <div className="sidebar-foot">Shared space · {active.length} active {active.length === 1 ? "project" : "projects"}</div>
  </aside>;
}
