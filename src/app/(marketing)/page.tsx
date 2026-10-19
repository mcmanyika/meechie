import Link from "next/link";
import { ExploreButton } from "@/components/marketing/explore-button";
import { buttonVariants } from "@/components/ui/button";
import { PRODUCT_TAGLINE } from "@/config/constants";
import { cn } from "cn";

const modules = [
  ["Community", "Households, consent, and program participation without collecting sensitive identifiers."],
  ["Events", "Registration, capacity, check-in, and a full giveaway workflow."],
  ["Volunteers", "Skills, assignments, and hours that roll into impact reports."],
  ["Fundraising", "Donors, simulated gifts, and sponsor renewals."],
  ["Inventory", "A movement ledger so stock cannot silently go negative."],
  ["Reporting", "Activity metrics kept separate from unverified outcome notes."],
];

export default function HomePage() {
  return (
    <main>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="text-sm font-medium text-primary">Nonprofit operating system</p>
          <h1 className="mt-3 max-w-xl text-5xl font-semibold tracking-tight">{PRODUCT_TAGLINE}</h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            MeechieOS gives a nonprofit one workspace for programs, events, volunteers, fundraising, and reporting. The Meechie Project in Dallas is the first demonstration organization.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ExploreButton className="h-10 px-4" />
            <Link href="/pricing" className={cn(buttonVariants({ variant: "outline" }), "h-10 px-4")}>View sample pricing</Link>
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            {[["Donations", "$48,250"], ["Families", "41"], ["Volunteers", "29"], ["Events", "4"]].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-muted px-3 py-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 text-xl font-semibold">{value}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Illustration only. Open the demo to see figures calculated from records.</p>
        </div>
      </section>
      <section className="border-y bg-card">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map(([title, body]) => (
            <article key={title}>
              <h2 className="font-medium">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-semibold">Built as a product, ready for more than one organization</h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Switch between The Meechie Project and Northside Family Alliance to see tenant isolation. A suspended sample organization shows how the platform owner can pause a workspace.
        </p>
        <Link href="/demo" className="mt-4 inline-block text-sm font-medium text-primary">How the demo works</Link>
      </section>
    </main>
  );
}
