"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/feedback";
import { RequireAccess } from "@/components/shared/require-access";
import { useSession } from "@/hooks/use-org";
import { ROLE_LABELS } from "@/lib/permissions";
import { orgSettingsSchema } from "@/lib/validations/schemas";
import { useDemoStore } from "@/stores/demo-store";
import type { z } from "zod";

export default function SettingsPage() {
  const { organization, subscription, plan, seatsUsed, db } = useSession();
  const saveOrganization = useDemoStore((state) => state.saveOrganization);
  const resetDemo = useDemoStore((state) => state.resetDemo);
  const form = useForm<z.infer<typeof orgSettingsSchema>>({
    resolver: zodResolver(orgSettingsSchema),
    values: organization ? {
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
    } : undefined,
  });
  if (!organization) return null;
  const staff = db.users.filter((user) => user.organizationId === organization.id);
  return (
    <RequireAccess permission="settings.manage" feature="Settings">
      <div className="grid gap-5">
        <PageHeader title="Settings" description="Branding and portal copy for this demonstration workspace." />
        <form className="grid gap-3 rounded-xl border bg-card p-4" onSubmit={form.handleSubmit((values) => {
          const result = saveOrganization({ ...organization, ...values });
          if (!result.ok) { toast.error(result.error); return; }
          toast.success("Organization settings saved.");
        })}>
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
            <label className="text-sm">Primary <Input type="color" {...form.register("primaryColor")} /></label>
            <label className="text-sm">Secondary <Input type="color" {...form.register("secondaryColor")} /></label>
          </div>
          <Textarea aria-label="Description" {...form.register("description")} />
          <Textarea aria-label="Portal welcome" {...form.register("portalWelcome")} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register("portalEnabled")} /> Public portal enabled</label>
          <Button type="submit" className="w-fit">Save settings</Button>
        </form>
        <section className="rounded-xl border bg-card p-4 text-sm">
          <h2 className="font-medium">Subscription preview</h2>
          <p className="mt-1 text-muted-foreground">{plan?.name} · {subscription?.status} · Staff seats {seatsUsed} / {subscription?.seatLimit ?? "custom"}</p>
          <ul className="mt-3 space-y-1">
            {staff.map((person) => <li key={person.id}>{person.name} · {ROLE_LABELS[person.role]}</li>)}
          </ul>
        </section>
        <section className="rounded-xl border bg-card p-4">
          <h2 className="text-sm font-medium">Reset demo data</h2>
          <p className="mt-1 text-sm text-muted-foreground">Restores the original fictional dataset in this browser. Your demo role stays signed in.</p>
          <Button className="mt-3" variant="outline" onClick={() => { void resetDemo(); toast.success("Demo data restored."); }}>Reset demo data</Button>
        </section>
      </div>
    </RequireAccess>
  );
}
