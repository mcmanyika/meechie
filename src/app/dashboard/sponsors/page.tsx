"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/feedback";
import { RequireAccess } from "@/components/shared/require-access";
import { StatusBadge } from "@/components/shared/status-badge";
import { useOrgRows, useSession } from "@/hooks/use-org";
import { computeImpact } from "@/lib/domain/metrics";
import { formatMoney, titleCase } from "@/lib/format";
import { createId } from "@/lib/ids";
import { sponsorSchema, type SponsorFormValues } from "@/lib/validations/schemas";
import { useDemoStore } from "@/stores/demo-store";
import type { Sponsor } from "@/types/models";

const tiers = [
  ["community", "Community Partner"],
  ["supporting", "Supporting Partner"],
  ["impact", "Impact Partner"],
  ["strategic", "Strategic Partner"],
] as const;

export default function SponsorsPage() {
  const sponsors = useOrgRows("sponsors");
  const programs = useOrgRows("programs");
  const events = useOrgRows("events");
  const donations = useOrgRows("donations");
  const { organization, db, orgId, allowed } = useSession();
  const [selected, setSelected] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Sponsor | null>(null);
  const [report, setReport] = useState(false);
  const sponsor = sponsors.find((item) => item.id === selected) ?? sponsors[0];
  const supportedEvents = events.filter((event) => sponsor && event.programId && sponsor.programIds.includes(event.programId));
  const gifts = donations.filter((donation) => donation.sponsorId === sponsor?.id && donation.status === "completed");
  const metrics = orgId ? computeImpact(db, { organizationId: orgId, start: new Date("2025-01-01"), end: new Date("2027-12-31"), programId: sponsor?.programIds[0] }) : null;
  return (
    <RequireAccess permission="sponsors.view" entitlement="sponsors" feature="Sponsors">
      <div className="grid gap-5">
        <PageHeader title="Sponsors" description="Sample partnership records. Contribution amounts are fictional." actions={allowed("sponsors.manage") ? <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus /> Add sponsor</Button> : null} />
        <div className="grid gap-3">
          {sponsors.map((item) => (
            <article key={item.id} className="rounded-xl border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <button type="button" className="text-left" onClick={() => setSelected(item.id)}>
                  <h2 className="font-medium">{item.companyName}</h2>
                  <p className="text-sm text-muted-foreground">{item.contactName} · {item.email} · {item.phone}</p>
                </button>
                <StatusBadge value={item.status} />
              </div>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-4">
                <div><dt className="text-xs text-muted-foreground">Tier</dt><dd>{tiers.find((tier) => tier[0] === item.tier)?.[1]}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Contribution</dt><dd>{formatMoney(item.contributionCents, organization?.currency)}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Renews</dt><dd>{item.renewalDate}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Programs</dt><dd>{item.programIds.map((id) => programs.find((program) => program.id === id)?.name).join(", ")}</dd></div>
              </dl>
              {allowed("sponsors.manage") ? <Button className="mt-3" variant="outline" size="sm" onClick={() => { setEditing(item); setOpen(true); }}>Edit</Button> : null}
            </article>
          ))}
        </div>
        {sponsor ? (
          <section className="rounded-xl border bg-card p-4">
            <h2 className="font-medium">{sponsor.companyName} history</h2>
            <p className="mt-1 text-sm text-muted-foreground">{gifts.length} corporate gift records · {supportedEvents.length} events in supported programs</p>
            <ul className="mt-3 space-y-1 text-sm">{supportedEvents.slice(0, 6).map((event) => <li key={event.id}>{event.name} · {titleCase(event.status)}</li>)}</ul>
            <Button className="mt-3" variant="outline" onClick={() => setReport(true)}>Sponsor impact summary</Button>
          </section>
        ) : null}
        <Dialog open={report} onOpenChange={setReport}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Sponsor report preview</DialogTitle></DialogHeader>
            <div className="text-sm">
              <p className="font-medium">{organization?.name}</p>
              <p className="text-muted-foreground">Prepared for {sponsor?.companyName}. Sample data only.</p>
              <p className="mt-3">Households served in the linked program: {metrics?.householdsServed ?? 0}</p>
              <p>Individuals served: {metrics?.individualsServed ?? 0}</p>
              <p>Volunteer hours in range: {metrics?.volunteerHours ?? 0}</p>
              <p className="mt-2 text-muted-foreground">These figures come from attendance and service logs. They are not audited outcomes.</p>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => window.print()}>Print preview</Button></DialogFooter>
          </DialogContent>
        </Dialog>
        <SponsorDialog open={open} onOpenChange={setOpen} sponsor={editing} />
      </div>
    </RequireAccess>
  );
}

