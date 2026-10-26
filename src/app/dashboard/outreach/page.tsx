"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { OutreachDialog } from "@/components/outreach/outreach-dialog";
import { EmptyState, PageHeader } from "@/components/shared/feedback";
import { RequireAccess } from "@/components/shared/require-access";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOrgRows, useSession } from "@/hooks/use-org";
import { formatDate, formatNumber, titleCase } from "@/lib/format";
import { toast } from "sonner";
import { useDemoStore } from "@/stores/demo-store";
import type { OutreachActivity, OutreachStatus, OutreachType } from "@/types/models";

const TYPES: OutreachType[] = ["canvass", "neighborhood_visit", "flyering", "partnership", "other"];
const STATUSES: OutreachStatus[] = ["planned", "completed", "cancelled"];

export default function OutreachPage() {
  const activities = useOrgRows("outreachActivities");
  const programs = useOrgRows("programs");
  const volunteers = useOrgRows("volunteers");
  const { db, allowed } = useSession();
  const setOutreachStatus = useDemoStore((state) => state.setOutreachStatus);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"all" | OutreachType>("all");
  const [status, setStatus] = useState<"all" | OutreachStatus>("all");
  const [programId, setProgramId] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<OutreachActivity | null>(null);

  const monthKey = new Date().toISOString().slice(0, 7);
  const completed = activities.filter((activity) => activity.status === "completed");
  const completedThisMonth = completed.filter((activity) => activity.date.slice(0, 7) === monthKey);
  const householdsReached = completed.reduce((sum, activity) => sum + activity.householdsReached, 0);
  const neighborhoods = new Set(completed.map((activity) => `${activity.city}|${activity.neighborhood}`));
  const plannedUpcoming = activities.filter(
    (activity) => activity.status === "planned" && activity.date >= new Date().toISOString().slice(0, 10),
  ).length;

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return activities
      .filter((activity) => {
        if (type !== "all" && activity.type !== type) return false;
        if (status !== "all" && activity.status !== status) return false;
        if (programId !== "all" && (activity.programId ?? "") !== programId) return false;
        if (!needle) return true;
        const haystack = `${activity.title} ${activity.neighborhood} ${activity.city} ${activity.notes}`.toLowerCase();
        return haystack.includes(needle);
      })
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt));
  }, [activities, search, type, status, programId]);

  const leadName = (userId: string) => db.users.find((person) => person.id === userId)?.name ?? "Staff";
  const programName = (id: string | null) => (id ? programs.find((program) => program.id === id)?.name ?? "Program" : null);

  const openCreate = () => {
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (activity: OutreachActivity) => {
    setEditing(activity);
    setOpen(true);
  };

  const cards = [
    { label: "Completed this month", value: formatNumber(completedThisMonth.length) },
    { label: "Households reached", value: formatNumber(householdsReached), hint: "From completed activities" },
    { label: "Neighborhoods touched", value: formatNumber(neighborhoods.size) },
    { label: "Planned upcoming", value: formatNumber(plannedUpcoming) },
  ];

  return (
    <RequireAccess permission="outreach.view" feature="Outreach">
      <div className="grid gap-5">
        <PageHeader
          title="Outreach"
          description="Log neighborhood visits, canvassing, flyering, and partnership outreach in the field."
          actions={
            allowed("outreach.manage") ? (
              <Button onClick={openCreate}>
                <Plus /> Log outreach
              </Button>
            ) : null
          }
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <article
              key={card.label}
              className="rounded-xl border bg-card px-4 py-3"
              style={{ backgroundImage: "var(--card-wash)" }}
            >
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">{card.value}</p>
              {card.hint ? <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p> : null}
            </article>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title, neighborhood, notes"
            aria-label="Search outreach"
            className="max-w-xs"
          />
          <select
            aria-label="Type"
            className="h-8 rounded-lg border bg-card px-2 text-sm"
            value={type}
            onChange={(event) => setType(event.target.value as "all" | OutreachType)}
          >
            <option value="all">All types</option>
            {TYPES.map((value) => (
              <option key={value} value={value}>
                {titleCase(value)}
              </option>
            ))}
          </select>
          <select
            aria-label="Status"
            className="h-8 rounded-lg border bg-card px-2 text-sm"
            value={status}
            onChange={(event) => setStatus(event.target.value as "all" | OutreachStatus)}
          >
            <option value="all">All statuses</option>
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {titleCase(value)}
              </option>
            ))}
          </select>
          <select
            aria-label="Program"
            className="h-8 rounded-lg border bg-card px-2 text-sm"
            value={programId}
            onChange={(event) => setProgramId(event.target.value)}
          >
            <option value="all">All programs</option>
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.name}
              </option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No outreach logged"
            body={
              activities.length === 0
                ? "Record neighborhood visits and field outreach so the team can see where you have been."
                : "Adjust search or filters."
            }
            action={
              allowed("outreach.manage") ? (
                <Button onClick={openCreate}>
                  <Plus /> Log outreach
                </Button>
              ) : null
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs text-muted-foreground">
                <tr>
                  {["Activity", "When", "Where", "Reach", "Lead", "Status", ""].map((heading) => (
                    <th key={heading || "actions"} className="px-3 py-2 font-medium">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((activity) => {
                  const linkedVolunteers = activity.volunteerIds
                    .map((id) => volunteers.find((volunteer) => volunteer.id === id))
                    .filter(Boolean);
                  return (
                    <tr key={activity.id} className="border-b last:border-0">
                      <td className="px-3 py-2">
                        <button type="button" className="text-left font-medium hover:underline" onClick={() => openEdit(activity)}>
                          {activity.title}
                        </button>
                        <p className="text-xs text-muted-foreground">
                          {titleCase(activity.type)}
                          {programName(activity.programId) ? ` · ${programName(activity.programId)}` : ""}
                        </p>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">{formatDate(activity.date)}</td>
                      <td className="px-3 py-2">
                        {activity.neighborhood}
                        <span className="block text-xs text-muted-foreground">{activity.city}</span>
                      </td>
                      <td className="px-3 py-2">
                        {activity.householdsReached} hh · {activity.individualsReached} people
                        {linkedVolunteers.length > 0 ? (
                          <span className="block text-xs text-muted-foreground">{linkedVolunteers.length} volunteers</span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2">{leadName(activity.leadUserId)}</td>
                      <td className="px-3 py-2">
                        {allowed("outreach.manage") ? (
                          <select
                            aria-label={`Status for ${activity.title}`}
                            className="h-8 rounded-lg border bg-transparent px-2 text-sm"
                            value={activity.status}
                            onChange={(event) => {
                              const result = setOutreachStatus(activity.id, event.target.value as OutreachStatus);
                              if (!result.ok) toast.error(result.error);
                              else toast.success("Status updated.");
                            }}
                          >
                            {STATUSES.map((value) => (
                              <option key={value} value={value}>
                                {titleCase(value)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <StatusBadge value={activity.status} />
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {allowed("outreach.manage") ? (
                          <Button variant="ghost" size="sm" onClick={() => openEdit(activity)}>
                            Edit
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <OutreachDialog open={open} onOpenChange={setOpen} activity={editing} />
      </div>
    </RequireAccess>
  );
}
