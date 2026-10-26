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
import { outreachActivitySchema, type OutreachActivityFormValues } from "@/lib/validations/schemas";
import { useDemoStore } from "@/stores/demo-store";
import type { OutreachActivity } from "@/types/models";

const TYPES = ["canvass", "neighborhood_visit", "flyering", "partnership", "other"] as const;
const STATUSES = ["planned", "completed", "cancelled"] as const;

export function OutreachDialog({
  open,
  onOpenChange,
  activity,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity?: OutreachActivity | null;
}) {
  const { db, orgId, user, organization } = useSession();
  const programs = useOrgRows("programs");
  const volunteers = useOrgRows("volunteers");
  const saveOutreachActivity = useDemoStore((state) => state.saveOutreachActivity);
  const deleteOutreachActivity = useDemoStore((state) => state.deleteOutreachActivity);
  const staff = db.users.filter(
    (person) =>
      person.organizationId === orgId &&
      (person.accountStatus ?? "active") === "active" &&
      (STAFF_ROLES.includes(person.role as (typeof STAFF_ROLES)[number]) || person.role === "volunteer"),
  );
  const form = useForm<OutreachActivityFormValues>({
    resolver: zodResolver(outreachActivitySchema),
    values: {
      title: activity?.title ?? "",
      type: activity?.type ?? "neighborhood_visit",
      status: activity?.status ?? "planned",
      date: activity?.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      neighborhood: activity?.neighborhood ?? "",
      city: activity?.city ?? organization?.city ?? "Dallas",
      programId: activity?.programId ?? "",
      leadUserId: activity?.leadUserId ?? user?.id ?? staff[0]?.id ?? "",
      volunteerIds: activity?.volunteerIds ?? [],
      householdsReached: activity?.householdsReached ?? 0,
      individualsReached: activity?.individualsReached ?? 0,
      notes: activity?.notes ?? "",
    },
  });
  const selectedVolunteers = form.watch("volunteerIds");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{activity ? "Edit outreach" : "Log outreach"}</DialogTitle>
        </DialogHeader>
        <form
          className="grid max-h-[70vh] gap-3 overflow-y-auto pr-1"
          onSubmit={form.handleSubmit((values) => {
            if (!orgId) return;
            const now = new Date().toISOString();
            const result = saveOutreachActivity(
              {
                id: activity?.id ?? createId("out"),
                organizationId: orgId,
                title: values.title,
                type: values.type,
                status: values.status,
                date: values.date,
                neighborhood: values.neighborhood,
                city: values.city,
                programId: values.programId || null,
                leadUserId: values.leadUserId,
                volunteerIds: values.volunteerIds,
                householdsReached: values.householdsReached,
                individualsReached: values.individualsReached,
                notes: values.notes,
                createdAt: activity?.createdAt ?? now,
                updatedAt: now,
              },
              activity ? "update" : "create",
            );
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success(activity ? "Outreach updated." : "Outreach logged.");
            onOpenChange(false);
          })}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="outreach-title">Title</Label>
            <Input id="outreach-title" placeholder="Oak Cliff door-to-door" {...form.register("title")} />
            {form.formState.errors.title ? <p className="text-xs text-destructive">{form.formState.errors.title.message}</p> : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              Type
              <select className="h-9 rounded-lg border bg-transparent px-2" {...form.register("type")}>
                {TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              Status
              <select className="h-9 rounded-lg border bg-transparent px-2" {...form.register("status")}>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-1.5">
              <Label htmlFor="outreach-date">Date</Label>
              <Input id="outreach-date" type="date" {...form.register("date")} />
              {form.formState.errors.date ? <p className="text-xs text-destructive">{form.formState.errors.date.message}</p> : null}
            </div>
            <label className="grid gap-1 text-sm">
              Lead
              <select className="h-9 rounded-lg border bg-transparent px-2" {...form.register("leadUserId")}>
                {staff.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
              {form.formState.errors.leadUserId ? (
                <p className="text-xs text-destructive">{form.formState.errors.leadUserId.message}</p>
              ) : null}
            </label>
            <div className="grid gap-1.5">
              <Label htmlFor="outreach-neighborhood">Neighborhood</Label>
              <Input id="outreach-neighborhood" {...form.register("neighborhood")} />
              {form.formState.errors.neighborhood ? (
                <p className="text-xs text-destructive">{form.formState.errors.neighborhood.message}</p>
              ) : null}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="outreach-city">City</Label>
              <Input id="outreach-city" {...form.register("city")} />
              {form.formState.errors.city ? <p className="text-xs text-destructive">{form.formState.errors.city.message}</p> : null}
            </div>
            <label className="grid gap-1 text-sm sm:col-span-2">
              Program (optional)
              <select className="h-9 rounded-lg border bg-transparent px-2" {...form.register("programId")}>
                <option value="">None</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="outreach-households">Households reached</Label>
              <Input
                id="outreach-households"
                type="number"
                min={0}
                {...form.register("householdsReached", { valueAsNumber: true })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="outreach-individuals">Individuals reached</Label>
              <Input
                id="outreach-individuals"
                type="number"
                min={0}
                {...form.register("individualsReached", { valueAsNumber: true })}
              />
            </div>
          </div>
          {volunteers.length > 0 ? (
            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium">Volunteers present</legend>
              <div className="max-h-28 space-y-1 overflow-y-auto rounded-lg border p-2">
                {volunteers.map((volunteer) => {
                  const checked = selectedVolunteers.includes(volunteer.id);
                  return (
                    <label key={volunteer.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          const next = event.target.checked
                            ? [...selectedVolunteers, volunteer.id]
                            : selectedVolunteers.filter((id) => id !== volunteer.id);
                          form.setValue("volunteerIds", next, { shouldDirty: true });
                        }}
                      />
                      {volunteer.firstName} {volunteer.lastName}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ) : null}
          <div className="grid gap-1.5">
            <Label htmlFor="outreach-notes">Notes</Label>
            <Textarea id="outreach-notes" rows={3} {...form.register("notes")} />
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            {activity ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  const result = deleteOutreachActivity(activity.id);
                  if (!result.ok) {
                    toast.error(result.error);
                    return;
                  }
                  toast.success("Outreach deleted.");
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
              <Button type="submit">{activity ? "Save" : "Log outreach"}</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
