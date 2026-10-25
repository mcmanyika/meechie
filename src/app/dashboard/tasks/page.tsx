"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { EmptyState, PageHeader } from "@/components/shared/feedback";
import { RequireAccess } from "@/components/shared/require-access";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STAFF_ROLES } from "@/config/constants";
import { useOrgRows, useSession } from "@/hooks/use-org";
import { formatDate, titleCase } from "@/lib/format";
import { toast } from "sonner";
import { useDemoStore } from "@/stores/demo-store";
import { cn } from "cn";
import type { StaffTask, TaskStatus } from "@/types/models";

const STATUSES: TaskStatus[] = ["todo", "in_progress", "blocked", "done"];

export default function TasksPage() {
  const tasks = useOrgRows("tasks");
  const programs = useOrgRows("programs");
  const { db, user, allowed, orgId } = useSession();
  const setTaskStatus = useDemoStore((state) => state.setTaskStatus);
  const [mode, setMode] = useState<"board" | "list">("board");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | TaskStatus>("all");
  const [assignee, setAssignee] = useState<"all" | "me" | string>("all");
  const [programId, setProgramId] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StaffTask | null>(null);

  const staff = useMemo(
    () =>
      db.users.filter(
        (person) =>
          person.organizationId === orgId &&
          (person.accountStatus ?? "active") === "active" &&
          (STAFF_ROLES.includes(person.role as (typeof STAFF_ROLES)[number]) || person.role === "volunteer"),
      ),
    [db.users, orgId],
  );

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return tasks
      .filter((task) => {
        if (status !== "all" && task.status !== status) return false;
        if (assignee === "me" && task.assigneeUserId !== user?.id) return false;
        if (assignee !== "all" && assignee !== "me" && task.assigneeUserId !== assignee) return false;
        if (programId !== "all" && (task.programId ?? "") !== programId) return false;
        if (!needle) return true;
        const haystack = `${task.title} ${task.description}`.toLowerCase();
        return haystack.includes(needle);
      })
      .slice()
      .sort((a, b) => {
        const priorityRank = { high: 0, medium: 1, low: 2 };
        const byPriority = priorityRank[a.priority] - priorityRank[b.priority];
        if (byPriority !== 0) return byPriority;
        return (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
      });
  }, [tasks, search, status, assignee, programId, user?.id]);

  const nameFor = (userId: string) => db.users.find((person) => person.id === userId)?.name ?? "Staff";
  const programName = (id: string | null) => (id ? programs.find((program) => program.id === id)?.name ?? "Program" : null);

  const openCreate = () => {
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (task: StaffTask) => {
    setEditing(task);
    setOpen(true);
  };

  return (
    <RequireAccess permission="tasks.view" feature="Tasks">
      <div className="grid gap-5">
        <PageHeader
          title="Tasks"
          description="Staff work tracker. Anyone can assign tasks to teammates and optionally link them to a program."
          actions={
            <>
              <button
                type="button"
                className={cn(buttonVariants({ variant: mode === "board" ? "default" : "outline" }))}
                onClick={() => setMode("board")}
              >
                Board
              </button>
              <button
                type="button"
                className={cn(buttonVariants({ variant: mode === "list" ? "default" : "outline" }))}
                onClick={() => setMode("list")}
              >
                List
              </button>
              {allowed("tasks.manage") ? (
                <Button onClick={openCreate}>
                  <Plus /> New task
                </Button>
              ) : null}
            </>
          }
        />

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tasks"
            aria-label="Search tasks"
            className="lg:max-w-sm"
          />
          <div className="flex flex-wrap gap-2">
            <Filter
              label="Status"
              value={status}
              onChange={(value) => setStatus(value as "all" | TaskStatus)}
              options={["all", ...STATUSES]}
            />
            <label className="text-xs text-muted-foreground">
              Assignee
              <select
                aria-label="Assignee"
                className="ml-2 h-9 rounded-lg border bg-card px-2 text-sm text-foreground"
                value={assignee}
                onChange={(event) => setAssignee(event.target.value)}
              >
                <option value="all">All</option>
                <option value="me">My tasks</option>
                {staff.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-muted-foreground">
              Program
              <select
                aria-label="Program"
                className="ml-2 h-9 rounded-lg border bg-card px-2 text-sm text-foreground"
                value={programId}
                onChange={(event) => setProgramId(event.target.value)}
              >
                <option value="all">All</option>
                <option value="">Unlinked</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {tasks.length} tasks
        </p>

        {filtered.length === 0 ? (
          <EmptyState
            title="No tasks match"
            body={tasks.length === 0 ? "Create a task to start tracking staff work." : "Adjust search or filters."}
            action={
              allowed("tasks.manage") ? (
                <Button onClick={openCreate}>
                  <Plus /> New task
                </Button>
              ) : undefined
            }
          />
        ) : mode === "board" ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {STATUSES.map((column) => {
              const items = filtered.filter((task) => task.status === column);
              return (
                <section key={column} className="rounded-xl border bg-card/60 p-3">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h2 className="text-sm font-medium">{titleCase(column)}</h2>
                    <span className="text-xs text-muted-foreground">{items.length}</span>
                  </div>
                  <ul className="grid gap-2">
                    {items.map((task) => (
                      <li key={task.id}>
                        <article className="rounded-lg border bg-background p-3 shadow-sm">
                          <button type="button" className="w-full text-left" onClick={() => openEdit(task)}>
                            <p className="text-sm font-medium">{task.title}</p>
                            {task.description ? (
                              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
                            ) : null}
                          </button>
                          <div className="mt-3 flex flex-wrap items-center gap-1.5">
                            <StatusBadge value={task.priority} />
                            {programName(task.programId) ? (
                              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                {programName(task.programId)}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                            <span>{nameFor(task.assigneeUserId)}</span>
                            <span>{task.dueDate ? formatDate(task.dueDate) : "No due date"}</span>
                          </div>
                          {allowed("tasks.manage") ? (
                            <label className="mt-2 block text-[11px] text-muted-foreground">
                              Move
                              <select
                                aria-label={`Status for ${task.title}`}
                                className="mt-1 h-8 w-full rounded-lg border bg-transparent px-2 text-xs text-foreground"
                                value={task.status}
                                onChange={(event) => {
                                  const result = setTaskStatus(task.id, event.target.value as TaskStatus);
                                  if (!result.ok) toast.error(result.error);
                                }}
                              >
                                {STATUSES.map((option) => (
                                  <option key={option} value={option}>
                                    {titleCase(option)}
                                  </option>
                                ))}
                              </select>
                            </label>
                          ) : null}
                        </article>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Task</th>
                  <th className="px-4 py-2 font-medium">Assignee</th>
                  <th className="px-4 py-2 font-medium">Program</th>
                  <th className="px-4 py-2 font-medium">Due</th>
                  <th className="px-4 py-2 font-medium">Priority</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((task) => (
                  <tr key={task.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <button type="button" className="text-left font-medium hover:underline" onClick={() => openEdit(task)}>
                        {task.title}
                      </button>
                      {task.description ? <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{task.description}</p> : null}
                    </td>
                    <td className="px-4 py-3">{nameFor(task.assigneeUserId)}</td>
                    <td className="px-4 py-3">{programName(task.programId) ?? "—"}</td>
                    <td className="px-4 py-3">{task.dueDate ? formatDate(task.dueDate) : "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge value={task.priority} />
                    </td>
                    <td className="px-4 py-3">
                      {allowed("tasks.manage") ? (
                        <select
                          aria-label={`Status for ${task.title}`}
                          className="h-8 rounded-lg border bg-transparent px-2 text-xs"
                          value={task.status}
                          onChange={(event) => {
                            const result = setTaskStatus(task.id, event.target.value as TaskStatus);
                            if (!result.ok) toast.error(result.error);
                          }}
                        >
                          {STATUSES.map((option) => (
                            <option key={option} value={option}>
                              {titleCase(option)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <StatusBadge value={task.status} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <TaskDialog open={open} onOpenChange={setOpen} task={editing} />
      </div>
    </RequireAccess>
  );
}

function Filter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="text-xs text-muted-foreground">
      {label}
      <select
        aria-label={label}
        className="ml-2 h-9 rounded-lg border bg-card px-2 text-sm text-foreground"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {titleCase(option)}
          </option>
        ))}
      </select>
    </label>
  );
}
