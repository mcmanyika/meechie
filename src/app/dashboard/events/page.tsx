"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { addDays, endOfMonth, endOfWeek, format, isSameMonth, parseISO, startOfMonth, startOfWeek } from "date-fns";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/feedback";
import { RequireAccess } from "@/components/shared/require-access";
import { StatusBadge } from "@/components/shared/status-badge";
import { useOrgRows, useSession } from "@/hooks/use-org";
import { activeRegistrationCount } from "@/lib/domain/metrics";
import { formatDateTime } from "@/lib/format";
import { cn } from "cn";

export default function EventsPage() {
  const events = useOrgRows("events");
  const { db, allowed } = useSession();
  const [mode, setMode] = useState<"list" | "calendar">("list");
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [status, setStatus] = useState("all");
  const visible = events.filter((event) => status === "all" || event.status === status);
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor));
    const end = endOfWeek(endOfMonth(cursor));
    const rows = [];
    for (let day = start; day <= end; day = addDays(day, 1)) rows.push(day);
    return rows;
  }, [cursor]);

  return (
    <RequireAccess permission="events.view" entitlement="events" feature="Events">
      <div className="grid gap-5">
        <PageHeader
          title="Events"
          actions={
            <>
              <button type="button" className={cn(buttonVariants({ variant: mode === "list" ? "default" : "outline" }))} onClick={() => setMode("list")}>
                List
              </button>
              <button type="button" className={cn(buttonVariants({ variant: mode === "calendar" ? "default" : "outline" }))} onClick={() => setMode("calendar")}>
                Calendar
              </button>
              {allowed("events.manage") ? (
                <Link href="/dashboard/events/new" className={cn(buttonVariants())}>
                  <Plus /> Create event
                </Link>
              ) : null}
            </>
          }
        />
        <label className="text-sm text-muted-foreground">
          Status
          <select aria-label="Event status" className="ml-2 h-8 rounded-lg border bg-card px-2 text-foreground" value={status} onChange={(event) => setStatus(event.target.value)}>
            {["all", "draft", "published", "registration_open", "full", "completed", "cancelled"].map((option) => (
              <option key={option} value={option}>
                {option.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        {mode === "list" ? (
          <div className="overflow-hidden rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Event</th>
                  <th className="px-4 py-2 font-medium">When</th>
                  <th className="px-4 py-2 font-medium">Capacity</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {visible
                  .slice()
                  .sort((a, b) => a.startAt.localeCompare(b.startAt))
                  .map((event) => (
                    <tr key={event.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/events/${event.id}`} className="font-medium hover:underline">
                          {event.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{event.location}</p>
                      </td>
                      <td className="px-4 py-3">{formatDateTime(event.startAt)}</td>
                      <td className="px-4 py-3">
                        {activeRegistrationCount(db, event.id)} / {event.capacity}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge value={event.status} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <ButtonLike onClick={() => setCursor(addDays(startOfMonth(cursor), -1))}>Previous</ButtonLike>
              <p className="text-sm font-medium">{format(cursor, "MMMM yyyy")}</p>
              <ButtonLike onClick={() => setCursor(addDays(endOfMonth(cursor), 1))}>Next</ButtonLike>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {days.map((day) => {
                const items = visible.filter((event) => format(parseISO(event.startAt), "yyyy-MM-dd") === format(day, "yyyy-MM-dd"));
                return (
                  <div key={day.toISOString()} className={cn("min-h-20 rounded-lg border p-1", !isSameMonth(day, cursor) && "opacity-40")}>
                    <p className="text-xs">{format(day, "d")}</p>
                    {items.map((event) => (
                      <Link key={event.id} href={`/dashboard/events/${event.id}`} className="mt-1 block truncate rounded bg-secondary px-1 py-0.5 text-[11px] text-secondary-foreground">
                        {event.name}
                      </Link>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </RequireAccess>
  );
}

function ButtonLike({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" className={cn(buttonVariants({ variant: "outline", size: "sm" }))} onClick={onClick}>
      {children}
    </button>
  );
}
