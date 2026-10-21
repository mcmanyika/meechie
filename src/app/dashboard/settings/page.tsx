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
import { orgSettingsSchema } from "@/lib/validations/schemas";
import { useDemoStore } from "@/stores/demo-store";
import type { z } from "zod";

export default function SettingsPage() {
  const { organization } = useSession();
  const saveOrganization = useDemoStore((state) => state.saveOrganization);
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
  return (
    <RequireAccess permission="settings.manage" feature="Settings">
      <div className="grid gap-5">
        <PageHeader title="Settings" />
        <form className="grid gap-3" onSubmit={form.handleSubmit((values) => {
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
          </div>
          <Textarea aria-label="Description" {...form.register("description")} />
          <Textarea aria-label="Portal welcome" {...form.register("portalWelcome")} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register("portalEnabled")} /> Public portal enabled</label>
          <Button type="submit" className="w-fit">Save settings</Button>
        </form>
      </div>
    </RequireAccess>
  );
}
