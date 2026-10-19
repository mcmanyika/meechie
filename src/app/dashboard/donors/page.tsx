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
import { useOrgRows, useSession } from "@/hooks/use-org";
import { formatMoney, titleCase } from "@/lib/format";
import { createId } from "@/lib/ids";
import { donorSchema, type DonorFormValues } from "@/lib/validations/schemas";
import { useDemoStore } from "@/stores/demo-store";
import type { Donor } from "@/types/models";

export default function DonorsPage() {
  const donors = useOrgRows("donors");
  const donations = useOrgRows("donations");
  const { organization, allowed } = useSession();
  const [selected, setSelected] = useState<string | null>(donors[0]?.id ?? null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Donor | null>(null);
  const donor = donors.find((item) => item.id === selected) ?? donors[0];
  const history = donations.filter((donation) => donation.donorId === donor?.id);
  const total = history.filter((donation) => donation.status === "completed").reduce((sum, donation) => sum + donation.amountCents, 0);
  return (
    <RequireAccess permission="donations.view" entitlement="donations" feature="Donors">
      <div className="grid gap-5">
        <PageHeader title="Donors" description="Profiles and gift history for the selected organization." actions={allowed("donations.manage") ? <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus /> Add donor</Button> : null} />
        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <ul className="rounded-xl border bg-card">
            {donors.map((item) => (
              <li key={item.id}>
                <button type="button" className={`w-full px-3 py-2 text-left text-sm hover:bg-muted ${donor?.id === item.id ? "bg-muted" : ""}`} onClick={() => setSelected(item.id)}>
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
          {donor ? (
            <section className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-medium">{donor.name}</h2>
                  <p className="text-sm text-muted-foreground">{donor.email} · {donor.phone} · {donor.city}</p>
                  <p className="text-sm text-muted-foreground">{titleCase(donor.type)} · Lifetime completed {formatMoney(total, organization?.currency)}</p>
                </div>
                {allowed("donations.manage") ? <Button variant="outline" onClick={() => { setEditing(donor); setOpen(true); }}>Edit</Button> : null}
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {history.map((donation) => (
                  <li key={donation.id} className="flex justify-between">
                    <span>{donation.date.slice(0, 10)} · {titleCase(donation.type)}</span>
                    <span>{formatMoney(donation.amountCents, organization?.currency)} · {donation.status}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : <p className="text-sm text-muted-foreground">No donors yet.</p>}
        </div>
        <DonorDialog open={open} onOpenChange={setOpen} donor={editing} />
      </div>
    </RequireAccess>
  );
}

function DonorDialog({ open, onOpenChange, donor }: { open: boolean; onOpenChange: (open: boolean) => void; donor?: Donor | null }) {
  const { orgId } = useSession();
  const saveDonor = useDemoStore((state) => state.saveDonor);
  const form = useForm<DonorFormValues>({
    resolver: zodResolver(donorSchema),
    values: { name: donor?.name ?? "", email: donor?.email ?? "", phone: donor?.phone ?? "", type: donor?.type ?? "individual", city: donor?.city ?? "Dallas" },
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{donor ? "Edit donor" : "Add donor"}</DialogTitle></DialogHeader>
        <form className="grid gap-3" onSubmit={form.handleSubmit((values) => {
          if (!orgId) return;
          const now = new Date().toISOString();
          const result = saveDonor({ id: donor?.id ?? createId("dnr"), organizationId: orgId, ...values, createdAt: donor?.createdAt ?? now, updatedAt: now }, donor ? "update" : "create");
          if (!result.ok) { toast.error(result.error); return; }
          toast.success("Donor saved.");
          onOpenChange(false);
        })}>
          <Input aria-label="Name" placeholder="Name" {...form.register("name")} />
          <Input aria-label="Email" placeholder="Email" {...form.register("email")} />
          <Input aria-label="Phone" placeholder="Phone" {...form.register("phone")} />
          <Input aria-label="City" placeholder="City" {...form.register("city")} />
          <select aria-label="Type" className="h-8 rounded-lg border bg-transparent px-2 text-sm" {...form.register("type")}>
            <option value="individual">Individual</option>
            <option value="corporate">Corporate</option>
            <option value="foundation">Foundation</option>
          </select>
          <DialogFooter><Button type="submit">Save donor</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
