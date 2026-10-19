"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/feedback";
import { StatusBadge } from "@/components/shared/status-badge";
import { useSession } from "@/hooks/use-org";
import { formatMoney } from "@/lib/format";
import { hasPermission } from "@/lib/permissions";
import { useDemoStore } from "@/stores/demo-store";

export default function SubscriptionsPage() {
  const { db, user } = useSession();
  const updatePlanPrice = useDemoStore((state) => state.updatePlanPrice);
  const [price, setPrice] = useState("149");
  if (!user || !hasPermission(user.role, "platform.manage")) return <p className="text-sm">Platform super admin demo required.</p>;
  return (
    <div className="grid gap-5">
      <PageHeader title="Subscriptions" description="Starter is $49, Growth is $149, and Enterprise is custom in the sample catalog. Editing a price only changes this browser." />
      <div className="grid gap-3 md:grid-cols-3">
        {db.plans.map((plan) => (
          <article key={plan.id} className="rounded-xl border bg-card p-4">
            <h2 className="font-medium">{plan.name}</h2>
            <p className="mt-1 text-2xl font-semibold">{plan.monthlyPriceCents == null ? "Custom" : formatMoney(plan.monthlyPriceCents)}</p>
            <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
            <p className="mt-2 text-xs text-muted-foreground">Seats: {plan.seatLimit ?? "Custom"}</p>
            <ul className="mt-3 space-y-1 text-sm">{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
          </article>
        ))}
      </div>
      <form className="flex flex-wrap items-end gap-2" onSubmit={(event) => {
        event.preventDefault();
        const cents = Math.round(Number(price) * 100);
        const result = updatePlanPrice("growth", Number.isFinite(cents) ? cents : null);
        if (!result.ok) toast.error(result.error); else toast.success("Sample Growth price updated.");
      }}>
        <label className="text-sm">Growth sample price (USD)
          <Input value={price} onChange={(event) => setPrice(event.target.value)} aria-label="Growth price" />
        </label>
        <Button type="submit">Update sample price</Button>
      </form>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-xs text-muted-foreground"><tr>{["Organization", "Plan", "Status", "Seats", "Renews"].map((heading) => <th key={heading} className="px-3 py-2">{heading}</th>)}</tr></thead>
          <tbody>
            {db.subscriptions.map((subscription) => {
              const org = db.organizations.find((item) => item.id === subscription.organizationId);
              return (
                <tr key={subscription.id} className="border-b last:border-0">
                  <td className="px-3 py-2">{org?.name}</td>
                  <td className="px-3 py-2">{subscription.planId}</td>
                  <td className="px-3 py-2"><StatusBadge value={subscription.status} /></td>
                  <td className="px-3 py-2">{subscription.seatLimit ?? "Custom"}</td>
                  <td className="px-3 py-2">{subscription.renewsAt}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
