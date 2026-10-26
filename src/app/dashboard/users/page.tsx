"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState, PageHeader } from "@/components/shared/feedback";
import { RequireAccess } from "@/components/shared/require-access";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STAFF_ROLES } from "@/config/constants";
import { useSession } from "@/hooks/use-org";
import { formatDate, formatNumber, formatRelative } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/permissions";
import { useDemoStore } from "@/stores/demo-store";
import type { Role, User } from "@/types/models";

const ACTIVATABLE_ROLES = STAFF_ROLES;

export default function UsersPage() {
  const { organization, db, user: currentUser } = useSession();
  const activateUser = useDemoStore((state) => state.activateUser);
  const [search, setSearch] = useState("");
  const [roleDrafts, setRoleDrafts] = useState<Record<string, Role>>({});

  const orgUsers = useMemo(
    () => db.users.filter((person) => person.organizationId === organization?.id),
    [db.users, organization?.id],
  );

  const pendingUsers = useMemo(
    () =>
      orgUsers
        .filter((person) => person.accountStatus === "pending")
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [orgUsers],
  );

  const activeStaff = useMemo(
    () =>
      orgUsers
        .filter(
          (person) =>
            person.accountStatus === "active" &&
            STAFF_ROLES.includes(person.role as (typeof STAFF_ROLES)[number]),
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [orgUsers],
  );

  const needle = search.trim().toLowerCase();
  const filteredPending = useMemo(
    () =>
      pendingUsers.filter((person) =>
        `${person.name} ${person.email}`.toLowerCase().includes(needle),
      ),
    [pendingUsers, needle],
  );
  const filteredActive = useMemo(
    () =>
      activeStaff.filter((person) =>
        `${person.name} ${person.email} ${ROLE_LABELS[person.role]}`.toLowerCase().includes(needle),
      ),
    [activeStaff, needle],
  );

  const draftRole = (person: User) =>
    roleDrafts[person.id] ??
    (STAFF_ROLES.includes(person.role as (typeof STAFF_ROLES)[number]) ? person.role : "program_manager");

  const classify = (person: User, role: Role, activating: boolean) => {
    const result = activateUser(person.id, role);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(
      activating
        ? `${person.name} activated as ${ROLE_LABELS[role]}.`
        : `${person.name} classified as ${ROLE_LABELS[role]}.`,
    );
  };

  if (!organization) return null;

  return (
    <RequireAccess permission="settings.manage" feature="Team access">
      <div className="grid gap-6">
        <PageHeader
          title="Team access"
          description="Classify registered accounts by staff role and activate them for the dashboard."
        />

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Pending activation", value: formatNumber(pendingUsers.length) },
            { label: "Active staff", value: formatNumber(activeStaff.length) },
            { label: "Registered accounts", value: formatNumber(orgUsers.length) },
          ].map((card) => (
            <article
              key={card.label}
              className="rounded-xl border bg-card px-4 py-3"
              style={{ backgroundImage: "var(--card-wash)" }}
            >
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">{card.value}</p>
            </article>
          ))}
        </div>

        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or email"
          aria-label="Search users"
          className="max-w-sm"
        />

        <section className="grid gap-3">
          <div>
            <h2 className="font-heading text-lg font-semibold tracking-tight">Pending registrations</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose a staff role, then activate. Until then they stay on the waiting screen.
            </p>
          </div>
          {filteredPending.length === 0 ? (
            <EmptyState
              title={pendingUsers.length === 0 ? "No pending accounts" : "No matches"}
              body={
                pendingUsers.length === 0
                  ? "When someone registers, they appear here for classification and activation."
                  : "Try a different search."
              }
            />
          ) : (
            <ul className="divide-y rounded-xl border bg-card">
              {filteredPending.map((person) => {
                const role = draftRole(person);
                return (
                  <li
                    key={person.id}
                    className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium">{person.name}</p>
                        <StatusBadge value="pending" />
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{person.email}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Registered {formatDate(person.createdAt)} · {formatRelative(person.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        aria-label={`Classify ${person.name}`}
                        className="h-9 rounded-lg border bg-background px-2 text-sm"
                        value={role}
                        onChange={(event) =>
                          setRoleDrafts((current) => ({
                            ...current,
                            [person.id]: event.target.value as Role,
                          }))
                        }
                      >
                        {ACTIVATABLE_ROLES.map((item) => (
                          <option key={item} value={item}>
                            {ROLE_LABELS[item]}
                          </option>
                        ))}
                      </select>
                      <Button type="button" size="sm" onClick={() => classify(person, role, true)}>
                        Activate
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="grid gap-3">
          <div>
            <h2 className="font-heading text-lg font-semibold tracking-tight">Active staff</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Reclassify an account if their responsibilities change.
            </p>
          </div>
          {filteredActive.length === 0 ? (
            <EmptyState
              title={activeStaff.length === 0 ? "No active staff yet" : "No matches"}
              body={
                activeStaff.length === 0
                  ? "Activated accounts will show here with their roles."
                  : "Try a different search."
              }
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border bg-card">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-xs text-muted-foreground">
                  <tr>
                    {["Name", "Email", "Role", "Updated", ""].map((heading) => (
                      <th key={heading || "actions"} className="px-3 py-2 font-medium">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredActive.map((person) => {
                    const role = draftRole(person);
                    const isSelf = person.id === currentUser?.id;
                    return (
                      <tr key={person.id} className="border-b last:border-0">
                        <td className="px-3 py-2 font-medium">
                          {person.name}
                          {isSelf ? <span className="ml-2 text-xs text-muted-foreground">you</span> : null}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{person.email}</td>
                        <td className="px-3 py-2">
                          <select
                            aria-label={`Role for ${person.name}`}
                            className="h-8 rounded-lg border bg-transparent px-2 text-sm"
                            value={role}
                            onChange={(event) =>
                              setRoleDrafts((current) => ({
                                ...current,
                                [person.id]: event.target.value as Role,
                              }))
                            }
                          >
                            {ACTIVATABLE_ROLES.map((item) => (
                              <option key={item} value={item}>
                                {ROLE_LABELS[item]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                          {formatDate(person.updatedAt)}
                        </td>
                        <td className="px-3 py-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={role === person.role}
                            onClick={() => classify(person, role, false)}
                          >
                            Save role
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </RequireAccess>
  );
}
