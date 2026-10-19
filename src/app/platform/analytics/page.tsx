"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/shared/feedback";
import { useSession } from "@/hooks/use-org";
import { formatMoney } from "@/lib/format";
import { hasPermission } from "@/lib/permissions";

export default function PlatformAnalyticsPage() {
  const { db, user } = useSession();
  if (!user || !hasPermission(user.role, "platform.manage")) return <p className="text-sm">Platform super admin demo required.</p>;
  const usage = db.organizations.map((org) => ({
    name: org.name.replace("The ", "").split(" ")[0],
    members: db.members.filter((member) => member.organizationId === org.id).length,
    events: db.events.filter((event) => event.organizationId === org.id).length,
  }));
  const revenue = db.subscriptions.map((subscription) => ({
    name: db.organizations.find((org) => org.id === subscription.organizationId)?.name.split(" ")[0] ?? "Org",
    mrr: (subscription.monthlyPriceCents ?? 0) / 100,
  }));
  return (
    <div className="grid gap-5">
      <PageHeader title="Platform analytics" description="Usage is counted from each tenant's records. Revenue is a preview of sample subscription prices." />
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="h-72 rounded-xl border bg-card p-4">
          <h2 className="mb-2 text-sm font-medium">Members by organization</h2>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={usage}><XAxis dataKey="name" stroke="var(--muted-foreground)" /><YAxis stroke="var(--muted-foreground)" /><Tooltip /><Bar dataKey="members" fill="var(--chart-1)" radius={4} /></BarChart>
          </ResponsiveContainer>
        </section>
        <section className="h-72 rounded-xl border bg-card p-4">
          <h2 className="mb-2 text-sm font-medium">Sample monthly revenue</h2>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={revenue}><XAxis dataKey="name" stroke="var(--muted-foreground)" /><YAxis stroke="var(--muted-foreground)" /><Tooltip formatter={(value) => formatMoney(Number(value ?? 0) * 100)} /><Bar dataKey="mrr" fill="var(--chart-2)" radius={4} /></BarChart>
          </ResponsiveContainer>
        </section>
      </div>
    </div>
  );
}
