"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/feedback";
import { RequireAccess } from "@/components/shared/require-access";
import { useOrgRows, useSession } from "@/hooks/use-org";
import { createId } from "@/lib/ids";
import { eventSchema, type EventFormValues } from "@/lib/validations/schemas";
import { useDemoStore } from "@/stores/demo-store";

const steps = ["Basics", "Schedule", "Capacity", "Review"];

export default function NewEventPage() {
  const programs = useOrgRows("programs");
  const { db, orgId, organization } = useSession();
  const saveEvent = useDemoStore((state) => state.saveEvent);
  const router = useRouter();
  const [step, setStep] = useState(0);
  const staff = db.users.filter((user) => user.organizationId === orgId);
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: "",
      description: "",
      programId: programs[0]?.id ?? "",
      category: "distribution",
      startAt: "",
      endAt: "",
      location: "",
      city: organization?.city ?? "",
      capacity: 40,
      registrationDeadline: "",
      coordinatorUserId: staff[0]?.id ?? "",
      volunteersNeeded: 4,
      budget: 500,
      status: "draft",
    },
  });
  const values = form.watch();

  return (
    <RequireAccess permission="events.manage" entitlement="events" feature="Events">
      <div className="mx-auto grid max-w-2xl gap-5">
        <PageHeader title="Create event" description={`Step ${step + 1} of ${steps.length}: ${steps[step]}`} />
        <ol className="flex gap-2 text-xs text-muted-foreground">
          {steps.map((label, index) => (
            <li key={label} className={index === step ? "font-medium text-foreground" : ""}>
              {index + 1}. {label}
            </li>
          ))}
        </ol>
        <form
          className="grid gap-3 rounded-xl border bg-card p-4"
          onSubmit={form.handleSubmit((data) => {
            if (!orgId) return;
            const now = new Date().toISOString();
            const result = saveEvent(
              {
                id: createId("evt"),
                organizationId: orgId,
                name: data.name,
                description: data.description,
                programId: data.programId,
                category: data.category,
                startAt: new Date(data.startAt).toISOString(),
                endAt: new Date(data.endAt).toISOString(),
                location: data.location,
                city: data.city,
                capacity: data.capacity,
                registrationDeadline: new Date(data.registrationDeadline).toISOString(),
                coordinatorUserId: data.coordinatorUserId,
                volunteersNeeded: data.volunteersNeeded,
                budgetCents: Math.round(data.budget * 100),
                status: data.status,
                createdAt: now,
                updatedAt: now,
              },
              "create",
            );
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success("Event created.");
            router.push(`/dashboard/events/${result.data.id}`);
          })}
        >
          {step === 0 ? (
            <>
              <label className="grid gap-1 text-sm">Name <Input {...form.register("name")} /></label>
              <label className="grid gap-1 text-sm">Description <Textarea {...form.register("description")} /></label>
              <label className="grid gap-1 text-sm">
                Program
                <select className="h-8 rounded-lg border bg-transparent px-2" {...form.register("programId")}>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>{program.name}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                Category
                <select className="h-8 rounded-lg border bg-transparent px-2" {...form.register("category")}>
                  {["distribution", "workshop", "outreach", "fundraiser", "volunteer"].map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </label>
            </>
          ) : null}
          {step === 1 ? (
            <>
              <label className="grid gap-1 text-sm">Starts <Input type="datetime-local" {...form.register("startAt")} /></label>
              <label className="grid gap-1 text-sm">Ends <Input type="datetime-local" {...form.register("endAt")} /></label>
              <label className="grid gap-1 text-sm">Registration deadline <Input type="datetime-local" {...form.register("registrationDeadline")} /></label>
              <label className="grid gap-1 text-sm">Location <Input {...form.register("location")} /></label>
              <label className="grid gap-1 text-sm">City <Input {...form.register("city")} /></label>
            </>
          ) : null}
          {step === 2 ? (
            <>
              <label className="grid gap-1 text-sm">Capacity <Input type="number" {...form.register("capacity", { valueAsNumber: true })} /></label>
              <label className="grid gap-1 text-sm">Volunteers needed <Input type="number" {...form.register("volunteersNeeded", { valueAsNumber: true })} /></label>
              <label className="grid gap-1 text-sm">Budget (USD) <Input type="number" step="0.01" {...form.register("budget", { valueAsNumber: true })} /></label>
              <label className="grid gap-1 text-sm">
                Coordinator
                <select className="h-8 rounded-lg border bg-transparent px-2" {...form.register("coordinatorUserId")}>
                  {staff.map((person) => (
                    <option key={person.id} value={person.id}>{person.name}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                Initial status
                <select className="h-8 rounded-lg border bg-transparent px-2" {...form.register("status")}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="registration_open">Registration open</option>
                </select>
              </label>
            </>
          ) : null}
          {step === 3 ? (
            <dl className="grid gap-2 text-sm">
              <div><dt className="text-xs text-muted-foreground">Name</dt><dd>{values.name || "—"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Location</dt><dd>{values.location || "—"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Capacity</dt><dd>{values.capacity}</dd></div>
              <p className="text-muted-foreground">Saving creates the event in this organization. Open registration from the event page when you are ready for attendees.</p>
            </dl>
          ) : null}
          {Object.values(form.formState.errors)[0]?.message ? <p className="text-xs text-destructive">{Object.values(form.formState.errors)[0]?.message}</p> : null}
          <div className="flex justify-between">
            <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep((current) => current - 1)}>
              Back
            </Button>
            {step < 3 ? (
              <Button
                type="button"
                onClick={async () => {
                  const fields: (keyof EventFormValues)[][] = [
                    ["name", "description", "programId", "category"],
                    ["startAt", "endAt", "registrationDeadline", "location", "city"],
                    ["capacity", "volunteersNeeded", "budget", "coordinatorUserId", "status"],
                  ];
                  const valid = await form.trigger(fields[step]);
                  if (valid) setStep((current) => current + 1);
                }}
              >
                Continue
              </Button>
            ) : (
              <Button type="submit">Create event</Button>
            )}
          </div>
        </form>
      </div>
    </RequireAccess>
  );
}
