"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { STAFF_ROLES } from "@/config/constants";
import { useOrgRows, useSession } from "@/hooks/use-org";
import { createId } from "@/lib/ids";
import { staffTaskSchema, type StaffTaskFormValues } from "@/lib/validations/schemas";
import { useDemoStore } from "@/stores/demo-store";
import type { StaffTask } from "@/types/models";

export function TaskDialog({
  open,
  onOpenChange,
  task,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: StaffTask | null;
}) {
  const { db, orgId, user } = useSession();
  const programs = useOrgRows("programs");
  const saveTask = useDemoStore((state) => state.saveTask);
  const deleteTask = useDemoStore((state) => state.deleteTask);
  const staff = db.users.filter(
    (person) =>
      person.organizationId === orgId &&
      (person.accountStatus ?? "active") === "active" &&
      (STAFF_ROLES.includes(person.role as (typeof STAFF_ROLES)[number]) || person.role === "volunteer"),
  );
  const form = useForm<StaffTaskFormValues>({
    resolver: zodResolver(staffTaskSchema),
    values: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      status: task?.status ?? "todo",
      priority: task?.priority ?? "medium",
      assigneeUserId: task?.assigneeUserId ?? user?.id ?? staff[0]?.id ?? "",
      programId: task?.programId ?? "",
      dueDate: task?.dueDate ?? "",
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? "Edit task" : "Create task"}</DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={form.handleSubmit((values) => {
            if (!orgId || !user) return;
            const now = new Date().toISOString();
            const result = saveTask(
              {
                id: task?.id ?? createId("task"),
                organizationId: orgId,
                title: values.title,
                description: values.description,
                status: values.status,
                priority: values.priority,
                assigneeUserId: values.assigneeUserId,
                createdByUserId: task?.createdByUserId ?? user.id,
                programId: values.programId || null,
                dueDate: values.dueDate || null,
                createdAt: task?.createdAt ?? now,
                updatedAt: now,
              },
              task ? "update" : "create",
            );
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success(task ? "Task updated." : "Task created.");
            onOpenChange(false);
          })}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="task-title">Title</Label>
            <Input id="task-title" {...form.register("title")} />
            {form.formState.errors.title ? <p className="text-xs text-destructive">{form.formState.errors.title.message}</p> : null}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="task-description">Description</Label>
            <Textarea id="task-description" rows={3} {...form.register("description")} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              Status
              <select className="h-9 rounded-lg border bg-transparent px-2" {...form.register("status")}>
                {["todo", "in_progress", "blocked", "done"].map((status) => (
                  <option key={status} value={status}>
                    {status.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              Priority
              <select className="h-9 rounded-lg border bg-transparent px-2" {...form.register("priority")}>
                {["low", "medium", "high"].map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              Assignee
              <select className="h-9 rounded-lg border bg-transparent px-2" {...form.register("assigneeUserId")}>
                {staff.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
              {form.formState.errors.assigneeUserId ? (
                <p className="text-xs text-destructive">{form.formState.errors.assigneeUserId.message}</p>
              ) : null}
            </label>
            <label className="grid gap-1 text-sm">
              Program
              <select className="h-9 rounded-lg border bg-transparent px-2" {...form.register("programId")}>
                <option value="">None</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              Due date
              <Input type="date" {...form.register("dueDate")} />
            </label>
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            {task ? (
              <Button
                type="button"
                variant="outline"
                className="text-destructive"
                onClick={() => {
                  const result = deleteTask(task.id);
                  if (!result.ok) {
                    toast.error(result.error);
                    return;
                  }
                  toast.success("Task deleted.");
                  onOpenChange(false);
                }}
              >
                Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{task ? "Save" : "Create"}</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
