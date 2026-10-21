"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { MEECHIE_ORG_ID, PRODUCT_NAME } from "@/config/constants";
import { useDemoStore } from "@/stores/demo-store";
import { LoadingBlock } from "@/components/shared/feedback";
import { cn } from "cn";

const links = [
  ["/portal", "Home"],
  ["/portal/events", "Events"],
  ["/portal/volunteer", "Volunteer"],
  ["/portal/donate", "Give"],
  ["/portal/assistance", "Assistance"],
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const hydrated = useDemoStore((state) => state.hydrated);
  const org = useDemoStore((state) => state.db.organizations.find((item) => item.id === MEECHIE_ORG_ID));
  const userId = useDemoStore((state) => state.userId);
  const user = useDemoStore((state) => state.db.users.find((item) => item.id === userId));
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && user?.accountStatus === "pending") {
      router.replace("/pending");
    }
  }, [hydrated, user, router]);

  if (!hydrated || !org || user?.accountStatus === "pending") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <LoadingBlock />
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-white text-black">
      <header className="border-b-2 border-black bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4">
          <Link href="/portal" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full border-2 border-black text-sm font-semibold text-white shadow-[2px_2px_0_#000]" style={{ background: org.primaryColor }}>{org.logoText}</span>
            <span>
              <span className="block text-sm font-semibold">{org.name}</span>
              <span className="block text-xs text-[#555555]">{org.city}, {org.state}</span>
            </span>
          </Link>
          <nav className="hidden gap-4 text-sm md:flex">
            {links.map(([href, label]) => (
              <Link key={href} href={href} className={cn(pathname === href && "font-semibold text-[#1db954]")} aria-current={pathname === href ? "page" : undefined}>{label}</Link>
            ))}
          </nav>
          <Link href="/dashboard" className="text-sm underline">Staff demo</Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 grid grid-cols-4 border-t-2 border-black bg-white text-center text-xs md:hidden">
        {links.slice(1).map(([href, label]) => (
          <Link key={href} href={href} className="px-2 py-3">{label}</Link>
        ))}
        <Link href="/portal" className="px-2 py-3">Home</Link>
      </nav>
      <footer className="mx-auto max-w-5xl px-4 pt-8 pb-24 text-xs text-[#555555] md:pb-8">
        Public community pages for {PRODUCT_NAME}.
      </footer>
    </div>
  );
}
