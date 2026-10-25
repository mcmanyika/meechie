import Link from "next/link";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@/config/constants";
import { buttonVariants } from "@/components/ui/button";
import { ExploreButton } from "@/components/marketing/explore-button";
import { MoodSwitcher } from "@/components/theme/mood-switcher";
import { cn } from "cn";

export function SiteFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b-2 border-foreground">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-heading font-semibold">
            <span className="grid size-8 place-items-center rounded-lg border-2 border-foreground bg-primary text-xs text-primary-foreground shadow-[2px_2px_0_var(--foreground)]">
              MP
            </span>
            {PRODUCT_NAME}
          </Link>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <Link href="/portal">Community</Link>
            <Link href="/give/meechie">Give</Link>
            <Link href="/demo">Staff demo</Link>
          </nav>
          <div className="flex items-center gap-2">
            <MoodSwitcher />
            <Link href="/" className={cn(buttonVariants({ variant: "ghost" }))}>
              Log in
            </Link>
            <ExploreButton />
          </div>
        </div>
      </header>
      {children}
      <footer className="border-t-2 border-foreground">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:justify-between">
          <p>
            {PRODUCT_NAME} · <span className="text-accent">{PRODUCT_TAGLINE}</span>
          </p>
          <p>themeechieproject.org · (214) 406-5090</p>
        </div>
      </footer>
    </div>
  );
}
