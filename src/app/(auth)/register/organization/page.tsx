"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_PLANS } from "@/config/plans";
import { formatMoney, initials } from "@/lib/format";
import { isAuthConfigured, registerWithPassword } from "@/lib/firebase/auth";
import { createId, stamp } from "@/lib/ids";
import { orgOnboardingSchema } from "@/lib/validations/schemas";
import { useDemoStore } from "@/stores/demo-store";
import type { z } from "zod";

const steps = ["Organization", "Branding", "Administrator", "Plan", "Create"];

type FormValues = z.infer<typeof orgOnboardingSchema>;

export default function RegisterPage() {
  const createWorkspace = useDemoStore((state) => state.createWorkspace);
  const enterByEmail = useDemoStore((state) => state.enterByEmail);
  const router = useRouter();
  const [step, setStep] = useState(0);
  const form = useForm<FormValues>({
    resolver: zodResolver(orgOnboardingSchema),
    defaultValues: {
      name: "",
      city: "",
      state: "TX",
      description: "A community nonprofit workspace on MeechieOS.",
      email: "",
      phone: "",
      website: "https://",
      primaryColor: "#12352f",
      secondaryColor: "#0F766E",
      adminName: "",
      adminEmail: "",
      password: "",
      confirmPassword: "",
      planId: "growth",
    },
  });
  const values = form.watch();

  return (
    <AuthShell
      title={steps[step]}
      description={`Step ${step + 1} of ${steps.length}. Create your organization and administrator account.`}
      footer={
        <>
          Already have an account?{" "}
          <Link href="/" className="font-medium text-[#12352f] underline-offset-4 hover:underline">
            Sign in
          </Link>
          {" · "}
          <Link href="/register" className="font-medium text-[#12352f] underline-offset-4 hover:underline">
            Create a personal account
          </Link>
        </>
      }
    >
      <form
        className="grid gap-3"
        onSubmit={form.handleSubmit(async (data) => {
          if (!isAuthConfigured()) {
            toast.error("Authentication is not configured. Add Firebase web config to continue.");
            return;
          }
          const auth = await registerWithPassword({
            email: data.adminEmail,
            password: data.password,
            displayName: data.adminName,
          });
          if (!auth.ok) {
            toast.error(auth.error);
            return;
          }
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
              portalWelcome: `${data.name} public page.`,
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
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          const session = enterByEmail(data.adminEmail);
          if (!session.ok) {
            toast.error(session.error);
            return;
          }
          toast.success("Account and workspace created.");
          router.push("/dashboard");
        })}
      >
        {step === 0 ? (
          <>
            <Field label="Organization name" error={form.formState.errors.name?.message}>
              <Input aria-label="Organization name" {...form.register("name")} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="City" error={form.formState.errors.city?.message}>
                <Input aria-label="City" {...form.register("city")} />
              </Field>
              <Field label="State" error={form.formState.errors.state?.message}>
                <Input aria-label="State" maxLength={2} {...form.register("state")} />
              </Field>
            </div>
            <Field label="Description" error={form.formState.errors.description?.message}>
              <Textarea aria-label="Description" {...form.register("description")} />
            </Field>
            <Field label="Organization email" error={form.formState.errors.email?.message}>
              <Input type="email" aria-label="Organization email" {...form.register("email")} />
            </Field>
            <Field label="Phone" error={form.formState.errors.phone?.message}>
              <Input type="tel" aria-label="Phone" {...form.register("phone")} />
            </Field>
            <Field label="Website" error={form.formState.errors.website?.message}>
              <Input aria-label="Website" {...form.register("website")} />
            </Field>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <Field label="Primary color">
              <Input type="color" aria-label="Primary color" {...form.register("primaryColor")} />
            </Field>
            <Field label="Secondary color">
              <Input type="color" aria-label="Secondary color" {...form.register("secondaryColor")} />
            </Field>
            <p className="text-sm text-muted-foreground">A monogram logo is generated from the organization name.</p>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Field label="Your name" error={form.formState.errors.adminName?.message}>
              <Input autoComplete="name" aria-label="Administrator name" {...form.register("adminName")} />
            </Field>
            <Field label="Work email" error={form.formState.errors.adminEmail?.message}>
              <Input type="email" autoComplete="email" aria-label="Administrator email" {...form.register("adminEmail")} />
            </Field>
            <Field label="Password" error={form.formState.errors.password?.message}>
              <Input type="password" autoComplete="new-password" aria-label="Password" {...form.register("password")} />
            </Field>
            <Field label="Confirm password" error={form.formState.errors.confirmPassword?.message}>
              <Input type="password" autoComplete="new-password" aria-label="Confirm password" {...form.register("confirmPassword")} />
            </Field>
            <p className="text-xs text-muted-foreground">Use at least 8 characters. This signs you into MeechieOS with Firebase Authentication.</p>
          </>
        ) : null}

        {step === 3 ? (
          <div className="grid gap-2">
            {DEFAULT_PLANS.map((plan) => (
              <label key={plan.id} className="flex items-start gap-3 rounded-xl border p-3 text-sm">
                <input type="radio" value={plan.id} {...form.register("planId")} />
                <span>
                  <span className="font-medium">{plan.name}</span> · {plan.monthlyPriceCents == null ? "Custom" : formatMoney(plan.monthlyPriceCents)}
                  <span className="block text-muted-foreground">{plan.description}</span>
                </span>
              </label>
            ))}
          </div>
        ) : null}

        {step === 4 ? (
          <p className="text-sm text-muted-foreground">
            {values.name || "This organization"} will be created with an empty operating dataset for{" "}
            {values.adminEmail || "the administrator"}, on the {values.planId} sample plan.
          </p>
        ) : null}

        <div className="mt-2 flex justify-between gap-2">
          <Button type="button" variant="outline" disabled={step === 0 || form.formState.isSubmitting} onClick={() => setStep((value) => value - 1)}>
            Back
          </Button>
          {step < 4 ? (
            <Button
              type="button"
              disabled={form.formState.isSubmitting}
              onClick={async () => {
                const fields: (keyof FormValues)[][] = [
                  ["name", "city", "state", "description", "email", "phone", "website"],
                  ["primaryColor", "secondaryColor"],
                  ["adminName", "adminEmail", "password", "confirmPassword"],
                  ["planId"],
                ];
                if (await form.trigger(fields[step])) setStep((value) => value + 1);
              }}
            >
              Continue
            </Button>
          ) : (
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Creating…" : "Create account"}
            </Button>
          )}
        </div>
      </form>
    </AuthShell>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
