import type { Metadata } from "next";

export const metadata: Metadata = { title: "Features" };

const groups = [
  ["Community CRM", "Directory, households, consent, notes, and portal assistance requests."],
  ["Programs", "Objectives, budgets, coordinators, expenses, and linked events."],
  ["Events", "Wizard, calendar, capacity, duplicate protection, check-in, and summaries."],
  ["Volunteers", "Applicants through active status, assignments, shifts, and service hours."],
  ["Fundraising", "One-time, recurring, corporate, and in-kind gifts with receipt previews."],
  ["Sponsors", "Tiers, renewals, supported programs, and a sponsor report preview."],
  ["Inventory", "Receipts, distributions, adjustments, and low-stock alerts."],
  ["Communications", "Templates, groups, and simulated sends that honor consent."],
  ["Impact", "Households, attendance, hours, gifts, expenses, and supplies from the same records."],
  ["Platform", "Plans, seats, activation, and a separate super admin role."],
];

export default function FeaturesPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="text-4xl font-semibold tracking-tight">What the workspace covers</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">Every module in the demonstration reads and writes the same local dataset. Advanced delivery such as real email or card processing is represented, not executed.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {groups.map(([title, body]) => (
          <article key={title} className="rounded-xl border bg-card p-4">
            <h2 className="font-medium">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{body}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
