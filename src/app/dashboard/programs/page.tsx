"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProgramDialog } from "@/components/programs/program-dialog";
import { EmptyState, PageHeader } from "@/components/shared/feedback";
import { RequireAccess } from "@/components/shared/require-access";
import { StatusBadge } from "@/components/shared/status-badge";
import { useOrgRows, useSession } from "@/hooks/use-org";
import { formatMoney, titleCase } from "@/lib/format";
import { cn } from "cn";
import type { Program, ProgramStatus } from "@/types/models";

const STATUSES: Array<"all" | ProgramStatus> = ["all", "draft", "planned", "active", "completed", "archived"];

type SortKey = "name" | "budget" | "dates" | "coordinator" | "status";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Program" },
  { key: "budget", label: "Budget" },
  { key: "dates", label: "Dates" },
  { key: "coordinator", label: "Coordinator" },
  { key: "status", label: "Status" },
];

export default function ProgramsPage() {
  const router = useRouter();
  const programs = useOrgRows("programs");
  const { organization, allowed, db } = useSession();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Program | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | ProgramStatus>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const coordinatorName = (userId: string) => db.users.find((user) => user.id === userId)?.name ?? "Assigned staff";

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const rows = programs.filter((program) => {
      if (status !== "all" && program.status !== status) return false;
      if (!needle) return true;
      const haystack = `${program.name} ${program.description} ${program.objectives.join(" ")}`.toLowerCase();
      return haystack.includes(needle);
    });
    const direction = sortDir === "asc" ? 1 : -1;
    return rows.slice().sort((a, b) => {
      const compare =
        sortKey === "name"
          ? a.name.localeCompare(b.name)
          : sortKey === "budget"
            ? a.budgetCents - b.budgetCents
            : sortKey === "dates"
              ? a.startDate.localeCompare(b.startDate) || a.endDate.localeCompare(b.endDate)
              : sortKey === "coordinator"
                ? coordinatorName(a.coordinatorUserId).localeCompare(coordinatorName(b.coordinatorUserId))
                : a.status.localeCompare(b.status);
      return compare * direction;
    });
  }, [programs, search, status, sortKey, sortDir, db.users]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  };

  return (
    <RequireAccess permission="programs.view" entitlement="programs" feature="Programs">
      <div className="grid gap-5">
        <PageHeader
          title="Programs"
          actions={
            allowed("programs.manage") ? (
              <Button
                onClick={() => {
                  setEditing(null);
                  setOpen(true);
                }}
              >
                <Plus /> Create program
              </Button>
            ) : null
          }
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search programs by name or description"
            aria-label="Search programs"
            className="sm:max-w-sm"
          />
          <label className="text-xs text-muted-foreground">
            Status
            <select
              aria-label="Program status"
              className="ml-2 h-9 rounded-lg border bg-card px-2 text-sm text-foreground"
              value={status}
              onChange={(event) => setStatus(event.target.value as "all" | ProgramStatus)}
            >
              {STATUSES.map((option) => (
                <option key={option} value={option}>
                  {titleCase(option)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No programs match"
            body={programs.length === 0 ? "Create a program to get started." : "Adjust the search or status filter."}
          />
        ) : (
          <div className="grid gap-2">
            <p className="text-xs text-muted-foreground">
              Showing {filtered.length} of {programs.length} programs
            </p>
            <div className="overflow-x-auto rounded-xl border bg-card">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-xs text-muted-foreground">
                  <tr>
                    {COLUMNS.map((column) => {
                      const active = sortKey === column.key;
                      const Icon = !active ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
                      return (
                        <th key={column.key} className="px-3 py-2 font-medium">
                          <button
                            type="button"
                            className={cn(
                              "inline-flex items-center gap-1 rounded-md hover:text-foreground",
                              active && "text-foreground",
                            )}
                            onClick={() => toggleSort(column.key)}
                            aria-label={`Sort by ${column.label}`}
                          >
                            {column.label}
                            <Icon className="size-3.5 opacity-70" />
                          </button>
                        </th>
                      );
                    })}
                    <th className="px-3 py-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((program) => (
                    <tr
                      key={program.id}
                      role="link"
                      tabIndex={0}
                      className="cursor-pointer border-b last:border-0 hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                      onClick={() => router.push(`/dashboard/programs/${program.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          router.push(`/dashboard/programs/${program.id}`);
                        }
                      }}
                    >
                      <td className="px-3 py-2 font-medium">{program.name}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {formatMoney(program.budgetCents, organization?.currency)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                        {program.startDate} – {program.endDate}
                      </td>
                      <td className="px-3 py-2">{coordinatorName(program.coordinatorUserId)}</td>
                      <td className="px-3 py-2">
                        <StatusBadge value={program.status} />
                      </td>
                      <td className="px-3 py-2 text-right">
                        {allowed("programs.manage") ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation();
                              setEditing(program);
                              setOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <ProgramDialog open={open} onOpenChange={setOpen} program={editing} />
      </div>
    </RequireAccess>
  );
}
