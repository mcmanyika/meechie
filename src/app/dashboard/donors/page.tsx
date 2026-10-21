"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DataTable, type GridColumn } from "@/components/shared/data-table";
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
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<Donor | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Donor | null>(null);

  const lifetimeByDonor = useMemo(() => {
    const map = new Map<string, number>();
    for (const donation of donations) {
      if (donation.status !== "completed") continue;
      map.set(donation.donorId, (map.get(donation.donorId) ?? 0) + donation.amountCents);
    }
    return map;
  }, [donations]);

  const filtered = useMemo(
    () =>
      donors.filter((donor) =>
        `${donor.name} ${donor.email} ${donor.phone} ${donor.city}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [donors, search],
  );

  const history = detail
    ? donations.filter((donation) => donation.donorId === detail.id)
    : [];
  const detailTotal = history
    .filter((donation) => donation.status === "completed")
    .reduce((sum, donation) => sum + donation.amountCents, 0);

  const columns: GridColumn[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <button
          type="button"
          className="font-medium text-left hover:underline"
          onClick={() => setDetail(row.original as Donor)}
        >
          {row.original.name}
        </button>
      ),
    },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "phone", header: "Phone" },
    { accessorKey: "city", header: "City" },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => titleCase(row.original.type),
    },
    {
      id: "lifetime",
      header: "Lifetime",
      accessorFn: (row) => lifetimeByDonor.get(row.id) ?? 0,
      cell: ({ row }) => formatMoney(lifetimeByDonor.get(row.original.id) ?? 0, organization?.currency),
    },
  ];

  return (
    <RequireAccess permission="donations.view" entitlement="donations" feature="Donors">
      <div className="grid gap-5">
        <PageHeader
          title="Donors"
          actions={
            allowed("donations.manage") ? (
              <Button
                onClick={() => {
                  setEditing(null);
                  setEditOpen(true);
                }}
              >
                <Plus /> Add donor
              </Button>
            ) : null
          }
        />
        <DataTable
          data={filtered}
          columns={columns}
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Search donors"
          emptyTitle="No donors"
          emptyBody="Add a donor to start the directory."
        />
        <Dialog open={Boolean(detail)} onOpenChange={(next) => !next && setDetail(null)}>
          <DialogContent className="sm:max-w-lg">
            {detail ? (
              <>
                <DialogHeader>
                  <DialogTitle>{detail.name}</DialogTitle>
                  <DialogDescription>
                    {detail.email} · {detail.phone} · {detail.city}
                  </DialogDescription>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                  {titleCase(detail.type)} · Lifetime completed {formatMoney(detailTotal, organization?.currency)}
                </p>
                <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
                  {history.length === 0 ? (
                    <li className="text-muted-foreground">No gifts recorded yet.</li>
                  ) : (
                    history.map((donation) => (
                      <li key={donation.id} className="flex justify-between gap-3">
                        <span>
                          {donation.date.slice(0, 10)} · {titleCase(donation.type)}
                        </span>
                        <span>
                          {formatMoney(donation.amountCents, organization?.currency)} · {donation.status}
                        </span>
                      </li>
                    ))
                  )}
                </ul>
                {allowed("donations.manage") ? (
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditing(detail);
                        setDetail(null);
                        setEditOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                  </DialogFooter>
                ) : null}
              </>
            ) : null}
          </DialogContent>
        </Dialog>
        <DonorDialog open={editOpen} onOpenChange={setEditOpen} donor={editing} />
      </div>
    </RequireAccess>
  );
}

function DonorDialog({ open, onOpenChange, donor }: { open: boolean; onOpenChange: (open: boolean) => void; donor?: Donor | null }) {
  const { orgId } = useSession();
  const saveDonor = useDemoStore((state) => state.saveDonor);
  const form = useForm<DonorFormValues>({
    resolver: zodResolver(donorSchema),
    values: {
      name: donor?.name ?? "",
      email: donor?.email ?? "",
      phone: donor?.phone ?? "",
      type: donor?.type ?? "individual",
      city: donor?.city ?? "Dallas",
    },
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{donor ? "Edit donor" : "Add donor"}</DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={form.handleSubmit((values) => {
            if (!orgId) return;
            const now = new Date().toISOString();
            const result = saveDonor(
              {
                id: donor?.id ?? createId("dnr"),
                organizationId: orgId,
                ...values,
                createdAt: donor?.createdAt ?? now,
                updatedAt: now,
              },
              donor ? "update" : "create",
            );
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success("Donor saved.");
            onOpenChange(false);
          })}
        >
          <Input aria-label="Name" placeholder="Name" {...form.register("name")} />
          <Input aria-label="Email" placeholder="Email" {...form.register("email")} />
          <Input aria-label="Phone" placeholder="Phone" {...form.register("phone")} />
          <Input aria-label="City" placeholder="City" {...form.register("city")} />
          <select aria-label="Type" className="h-8 rounded-lg border bg-transparent px-2 text-sm" {...form.register("type")}>
            <option value="individual">Individual</option>
            <option value="corporate">Corporate</option>
            <option value="foundation">Foundation</option>
          </select>
          <DialogFooter>
            <Button type="submit">Save donor</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
