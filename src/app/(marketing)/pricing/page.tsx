import type { Metadata } from "next";
import Link from "next/link";
import { DEFAULT_PLANS } from "@/config/plans";
import { formatMoney } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

export const metadata: Metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="text-4xl font-semibold tracking-tight">Sample plans</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">Starter is $49 per month, Growth is $149 per month, and Enterprise is custom. These figures are for the concept and are not a billing offer.</p>
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {DEFAULT_PLANS.map((plan) => (
          <article key={plan.id} className="flex flex-col rounded-2xl border bg-card p-5">
            <h2 className="text-lg font-medium">{plan.name}</h2>
            <p className="mt-2 text-3xl font-semibold">{plan.monthlyPriceCents == null ? "Custom" : formatMoney(plan.monthlyPriceCents)}</p>
            <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
            <ul className="mt-4 flex-1 space-y-2 text-sm">{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
            <Link href="/register/organization" className={cn(buttonVariants(), "mt-6")}>Start onboarding</Link>
          </article>
        ))}
      </div>
    </main>
  );
}
