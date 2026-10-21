"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemberDialog } from "@/components/community/member-dialog";
import { DataTable, type GridColumn } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/feedback";
import { RequireAccess } from "@/components/shared/require-access";
import { StatusBadge } from "@/components/shared/status-badge";
import { useOrgRows, useSession } from "@/hooks/use-org";
import { memberProgramIds } from "@/lib/domain/metrics";
import { downloadText, formatDate, titleCase, toCsv } from "@/lib/format";
import { useDemoStore } from "@/stores/demo-store";
import type { CommunityMember } from "@/types/models";

export default function CommunityPage() {
  return (
    <Suspense>
      <CommunityDirectory />
    </Suspense>
  );
}

function CommunityDirectory() {
  const params = useSearchParams();
  const members = useOrgRows("members");
  const { db, allowed } = useSession();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [city, setCity] = useState("all");
  const [channel, setChannel] = useState("all");
  const [open, setOpen] = useState(params.get("new") === "1");
  const [editing, setEditing] = useState<CommunityMember | null>(null);
  const cities = [...new Set(members.map((member) => member.city))].sort();
  const filtered = useMemo(
    () =>
      members.filter((member) => {
        const haystack = `${member.firstName} ${member.lastName} ${member.email ?? ""} ${member.id}`.toLowerCase();
        if (search && !haystack.includes(search.toLowerCase())) return false;
        if (status !== "all" && member.status !== status) return false;
        if (city !== "all" && member.city !== city) return false;
        if (channel !== "all" && member.preferredChannel !== channel) return false;
        return true;
      }),
    [members, search, status, city, channel],
  );
  const columns: GridColumn[] = [
    {
      accessorKey: "lastName",
      header: "Member",
      cell: ({ row }) => (
        <div>
          <Link href={`/dashboard/community/${row.original.id}`} className="font-medium hover:underline">
            {row.original.firstName} {row.original.lastName}
          </Link>
          <p className="text-xs text-muted-foreground">{row.original.id}</p>
        </div>
      ),
    },
    { accessorKey: "city", header: "City", cell: ({ row }) => row.original.city },
    { id: "channel", header: "Channel", accessorFn: (row) => row.preferredChannel, cell: ({ row }) => titleCase(row.original.preferredChannel) },
    { id: "programs", header: "Programs", accessorFn: (row) => memberProgramIds(db, row.id).length, cell: ({ getValue }) => getValue<number>() },
    { id: "registered", header: "Registered", accessorFn: (row) => row.registeredAt, cell: ({ row }) => formatDate(row.original.registeredAt) },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge value={row.original.status} /> },
    {
      id: "actions",
      header: "",
      cell: ({ row }) =>
        allowed("community.manage") ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditing(row.original as CommunityMember);
              setOpen(true);
            }}
          >
            Edit
          </Button>
        ) : null,
    },
  ];

  return (
    <RequireAccess permission="community.view" entitlement="community" feature="Community">
      <div className="grid gap-5">
        <PageHeader
          title="Community"
          actions={
            allowed("community.manage") ? (
              <Button
                onClick={() => {
                  setEditing(null);
                  setOpen(true);
                }}
              >
                <Plus /> Add member
              </Button>
            ) : null
          }
        />
        <div className="flex flex-wrap gap-2">
          <Filter value={status} onChange={setStatus} label="Status" options={["all", "active", "inactive", "waitlist"]} />
          <Filter value={city} onChange={setCity} label="City" options={["all", ...cities]} />
          <Filter value={channel} onChange={setChannel} label="Channel" options={["all", "email", "sms", "whatsapp", "phone"]} />
        </div>
        <DataTable
          data={filtered}
          columns={columns}
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Search name, email, or member ID"
          emptyTitle="No members match"
          emptyBody="Adjust the filters or add a household member."
          toolbar={
            <Button
              variant="outline"
              onClick={() =>
                downloadText(
                  "community-members.csv",
                  toCsv(
                    filtered.map((member) => ({
                      id: member.id,
                      firstName: member.firstName,
                      lastName: member.lastName,
                      email: member.email,
                      phone: member.phone,
                      city: member.city,
                      status: member.status,
                      channel: member.preferredChannel,
                    })),
                  ),
                )
              }
            >
              <Download /> Export CSV
            </Button>
          }
        />
        <AssistanceQueue />
        <MemberDialog
          open={open}
          member={editing}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) setEditing(null);
          }}
        />
      </div>
    </RequireAccess>
  );
}

function AssistanceQueue() {
  const requests = useOrgRows("assistanceRequests");
  const setStatus = useDemoStore((state) => state.setAssistanceStatus);
  if (requests.length === 0) return null;
  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="text-sm font-medium">Assistance requests</h2>
      <p className="mt-1 text-sm text-muted-foreground">Portal submissions land here. They do not include sensitive case details.</p>
      <ul className="mt-3 divide-y">
        {requests.map((request) => (
          <li key={request.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">
                {request.requestType} · {request.neighborhood}
              </p>
              <p className="text-sm text-muted-foreground">
                {request.contactName} · {request.contactValue}
              </p>
            </div>
            <label className="text-xs text-muted-foreground">
              Status
              <select
                aria-label={`Status for ${request.contactName}`}
                className="ml-2 h-8 rounded-lg border bg-transparent px-2 text-sm"
                value={request.status}
                onChange={(event) => setStatus(request.id, event.target.value as typeof request.status)}
              >
                <option value="new">New</option>
                <option value="in_review">In review</option>
                <option value="scheduled">Scheduled</option>
                <option value="closed">Closed</option>
              </select>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Filter({ value, onChange, label, options }: { value: string; onChange: (value: string) => void; label: string; options: string[] }) {
  return (
    <label className="text-xs text-muted-foreground">
      {label}
      <select aria-label={label} className="ml-2 h-8 rounded-lg border bg-card px-2 text-sm text-foreground" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {titleCase(option)}
          </option>
        ))}
      </select>
    </label>
  );
}
