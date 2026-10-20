import Link from "next/link";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@/config/constants";
import { buttonVariants } from "@/components/ui/button";
import { ExploreButton } from "@/components/marketing/explore-button";
import { cn } from "cn";

export function SiteFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="grid size-8 place-items-center rounded-lg bg-[#0b1f33] text-xs text-[#99f6e4]">MO</span>
            {PRODUCT_NAME}
          </Link>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <Link href="/features">Features</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/demo">Demo</Link>
            <Link href="/portal">Community portal</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/" className={cn(buttonVariants({ variant: "ghost" }))}>Log in</Link>
            <ExploreButton />
          </div>
        </div>
      </header>
      {children}
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:justify-between">
          <p>{PRODUCT_NAME} · {PRODUCT_TAGLINE}</p>
          <p>Demonstration software. Sample organizations and prices are fictional.</p>
        </div>
      </footer>
    </div>
  );
}
