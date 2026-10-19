"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/use-org";
import { createId } from "@/lib/ids";
import { programSchema, type ProgramFormValues } from "@/lib/validations/schemas";
import { useDemoStore } from "@/stores/demo-store";
import type { Program } from "@/types/models";

export function ProgramDialog({ open, onOpenChange, program }: { open: boolean; onOpenChange: (open: boolean) => void; program?: Program | null }) {
  const { db, orgId } = useSession();
  const saveProgram = useDemoStore((state) => state.saveProgram);
  const staff = db.users.filter((user) => user.organizationId === orgId || user.role === "organization_admin");
  const form = useForm<ProgramFormValues>({
    resolver: zodResolver(programSchema),
    values: {
      name: program?.name ?? "",
      description: program?.description ?? "",
      objectives: program?.objectives.join("\n") ?? "",
      status: program?.status ?? "draft",
      coordinatorUserId: program?.coordinatorUserId ?? staff[0]?.id ?? "",
      budget: program ? program.budgetCents / 100 : 1000,
      startDate: program?.startDate ?? new Date().toISOString().slice(0, 10),
      endDate: program?.endDate ?? new Date().toISOString().slice(0, 10),
    },
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{program ? "Edit program" : "Create program"}</DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={form.handleSubmit((values) => {
            if (!orgId) return;
            const now = new Date().toISOString();
            const result = saveProgram(
              {
                id: program?.id ?? createId("prog"),
                organizationId: orgId,
                name: values.name,
                description: values.description,
                objectives: values.objectives.split("\n").map((line) => line.trim()).filter(Boolean),
                status: values.status,
                coordinatorUserId: values.coordinatorUserId,
                budgetCents: Math.round(values.budget * 100),
                startDate: values.startDate,
                endDate: values.endDate,
                outcomes: program?.outcomes ?? [],
                createdAt: program?.createdAt ?? now,
                updatedAt: now,
              },
              program ? "update" : "create",
            );
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success("Program saved.");
            onOpenChange(false);
          })}
        >
          <Label htmlFor="program-name">Name</Label>
          <Input id="program-name" {...form.register("name")} />
          <Label htmlFor="program-description">Description</Label>
          <Textarea id="program-description" {...form.register("description")} />
          <Label htmlFor="program-objectives">Objectives, one per line</Label>
          <Textarea id="program-objectives" {...form.register("objectives")} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              Status
              <select className="h-8 rounded-lg border bg-transparent px-2" {...form.register("status")}>
                {["draft", "planned", "active", "completed", "archived"].map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              Coordinator
              <select className="h-8 rounded-lg border bg-transparent px-2" {...form.register("coordinatorUserId")}>
                {staff.map((person) => (
                  <option key={person.id} value={person.id}>{person.name}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              Budget (USD)
              <Input type="number" step="0.01" {...form.register("budget", { valueAsNumber: true })} />
            </label>
            <label className="grid gap-1 text-sm">
              Start
              <Input type="date" {...form.register("startDate")} />
            </label>
            <label className="grid gap-1 text-sm">
              End
              <Input type="date" {...form.register("endDate")} />
            </label>
          </div>
          {form.formState.errors.description ? <p className="text-xs text-destructive">{form.formState.errors.description.message}</p> : null}
          <DialogFooter>
            <Button type="submit">Save program</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
