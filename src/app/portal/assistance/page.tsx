"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { MEECHIE_ORG_ID } from "@/config/constants";
import { assistanceSchema } from "@/lib/validations/schemas";
import { useDemoStore } from "@/stores/demo-store";

export default function PortalAssistancePage() {
  const addAssistance = useDemoStore((state) => state.addAssistance);
  const form = useForm({
    resolver: zodResolver(assistanceSchema),
    defaultValues: { contactName: "", contactMethod: "email" as const, contactValue: "", neighborhood: "", requestType: "Food assistance", message: "" },
  });
  return (
    <form className="mx-auto grid max-w-lg gap-3 pb-16" onSubmit={form.handleSubmit((values) => {
      const result = addAssistance({ organizationId: MEECHIE_ORG_ID, ...values });
      if (!result.ok) { toast.error(result.error); return; }
      toast.success("Request saved for the community team in this demo.");
      form.reset();
    })}>
      <h1 className="text-2xl font-semibold">Request assistance</h1>
      <p className="text-sm text-[#555555]">Share a way to reach you and the kind of help you want. Do not include medical details, government IDs, or information about children.</p>
      <input className="h-11 rounded-xl border bg-white px-3" placeholder="Your name" aria-label="Your name" {...form.register("contactName")} />
      <select aria-label="Contact method" className="h-11 rounded-xl border bg-white px-3" {...form.register("contactMethod")}>
        <option value="email">Email</option>
        <option value="phone">Phone</option>
      </select>
      <input className="h-11 rounded-xl border bg-white px-3" placeholder="Email or phone" aria-label="Contact value" {...form.register("contactValue")} />
      <input className="h-11 rounded-xl border bg-white px-3" placeholder="Neighborhood" aria-label="Neighborhood" {...form.register("neighborhood")} />
      <select aria-label="Request type" className="h-11 rounded-xl border bg-white px-3" {...form.register("requestType")}>
        <option>Food assistance</option>
        <option>School supplies</option>
        <option>Program information</option>
        <option>Other community resource</option>
      </select>
      <textarea className="min-h-28 rounded-xl border bg-white px-3 py-2" placeholder="How can the team follow up?" aria-label="Message" {...form.register("message")} />
      <button className="h-11 rounded-full bg-[#1db954] text-sm font-medium text-white" type="submit">Submit request</button>
    </form>
  );
}
