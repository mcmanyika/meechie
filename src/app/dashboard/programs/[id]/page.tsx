"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProgramDialog } from "@/components/programs/program-dialog";
import { PageHeader } from "@/components/shared/feedback";
import { Panel } from "@/components/shared/panel";
import { RequireAccess } from "@/components/shared/require-access";
import { StatusBadge } from "@/components/shared/status-badge";
import { useOrgRows, useSession } from "@/hooks/use-org";
import { formatDate, formatMoney } from "@/lib/format";
import { useDemoStore } from "@/stores/demo-store";

export default function ProgramDetailPage() {
  const params = useParams<{ id: string }>();
  const programs = useOrgRows("programs");
  const events = useOrgRows("events");
  const donations = useOrgRows("donations");
  const expenses = useOrgRows("expenses");
  const attendance = useOrgRows("attendance");
  const { organization, db, allowed } = useSession();
  const addExpense = useDemoStore((state) => state.addExpense);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const program = programs.find((item) => item.id === params.id);
  if (!program || !organization) {
    return (
      <RequireAccess permission="programs.view" entitlement="programs" feature="Programs">
        <p className="text-sm text-muted-foreground">Program not found in this organization.</p>
      </RequireAccess>
    );
  }
  const relatedEvents = events.filter((event) => event.programId === program.id);
  const giftTotal = donations
    .filter((donation) => donation.programId === program.id && donation.status === "completed")
    .reduce((sum, donation) => sum + donation.amountCents, 0);
  const spent = expenses.filter((expense) => expense.programId === program.id).reduce((sum, expense) => sum + expense.amountCents, 0);
  const participants = new Set(
    attendance
      .filter((record) => relatedEvents.some((event) => event.id === record.eventId))
      .map((record) => record.memberId),
  );
  const coordinator = db.users.find((user) => user.id === program.coordinatorUserId);

  return (
    <RequireAccess permission="programs.view" entitlement="programs" feature="Programs">
      <div className="grid gap-5">
        <PageHeader
          eyebrow="Program"
          title={program.name}
          actions={
            allowed("programs.manage") ? (
              <Button variant="outline" onClick={() => setOpen(true)}>
                Edit program
              </Button>
            ) : null
          }
        />
        <div className="flex flex-wrap gap-2">
          <StatusBadge value={program.status} />
          <span className="text-sm text-muted-foreground">Coordinator: {coordinator?.name ?? "Unassigned"}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Participants checked in" value={String(participants.size)} />
          <Metric label="Completed gifts" value={formatMoney(giftTotal, organization.currency)} />
          <Metric label="Expenses" value={formatMoney(spent, organization.currency)} />
        </div>
        <Panel title="Objectives">
          <ul className="list-disc space-y-1 pl-4 text-sm">
            {program.objectives.map((objective) => (
              <li key={objective}>{objective}</li>
            ))}
          </ul>
        </Panel>
        <Panel title="Associated events">
          <ul className="space-y-2">
            {relatedEvents.map((event) => (
              <li key={event.id} className="flex items-center justify-between text-sm">
                <Link href={`/dashboard/events/${event.id}`} className="hover:underline">
                  {event.name}
                </Link>
                <span className="text-muted-foreground">{formatDate(event.startAt)}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Financial summary">
          <p className="text-sm text-muted-foreground">
            Budget {formatMoney(program.budgetCents, organization.currency)}. Expenses below are ledger entries, not estimates.
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {expenses
              .filter((expense) => expense.programId === program.id)
              .map((expense) => (
                <li key={expense.id} className="flex justify-between">
                  <span>{expense.description}</span>
                  <span>{formatMoney(expense.amountCents, organization.currency)}</span>
                </li>
              ))}
          </ul>
          {allowed("programs.manage") || allowed("reports.financial") ? (
            <form
              className="mt-4 flex flex-wrap gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const dollars = Number(amount);
                if (!Number.isFinite(dollars) || dollars <= 0) return;
                const result = addExpense({
                  amountCents: Math.round(dollars * 100),
                  date: new Date().toISOString(),
                  category: "Program",
                  description: description || `${program.name} expense`,
                  programId: program.id,
                  eventId: null,
                });
                if (!result.ok) {
                  toast.error(result.error);
                  return;
                }
                setAmount("");
                setDescription("");
                toast.success("Expense recorded.");
              }}
            >
              <Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" aria-label="Expense description" className="max-w-xs" />
              <Input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="1" step="0.01" placeholder="Amount" aria-label="Expense amount" className="max-w-32" />
              <Button type="submit">Record expense</Button>
            </form>
          ) : null}
        </Panel>
        <Panel title="Impact summary">
          <p className="text-sm">
            {participants.size} people checked in across {relatedEvents.filter((event) => event.status === "completed").length} completed events.
          </p>
          <div className="mt-3 rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium">Unverified outcome note</p>
            {program.outcomes.map((outcome) => (
              <p key={outcome.id} className="mt-1 text-muted-foreground">
                {outcome.label}: {outcome.narrative}
              </p>
            ))}
          </div>
        </Panel>
        <ProgramDialog open={open} onOpenChange={setOpen} program={program} />
      </div>
    </RequireAccess>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </article>
  );
}
