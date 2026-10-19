"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  if (!hydrated || !org) return <div className="mx-auto max-w-3xl px-4 py-10"><LoadingBlock /></div>;
  return (
    <div className="min-h-screen bg-[#f6f3ec] text-[#1c1915]">
      <header className="border-b border-[#e4dccf] bg-[#fffdf8]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4">
          <Link href="/portal" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full text-sm font-semibold text-white" style={{ background: org.secondaryColor }}>{org.logoText}</span>
            <span>
              <span className="block text-sm font-semibold">{org.name}</span>
              <span className="block text-xs text-[#6b6258]">{org.city}, {org.state}</span>
            </span>
          </Link>
          <nav className="hidden gap-4 text-sm md:flex">
            {links.map(([href, label]) => (
              <Link key={href} href={href} className={cn(pathname === href && "font-semibold")} aria-current={pathname === href ? "page" : undefined}>{label}</Link>
            ))}
          </nav>
          <Link href="/dashboard" className="text-sm underline">Staff demo</Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 grid grid-cols-4 border-t border-[#e4dccf] bg-[#fffdf8] text-center text-xs md:hidden">
        {links.slice(1).map(([href, label]) => (
          <Link key={href} href={href} className="px-2 py-3">{label}</Link>
        ))}
        <Link href="/portal" className="px-2 py-3">Home</Link>
      </nav>
      <footer className="mx-auto max-w-5xl px-4 pt-8 pb-24 text-xs text-[#6b6258] md:pb-8">
        Public preview inside {PRODUCT_NAME}. Records are fictional. Placeholder mark, not an official logo.
      </footer>
    </div>
  );
}
