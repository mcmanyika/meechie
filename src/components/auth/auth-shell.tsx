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
        <section className="relative flex min-h-[42vh] flex-col justify-between overflow-hidden bg-black px-8 py-10 text-white lg:min-h-screen lg:px-12 lg:py-14">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(29,185,84,0.35),transparent_42%),radial-gradient(circle_at_85%_75%,rgba(6,108,244,0.28),transparent_45%),radial-gradient(circle_at_50%_100%,rgba(253,242,121,0.18),transparent_40%)]"
          />
          <Link href="/" className="relative z-10 font-heading text-sm font-medium tracking-wide text-[#7bf9aa]">
            {PRODUCT_NAME}
          </Link>
          <div className="relative z-10 max-w-md">
            <p className="font-heading text-[clamp(2.75rem,6vw,4.5rem)] leading-[0.95] font-semibold tracking-tight text-white">
              {PRODUCT_NAME}
            </p>
            <p className="mt-5 max-w-sm font-heading text-base leading-relaxed text-[#066cf4]">{PRODUCT_TAGLINE}</p>
          </div>
          <p className="relative z-10 text-xs text-white/60">Dallas · themeechieproject.org</p>
        </section>

        <section className="flex min-h-[58vh] flex-col justify-center bg-white px-6 py-12 sm:px-10 lg:min-h-screen lg:px-16">
          <div className="mx-auto w-full max-w-md">
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-black">{title}</h1>
            <p className="mt-2 text-sm text-[#555555]">{description}</p>
            <div className="mt-8">{children}</div>
            {footer ? <div className="mt-6 text-sm text-[#555555]">{footer}</div> : null}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#7bf9aa33,transparent_42%),radial-gradient(circle_at_bottom_right,#fdf27955,transparent_40%),linear-gradient(180deg,#ffffff,#f7f7f7)]">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
        <Link href="/" className="font-heading text-sm font-medium text-black">
          {PRODUCT_NAME}
        </Link>
        <p className="mt-1 font-heading text-xs text-[#066cf4]">{PRODUCT_TAGLINE}</p>
        <h1 className="mt-8 font-heading text-3xl font-semibold tracking-tight text-black">{title}</h1>
        <p className="mt-2 text-sm text-[#555555]">{description}</p>
        <div className="mt-6 rounded-2xl border-2 border-black bg-white p-5 shadow-[4px_4px_0_#000]">
          {children}
        </div>
        {footer ? <div className="mt-4 text-sm text-[#555555]">{footer}</div> : null}
      </div>
    </main>
  );
}
