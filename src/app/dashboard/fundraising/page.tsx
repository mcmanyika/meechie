"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Building2, ExternalLink, HandCoins, HeartHandshake, Plus } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmbedButtonsPanel } from "@/components/donations/embed-buttons";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/shared/feedback";
import { Panel } from "@/components/shared/panel";
import { RequireAccess } from "@/components/shared/require-access";
import { StatusBadge } from "@/components/shared/status-badge";
import { useOrgRows, useSession } from "@/hooks/use-org";
import { monthBuckets } from "@/lib/domain/metrics";
import { formatDate, formatMoney, formatNumber, titleCase } from "@/lib/format";
import { cn } from "cn";

export default function FundraisingPage() {
  const { organization, allowed, plan } = useSession();
  const donations = useOrgRows("donations");
  const donors = useOrgRows("donors");
  const sponsors = useOrgRows("sponsors");
  const programs = useOrgRows("programs");

  const completed = useMemo(
    () => donations.filter((donation) => donation.status === "completed"),
    [donations],
  );
  const pending = useMemo(
    () => donations.filter((donation) => donation.status === "pending"),
    [donations],
  );
  const raisedCents = completed.reduce((sum, donation) => sum + donation.amountCents, 0);
  const pendingCents = pending.reduce((sum, donation) => sum + donation.amountCents, 0);
  const sponsorCents = sponsors.reduce((sum, sponsor) => sum + sponsor.contributionCents, 0);

  const months = monthBuckets(new Date(), 6);
  const donationSeries = months.map((month) => ({
    label: month.label,
    amount:
      completed
        .filter((donation) => {
          const date = new Date(donation.date);
          return date >= month.start && date <= month.end;
        })
        .reduce((sum, donation) => sum + donation.amountCents, 0) / 100,
  }));

  const byProgram = useMemo(() => {
    const rows = new Map<string, number>();
    for (const donation of completed) {
      const key = donation.programId ?? "unrestricted";
      rows.set(key, (rows.get(key) ?? 0) + donation.amountCents);
    }
    return [...rows.entries()]
      .map(([key, cents]) => ({
        key,
        label: key === "unrestricted" ? "Unrestricted" : programs.find((program) => program.id === key)?.name ?? "Program",
        cents,
      }))
      .sort((a, b) => b.cents - a.cents);
  }, [completed, programs]);

  const recent = useMemo(
    () =>
      [...donations].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8),
    [donations],
  );

  const giveHref = organization ? `/give/${organization.slug}` : "/give/meechie";
  const canManage = allowed("donations.manage");
  const canSponsors = Boolean(plan?.entitlements.includes("sponsors")) && allowed("sponsors.view");

  const cards = [
    { label: "Raised", value: formatMoney(raisedCents, organization?.currency), hint: `${formatNumber(completed.length)} completed gifts` },
    { label: "Pending", value: formatMoney(pendingCents, organization?.currency), hint: `${formatNumber(pending.length)} awaiting settlement` },
    { label: "Donors", value: formatNumber(donors.length), hint: "People and organizations on file" },
    { label: "Sponsors", value: formatMoney(sponsorCents, organization?.currency), hint: `${formatNumber(sponsors.length)} partner pledges` },
  ];

  return (
    <RequireAccess permission="donations.view" entitlement="donations" feature="Fundraising">
      <div className="grid gap-6">
        <PageHeader
          title="Fundraising"
          description="Track gifts, donors, sponsors, and the public give page for The Meechie Project."
          actions={
            <>
              {canManage ? (
                <Link href="/dashboard/donations?new=1" className={cn(buttonVariants())}>
                  <Plus /> Record donation
                </Link>
              ) : null}
              <Link href={giveHref} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "outline" }))}>
                <ExternalLink /> Public give page
              </Link>
            </>
          }
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <article
              key={card.label}
              className="rounded-xl border bg-card px-4 py-3"
              style={{ backgroundImage: "var(--card-wash)" }}
            >
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">{card.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
            </article>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Link href="/dashboard/donations" className="rounded-xl border bg-card p-4 transition-colors hover:bg-muted/40">
            <HandCoins className="size-4 text-primary" />
            <p className="mt-3 font-medium">Donations</p>
            <p className="mt-1 text-sm text-muted-foreground">Ledger, receipts, and gift filters</p>
          </Link>
          <Link href="/dashboard/donors" className="rounded-xl border bg-card p-4 transition-colors hover:bg-muted/40">
            <HeartHandshake className="size-4 text-primary" />
            <p className="mt-3 font-medium">Donors</p>
            <p className="mt-1 text-sm text-muted-foreground">People and lifetime giving</p>
          </Link>
          {canSponsors ? (
            <Link href="/dashboard/sponsors" className="rounded-xl border bg-card p-4 transition-colors hover:bg-muted/40">
              <Building2 className="size-4 text-primary" />
              <p className="mt-3 font-medium">Sponsors</p>
              <p className="mt-1 text-sm text-muted-foreground">Corporate partners and tiers</p>
            </Link>
          ) : (
            <div className="rounded-xl border border-dashed bg-card p-4 opacity-70">
              <Building2 className="size-4 text-muted-foreground" />
              <p className="mt-3 font-medium">Sponsors</p>
              <p className="mt-1 text-sm text-muted-foreground">Not available on this plan</p>
            </div>
          )}
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Panel title="Gifts over time">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={donationSeries}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <Tooltip formatter={(value) => formatMoney(Number(value ?? 0) * 100, organization?.currency)} />
                  <Area dataKey="amount" name="Completed ($)" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title="By program">
            {byProgram.length === 0 ? (
              <p className="text-sm text-muted-foreground">Completed gifts will group here by program.</p>
            ) : (
              <ul className="space-y-3">
                {byProgram.map((row) => {
                  const share = raisedCents > 0 ? Math.round((row.cents / raisedCents) * 100) : 0;
                  return (
                    <li key={row.key}>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="truncate font-medium">{row.label}</span>
                        <span className="shrink-0 text-muted-foreground">{formatMoney(row.cents, organization?.currency)}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${share}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>

        <Panel
          title="Recent gifts"
          action={
            <Link href="/dashboard/donations" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
              View all
            </Link>
          }
        >
          {recent.length === 0 ? (
            <EmptyState
              title="No gifts yet"
              body="Record a donation or share the public give page to start the fundraising ledger."
              action={
                canManage ? (
                  <Link href="/dashboard/donations?new=1" className={cn(buttonVariants())}>
                    <Plus /> Record donation
                  </Link>
                ) : null
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-xs text-muted-foreground">
                  <tr>
                    {["Donor", "Amount", "Date", "Type", "Status"].map((heading) => (
                      <th key={heading} className="px-2 py-2 font-medium">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.map((donation) => (
                    <tr key={donation.id} className="border-b last:border-0">
                      <td className="px-2 py-2">{donors.find((donor) => donor.id === donation.donorId)?.name ?? "Donor"}</td>
                      <td className="px-2 py-2">{formatMoney(donation.amountCents, organization?.currency)}</td>
                      <td className="px-2 py-2">{formatDate(donation.date)}</td>
                      <td className="px-2 py-2">{titleCase(donation.type)}</td>
                      <td className="px-2 py-2">
                        <StatusBadge value={donation.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <EmbedButtonsPanel />
      </div>
    </RequireAccess>
  );
}
