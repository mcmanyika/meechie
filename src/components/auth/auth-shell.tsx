import Link from "next/link";
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
      <main className="grid min-h-screen lg:grid-cols-2">
        <section className="relative flex min-h-[42vh] flex-col justify-between overflow-hidden bg-[#12352f] px-8 py-10 text-[#e8f2ef] lg:min-h-screen lg:px-12 lg:py-14">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(153,246,228,0.22),transparent_42%),radial-gradient(circle_at_80%_70%,rgba(214,184,120,0.18),transparent_45%),linear-gradient(160deg,#0d2a25_0%,#12352f_48%,#1a4540_100%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.04))]"
          />
          <Link href="/" className="relative z-10 text-sm font-medium tracking-wide text-[#99f6e4]">
            {PRODUCT_NAME}
          </Link>
          <div className="relative z-10 max-w-md">
            <p className="text-[clamp(2.75rem,6vw,4.5rem)] leading-[0.95] font-semibold tracking-tight text-white">
              {PRODUCT_NAME}
            </p>
            <p className="mt-5 max-w-sm text-base leading-relaxed text-[#c5ddd6]">{PRODUCT_TAGLINE}</p>
          </div>
          <p className="relative z-10 text-xs text-[#8fb5ab]">Dallas · themeechieproject.org</p>
        </section>

        <section className="flex min-h-[58vh] flex-col justify-center bg-[#f7f4ee] px-6 py-12 sm:px-10 lg:min-h-screen lg:px-16">
          <div className="mx-auto w-full max-w-md">
            <h1 className="text-3xl font-semibold tracking-tight text-[#12352f]">{title}</h1>
            <p className="mt-2 text-sm text-[#6b6258]">{description}</p>
            <div className="mt-8">{children}</div>
            {footer ? <div className="mt-6 text-sm text-[#6b6258]">{footer}</div> : null}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#dce8e4,transparent_42%),radial-gradient(circle_at_bottom_right,#efe8d8,transparent_40%),linear-gradient(180deg,#f7f4ee,#eef3f1)]">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
        <Link href="/" className="text-sm font-medium text-[#12352f]">
          {PRODUCT_NAME}
        </Link>
        <p className="mt-1 text-xs text-[#6b6258]">{PRODUCT_TAGLINE}</p>
        <h1 className="mt-8 text-3xl font-semibold tracking-tight text-[#12352f]">{title}</h1>
        <p className="mt-2 text-sm text-[#6b6258]">{description}</p>
        <div className="mt-6 rounded-2xl border border-[#12352f]/10 bg-white/90 p-5 shadow-sm backdrop-blur">
          {children}
        </div>
        {footer ? <div className="mt-4 text-sm text-[#6b6258]">{footer}</div> : null}
      </div>
    </main>
  );
}