function SponsorDialog({ open, onOpenChange, sponsor }: { open: boolean; onOpenChange: (open: boolean) => void; sponsor?: Sponsor | null }) {
  const programs = useOrgRows("programs");
  const { orgId } = useSession();
  const saveSponsor = useDemoStore((state) => state.saveSponsor);
  const form = useForm<SponsorFormValues>({
    resolver: zodResolver(sponsorSchema),
    values: {
      companyName: sponsor?.companyName ?? "",
      contactName: sponsor?.contactName ?? "",
      email: sponsor?.email ?? "",
      phone: sponsor?.phone ?? "",
      tier: sponsor?.tier ?? "community",
      contribution: sponsor ? sponsor.contributionCents / 100 : 2500,
      programIds: sponsor?.programIds ?? (programs[0] ? [programs[0].id] : []),
      startDate: sponsor?.startDate ?? new Date().toISOString().slice(0, 10),
      renewalDate: sponsor?.renewalDate ?? new Date().toISOString().slice(0, 10),
      status: sponsor?.status ?? "pending",
    },
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{sponsor ? "Edit sponsor" : "Add sponsor"}</DialogTitle></DialogHeader>
        <form className="grid gap-3" onSubmit={form.handleSubmit((values) => {
          if (!orgId) return;
          const now = new Date().toISOString();
          const result = saveSponsor({
            id: sponsor?.id ?? createId("spo"),
            organizationId: orgId,
            companyName: values.companyName,
            contactName: values.contactName,
            email: values.email,
            phone: values.phone,
            tier: values.tier,
            contributionCents: Math.round(values.contribution * 100),
            programIds: values.programIds,
            startDate: values.startDate,
            renewalDate: values.renewalDate,
            status: values.status,
            createdAt: sponsor?.createdAt ?? now,
            updatedAt: now,
          }, sponsor ? "update" : "create");
          if (!result.ok) { toast.error(result.error); return; }
          toast.success("Sponsor saved.");
          onOpenChange(false);
        })}>
          <Input aria-label="Company" placeholder="Company" {...form.register("companyName")} />
          <Input aria-label="Contact" placeholder="Contact" {...form.register("contactName")} />
          <Input aria-label="Email" {...form.register("email")} />
          <Input aria-label="Phone" {...form.register("phone")} />
          <Input type="number" aria-label="Contribution" {...form.register("contribution", { valueAsNumber: true })} />
          <select aria-label="Tier" className="h-8 rounded-lg border bg-transparent px-2 text-sm" {...form.register("tier")}>
            {tiers.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select aria-label="Program" className="h-8 rounded-lg border bg-transparent px-2 text-sm" value={form.watch("programIds")[0] ?? ""} onChange={(event) => form.setValue("programIds", [event.target.value])}>
            {programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}
          </select>
          <Input type="date" aria-label="Start" {...form.register("startDate")} />
          <Input type="date" aria-label="Renewal" {...form.register("renewalDate")} />
          <select aria-label="Status" className="h-8 rounded-lg border bg-transparent px-2 text-sm" {...form.register("status")}>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="expired">Expired</option>
          </select>
          <DialogFooter><Button type="submit">Save sponsor</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
