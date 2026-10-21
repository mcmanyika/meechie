"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isAuthConfigured, registerWithPassword } from "@/lib/firebase/auth";
import { registerUserSchema, type RegisterUserFormValues } from "@/lib/validations/schemas";
import { useDemoStore } from "@/stores/demo-store";

export default function RegisterPage() {
  const registerUser = useDemoStore((state) => state.registerUser);
  const router = useRouter();
  const form = useForm<RegisterUserFormValues>({
    resolver: zodResolver(registerUserSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  return (
    <AuthShell
      title="Create an account"
      description="Register with your name, email, and password. An admin must activate your account before you can use the staff dashboard."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/" className="font-medium text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
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
          const auth = await registerWithPassword({
            email: values.email,
            password: values.password,
            displayName: values.name,
          });
          if (!auth.ok) {
            toast.error(auth.error);
            return;
          }
          const result = registerUser({ name: values.name, email: values.email });
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success("Account created. An admin must activate it before dashboard access.");
          router.push("/pending");
        })}
      >
        <div className="grid gap-1.5">
          <Label htmlFor="register-name">Name</Label>
          <Input
            id="register-name"
            autoComplete="name"
            placeholder="Your name"
            aria-invalid={Boolean(form.formState.errors.name)}
            {...form.register("name")}
          />
          {form.formState.errors.name ? <p className="text-xs text-destructive">{form.formState.errors.name.message}</p> : null}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="register-email">Email</Label>
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(form.formState.errors.email)}
            {...form.register("email")}
          />
          {form.formState.errors.email ? <p className="text-xs text-destructive">{form.formState.errors.email.message}</p> : null}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="register-password">Password</Label>
          <Input
            id="register-password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            aria-invalid={Boolean(form.formState.errors.password)}
            {...form.register("password")}
          />
          {form.formState.errors.password ? <p className="text-xs text-destructive">{form.formState.errors.password.message}</p> : null}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="register-confirm">Confirm password</Label>
          <Input
            id="register-confirm"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            aria-invalid={Boolean(form.formState.errors.confirmPassword)}
            {...form.register("confirmPassword")}
          />
          {form.formState.errors.confirmPassword ? (
            <p className="text-xs text-destructive">{form.formState.errors.confirmPassword.message}</p>
          ) : null}
        </div>
        <Button type="submit" className="h-10" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}
