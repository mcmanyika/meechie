"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, PageHeader } from "@/components/shared/feedback";
import { RequireAccess } from "@/components/shared/require-access";
import { STAFF_ROLES } from "@/config/constants";
import { useSession } from "@/hooks/use-org";
import { ROLE_LABELS } from "@/lib/permissions";
import { orgSettingsSchema } from "@/lib/validations/schemas";
import { useDemoStore } from "@/stores/demo-store";
import type { Role } from "@/types/models";
import type { z } from "zod";

const ACTIVATABLE_ROLES = STAFF_ROLES;

export default function SettingsPage() {
  const { organization, db } = useSession();
  const saveOrganization = useDemoStore((state) => state.saveOrganization);
  const activateUser = useDemoStore((state) => state.activateUser);
  const [roleDrafts, setRoleDrafts] = useState<Record<string, Role>>({});
  const form = useForm<z.infer<typeof orgSettingsSchema>>({
    resolver: zodResolver(orgSettingsSchema),
    values: organization
      ? {
          name: organization.name,
          description: organization.description,
          email: organization.email,
          phone: organization.phone,
          website: organization.website,
          addressLine: organization.addressLine,
          city: organization.city,
          state: organization.state,
          postalCode: organization.postalCode,
          timezone: organization.timezone,
          currency: organization.currency,
          primaryColor: organization.primaryColor,
          secondaryColor: organization.secondaryColor,
          portalEnabled: organization.portalEnabled,
          portalWelcome: organization.portalWelcome,
        }
      : undefined,
  });

  const pendingUsers = useMemo(
    () =>
      db.users
        .filter((user) => user.organizationId === organization?.id && user.accountStatus === "pending")
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [db.users, organization?.id],
  );

  const activeStaff = useMemo(
    () =>
      db.users
        .filter(
          (user) =>
            user.organizationId === organization?.id &&
            user.accountStatus === "active" &&
            STAFF_ROLES.includes(user.role as (typeof STAFF_ROLES)[number]),
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [db.users, organization?.id],
  );

  if (!organization) return null;
  return (
    <RequireAccess permission="settings.manage" feature="Settings">
      <div className="grid gap-8">
        <PageHeader title="Settings" />

        <section className="grid gap-3">
          <div>
            <h2 className="font-heading text-lg font-semibold tracking-tight">Staff access</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              New registrations stay pending until an admin activates them for the dashboard.
            </p>
          </div>
          {pendingUsers.length === 0 ? (
            <EmptyState title="No pending accounts" body="When someone registers, they will appear here for activation." />
          ) : (
            <ul className="divide-y rounded-xl border bg-card">
              {pendingUsers.map((user) => {
                const role = roleDrafts[user.id] ?? "program_manager";
                return (
                  <li key={user.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{user.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        aria-label={`Role for ${user.name}`}
                        className="h-9 rounded-lg border bg-background px-2 text-sm"
                        value={role}
                        onChange={(event) =>
                          setRoleDrafts((current) => ({ ...current, [user.id]: event.target.value as Role }))
                        }
                      >
                        {ACTIVATABLE_ROLES.map((item) => (
                          <option key={item} value={item}>
                            {ROLE_LABELS[item]}
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          const result = activateUser(user.id, role);
                          if (!result.ok) {
                            toast.error(result.error);
                            return;
                          }
                          toast.success(`${user.name} activated as ${ROLE_LABELS[role]}.`);
                        }}
                      >
                        Activate
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {activeStaff.length > 0 ? (
            <div className="grid gap-2">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Active staff</p>
              <ul className="grid gap-1 text-sm">
                {activeStaff.map((user) => (
                  <li key={user.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                    <span className="min-w-0 truncate">
                      {user.name} · <span className="text-muted-foreground">{user.email}</span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <form
          className="grid gap-3"
          onSubmit={form.handleSubmit((values) => {
            const result = saveOrganization({ ...organization, ...values });
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success("Organization settings saved.");
          })}
        >
          <h2 className="font-heading text-lg font-semibold tracking-tight">Organization</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input aria-label="Organization name" {...form.register("name")} />
            <Input aria-label="Email" {...form.register("email")} />
            <Input aria-label="Phone" {...form.register("phone")} />
            <Input aria-label="Website" {...form.register("website")} />
            <Input aria-label="Address" {...form.register("addressLine")} />
            <Input aria-label="City" {...form.register("city")} />
            <Input aria-label="State" {...form.register("state")} />
            <Input aria-label="Postal code" {...form.register("postalCode")} />
            <Input aria-label="Time zone" {...form.register("timezone")} />
            <Input aria-label="Currency" {...form.register("currency")} />
          </div>
          <Textarea aria-label="Description" {...form.register("description")} />
          <Textarea aria-label="Portal welcome" {...form.register("portalWelcome")} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register("portalEnabled")} /> Public portal enabled
          </label>
          <Button type="submit" className="w-fit">
            Save settings
          </Button>
        </form>
      </div>
    </RequireAccess>
  );
}
