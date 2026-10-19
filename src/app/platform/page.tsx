"use client";

import Link from "next/link";
import { PLATFORM_ADMIN_USER_ID } from "@/config/constants";
import { PageHeader } from "@/components/shared/feedback";
import { useSession } from "@/hooks/use-org";
import { formatMoney } from "@/lib/format";
import { hasPermission } from "@/lib/permissions";
import { useDemoStore } from "@/stores/demo-store";

export default function PlatformHomePage() {
  const { db, user } = useSession();
  const setUser = useDemoStore((state) => state.setUser);
  if (!user || !hasPermission(user.role, "platform.manage")) {
    return (
      <div className="max-w-lg py-10">
        <h1 className="text-2xl font-semibold">Platform administration</h1>
        <p className="mt-2 text-sm text-muted-foreground">This area is for the software owner demo, separate from an organization administrator.</p>
        <button type="button" className="mt-4 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground" onClick={() => setUser(PLATFORM_ADMIN_USER_ID)}>
          View as Avery Quinn
        </button>
      </div>
    );
  }
  const mrr = db.subscriptions.filter((item) => item.status === "active" || item.status === "trialing").reduce((sum, item) => sum + (item.monthlyPriceCents ?? 0), 0);
  const custom = db.subscriptions.filter((item) => item.monthlyPriceCents == null).length;
  return (
    <div className="grid gap-5">
      <PageHeader title="Platform" description="Sample commercial operations for MeechieOS. Prices are not billing commitments." />
      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">Organizations</p><p className="text-2xl font-semibold">{db.organizations.length}</p></article>
        <article className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">Listed MRR</p><p className="text-2xl font-semibold">{formatMoney(mrr)}</p><p className="text-xs text-muted-foreground">{custom} custom contract excluded</p></article>
        <article className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">Active subscriptions</p><p className="text-2xl font-semibold">{db.subscriptions.filter((item) => item.status === "active").length}</p></article>
      </div>
      <div className="flex gap-3 text-sm">
        <Link href="/platform/organizations" className="underline">Organizations</Link>
        <Link href="/platform/subscriptions" className="underline">Subscriptions</Link>
        <Link href="/platform/analytics" className="underline">Analytics</Link>
      </div>
    </div>
  );
}
