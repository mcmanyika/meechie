"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { VolunteerDialog } from "@/components/volunteers/volunteer-dialog";
import { DataTable, type GridColumn } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/feedback";
import { RequireAccess } from "@/components/shared/require-access";
import { StatusBadge } from "@/components/shared/status-badge";
import { useOrgRows, useSession } from "@/hooks/use-org";
import { monthBuckets } from "@/lib/domain/metrics";
import { useDemoStore } from "@/stores/demo-store";
import type { Volunteer } from "@/types/models";

export default function VolunteersPage() {
  return (
    <Suspense>
      <VolunteerDirectory />
    </Suspense>
  );
}

function VolunteerDirectory() {
  const params = useSearchParams();
  const volunteers = useOrgRows("volunteers");
  const assignments = useOrgRows("assignments");
  const logs = useOrgRows("serviceLogs");
  const interests = useOrgRows("volunteerInterests");
  const { allowed } = useSession();
  const convertInterest = useDemoStore((state) => state.convertInterest);
  const [open, setOpen] = useState(params.get("new") === "1");
  const [editing, setEditing] = useState<Volunteer | null>(null);
  const [search, setSearch] = useState("");
  const filtered = volunteers.filter((volunteer) => `${volunteer.firstName} ${volunteer.lastName} ${volunteer.email}`.toLowerCase().includes(search.toLowerCase()));
  const hours = monthBuckets(new Date(), 6).map((month) => ({
    label: month.label,
    hours: logs.filter((log) => {
      const date = new Date(log.date);
      return date >= month.start && date <= month.end;
    }).reduce((sum, log) => sum + log.hours, 0),
  }));
  const columns: GridColumn[] = [
    {
      accessorKey: "lastName",
      header: "Volunteer",
      cell: ({ row }) => (
        <Link href={`/dashboard/volunteers/${row.original.id}`} className="font-medium hover:underline">
          {row.original.firstName} {row.original.lastName}
        </Link>
      ),
    },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "phone", header: "Phone" },
    { id: "skills", header: "Skills", accessorFn: (row) => row.skills.join(", "), cell: ({ row }) => row.original.skills.join(", ") },
    { id: "availability", header: "Availability", accessorFn: (row) => row.availability.join(", ") },
    {
      id: "events",
      header: "Events",
      accessorFn: (row) => assignments.filter((item) => item.volunteerId === row.id && item.status === "assigned").length,
    },
    {
      id: "hours",
      header: "Hours",
      accessorFn: (row) => logs.filter((log) => log.volunteerId === row.id).reduce((sum, log) => sum + log.hours, 0),
    },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge value={row.original.status} /> },
    {
      id: "edit",
      header: "",
      cell: ({ row }) =>
        allowed("volunteers.manage") ? (
          <Button variant="ghost" size="sm" onClick={() => { setEditing(row.original as Volunteer); setOpen(true); }}>
            Edit
          </Button>
        ) : null,
    },
  ];
  return (
    <RequireAccess permission="volunteers.view" entitlement="volunteers" feature="Volunteers">
      <div className="grid gap-5">
        <PageHeader
          title="Volunteers"
          description="Roster, assignments, and recorded hours. Safeguarding fields are staff notes in this demo."
          actions={allowed("volunteers.manage") ? <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus /> Register volunteer</Button> : null}
        />
        <div className="h-48 rounded-xl border bg-card p-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hours}>
              <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
              <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
              <Tooltip />
              <Bar dataKey="hours" fill="var(--chart-2)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <DataTable data={filtered} columns={columns} search={search} onSearch={setSearch} searchPlaceholder="Search volunteers" emptyTitle="No volunteers" emptyBody="Register a volunteer to build the roster." />
        <section className="rounded-xl border bg-card p-4">
          <h2 className="text-sm font-medium">Portal interest forms</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {interests.length === 0 ? <li className="text-muted-foreground">No new interest forms.</li> : null}
            {interests.map((interest) => (
              <li key={interest.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>{interest.name} · {interest.interests} · {interest.availability}</span>
                {interest.status === "new" && allowed("volunteers.manage") ? (
                  <Button size="sm" variant="outline" onClick={() => {
                    const result = convertInterest(interest.id);
                    if (!result.ok) toast.error(result.error);
                    else toast.success("Added as an applicant. Screening is not recorded.");
                  }}>Convert to applicant</Button>
                ) : <StatusBadge value={interest.status} />}
              </li>
            ))}
          </ul>
        </section>
        <VolunteerDialog open={open} onOpenChange={setOpen} volunteer={editing} />
      </div>
    </RequireAccess>
  );
}
