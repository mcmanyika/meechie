"use client";

import Link from "next/link";
import { MEECHIE_ORG_ID } from "@/config/constants";
import { activeRegistrationCount } from "@/lib/domain/metrics";
import { formatDateTime, titleCase } from "@/lib/format";
import { useDemoStore } from "@/stores/demo-store";

export default function PortalEventsPage() {
  const db = useDemoStore((state) => state.db);
  const events = db.events
    .filter((event) => event.organizationId === MEECHIE_ORG_ID && event.status !== "draft" && event.status !== "cancelled")
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
  return (
    <div className="grid gap-3 pb-16">
      <h1 className="text-2xl font-semibold">Events</h1>
      {events.map((event) => (
        <Link key={event.id} href={`/portal/events/${event.id}`} className="rounded-2xl bg-white p-4">
          <p className="text-xs text-[#6b6258]">{titleCase(event.category)}</p>
          <h2 className="font-medium">{event.name}</h2>
          <p className="text-sm text-[#6b6258]">{formatDateTime(event.startAt)} · {event.location}</p>
          <p className="mt-1 text-sm">{activeRegistrationCount(db, event.id)} of {event.capacity} spots taken</p>
        </Link>
      ))}
    </div>
  );
}
