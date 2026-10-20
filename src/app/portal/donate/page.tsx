"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { MEECHIE_ORG_ID } from "@/config/constants";
import { startStripeCheckout } from "@/lib/stripe/checkout-client";
import { donateSchema } from "@/lib/validations/schemas";
import { useDemoStore } from "@/stores/demo-store";

export default function PortalDonatePage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm">Loading the gift form…</p>}>
      <DonateForm />
    </Suspense>
  );
}

function DonateForm() {
  const params = useSearchParams();
  const allPrograms = useDemoStore((state) => state.db.programs);
  const programs = useMemo(() => allPrograms.filter((program) => program.organizationId === MEECHIE_ORG_ID), [allPrograms]);
  const form = useForm({ resolver: zodResolver(donateSchema), defaultValues: { name: "", email: "", amount: 50, type: "one_time" as const, programId: "", method: "card" as const } });

  useEffect(() => {
    if (params.get("canceled") === "1") toast.message("Checkout was canceled. No gift was recorded.");
  }, [params]);

  return (
    <form className="mx-auto grid max-w-lg gap-3 pb-16" onSubmit={form.handleSubmit(async (values) => {
      try {
        await startStripeCheckout({
          organizationId: MEECHIE_ORG_ID,
          name: values.name,
          email: values.email,
          amountCents: Math.round(values.amount * 100),
          programId: values.programId || null,
          type: values.type,
          method: values.method,
          returnTo: "portal",
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Stripe Checkout is unavailable.");
      }
    })}>
      <h1 className="text-2xl font-semibold">Give</h1>
      <p className="text-sm text-[#6b6258]">Card and bank gifts open Stripe Checkout. This page never asks for a card number. A paid gift is added to the donation total.</p>
      <input className="h-11 rounded-xl border bg-white px-3" placeholder="Name" aria-label="Name" {...form.register("name")} />
      <input className="h-11 rounded-xl border bg-white px-3" placeholder="Email" aria-label="Email" {...form.register("email")} />
      <input className="h-11 rounded-xl border bg-white px-3" type="number" min="1" step="1" aria-label="Amount in dollars" {...form.register("amount", { valueAsNumber: true })} />
      <select aria-label="Gift type" className="h-11 rounded-xl border bg-white px-3" {...form.register("type")}>
        <option value="one_time">One-time</option>
        <option value="recurring">Monthly</option>
        <option value="corporate">Corporate</option>
      </select>
      <select aria-label="Program" className="h-11 rounded-xl border bg-white px-3" {...form.register("programId")}>
        <option value="">Where the need is greatest</option>
        {programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}
      </select>
      <select aria-label="Payment method" className="h-11 rounded-xl border bg-white px-3" {...form.register("method")}>
        <option value="card">Card</option>
        <option value="ach">Bank account (ACH)</option>
      </select>
      <button className="h-11 rounded-full bg-[#12352f] text-sm font-medium text-white" type="submit">Continue to Stripe</button>
    </form>
  );
}
