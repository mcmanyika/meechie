"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PRODUCT_NAME } from "@/config/constants";
import { ROLE_LABELS } from "@/lib/permissions";
import { useDemoStore } from "@/stores/demo-store";
import { LoadingBlock } from "@/components/shared/feedback";

export default function LoginPage() {
  const hydrated = useDemoStore((state) => state.hydrated);
  const users = useDemoStore((state) => state.db.users);
  const enterDemo = useDemoStore((state) => state.enterDemo);
  const router = useRouter();
  if (!hydrated) return <div className="mx-auto max-w-lg px-4 py-16"><LoadingBlock /></div>;
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-12">
      <Link href="/" className="text-sm text-muted-foreground">{PRODUCT_NAME}</Link>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Enter the demo</h1>
      <p className="mt-2 text-sm text-muted-foreground">Pick a fictional staff profile. There is no password in this concept. Production sign-in has to be enforced on the server.</p>
      <ul className="mt-6 divide-y rounded-xl border bg-card">
        {users.map((user) => (
          <li key={user.id}>
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-muted"
              onClick={() => {
                enterDemo(user.id);
                router.push(user.role === "platform_super_admin" ? "/platform" : user.role === "community_member" ? "/portal" : "/dashboard");
              }}
            >
              <span>
                <span className="block font-medium">{user.name}</span>
                <span className="text-muted-foreground">{user.email}</span>
              </span>
              <span className="text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</span>
            </button>
          </li>
        ))}
      </ul>
      <Link href="/register" className="mt-4 text-sm text-primary">Create a new organization instead</Link>
    </main>
  );
}
