export type Status = "BACKLOG" | "TODO" | "IN_PROGRESS" | "DONE";
export type Priority = "LOW" | "MEDIUM" | "HIGH";
export type Project = { id: string; name: string; description: string | null; archived: boolean; created_at: string };
export type Task = { id: string; project_id: string; title: string; description: string | null; status: Status; priority: Priority; assignee_identifier: string; created_at: string };
export const STATUSES: Status[] = ["BACKLOG", "TODO", "IN_PROGRESS", "DONE"];
export const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH"];
