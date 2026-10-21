"use client";

import Link from "next/link";
import { MEECHIE_ORG_ID } from "@/config/constants";
import { useDemoStore } from "@/stores/demo-store";
import { formatDateTime } from "@/lib/format";

export default function PortalHomePage() {
  const db = useDemoStore((state) => state.db);
  const org = db.organizations.find((item) => item.id === MEECHIE_ORG_ID);
  const programs = db.programs.filter((program) => program.organizationId === MEECHIE_ORG_ID && program.status === "active");
  const events = db.events
    .filter((event) => event.organizationId === MEECHIE_ORG_ID && (event.status === "registration_open" || event.status === "full" || event.status === "published"))
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
    .slice(0, 3);
  if (!org) return null;
  return (
    <div className="grid gap-8 pb-8">
      <section className="rounded-3xl border-2 border-black bg-black px-6 py-10 text-white shadow-[6px_6px_0_#1db954]">
        <p className="text-sm text-[#7bf9aa]">Community portal</p>
        <h1 className="mt-2 max-w-xl text-4xl font-semibold tracking-tight">{org.name}</h1>
        <p className="mt-3 max-w-xl text-sm text-white/80">{org.portalWelcome}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/portal/events" className="rounded-full border-2 border-black bg-[#1db954] px-4 py-2 text-sm font-medium text-white shadow-[3px_3px_0_#000]">See events</Link>
          <Link href="/portal/volunteer" className="rounded-full border-2 border-white/40 px-4 py-2 text-sm">Offer time</Link>
        </div>
      </section>
      <section>
        <h2 className="text-lg font-semibold">Programs</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {programs.map((program) => (
            <article key={program.id} className="rounded-2xl border-2 border-black bg-white p-4 shadow-[3px_3px_0_#fdf279]">
              <h3 className="font-medium">{program.name}</h3>
              <p className="mt-1 text-sm text-[#555555]">{program.description}</p>
            </article>
          ))}
        </div>
      </section>
      <section>
        <h2 className="text-lg font-semibold">Coming up</h2>
        <div className="mt-3 grid gap-3">
          {events.map((event) => (
            <Link key={event.id} href={`/portal/events/${event.id}`} className="rounded-2xl border-2 border-black bg-white p-4 shadow-[3px_3px_0_#7bf9aa]">
              <p className="font-medium">{event.name}</p>
              <p className="text-sm text-[#555555]">{formatDateTime(event.startAt)} · {event.location}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
