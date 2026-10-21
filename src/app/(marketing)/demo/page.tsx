import type { Metadata } from "next";
import { ExploreButton } from "@/components/marketing/explore-button";

export const metadata: Metadata = { title: "Staff demo" };

export default function DemoPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-4xl font-semibold tracking-tight">Staff workspace demo</h1>
      <p className="mt-3 text-muted-foreground">
        Enter as Jordan Hale to explore The Meechie Project staff tools — programs, events, volunteers, donations, and impact reports. Sample people and activity records are fictional.
      </p>
      <ul className="mt-6 space-y-2 text-sm">
        <li>Use the staff role menu to preview finance, volunteer, or community views.</li>
        <li>Reset demo data from Help or Settings to restore the sample set.</li>
        <li>Community visitors use the portal and give pages without staff login.</li>
      </ul>
      <ExploreButton className="mt-6 h-10 px-4" />
    </main>
  );
}
