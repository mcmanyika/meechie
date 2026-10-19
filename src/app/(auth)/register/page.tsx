"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_PLANS } from "@/config/plans";
import { formatMoney } from "@/lib/format";
import { createId, stamp } from "@/lib/ids";
import { initials } from "@/lib/format";
import { orgOnboardingSchema } from "@/lib/validations/schemas";
import { useDemoStore } from "@/stores/demo-store";
import type { z } from "zod";

const steps = ["Organization", "Branding", "Administrator", "Plan", "Create"];

export default function RegisterPage() {
  const createWorkspace = useDemoStore((state) => state.createWorkspace);
  const router = useRouter();
  const [step, setStep] = useState(0);
  const form = useForm<z.infer<typeof orgOnboardingSchema>>({
    resolver: zodResolver(orgOnboardingSchema),
    defaultValues: {
      name: "",
      city: "",
      state: "TX",
      description: "A new demonstration nonprofit workspace.",
      email: "",
      phone: "(214) 555-0101",
      website: "https://example.org/new-organization",
      primaryColor: "#1D4ED8",
      secondaryColor: "#0F766E",
      adminName: "",
      adminEmail: "",
      planId: "growth",
    },
  });
  const values = form.watch();
  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <p className="text-sm text-muted-foreground">Step {step + 1} of {steps.length}</p>
      <h1 className="mt-1 text-3xl font-semibold">{steps[step]}</h1>
      <form className="mt-6 grid gap-3" onSubmit={form.handleSubmit((data) => {
        const now = stamp();
        const orgId = createId("org");
        const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "org";
        const result = createWorkspace({
          planId: data.planId,
          organization: {
            id: orgId,
            name: data.name,
            slug,
            logoText: initials(data.name).slice(0, 2) || "NP",
            description: data.description,
            primaryColor: data.primaryColor,
            secondaryColor: data.secondaryColor,
            email: data.email,
            phone: data.phone,
            website: data.website,
            addressLine: "100 Main Street",
            city: data.city,
            state: data.state,
            postalCode: "75001",
            timezone: "America/Chicago",
            currency: "USD",
            status: "trial",
            portalEnabled: false,
            portalWelcome: `${data.name} public page. This workspace is a demonstration.`,
            ...now,
          },
          admin: {
            id: createId("user"),
            organizationId: orgId,
            name: data.adminName,
            email: data.adminEmail,
            role: "organization_admin",
            title: "Administrator",
            avatarInitials: initials(data.adminName),
            ...now,
          },
        });
        if (!result.ok) { toast.error(result.error); return; }
        toast.success("Workspace created in the demo.");
        router.push("/dashboard");
      })}>
        {step === 0 ? <>
          <Input placeholder="Organization name" aria-label="Organization name" {...form.register("name")} />
          <Input placeholder="City" aria-label="City" {...form.register("city")} />
          <Input placeholder="State" aria-label="State" maxLength={2} {...form.register("state")} />
          <Textarea aria-label="Description" {...form.register("description")} />
          <Input placeholder="Email" aria-label="Organization email" {...form.register("email")} />
          <Input placeholder="Phone" aria-label="Phone" {...form.register("phone")} />
          <Input placeholder="Website" aria-label="Website" {...form.register("website")} />
        </> : null}
        {step === 1 ? <>
          <label className="text-sm">Primary color <Input type="color" {...form.register("primaryColor")} /></label>
          <label className="text-sm">Secondary color <Input type="color" {...form.register("secondaryColor")} /></label>
          <p className="text-sm text-muted-foreground">The logo is a generated monogram. It is not an official mark.</p>
        </> : null}
        {step === 2 ? <>
          <Input placeholder="Administrator name" aria-label="Administrator name" {...form.register("adminName")} />
          <Input placeholder="Administrator email" aria-label="Administrator email" {...form.register("adminEmail")} />
        </> : null}
        {step === 3 ? (
          <div className="grid gap-2">
            {DEFAULT_PLANS.map((plan) => (
              <label key={plan.id} className="flex items-start gap-3 rounded-xl border p-3 text-sm">
                <input type="radio" value={plan.id} {...form.register("planId")} />
                <span><span className="font-medium">{plan.name}</span> · {plan.monthlyPriceCents == null ? "Custom" : formatMoney(plan.monthlyPriceCents)}<span className="block text-muted-foreground">{plan.description}</span></span>
              </label>
            ))}
          </div>
        ) : null}
        {step === 4 ? <p className="text-sm text-muted-foreground">{values.name || "This organization"} will be created with an empty operating dataset so you can see the empty states, on the {values.planId} sample plan.</p> : null}
        <div className="flex justify-between">
          <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep((value) => value - 1)}>Back</Button>
          {step < 4 ? <Button type="button" onClick={async () => {
            const fields: (keyof z.infer<typeof orgOnboardingSchema>)[][] = [
              ["name", "city", "state", "description", "email", "phone", "website"],
              ["primaryColor", "secondaryColor"],
              ["adminName", "adminEmail"],
              ["planId"],
            ];
            if (await form.trigger(fields[step])) setStep((value) => value + 1);
          }}>Continue</Button> : <Button type="submit">Create workspace</Button>}
        </div>
      </form>
    </main>
  );
}
