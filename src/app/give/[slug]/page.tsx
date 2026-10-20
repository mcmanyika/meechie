"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import type { PublicGivingProfile } from "@/lib/giving/types";
import { startStripeCheckout } from "@/lib/stripe/checkout-client";

export default function PublicGivePage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-stone-600">Loading…</p>}>
      <GiveForm />
    </Suspense>
  );
}

function GiveForm() {
  const params = useParams<{ slug: string }>();
  const search = useSearchParams();
  const slug = params.slug;
  const buttonId = search.get("button");
  const [profile, setProfile] = useState<PublicGivingProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState(50);
  const [method, setMethod] = useState<"card" | "ach">("card");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (search.get("canceled") === "1") toast.message("Checkout was canceled. No gift was recorded.");
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const response = await fetch(`/api/giving/${encodeURIComponent(slug)}`);
      const body = (await response.json()) as PublicGivingProfile & { error?: string };
      if (cancelled) return;
      if (!response.ok) {
        setError(body.error ?? "This give page is unavailable.");
        setProfile(null);
        setLoading(false);
        return;
      }
      setProfile(body);
      const selected = body.buttons.find((button) => button.id === buttonId) ?? body.buttons[0];
      if (selected) setAmount(selected.defaultAmount);
      setError(null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, buttonId]);

  const button = useMemo(() => {
    if (!profile) return null;
    return profile.buttons.find((item) => item.id === buttonId) ?? profile.buttons[0] ?? null;
  }, [profile, buttonId]);

  if (loading) return <p className="mx-auto max-w-md p-8 text-sm text-stone-600">Loading give page…</p>;
  if (error || !profile || !button) {
    return (
      <main className="mx-auto grid min-h-screen max-w-md content-center gap-3 p-8">
        <h1 className="text-2xl font-semibold text-stone-900">Give page unavailable</h1>
        <p className="text-sm text-stone-600">{error ?? "No active donate buttons are published for this organization."}</p>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen bg-[radial-gradient(circle_at_top,_#f7f3ee,_#ebe4da_55%,_#e2d7c8)] px-4 py-10"
      style={{ ["--give-accent" as string]: profile.primaryColor }}
    >
      <form
        className="mx-auto grid max-w-md gap-4 rounded-2xl border border-stone-200/80 bg-white/90 p-6 shadow-sm backdrop-blur"
        onSubmit={(event) => {
          event.preventDefault();
          void (async () => {
            setSubmitting(true);
            try {
              await startStripeCheckout({
                organizationId: profile.organizationId,
                name,
                email,
                amountCents: Math.round(amount * 100),
                programId: button.programId,
                type: button.type,
                method,
                returnTo: "embed",
                orgSlug: profile.slug,
              });
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Stripe Checkout is unavailable.");
              setSubmitting(false);
            }
          })();
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="grid h-11 w-11 place-items-center rounded-full text-sm font-semibold text-white"
            style={{ background: profile.primaryColor }}
          >
            {profile.logoText}
          </span>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-stone-500">Give</p>
            <h1 className="text-xl font-semibold text-stone-900">{profile.name}</h1>
          </div>
        </div>
        <p className="text-sm text-stone-600">{profile.description}</p>
        <input
          className="h-11 rounded-xl border border-stone-200 bg-white px-3 text-sm"
          placeholder="Name"
          aria-label="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          minLength={2}
        />
        <input
          className="h-11 rounded-xl border border-stone-200 bg-white px-3 text-sm"
          placeholder="Email"
          aria-label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        {button.amounts.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {button.amounts.map((preset) => (
              <button
                key={preset}
                type="button"
                className={`h-10 rounded-full border px-4 text-sm ${amount === preset ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white text-stone-800"}`}
                onClick={() => setAmount(preset)}
              >
                ${preset}
              </button>
            ))}
          </div>
        ) : null}
        <label className="grid gap-1 text-sm text-stone-600">
          Amount (USD)
          <input
            className="h-11 rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900"
            type="number"
            min={1}
            step={1}
            value={amount}
            onChange={(event) => setAmount(Number(event.target.value))}
            required
          />
        </label>
        <select
          aria-label="Payment method"
          className="h-11 rounded-xl border border-stone-200 bg-white px-3 text-sm"
          value={method}
          onChange={(event) => setMethod(event.target.value as "card" | "ach")}
        >
          <option value="card">Card</option>
          <option value="ach">Bank account (ACH)</option>
        </select>
        <p className="text-xs text-stone-500">
          {button.type === "recurring" ? "Monthly gift · " : "One-time gift · "}
          {button.programId
            ? profile.programs.find((program) => program.id === button.programId)?.name ?? "Selected program"
            : "Where the need is greatest"}
        </p>
        <button
          className="h-11 rounded-full text-sm font-medium text-white disabled:opacity-60"
          style={{ background: profile.primaryColor }}
          type="submit"
          disabled={submitting}
        >
          {submitting ? "Opening Stripe…" : button.label}
        </button>
      </form>
    </main>
  );
}
