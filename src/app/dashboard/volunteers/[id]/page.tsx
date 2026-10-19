"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VolunteerDialog } from "@/components/volunteers/volunteer-dialog";
import { PageHeader } from "@/components/shared/feedback";
import { Panel } from "@/components/shared/panel";
import { RequireAccess } from "@/components/shared/require-access";
import { StatusBadge } from "@/components/shared/status-badge";
import { useOrgRows, useSession } from "@/hooks/use-org";
import { formatDate } from "@/lib/format";
import { useDemoStore } from "@/stores/demo-store";

export default function VolunteerProfilePage() {
  const params = useParams<{ id: string }>();
  const volunteers = useOrgRows("volunteers");
  const assignments = useOrgRows("assignments");
  const events = useOrgRows("events");
  const logs = useOrgRows("serviceLogs");
  const { allowed, user } = useSession();
  const logService = useDemoStore((state) => state.logService);
  const unassign = useDemoStore((state) => state.unassign);
  const [open, setOpen] = useState(false);
  const [hours, setHours] = useState("2");
  const [eventId, setEventId] = useState("");
  const volunteer = volunteers.find((item) => item.id === params.id);
  if (!volunteer) {
    return <RequireAccess permission="volunteers.view" entitlement="volunteers" feature="Volunteers"><p className="text-sm text-muted-foreground">Volunteer not found.</p></RequireAccess>;
  }
  const mine = user?.volunteerId && user.volunteerId !== volunteer.id && user.role === "volunteer";
  if (mine) {
    return <RequireAccess permission="volunteers.view" entitlement="volunteers" feature="Volunteers"><p className="text-sm text-muted-foreground">This demo volunteer account can open their own profile from the directory search.</p></RequireAccess>;
  }
  const own = assignments.filter((item) => item.volunteerId === volunteer.id);
  const history = logs.filter((log) => log.volunteerId === volunteer.id);
  const total = history.reduce((sum, log) => sum + log.hours, 0);
  const upcoming = own.filter((item) => item.status === "assigned" && new Date(events.find((event) => event.id === item.eventId)?.startAt ?? 0) > new Date());

  return (
    <RequireAccess permission="volunteers.view" entitlement="volunteers" feature="Volunteers">
      <div className="grid gap-5">
        <PageHeader
          title={`${volunteer.firstName} ${volunteer.lastName}`}
          description={`${volunteer.email} · ${volunteer.phone}`}
          actions={allowed("volunteers.manage") ? <Button variant="outline" onClick={() => setOpen(true)}>Edit profile</Button> : null}
        />
        <div className="flex flex-wrap gap-2">
          <StatusBadge value={volunteer.status} />
          <StatusBadge value={volunteer.safeguardingStatus} />
        </div>
        <p className="text-sm text-muted-foreground">{volunteer.safeguardingNote}</p>
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Personal details">
            <p className="text-sm">Joined {formatDate(volunteer.joinedAt)}</p>
            <p className="mt-2 text-sm">Skills: {volunteer.skills.join(", ")}</p>
            <p className="text-sm">Interests: {volunteer.interests.join(", ")}</p>
            <p className="text-sm">Availability: {volunteer.availability.join(", ")}</p>
          </Panel>
          <Panel title="Hours">
            <p className="text-3xl font-semibold">{total}</p>
            <p className="text-sm text-muted-foreground">Total recorded service hours</p>
          </Panel>
          <Panel title="Assignments">
            <ul className="space-y-2 text-sm">
              {own.filter((item) => item.status === "assigned").map((item) => {
                const event = events.find((record) => record.id === item.eventId);
                return (
                  <li key={item.id} className="flex items-center justify-between gap-2">
                    <Link href={`/dashboard/events/${item.eventId}`} className="hover:underline">{event?.name}</Link>
                    <span className="text-muted-foreground">{item.role}</span>
                    {allowed("volunteers.manage") ? <Button variant="ghost" size="sm" onClick={() => unassign(item.id)}>Remove</Button> : null}
                  </li>
                );
              })}
            </ul>
          </Panel>
          <Panel title="Upcoming shifts">
            <ul className="space-y-2 text-sm">
              {upcoming.length === 0 ? <li className="text-muted-foreground">No upcoming assignments.</li> : null}
              {upcoming.map((item) => {
                const event = events.find((record) => record.id === item.eventId);
                return <li key={item.id}>{event ? `${event.name} · ${formatDate(event.startAt)}` : item.eventId}</li>;
              })}
            </ul>
          </Panel>
          <Panel title="Service history" className="lg:col-span-2">
            <ul className="space-y-2 text-sm">
              {history.map((log) => (
                <li key={log.id}>{formatDate(log.date)} · {log.hours} hours · {log.notes}</li>
              ))}
            </ul>
            {allowed("volunteers.manage") ? (
              <form className="mt-3 flex flex-wrap gap-2" onSubmit={(submit) => {
                submit.preventDefault();
                const result = logService({ volunteerId: volunteer.id, eventId: eventId || null, hours: Number(hours), date: new Date().toISOString(), notes: "Recorded from the volunteer profile." });
                if (!result.ok) toast.error(result.error);
                else toast.success("Hours recorded.");
              }}>
                <select aria-label="Event" className="h-8 rounded-lg border bg-card px-2 text-sm" value={eventId} onChange={(event) => setEventId(event.target.value)}>
                  <option value="">No event</option>
                  {events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
                </select>
                <Input type="number" min="0.5" max="24" step="0.5" value={hours} onChange={(event) => setHours(event.target.value)} aria-label="Hours" className="max-w-28" />
                <Button type="submit">Record hours</Button>
              </form>
            ) : null}
          </Panel>
        </div>
        <VolunteerDialog open={open} onOpenChange={setOpen} volunteer={volunteer} />
      </div>
    </RequireAccess>
  );
}
