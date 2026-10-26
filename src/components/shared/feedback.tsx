"use client";

import { toast } from "sonner";
import type { Result } from "@/lib/domain/workflows";

export function notify(result: Result<unknown>, success: string) {
  if (!result.ok) {
    toast.error(result.error);
    return false;
  }
  toast.success(success);
  return true;
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed bg-card px-6 py-10">
      <div>
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="mt-1 max-w-lg text-sm text-muted-foreground">{body}</p>
      </div>
      {action}
    </div>
  );
}

export function AccessDenied({
  title = "You do not have access to this page",
  body = "Sign in with a staff account that has permission for this page.",
}: {
  title?: string;
  body?: string;
}) {
  return (
    <div className="mx-auto max-w-lg py-16">
      <p className="text-xs font-medium tracking-wide text-primary uppercase">Access</p>
      <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{eyebrow}</p> : null}
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function LoadingBlock() {
  return (
    <div className="grid gap-4">
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
      </div>
      <div className="h-72 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
