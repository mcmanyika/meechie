"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/feedback";
import { RequireAccess } from "@/components/shared/require-access";
import { useSession } from "@/hooks/use-org";
import { orgSettingsSchema } from "@/lib/validations/schemas";
import { useDemoStore } from "@/stores/demo-store";
import { cn } from "cn";
import type { z } from "zod";

export default function SettingsPage() {
  const { organization, db } = useSession();
  const saveOrganization = useDemoStore((state) => state.saveOrganization);
  const pendingCount = db.users.filter(
    (user) => user.organizationId === organization?.id && user.accountStatus === "pending",
  ).length;
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

  if (!organization) return null;
  return (
    <RequireAccess permission="settings.manage" feature="Settings">
      <div className="grid gap-8">
        <PageHeader title="Settings" />

        <section className="rounded-xl border bg-card p-4" style={{ backgroundImage: "var(--card-wash)" }}>
          <h2 className="font-heading text-lg font-semibold tracking-tight">Team access</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Classify and activate registered users from the Team access page.
            {pendingCount > 0 ? ` ${pendingCount} account${pendingCount === 1 ? "" : "s"} waiting.` : ""}
          </p>
          <Link href="/dashboard/users" className={cn(buttonVariants({ variant: "outline" }), "mt-3 w-fit")}>
            Open team access
          </Link>
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
