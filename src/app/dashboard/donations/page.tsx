"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Download, Plus } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/feedback";
import { RequireAccess } from "@/components/shared/require-access";
import { StatusBadge } from "@/components/shared/status-badge";
import { useOrgRows, useSession } from "@/hooks/use-org";
import { downloadText, formatDate, formatMoney, titleCase, toCsv } from "@/lib/format";
import { donationSchema, type DonationFormValues } from "@/lib/validations/schemas";
import { useDemoStore } from "@/stores/demo-store";
import type { Donation } from "@/types/models";

export default function DonationsPage() {
  return <Suspense><DonationLedger /></Suspense>;
}

function DonationLedger() {
  const params = useSearchParams();
  const donations = useOrgRows("donations");
  const donors = useOrgRows("donors");
  const programs = useOrgRows("programs");
  const { organization, allowed } = useSession();
  const [open, setOpen] = useState(params.get("new") === "1");
  const [editing, setEditing] = useState<Donation | null>(null);
  const [receipt, setReceipt] = useState<Donation | null>(null);
  const [programId, setProgramId] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const filtered = useMemo(() => donations.filter((donation) => {
    if (programId !== "all" && donation.programId !== programId) return false;
    if (from && donation.date.slice(0, 10) < from) return false;
    if (to && donation.date.slice(0, 10) > to) return false;
    return true;
  }), [donations, programId, from, to]);
  const completed = filtered.filter((donation) => donation.status === "completed").reduce((sum, donation) => sum + donation.amountCents, 0);
  const sources = ["one_time", "recurring", "corporate", "in_kind"].map((type, index) => ({
    name: titleCase(type),
    value: filtered.filter((donation) => donation.type === type && donation.status === "completed").reduce((sum, donation) => sum + donation.amountCents, 0),
    fill: `var(--chart-${index + 1})`,
  }));
  return (
    <RequireAccess permission="donations.view" entitlement="donations" feature="Donations">
      <div className="grid gap-5">
        <PageHeader
          title="Donations"
          description="Simulated gifts only. Completed amounts update fundraising metrics. No card numbers are collected."
          actions={allowed("donations.manage") ? <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus /> Record donation</Button> : null}
        />
        <div className="grid gap-3 lg:grid-cols-[220px_1fr]">
          <article className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">Completed in view</p>
            <p className="mt-2 text-2xl font-semibold">{formatMoney(completed, organization?.currency)}</p>
          </article>
          <div className="h-40 rounded-xl border bg-card p-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sources} dataKey="value" nameKey="name" innerRadius={36} outerRadius={58}>
                  {sources.map((source) => <Cell key={source.name} fill={source.fill} />)}
                </Pie>
                <Tooltip formatter={(value) => formatMoney(Number(value ?? 0), organization?.currency)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <select aria-label="Program" className="h-8 rounded-lg border bg-card px-2" value={programId} onChange={(event) => setProgramId(event.target.value)}>
            <option value="all">All programs</option>
            {programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}
          </select>
          <Input type="date" aria-label="From" value={from} onChange={(event) => setFrom(event.target.value)} className="max-w-40" />
          <Input type="date" aria-label="To" value={to} onChange={(event) => setTo(event.target.value)} className="max-w-40" />
          <Button variant="outline" onClick={() => downloadText("donations.csv", toCsv(filtered.map((donation) => ({
            id: donation.id,
            donor: donors.find((donor) => donor.id === donation.donorId)?.name,
            amount: (donation.amountCents / 100).toFixed(2),
            date: donation.date.slice(0, 10),
            type: donation.type,
            status: donation.status,
            reference: donation.reference,
          }))))}><Download /> Export</Button>
        </div>
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs text-muted-foreground">
              <tr>
                {["Donation", "Donor", "Amount", "Date", "Type", "Program", "Method", "Status", ""].map((heading) => <th key={heading} className="px-3 py-2 font-medium">{heading}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map((donation) => (
                <tr key={donation.id} className="border-b last:border-0">
                  <td className="px-3 py-2">{donation.id}</td>
                  <td className="px-3 py-2">{donors.find((donor) => donor.id === donation.donorId)?.name}</td>
                  <td className="px-3 py-2">{formatMoney(donation.amountCents, organization?.currency)}</td>
                  <td className="px-3 py-2">{formatDate(donation.date)}</td>
                  <td className="px-3 py-2">{titleCase(donation.type)}</td>
                  <td className="px-3 py-2">{programs.find((program) => program.id === donation.programId)?.name ?? "Unrestricted"}</td>
                  <td className="px-3 py-2">{titleCase(donation.method)}</td>
                  <td className="px-3 py-2"><StatusBadge value={donation.status} /></td>
                  <td className="px-3 py-2">
                    <Button variant="ghost" size="sm" onClick={() => setReceipt(donation)}>Receipt</Button>
                    {allowed("donations.manage") ? <Button variant="ghost" size="sm" onClick={() => { setEditing(donation); setOpen(true); }}>Edit</Button> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <DonationDialog open={open} onOpenChange={setOpen} donation={editing} />
        <Dialog open={Boolean(receipt)} onOpenChange={(next) => !next && setReceipt(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sample receipt</DialogTitle>
              <DialogDescription>Preview only. This is not a tax receipt and no payment was processed.</DialogDescription>
            </DialogHeader>
            {receipt ? (
              <div className="text-sm">
                <p>{organization?.name}</p>
                <p className="mt-2">{donors.find((donor) => donor.id === receipt.donorId)?.name}</p>
                <p>{formatMoney(receipt.amountCents, organization?.currency)} · {formatDate(receipt.date)}</p>
                <p className="text-muted-foreground">Reference {receipt.reference}</p>
              </div>
            ) : null}
            <DialogFooter><Button variant="outline" onClick={() => window.print()}>Print preview</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RequireAccess>
  );
}

function DonationDialog({ open, onOpenChange, donation }: { open: boolean; onOpenChange: (open: boolean) => void; donation?: Donation | null }) {
  const donors = useOrgRows("donors");
  const programs = useOrgRows("programs");
  const { orgId } = useSession();
  const saveDonation = useDemoStore((state) => state.saveDonation);
  const form = useForm<DonationFormValues>({
    resolver: zodResolver(donationSchema),
    values: {
      donorId: donation?.donorId ?? donors[0]?.id ?? "",
      amount: donation ? donation.amountCents / 100 : 50,
      date: donation?.date.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      type: donation?.type ?? "one_time",
      programId: donation?.programId ?? "",
      method: donation?.method ?? "card_sim",
      reference: donation?.reference ?? "",
      status: donation?.status ?? "completed",
      inKindDescription: donation?.inKindDescription ?? "",
    },
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{donation ? "Edit donation" : "Record donation"}</DialogTitle>
          <DialogDescription>Choose simulated card, ACH, check, cash, or in-kind. Do not enter a real card number.</DialogDescription>
        </DialogHeader>
        <form className="grid gap-3" onSubmit={form.handleSubmit((values) => {
          if (!orgId) return;
          const now = new Date().toISOString();
          const result = saveDonation({
            id: donation?.id ?? "",
            organizationId: orgId,
            donorId: values.donorId,
            amountCents: Math.round(values.amount * 100),
            date: new Date(values.date).toISOString(),
            type: values.type,
            programId: values.programId || null,
            method: values.method,
            reference: values.reference || `SIM-${Date.now()}`,
            status: values.status,
            inKindDescription: values.type === "in_kind" ? values.inKindDescription || "Estimated in-kind value" : null,
            sponsorId: donation?.sponsorId ?? null,
            createdAt: donation?.createdAt ?? now,
            updatedAt: now,
          }, donation ? "update" : "create");
          if (!result.ok) { toast.error(result.error); return; }
          toast.success("Donation saved.");
          onOpenChange(false);
        })}>
          <select aria-label="Donor" className="h-8 rounded-lg border bg-transparent px-2 text-sm" {...form.register("donorId")}>
            {donors.map((donor) => <option key={donor.id} value={donor.id}>{donor.name}</option>)}
          </select>
          <Input type="number" step="0.01" aria-label="Amount" {...form.register("amount", { valueAsNumber: true })} />
          <Input type="date" aria-label="Date" {...form.register("date")} />
          <div className="grid gap-2 sm:grid-cols-2">
            <select aria-label="Type" className="h-8 rounded-lg border bg-transparent px-2 text-sm" {...form.register("type")}>
              {["one_time", "recurring", "corporate", "in_kind"].map((type) => <option key={type} value={type}>{titleCase(type)}</option>)}
            </select>
            <select aria-label="Status" className="h-8 rounded-lg border bg-transparent px-2 text-sm" {...form.register("status")}>
              {["pending", "completed", "refunded"].map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
          <select aria-label="Program" className="h-8 rounded-lg border bg-transparent px-2 text-sm" {...form.register("programId")}>
            <option value="">Unrestricted</option>
            {programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}
          </select>
          <select aria-label="Method" className="h-8 rounded-lg border bg-transparent px-2 text-sm" {...form.register("method")}>
            <option value="card_sim">Simulated card</option>
            <option value="ach_sim">Simulated ACH</option>
            <option value="check">Check</option>
            <option value="cash">Cash</option>
            <option value="in_kind">In-kind</option>
          </select>
          <Input placeholder="Reference" aria-label="Reference" {...form.register("reference")} />
          <DialogFooter><Button type="submit">Save donation</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
