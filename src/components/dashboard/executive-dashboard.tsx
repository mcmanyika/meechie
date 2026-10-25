"use client";

import Link from "next/link";
import { CalendarPlus, FileBarChart, HandCoins, UserPlus, Users } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/feedback";
import { Panel } from "@/components/shared/panel";
import { useOrgRows, useSession } from "@/hooks/use-org";
import { executiveSnapshot, monthBuckets } from "@/lib/domain/metrics";
import { formatMoney, formatNumber } from "@/lib/format";
import { cn } from "cn";

export function ExecutiveDashboard() {
  const { organization, db, orgId, user } = useSession();
  const events = useOrgRows("events");
  const donations = useOrgRows("donations");
  const programs = useOrgRows("programs");
  const volunteers = useOrgRows("volunteers");
  const serviceLogs = useOrgRows("serviceLogs");
  const expenses = useOrgRows("expenses");
  const attendance = useOrgRows("attendance");
  const members = useOrgRows("members");
  if (!orgId || !organization) return null;
  const snapshot = executiveSnapshot(db, orgId);
  const months = monthBuckets(new Date(), 6);
  const donationSeries = months.map((month) => ({
    label: month.label,
    amount:
      donations
        .filter((donation) => donation.status === "completed" && inBucket(donation.date, month.start, month.end))
        .reduce((sum, donation) => sum + donation.amountCents, 0) / 100,
  }));
  const familySeries = months.map((month) => {
    const ids = new Set(
      attendance.filter((record) => inBucket(record.checkedInAt, month.start, month.end)).map((record) => record.memberId),
    );
    const households = new Set(members.filter((member) => ids.has(member.id)).map((member) => member.householdId));
    return { label: month.label, households: households.size };
  });
  const hourSeries = months.map((month) => ({
    label: month.label,
    hours: serviceLogs.filter((log) => inBucket(log.date, month.start, month.end)).reduce((sum, log) => sum + log.hours, 0),
  }));
  const participation = programs.map((program) => ({
    name: program.name.replace(" Support", "").replace(" Assistance", ""),
    people: new Set(
      attendance
        .filter((record) => events.find((event) => event.id === record.eventId)?.programId === program.id)
        .map((record) => record.memberId),
    ).size,
  }));
  const sources = ["one_time", "recurring", "corporate", "in_kind"].map((type) => ({
    name: type.replaceAll("_", " "),
    value: donations.filter((donation) => donation.type === type && donation.status === "completed").reduce((sum, donation) => sum + donation.amountCents, 0),
  }));

  const cards = [
    ["Total donations", formatMoney(snapshot.donationsCents, organization.currency), "Completed gifts"],
    ["Families served", formatNumber(snapshot.familiesServed), "Households with a check-in"],
    ["Active volunteers", formatNumber(snapshot.activeVolunteers), `${volunteers.length} on the roster`],
    ["Upcoming events", formatNumber(snapshot.upcomingEvents), "Published or open"],
    ["Active programs", formatNumber(snapshot.activePrograms), `${programs.length} total`],
    ["Monthly expenses", formatMoney(snapshot.monthlyExpensesCents, organization.currency), "Recorded this month"],
  ];

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={organization.name}
        title={`Good to see you, ${user?.name.split(" ")[0] ?? "there"}`}
        actions={
          <>
            <Link href="/dashboard/events/new" className={cn(buttonVariants())}>
              <CalendarPlus /> Create event
            </Link>
            <Link href="/dashboard/community?new=1" className={cn(buttonVariants({ variant: "outline" }))}>
              <UserPlus /> Add member
            </Link>
            <Link href="/dashboard/volunteers?new=1" className={cn(buttonVariants({ variant: "outline" }))}>
              <Users /> Register volunteer
            </Link>
            <Link href="/dashboard/donations?new=1" className={cn(buttonVariants({ variant: "outline" }))}>
              <HandCoins /> Record donation
            </Link>
            <Link href="/dashboard/reports" className={cn(buttonVariants({ variant: "outline" }))}>
              <FileBarChart /> Generate report
            </Link>
          </>
        }
      />
      {organization.status === "suspended" ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">This organization is suspended. Records stay visible and edits are blocked.</p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value, hint]) => (
          <article
            key={label}
            className="rounded-xl border bg-card px-4 py-3"
            style={{ backgroundImage: "var(--card-wash)" }}
          >
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          </article>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Donations over time">
          <ChartFrame>
            <AreaChart data={donationSeries}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
              <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
              <Tooltip />
              <Area dataKey="amount" name="Completed ($)" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.15} />
            </AreaChart>
          </ChartFrame>
        </Panel>
        <Panel title="Families served by month">
          <ChartFrame>
            <BarChart data={familySeries}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
              <Tooltip />
              <Bar dataKey="households" fill="var(--chart-2)" radius={4} />
            </BarChart>
          </ChartFrame>
        </Panel>
        <Panel title="Program participation">
          <ChartFrame>
            <BarChart data={participation} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid stroke="var(--border)" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <Tooltip />
              <Bar dataKey="people" fill="var(--chart-3)" radius={4} />
            </BarChart>
          </ChartFrame>
        </Panel>
        <Panel title="Volunteer hours">
          <ChartFrame>
            <AreaChart data={hourSeries}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
              <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
              <Tooltip />
              <Area dataKey="hours" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.18} />
            </AreaChart>
          </ChartFrame>
        </Panel>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Donation sources">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sources} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72}>
                  {sources.map((entry, index) => (
                    <Cell key={entry.name} fill={`var(--chart-${index + 1})`} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatMoney(Number(value ?? 0), organization.currency)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Budget utilization" className="lg:col-span-2">
          <ul className="space-y-3">
            {programs.map((program) => {
              const spent = expenses.filter((expense) => expense.programId === program.id).reduce((sum, expense) => sum + expense.amountCents, 0);
              const pct = program.budgetCents === 0 ? 0 : Math.min(100, Math.round((spent / program.budgetCents) * 100));
              return (
                <li key={program.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <Link href={`/dashboard/programs/${program.id}`} className="font-medium hover:underline">
                      {program.name}
                    </Link>
                    <span className="text-muted-foreground">
                      {formatMoney(spent, organization.currency)} / {formatMoney(program.budgetCents, organization.currency)}
                    </span>
                  </div>
                  <Progress value={pct} />
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function ChartFrame({ children }: { children: React.ReactElement }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

function inBucket(iso: string, start: Date, end: Date) {
  const date = new Date(iso);
  return date >= start && date <= end;
}
