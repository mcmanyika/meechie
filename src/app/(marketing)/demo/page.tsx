import type { Metadata } from "next";
import { ExploreButton } from "@/components/marketing/explore-button";

export const metadata: Metadata = { title: "Staff demo" };

export default function DemoPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-4xl font-semibold tracking-tight">Staff workspace demo</h1>
      <p className="mt-3 text-muted-foreground">
        Enter as Partson Manyika to explore The Meechie Project staff tools — programs, events, volunteers, donations, and impact reports. The workspace starts empty so you can add real records.
      </p>
      <ul className="mt-6 space-y-2 text-sm">
        <li>Reset workspace data from Help or Settings to clear local records and start fresh.</li>
        <li>Community visitors use the portal and give pages without staff login.</li>
      </ul>
      <ExploreButton className="mt-6 h-10 px-4" />
    </main>
  );
}
