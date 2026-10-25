import Link from "next/link";
import { MoodSwitcher } from "@/components/theme/mood-switcher";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@/config/constants";

export function AuthShell({
  title,
  description,
  children,
  footer,
  variant = "centered",
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  variant?: "centered" | "split";
}) {
  if (variant === "split") {
    return (
      <main className="relative grid min-h-screen lg:grid-cols-2">
        <div className="absolute top-4 right-4 z-20 lg:right-8">
          <MoodSwitcher />
        </div>
        <section className="relative flex min-h-[42vh] flex-col justify-between overflow-hidden bg-black px-8 py-10 text-white lg:min-h-screen lg:px-12 lg:py-14">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,var(--mood-glow-a),transparent_42%),radial-gradient(circle_at_85%_75%,var(--mood-glow-b),transparent_45%)]"
          />
          <Link href="/" className="relative z-10 font-heading text-sm font-medium tracking-wide text-primary">
            {PRODUCT_NAME}
          </Link>
          <div className="relative z-10 max-w-md">
            <p className="font-heading text-[clamp(2.75rem,6vw,4.5rem)] leading-[0.95] font-semibold tracking-tight text-white">
              {PRODUCT_NAME}
            </p>
            <p className="mt-5 max-w-sm font-heading text-base leading-relaxed text-secondary">{PRODUCT_TAGLINE}</p>
          </div>
          <p className="relative z-10 text-xs text-white/60">Dallas · themeechieproject.org</p>
        </section>

        <section className="flex min-h-[58vh] flex-col justify-center bg-background px-6 py-12 sm:px-10 lg:min-h-screen lg:px-16">
          <div className="mx-auto w-full max-w-md">
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            <div className="mt-8">{children}</div>
            {footer ? <div className="mt-6 text-sm text-muted-foreground">{footer}</div> : null}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute top-4 right-4 z-20">
        <MoodSwitcher />
      </div>
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
        <Link href="/" className="font-heading text-sm font-medium text-foreground">
          {PRODUCT_NAME}
        </Link>
        <p className="mt-1 font-heading text-xs text-accent">{PRODUCT_TAGLINE}</p>
        <h1 className="mt-8 font-heading text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-6 rounded-2xl border-2 border-foreground bg-card p-5 shadow-[4px_4px_0_var(--foreground)]">
          {children}
        </div>
        {footer ? <div className="mt-4 text-sm text-muted-foreground">{footer}</div> : null}
      </div>
    </main>
  );
}
