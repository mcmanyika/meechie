import Link from "next/link";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@/config/constants";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
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
