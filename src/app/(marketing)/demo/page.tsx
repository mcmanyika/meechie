import type { Metadata } from "next";
import { ExploreButton } from "@/components/marketing/explore-button";

export const metadata: Metadata = { title: "Demo" };

export default function DemoPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-4xl font-semibold tracking-tight">Explore the demonstration</h1>
      <p className="mt-3 text-muted-foreground">No password is required. You enter as Jordan Hale, executive director of the fictional Meechie Project workspace. A tour points through the dashboard, community records, the giveaway event, volunteers, donations, and reports.</p>
      <ul className="mt-6 space-y-2 text-sm">
        <li>Switch organizations in the header to see Northside Family Alliance without mixing records.</li>
        <li>Switch the demo role to preview finance, volunteer, sponsor, and platform views.</li>
        <li>Reset demo data from Help or Settings to restore the original sample set.</li>
        <li>Changes stay in this browser until you reset them.</li>
      </ul>
      <ExploreButton className="mt-6 h-10 px-4" />
    </main>
  );
}
