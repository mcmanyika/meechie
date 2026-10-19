"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { MEECHIE_ORG_ID } from "@/config/constants";
import { volunteerInterestSchema } from "@/lib/validations/schemas";
import { useDemoStore } from "@/stores/demo-store";

export default function PortalVolunteerPage() {
  const addInterest = useDemoStore((state) => state.addInterest);
  const form = useForm({ resolver: zodResolver(volunteerInterestSchema), defaultValues: { name: "", email: "", phone: "", interests: "", availability: "" } });
  return (
    <form className="mx-auto grid max-w-lg gap-3 pb-16" onSubmit={form.handleSubmit((values) => {
      const result = addInterest({ organizationId: MEECHIE_ORG_ID, ...values });
      if (!result.ok) { toast.error(result.error); return; }
      toast.success("Interest received in the demo volunteer queue.");
      form.reset();
    })}>
      <h1 className="text-2xl font-semibold">Volunteer</h1>
      <p className="text-sm text-[#6b6258]">Tell us when you can help. This does not start a background check.</p>
      <input className="h-11 rounded-xl border bg-white px-3" placeholder="Name" aria-label="Name" {...form.register("name")} />
      <input className="h-11 rounded-xl border bg-white px-3" placeholder="Email" aria-label="Email" {...form.register("email")} />
      <input className="h-11 rounded-xl border bg-white px-3" placeholder="Phone" aria-label="Phone" {...form.register("phone")} />
      <input className="h-11 rounded-xl border bg-white px-3" placeholder="Interests" aria-label="Interests" {...form.register("interests")} />
      <input className="h-11 rounded-xl border bg-white px-3" placeholder="Availability" aria-label="Availability" {...form.register("availability")} />
      <button className="h-11 rounded-full bg-[#12352f] text-sm font-medium text-white" type="submit">Submit interest</button>
    </form>
  );
}
