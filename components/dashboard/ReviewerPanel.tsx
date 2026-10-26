"use client";
import { useState } from "react";
const steps = ["Create Project", "Create Task", "Move Task", "Assign Task", "Filter Tasks"] as const;
export type ReviewAction = typeof steps[number];
export function ReviewerPanel({ completed }: { completed: ReviewAction[] }) {
  const [showChecklist, setShowChecklist] = useState(true);
  return <><div className="reviewer-snapshot"><span>This platform supports Projects, Tasks, Status Movement, Assignment, Filtering, and Motivation Metrics.</span><button className="reviewer-toggle" aria-expanded={showChecklist} onClick={() => setShowChecklist((visible) => !visible)}>{showChecklist ? "Hide checklist" : "Reviewer mode"}</button></div>{showChecklist && <div className="reviewer-checks" aria-label="Reviewer checklist">{steps.map((step) => <span className={`check-pill ${completed.includes(step) ? "done" : ""}`} key={step}>{completed.includes(step) ? "✓ " : "○ "}{step}</span>)}</div>}</>;
}
