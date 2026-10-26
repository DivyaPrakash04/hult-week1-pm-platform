"use client";
import type { Project, Task } from "@/lib/types";
export function MotivationLayer({ tasks, projects, selectedProject }: { tasks: Task[]; projects: Project[]; selectedProject: string }) {
  const scoped = selectedProject === "all" ? tasks : tasks.filter((t) => t.project_id === selectedProject);
  const done = scoped.filter((t) => t.status === "DONE").length; const pct = scoped.length ? Math.round(done / scoped.length * 100) : 0;
  const activeProject = projects.find((p) => p.id === selectedProject);
  const today = new Date(); const start = new Date(today); start.setDate(today.getDate() - ((today.getDay() + 6) % 7)); start.setHours(0, 0, 0, 0);
  const shippedThisWeek = tasks.filter((t) => t.status === "DONE" && new Date(t.created_at) >= start).length;
  const shippedToday = tasks.filter((t) => t.status === "DONE" && new Date(t.created_at).toDateString() === today.toDateString()).length;
  const next = tasks.filter((t) => t.status === "TODO" && (selectedProject === "all" || t.project_id === selectedProject)).sort((a, b) => ["HIGH", "MEDIUM", "LOW"].indexOf(a.priority) - ["HIGH", "MEDIUM", "LOW"].indexOf(b.priority))[0];
  return <><div className="motivation-grid"><div className="metric"><div className="metric-label">{activeProject ? `${activeProject.name} momentum` : "Cohort momentum"}</div><div className="metric-value">{pct}%</div><div className="momentum-track"><div className="momentum-fill" style={{ width: `${pct}%` }} /></div></div><div className="metric"><div className="metric-label">Shipping streak · today</div><div className="metric-value">🔥 {shippedToday} task{shippedToday === 1 ? "" : "s"}</div><div className="metric-sub">Keep the momentum going</div></div><div className="metric"><div className="metric-label">Cohort velocity · this week</div><div className="metric-value">🚀 {shippedThisWeek} shipped</div><div className="metric-sub">Tasks completed across projects</div></div></div><div className="next-action"><span>✦</span><span>{next ? <>Next recommended action: Move <strong>“{next.title}”</strong> to IN_PROGRESS.</> : "Next recommended action: Pick a task and make progress."}</span></div></>;
}
