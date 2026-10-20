"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoadingBlock } from "@/components/shared/feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO_ADMIN_USER_ID } from "@/config/constants";
import { isAuthConfigured, signInWithPassword } from "@/lib/firebase/auth";
import { loginSchema, type LoginFormValues } from "@/lib/validations/schemas";
import { useDemoStore } from "@/stores/demo-store";

function destinationForRole(role: string) {
  if (role === "platform_super_admin") return "/platform";
  if (role === "community_member" || role === "volunteer" || role === "sponsor") return "/portal";
  return "/dashboard";
}

export function LoginForm() {
  const hydrated = useDemoStore((state) => state.hydrated);
  const enterByEmail = useDemoStore((state) => state.enterByEmail);
  const enterDemo = useDemoStore((state) => state.enterDemo);
  const router = useRouter();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <LoadingBlock />
      </div>
    );
  }

  return (
    <AuthShell
      title="Sign in"
      description="Use the email and password for your MeechieOS account."
      footer={
        <>
          New organization?{" "}
          <Link href="/register" className="font-medium text-[#12352f] underline-offset-4 hover:underline">
            Create an account
          </Link>
          {" · "}
          <button
            type="button"
            className="font-medium text-[#12352f] underline-offset-4 hover:underline"
            onClick={() => {
              enterDemo(DEMO_ADMIN_USER_ID);
              router.push("/dashboard");
            }}
          >
            Explore the demo
          </button>
        </>
      }
    >
      <form
        className="grid gap-4"
        onSubmit={form.handleSubmit(async (values) => {
          if (!isAuthConfigured()) {
            toast.error("Authentication is not configured. Add Firebase web config to continue.");
            return;
          }
          const auth = await signInWithPassword(values.email, values.password);
          if (!auth.ok) {
            toast.error(auth.error);
            return;
          }
          const session = enterByEmail(auth.data.email ?? values.email);
          if (!session.ok) {
            toast.error(session.error);
            return;
          }
          toast.success("Signed in.");
          router.push(destinationForRole(session.data.role));
        })}
      >
        <div className="grid gap-1.5">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@organization.org"
            aria-invalid={Boolean(form.formState.errors.email)}
            {...form.register("email")}
          />
          {form.formState.errors.email ? <p className="text-xs text-destructive">{form.formState.errors.email.message}</p> : null}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="login-password">Password</Label>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={Boolean(form.formState.errors.password)}
            {...form.register("password")}
          />
          {form.formState.errors.password ? <p className="text-xs text-destructive">{form.formState.errors.password.message}</p> : null}
        </div>
        <Button type="submit" className="h-10" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}
