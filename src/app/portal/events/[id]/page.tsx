"use client";

import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { MEECHIE_ORG_ID } from "@/config/constants";
import { activeRegistrationCount } from "@/lib/domain/metrics";
import { formatDateTime } from "@/lib/format";
import { useDemoStore } from "@/stores/demo-store";

const schema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().min(7),
  city: z.string().trim().min(2),
  neighborhood: z.string().trim().min(2),
  consentEmail: z.boolean(),
});

export default function PortalEventPage() {
  const params = useParams<{ id: string }>();
  const db = useDemoStore((state) => state.db);
  const register = useDemoStore((state) => state.portalRegister);
  const event = db.events.find((item) => item.id === params.id && item.organizationId === MEECHIE_ORG_ID);
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { firstName: "", lastName: "", email: "", phone: "", city: "Dallas", neighborhood: "", consentEmail: true } });
  if (!event) return <p>That event is not on this portal.</p>;
  const open = event.status === "registration_open";
  const spots = event.capacity - activeRegistrationCount(db, event.id);
  return (
    <div className="grid gap-4 pb-16">
      <article className="rounded-2xl bg-white p-5">
        <h1 className="text-2xl font-semibold">{event.name}</h1>
        <p className="mt-2 text-sm text-[#6b6258]">{event.description}</p>
        <p className="mt-3 text-sm">{formatDateTime(event.startAt)} · {event.location}, {event.city}</p>
        <p className="text-sm">{spots} spots remaining</p>
      </article>
      {open ? (
        <form className="grid gap-3 rounded-2xl bg-white p-5" onSubmit={form.handleSubmit((values) => {
          const result = register({ organizationId: MEECHIE_ORG_ID, eventId: event.id, ...values });
          if (!result.ok) { toast.error(result.error); return; }
          toast.success("You are registered in the demo. Staff can see this on the event page.");
          form.reset();
        })}>
          <h2 className="font-medium">Register</h2>
          <input className="h-11 rounded-xl border px-3" placeholder="First name" aria-label="First name" {...form.register("firstName")} />
          <input className="h-11 rounded-xl border px-3" placeholder="Last name" aria-label="Last name" {...form.register("lastName")} />
          <input className="h-11 rounded-xl border px-3" placeholder="Email" aria-label="Email" {...form.register("email")} />
          <input className="h-11 rounded-xl border px-3" placeholder="Phone" aria-label="Phone" {...form.register("phone")} />
          <input className="h-11 rounded-xl border px-3" placeholder="City" aria-label="City" {...form.register("city")} />
          <input className="h-11 rounded-xl border px-3" placeholder="Neighborhood" aria-label="Neighborhood" {...form.register("neighborhood")} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register("consentEmail")} /> Email me about this registration. You can ask staff to remove consent later.</label>
          <button type="submit" className="h-11 rounded-full bg-[#12352f] text-sm font-medium text-white">Submit registration</button>
        </form>
      ) : <p className="rounded-2xl bg-white p-5 text-sm">Registration is not open for this event.</p>}
    </div>
  );
}
