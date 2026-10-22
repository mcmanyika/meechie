"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProgramDialog } from "@/components/programs/program-dialog";
import { EmptyState, PageHeader } from "@/components/shared/feedback";
import { RequireAccess } from "@/components/shared/require-access";
import { StatusBadge } from "@/components/shared/status-badge";
import { useOrgRows, useSession } from "@/hooks/use-org";
import { formatMoney, titleCase } from "@/lib/format";
import type { Program, ProgramStatus } from "@/types/models";

const STATUSES: Array<"all" | ProgramStatus> = ["all", "draft", "planned", "active", "completed", "archived"];

export default function ProgramsPage() {
  const programs = useOrgRows("programs");
  const { organization, allowed, db } = useSession();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Program | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | ProgramStatus>("all");

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return programs
      .filter((program) => {
        if (status !== "all" && program.status !== status) return false;
        if (!needle) return true;
        const haystack = `${program.name} ${program.description} ${program.objectives.join(" ")}`.toLowerCase();
        return haystack.includes(needle);
      })
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [programs, search, status]);

  const coordinatorName = (userId: string) => db.users.find((user) => user.id === userId)?.name ?? "Assigned staff";

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
          <div className="grid gap-3">
            <p className="text-xs text-muted-foreground">
              Showing {filtered.length} of {programs.length} programs
            </p>
            {filtered.map((program) => (
              <article key={program.id} className="rounded-xl border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link href={`/dashboard/programs/${program.id}`} className="text-base font-medium hover:underline">
                      {program.name}
                    </Link>
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{program.description}</p>
                  </div>
                  <StatusBadge value={program.status} />
                </div>
                <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-xs text-muted-foreground">Budget</dt>
                    <dd>{formatMoney(program.budgetCents, organization?.currency)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Dates</dt>
                    <dd>
                      {program.startDate} – {program.endDate}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Coordinator</dt>
                    <dd>{coordinatorName(program.coordinatorUserId)}</dd>
                  </div>
                </dl>
                {allowed("programs.manage") ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      setEditing(program);
                      setOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                ) : null}
              </article>
            ))}
          </div>
        )}
        <ProgramDialog open={open} onOpenChange={setOpen} program={editing} />
      </div>
    </RequireAccess>
  );
}
