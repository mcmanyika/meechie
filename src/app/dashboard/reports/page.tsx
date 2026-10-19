"use client";

import { useMemo, useState } from "react";
import { subMonths } from "date-fns";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/feedback";
import { RequireAccess } from "@/components/shared/require-access";
import { useOrgRows, useSession } from "@/hooks/use-org";
import { computeImpact } from "@/lib/domain/metrics";
import { downloadText, formatMoney, toCsv } from "@/lib/format";
import { useDemoStore } from "@/stores/demo-store";

export default function ReportsPage() {
  const programs = useOrgRows("programs");
  const events = useOrgRows("events");
  const { organization, db, orgId } = useSession();
  const saveReport = useDemoStore((state) => state.saveReport);
  const [start, setStart] = useState(subMonths(new Date(), 12).toISOString().slice(0, 10));
  const [end, setEnd] = useState(new Date().toISOString().slice(0, 10));
  const [programId, setProgramId] = useState("");
  const [eventId, setEventId] = useState("");
  const [location, setLocation] = useState("");
  const cities = [...new Set(events.map((event) => event.city))];
  const filters = useMemo(() => ({
    organizationId: orgId ?? "",
    start: new Date(`${start}T00:00:00`),
    end: new Date(`${end}T23:59:59`),
    programId: programId || null,
    eventId: eventId || null,
    location: location || null,
  }), [orgId, start, end, programId, eventId, location]);
  const current = orgId ? computeImpact(db, filters) : null;
  const previousStart = new Date(filters.start);
  previousStart.setFullYear(previousStart.getFullYear() - 1);
  const previousEnd = new Date(filters.end);
  previousEnd.setFullYear(previousEnd.getFullYear() - 1);
  const previous = orgId ? computeImpact(db, { ...filters, start: previousStart, end: previousEnd }) : null;
  if (!current || !organization || !orgId) return null;
  const rows = [
    ["Households served", current.householdsServed, previous?.householdsServed ?? 0],
    ["Individuals served", current.individualsServed, previous?.individualsServed ?? 0],
    ["Events completed", current.eventsCompleted, previous?.eventsCompleted ?? 0],
    ["Volunteer hours", current.volunteerHours, previous?.volunteerHours ?? 0],
    ["Donations", formatMoney(current.donationsCents, organization.currency), formatMoney(previous?.donationsCents ?? 0, organization.currency)],
    ["Expenses", formatMoney(current.expensesCents, organization.currency), formatMoney(previous?.expensesCents ?? 0, organization.currency)],
    ["Supplies distributed", current.suppliesDistributed, previous?.suppliesDistributed ?? 0],
  ];
  return (
    <RequireAccess permission="reports.view" entitlement="reports" feature="Impact reports">
      <div className="grid gap-5" id="impact-report">
        <PageHeader
          title="Impact reports"
          description="Verified activity is calculated from records. Narrative program outcomes are separate and unverified. This view uses sample data."
          actions={<Button variant="outline" onClick={() => window.print()}>Print report</Button>}
        />
        <div className="flex flex-wrap gap-2">
          <Input type="date" aria-label="Start date" value={start} onChange={(event) => setStart(event.target.value)} className="max-w-40" />
          <Input type="date" aria-label="End date" value={end} onChange={(event) => setEnd(event.target.value)} className="max-w-40" />
          <select aria-label="Program" className="h-8 rounded-lg border bg-card px-2 text-sm" value={programId} onChange={(event) => setProgramId(event.target.value)}>
            <option value="">All programs</option>
            {programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}
          </select>
          <select aria-label="Event" className="h-8 rounded-lg border bg-card px-2 text-sm" value={eventId} onChange={(event) => setEventId(event.target.value)}>
            <option value="">All events</option>
            {events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
          </select>
          <select aria-label="Location" className="h-8 rounded-lg border bg-card px-2 text-sm" value={location} onChange={(event) => setLocation(event.target.value)}>
            <option value="">All locations</option>
            {cities.map((city) => <option key={city} value={city}>{city}</option>)}
          </select>
          <Button variant="outline" onClick={() => downloadText("impact-report.csv", toCsv(rows.map(([metric, value, prior]) => ({ metric: String(metric), current: String(value), priorPeriod: String(prior) }))))}>Export CSV</Button>
          <Button onClick={() => {
            const result = saveReport({ title: `${organization.name} impact report`, periodStart: start, periodEnd: end, programId: programId || null, eventId: eventId || null, location: location || null });
            if (!result.ok) return;
          }}>Save report preset</Button>
        </div>
        <article className="rounded-xl border bg-card p-6">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">Sample data · {organization.name}</p>
          <h2 className="mt-1 text-xl font-semibold">Sponsor-ready activity summary</h2>
          <p className="text-sm text-muted-foreground">{organization.addressLine}, {organization.city}, {organization.state} · {start} to {end}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {rows.map(([label, value, prior]) => (
              <div key={String(label)} className="rounded-lg bg-muted px-3 py-2">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-lg font-semibold">{value}</p>
                <p className="text-xs text-muted-foreground">Prior period {prior}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={current.participationByProgram}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" interval={0} angle={-20} height={60} />
                <YAxis allowDecimals={false} stroke="var(--muted-foreground)" />
                <Tooltip />
                <Bar dataKey="participants" fill="var(--chart-1)" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <h3 className="mt-4 text-sm font-medium">Program notes that are not verified metrics</h3>
          <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
            {programs.filter((program) => !programId || program.id === programId).map((program) => (
              <li key={program.id}>{program.name}: {program.outcomes[0]?.narrative}</li>
            ))}
          </ul>
        </article>
      </div>
    </RequireAccess>
  );
}
