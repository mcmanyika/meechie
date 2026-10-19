"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { MEECHIE_ORG_ID } from "@/config/constants";
import { donateSchema } from "@/lib/validations/schemas";
import { useDemoStore } from "@/stores/demo-store";

export default function PortalDonatePage() {
  const allPrograms = useDemoStore((state) => state.db.programs);
  const programs = useMemo(() => allPrograms.filter((program) => program.organizationId === MEECHIE_ORG_ID), [allPrograms]);
  const donate = useDemoStore((state) => state.portalDonate);
  const form = useForm({ resolver: zodResolver(donateSchema), defaultValues: { name: "", email: "", amount: 50, type: "one_time" as const, programId: "", method: "card_sim" as const } });
  return (
    <form className="mx-auto grid max-w-lg gap-3 pb-16" onSubmit={form.handleSubmit((values) => {
      const result = donate({
        organizationId: MEECHIE_ORG_ID,
        name: values.name,
        email: values.email,
        amountCents: Math.round(values.amount * 100),
        programId: values.programId || null,
        type: values.type,
        method: values.method,
      });
      if (!result.ok) { toast.error(result.error); return; }
      toast.success("Simulated gift recorded. No payment was processed.");
      form.reset();
    })}>
      <h1 className="text-2xl font-semibold">Give</h1>
      <p className="text-sm text-[#6b6258]">This checkout is a simulation. Do not enter a card number. A later release can connect Stripe or another provider behind the same donation record.</p>
      <input className="h-11 rounded-xl border bg-white px-3" placeholder="Name" aria-label="Name" {...form.register("name")} />
      <input className="h-11 rounded-xl border bg-white px-3" placeholder="Email" aria-label="Email" {...form.register("email")} />
      <input className="h-11 rounded-xl border bg-white px-3" type="number" min="1" step="1" aria-label="Amount in dollars" {...form.register("amount", { valueAsNumber: true })} />
      <select aria-label="Gift type" className="h-11 rounded-xl border bg-white px-3" {...form.register("type")}>
        <option value="one_time">One-time</option>
        <option value="recurring">Recurring (simulated)</option>
        <option value="corporate">Corporate</option>
      </select>
      <select aria-label="Program" className="h-11 rounded-xl border bg-white px-3" {...form.register("programId")}>
        <option value="">Where the need is greatest</option>
        {programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}
      </select>
      <select aria-label="Simulated method" className="h-11 rounded-xl border bg-white px-3" {...form.register("method")}>
        <option value="card_sim">Simulated card — no card entry</option>
        <option value="ach_sim">Simulated bank transfer</option>
        <option value="check">Mail a check later</option>
      </select>
      <button className="h-11 rounded-full bg-[#12352f] text-sm font-medium text-white" type="submit">Record simulated gift</button>
    </form>
  );
}
