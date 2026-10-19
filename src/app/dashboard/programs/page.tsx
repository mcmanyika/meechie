"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgramDialog } from "@/components/programs/program-dialog";
import { PageHeader } from "@/components/shared/feedback";
import { RequireAccess } from "@/components/shared/require-access";
import { StatusBadge } from "@/components/shared/status-badge";
import { useOrgRows, useSession } from "@/hooks/use-org";
import { formatMoney } from "@/lib/format";
import type { Program } from "@/types/models";

export default function ProgramsPage() {
  const programs = useOrgRows("programs");
  const { organization, allowed, user } = useSession();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Program | null>(null);
  return (
    <RequireAccess permission="programs.view" entitlement="programs" feature="Programs">
      <div className="grid gap-5">
        <PageHeader
          title="Programs"
          description="Budgets, dates, and coordinators for the selected organization."
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
        <div className="grid gap-3">
          {programs.map((program) => (
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
                  <dd>{user && program.coordinatorUserId === user.id ? user.name : "Assigned staff"}</dd>
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
        <ProgramDialog open={open} onOpenChange={setOpen} program={editing} />
      </div>
    </RequireAccess>
  );
}
