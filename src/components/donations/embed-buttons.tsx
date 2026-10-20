"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Copy, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useOrgRows, useSession } from "@/hooks/use-org";
import { publishGivingProfile } from "@/lib/giving/publish-client";
import { createId } from "@/lib/ids";
import { donateButtonSchema, type DonateButtonFormValues } from "@/lib/validations/schemas";
import { useDemoStore } from "@/stores/demo-store";
import type { DonateButton } from "@/types/models";

function parseAmounts(value: string) {
  return value
    .split(/[,\s]+/)
    .map((part) => Number(part.trim()))
    .filter((amount) => Number.isFinite(amount) && amount > 0);
}

export function EmbedButtonsPanel() {
  const buttons = useOrgRows("donateButtons");
  const programs = useOrgRows("programs");
  const { organization, allowed } = useSession();
  const saveDonateButton = useDemoStore((state) => state.saveDonateButton);
  const deleteDonateButton = useDemoStore((state) => state.deleteDonateButton);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DonateButton | null>(null);
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    if (!organization) return;
    void publishGivingProfile({
      organization,
      buttons,
      programs,
    }).catch(() => undefined);
  }, [organization, buttons, programs]);

  const form = useForm<DonateButtonFormValues>({
    resolver: zodResolver(donateButtonSchema),
    defaultValues: {
      label: "Donate",
      amounts: "25, 50, 100, 250",
      defaultAmount: 50,
      programId: "",
      type: "one_time",
      active: true,
    },
  });

  const rows = useMemo(
    () => buttons.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [buttons],
  );

  if (!organization) return null;

  return (
    <section className="grid gap-3 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Website donate buttons</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Create a button, copy the embed code onto your website, and successful Stripe gifts update this donation ledger.
          </p>
        </div>
        {allowed("donations.manage") ? (
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              form.reset({
                label: "Donate",
                amounts: "25, 50, 100, 250",
                defaultAmount: 50,
                programId: "",
                type: "one_time",
                active: true,
              });
              setOpen(true);
            }}
          >
            <Plus /> New button
          </Button>
        ) : null}
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No embed buttons yet. Create one to get a public give link.</p>
      ) : (
        <div className="grid gap-3">
          {rows.map((button) => {
            const giveUrl = `${origin}/give/${organization.slug}?button=${button.id}`;
            const embed = `<a href="${giveUrl}" target="_blank" rel="noopener noreferrer">${button.label}</a>`;
            return (
              <article key={button.id} className="grid gap-2 rounded-lg border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{button.label}</p>
                    <p className="text-muted-foreground">
                      {button.type === "recurring" ? "Monthly" : "One-time"} · presets {button.amounts.map((amount) => `$${amount}`).join(", ") || "custom"} · default ${button.defaultAmount}
                      {button.active ? "" : " · inactive"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        await navigator.clipboard.writeText(embed);
                        toast.success("Embed code copied.");
                      }}
                    >
                      <Copy /> Copy embed
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        await navigator.clipboard.writeText(giveUrl);
                        toast.success("Give link copied.");
                      }}
                    >
                      Copy link
                    </Button>
                    {allowed("donations.manage") ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditing(button);
                            form.reset({
                              label: button.label,
                              amounts: button.amounts.join(", "),
                              defaultAmount: button.defaultAmount,
                              programId: button.programId ?? "",
                              type: button.type,
                              active: button.active,
                            });
                            setOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const result = deleteDonateButton(button.id);
                            if (!result.ok) toast.error(result.error);
                            else toast.success("Button removed.");
                          }}
                        >
                          <Trash2 />
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
                <code className="overflow-x-auto rounded-md bg-muted px-2 py-1 text-xs">{embed}</code>
              </article>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit donate button" : "New donate button"}</DialogTitle>
            <DialogDescription>Donors leave your site, pay on Stripe Checkout, then return. Completed gifts land in Donations.</DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={form.handleSubmit((values) => {
              const amounts = parseAmounts(values.amounts);
              const result = saveDonateButton(
                {
                  id: editing?.id ?? createId("btn"),
                  organizationId: organization.id,
                  label: values.label,
                  amounts,
                  defaultAmount: values.defaultAmount,
                  programId: values.programId || null,
                  type: values.type,
                  active: values.active,
                  createdAt: editing?.createdAt ?? new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
                editing ? "update" : "create",
              );
              if (!result.ok) {
                toast.error(result.error);
                return;
              }
              toast.success(editing ? "Button updated." : "Button created. Copy the embed code for your website.");
              setOpen(false);
            })}
          >
            <Input aria-label="Label" placeholder="Donate" {...form.register("label")} />
            <Input aria-label="Preset amounts" placeholder="25, 50, 100, 250" {...form.register("amounts")} />
            <Input
              aria-label="Default amount"
              type="number"
              step="1"
              min="1"
              {...form.register("defaultAmount", { valueAsNumber: true })}
            />
            <select aria-label="Gift type" className="h-8 rounded-lg border bg-transparent px-2 text-sm" {...form.register("type")}>
              <option value="one_time">One-time</option>
              <option value="recurring">Monthly</option>
            </select>
            <select aria-label="Program" className="h-8 rounded-lg border bg-transparent px-2 text-sm" {...form.register("programId")}>
              <option value="">Where the need is greatest</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...form.register("active")} />
              Active on public give page
            </label>
            <DialogFooter>
              <Button type="submit">{editing ? "Save" : "Create button"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
