"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/feedback";
import { Panel } from "@/components/shared/panel";
import { RequireAccess } from "@/components/shared/require-access";
import { StatusBadge } from "@/components/shared/status-badge";
import { useOrgRows, useSession } from "@/hooks/use-org";
import { activeRegistrationCount } from "@/lib/domain/metrics";
import { formatDateTime, formatMoney, titleCase } from "@/lib/format";
import { useDemoStore } from "@/stores/demo-store";
import { GIVEAWAY_EVENT_ID } from "@/config/constants";

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const events = useOrgRows("events");
  const programs = useOrgRows("programs");
  const members = useOrgRows("members");
  const registrations = useOrgRows("registrations");
  const attendance = useOrgRows("attendance");
  const volunteers = useOrgRows("volunteers");
  const assignments = useOrgRows("assignments");
  const expenses = useOrgRows("expenses");
  const { db, organization, allowed } = useSession();
  const openRegistration = useDemoStore((state) => state.openRegistration);
  const setEventStatus = useDemoStore((state) => state.setEventStatus);
  const registerMember = useDemoStore((state) => state.registerMember);
  const checkIn = useDemoStore((state) => state.checkIn);
  const cancelRegistration = useDemoStore((state) => state.cancelRegistration);
  const assign = useDemoStore((state) => state.assign);
  const unassign = useDemoStore((state) => state.unassign);
  const addExpense = useDemoStore((state) => state.addExpense);
  const [memberId, setMemberId] = useState("");
  const [volunteerId, setVolunteerId] = useState("");
  const [role, setRole] = useState("Event support");
  const [expense, setExpense] = useState("");
  const event = events.find((item) => item.id === params.id);
  if (!event || !organization) {
    return (
      <RequireAccess permission="events.view" entitlement="events" feature="Events">
        <p className="text-sm text-muted-foreground">Event not found in this organization.</p>
      </RequireAccess>
    );
  }
  const program = programs.find((item) => item.id === event.programId);
  const rows = registrations.filter((item) => item.eventId === event.id);
  const active = activeRegistrationCount(db, event.id);
  const checked = attendance.filter((item) => item.eventId === event.id);
  const eventAssignments = assignments.filter((item) => item.eventId === event.id && item.status === "assigned");
  const eventExpenses = expenses.filter((item) => item.eventId === event.id);
  const giveaway = event.id === GIVEAWAY_EVENT_ID;

  return (
    <RequireAccess permission="events.view" entitlement="events" feature="Events">
      <div className="grid gap-5">
        <PageHeader eyebrow={event.id} title={event.name} description={event.description} />
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge value={event.status} />
          <span className="text-sm text-muted-foreground">{program?.name}</span>
          <span className="text-sm text-muted-foreground">
            {active} / {event.capacity} registered
          </span>
        </div>
        {giveaway ? (
          <ol className="grid gap-2 rounded-xl border bg-card p-4 text-sm sm:grid-cols-3">
            {[
              ["Created", true],
              ["Registration open", event.status === "registration_open" || event.status === "full"],
              ["Has registrations", rows.some((row) => row.status !== "cancelled")],
              ["Volunteer assigned", eventAssignments.length > 0],
              ["Someone checked in", checked.length > 0],
              ["Summary available", true],
            ].map(([label, done]) => (
              <li key={String(label)} className="rounded-lg bg-muted px-3 py-2">
                {done ? "Done" : "Waiting"} · {label}
              </li>
            ))}
          </ol>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {allowed("events.manage") && event.status !== "registration_open" && event.status !== "full" && event.status !== "cancelled" && event.status !== "completed" ? (
            <Button
              onClick={() => {
                const result = openRegistration(event.id);
                if (!result.ok) toast.error(result.error);
                else toast.success("Registration is open.");
              }}
            >
              Open registration
            </Button>
          ) : null}
          {allowed("events.manage") && event.status !== "completed" && event.status !== "cancelled" ? (
            <Button
              variant="outline"
              onClick={() => {
                const result = setEventStatus(event.id, "completed");
                if (!result.ok) toast.error(result.error);
                else toast.success("Event marked completed.");
              }}
            >
              Mark completed
            </Button>
          ) : null}
          {allowed("events.manage") && event.status !== "cancelled" ? (
            <Button
              variant="outline"
              onClick={() => {
                const result = setEventStatus(event.id, "cancelled");
                if (!result.ok) toast.error(result.error);
                else toast.success("Event cancelled.");
              }}
            >
              Cancel event
            </Button>
          ) : null}
        </div>
        <Tabs defaultValue="overview">
          <TabsList className="flex h-auto flex-wrap">
            {["overview", "registrations", "attendance", "volunteers", "expenses", "summary"].map((tab) => (
              <TabsTrigger key={tab} value={tab}>
                {titleCase(tab)}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="overview" className="grid gap-3 pt-4 sm:grid-cols-2">
            <Info label="When" value={`${formatDateTime(event.startAt)} – ${formatDateTime(event.endAt)}`} />
            <Info label="Location" value={`${event.location}, ${event.city}`} />
            <Info label="Deadline" value={formatDateTime(event.registrationDeadline)} />
            <Info label="Budget" value={formatMoney(event.budgetCents, organization.currency)} />
            <Info label="Category" value={titleCase(event.category)} />
            <Info label="Volunteers needed" value={String(event.volunteersNeeded)} />
          </TabsContent>
          <TabsContent value="registrations" className="grid gap-3 pt-4">
            {allowed("events.manage") ? (
              <form
                className="flex flex-wrap gap-2"
                onSubmit={(submit) => {
                  submit.preventDefault();
                  const result = registerMember(event.id, memberId, "admin");
                  if (!result.ok) toast.error(result.error);
                  else toast.success("Registration added.");
                }}
              >
                <select aria-label="Community member" className="h-8 min-w-56 rounded-lg border bg-card px-2 text-sm" value={memberId} onChange={(input) => setMemberId(input.target.value)}>
                  <option value="">Choose a member</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.firstName} {member.lastName}
                    </option>
                  ))}
                </select>
                <Button type="submit">Register</Button>
              </form>
            ) : null}
            <Directory rows={rows} members={members} canCancel={allowed("events.manage")} onCancel={(id) => {
              const result = cancelRegistration(id);
              if (!result.ok) toast.error(result.error);
              else toast.success("Registration cancelled.");
            }} />
          </TabsContent>
          <TabsContent value="attendance" className="grid gap-3 pt-4">
            <p className="text-sm text-muted-foreground">{checked.length} checked in.</p>
            <ul className="divide-y rounded-xl border bg-card">
              {rows
                .filter((row) => row.status !== "cancelled")
                .map((row) => {
                  const member = members.find((item) => item.id === row.memberId);
                  const present = attendance.find((item) => item.registrationId === row.id);
                  return (
                    <li key={row.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                      <span>
                        {member?.firstName} {member?.lastName}
                      </span>
                      {present ? (
                        <span className="text-muted-foreground">{formatDateTime(present.checkedInAt)}</span>
                      ) : allowed("events.checkin") ? (
                        <Button
                          size="sm"
                          onClick={() => {
                            const result = checkIn(row.id);
                            if (!result.ok) toast.error(result.error);
                            else toast.success("Checked in.");
                          }}
                        >
                          Check in
                        </Button>
                      ) : (
                        <StatusBadge value={row.status} />
                      )}
                    </li>
                  );
                })}
            </ul>
          </TabsContent>
          <TabsContent value="volunteers" className="grid gap-3 pt-4">
            {allowed("volunteers.manage") ? (
              <form
                className="flex flex-wrap gap-2"
                onSubmit={(submit) => {
                  submit.preventDefault();
                  const result = assign(volunteerId, event.id, role);
                  if (!result.ok) toast.error(result.error);
                  else toast.success("Volunteer assigned.");
                }}
              >
                <select aria-label="Volunteer" className="h-8 rounded-lg border bg-card px-2 text-sm" value={volunteerId} onChange={(input) => setVolunteerId(input.target.value)}>
                  <option value="">Choose a volunteer</option>
                  {volunteers.map((volunteer) => (
                    <option key={volunteer.id} value={volunteer.id}>
                      {volunteer.firstName} {volunteer.lastName}
                    </option>
                  ))}
                </select>
                <Input value={role} onChange={(input) => setRole(input.target.value)} aria-label="Assignment role" className="max-w-48" />
                <Button type="submit">Assign</Button>
              </form>
            ) : null}
            <ul className="divide-y rounded-xl border bg-card">
              {eventAssignments.map((assignment) => {
                const volunteer = volunteers.find((item) => item.id === assignment.volunteerId);
                return (
                  <li key={assignment.id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <span>
                      {volunteer?.firstName} {volunteer?.lastName} · {assignment.role}
                    </span>
                    {allowed("volunteers.manage") ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const result = unassign(assignment.id);
                          if (!result.ok) toast.error(result.error);
                          else toast.success("Assignment removed.");
                        }}
                      >
                        Remove
                      </Button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </TabsContent>
          <TabsContent value="expenses" className="grid gap-3 pt-4">
            <ul className="space-y-2 text-sm">
              {eventExpenses.map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span>{item.description}</span>
                  <span>{formatMoney(item.amountCents, organization.currency)}</span>
                </li>
              ))}
            </ul>
            {allowed("programs.manage") || allowed("reports.financial") ? (
              <form
                className="flex gap-2"
                onSubmit={(submit) => {
                  submit.preventDefault();
                  const dollars = Number(expense);
                  const result = addExpense({
                    amountCents: Math.round(dollars * 100),
                    date: new Date().toISOString(),
                    category: "Event",
                    description: `${event.name} expense`,
                    programId: event.programId,
                    eventId: event.id,
                  });
                  if (!result.ok) toast.error(result.error);
                  else {
                    setExpense("");
                    toast.success("Expense recorded.");
                  }
                }}
              >
                <Input type="number" min="1" step="0.01" value={expense} onChange={(input) => setExpense(input.target.value)} aria-label="Expense amount" className="max-w-40" />
                <Button type="submit">Record expense</Button>
              </form>
            ) : null}
          </TabsContent>
          <TabsContent value="summary" className="pt-4">
            <Panel title="Post-event summary">
              <p className="text-sm text-muted-foreground">Generated from this event&apos;s demonstration records.</p>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <Info label="Registrations" value={String(rows.filter((row) => row.status !== "cancelled").length)} />
                <Info label="Attendance" value={String(checked.length)} />
                <Info label="Volunteers assigned" value={String(eventAssignments.length)} />
                <Info label="Expenses" value={formatMoney(eventExpenses.reduce((sum, item) => sum + item.amountCents, 0), organization.currency)} />
              </dl>
              <Button className="mt-4" variant="outline" onClick={() => window.print()}>
                Print summary
              </Button>
            </Panel>
          </TabsContent>
        </Tabs>
      </div>
    </RequireAccess>
  );
}

function Directory({
  rows,
  members,
  canCancel,
  onCancel,
}: {
  rows: { id: string; memberId: string; status: string; source: string }[];
  members: { id: string; firstName: string; lastName: string }[];
  canCancel: boolean;
  onCancel: (id: string) => void;
}) {
  return (
    <ul className="divide-y rounded-xl border bg-card">
      {rows.map((row) => {
        const member = members.find((item) => item.id === row.memberId);
        return (
          <li key={row.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
            <span>
              {member?.firstName} {member?.lastName}
              <span className="ml-2 text-xs text-muted-foreground">{row.source}</span>
            </span>
            <span className="flex items-center gap-2">
              <StatusBadge value={row.status} />
              {canCancel && row.status !== "cancelled" ? (
                <Button variant="ghost" size="sm" onClick={() => onCancel(row.id)}>
                  Cancel
                </Button>
              ) : null}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}
