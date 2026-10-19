"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOrgRows, useSession } from "@/hooks/use-org";
import { createId } from "@/lib/ids";
import { memberSchema, type MemberFormValues } from "@/lib/validations/schemas";
import { useDemoStore } from "@/stores/demo-store";
import type { CommunityMember } from "@/types/models";

export function MemberDialog({
  open,
  onOpenChange,
  member,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: CommunityMember | null;
}) {
  const households = useOrgRows("households");
  const members = useOrgRows("members");
  const { orgId } = useSession();
  const saveMember = useDemoStore((state) => state.saveMember);
  const saveHousehold = useDemoStore((state) => state.saveHousehold);
  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: valuesFrom(member, households[0]?.id ?? ""),
  });

  useEffect(() => {
    form.reset(valuesFrom(member, households[0]?.id ?? ""));
  }, [member, open, form, households]);

  const isMinor = form.watch("isMinor");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{member ? "Edit community member" : "Add community member"}</DialogTitle>
          <DialogDescription>Household contact only. Do not enter government IDs or medical details.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={form.handleSubmit((values) => {
            if (!orgId) return;
            let householdId = values.householdId;
            if (householdId === "new") {
              const created = saveHousehold(
                {
                  id: createId("hh"),
                  organizationId: orgId,
                  name: `${values.lastName} Household`,
                  city: values.city,
                  neighborhood: values.city,
                  postalCode: "75215",
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
                "create",
              );
              if (!created.ok) {
                toast.error(created.error);
                return;
              }
              householdId = created.data.id;
            }
            const now = new Date().toISOString();
            const next: CommunityMember = {
              id: member?.id ?? createId("mem"),
              organizationId: orgId,
              householdId,
              firstName: values.firstName,
              lastName: values.lastName,
              email: values.isMinor || !values.email ? null : values.email,
              phone: values.isMinor || !values.phone ? null : values.phone,
              city: values.city,
              isMinor: values.isMinor,
              guardianMemberId: values.isMinor ? values.guardianMemberId : null,
              preferredChannel: values.preferredChannel,
              consentEmail: values.isMinor ? false : values.consentEmail,
              consentSms: values.isMinor ? false : values.consentSms,
              consentWhatsapp: values.isMinor ? false : values.consentWhatsapp,
              status: values.status,
              registeredAt: member?.registeredAt ?? now,
              createdAt: member?.createdAt ?? now,
              updatedAt: now,
            };
            const result = saveMember(next, member ? "update" : "create");
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success(member ? "Member updated." : "Member added.");
            onOpenChange(false);
          })}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="First name" error={form.formState.errors.firstName?.message}>
              <Input {...form.register("firstName")} />
            </Field>
            <Field label="Last name" error={form.formState.errors.lastName?.message}>
              <Input {...form.register("lastName")} />
            </Field>
          </div>
          <Field label="Household" error={form.formState.errors.householdId?.message}>
            <select className="h-8 w-full rounded-lg border bg-transparent px-2 text-sm" {...form.register("householdId")}>
              <option value="new">Create a new household</option>
              {households.map((household) => (
                <option key={household.id} value={household.id}>
                  {household.name}
                </option>
              ))}
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register("isMinor")} />
            Child record, managed by a guardian
          </label>
          {isMinor ? (
            <Field label="Guardian" error={form.formState.errors.guardianMemberId?.message}>
              <select className="h-8 w-full rounded-lg border bg-transparent px-2 text-sm" {...form.register("guardianMemberId")}>
                <option value="">Select a guardian</option>
                {members
                  .filter((item) => !item.isMinor)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.firstName} {item.lastName}
                    </option>
                  ))}
              </select>
            </Field>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Email" error={form.formState.errors.email?.message}>
                <Input type="email" {...form.register("email")} />
              </Field>
              <Field label="Phone" error={form.formState.errors.phone?.message}>
                <Input {...form.register("phone")} />
              </Field>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="City">
              <Input {...form.register("city")} />
            </Field>
            <Field label="Channel">
              <select className="h-8 w-full rounded-lg border bg-transparent px-2 text-sm" {...form.register("preferredChannel")}>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="phone">Phone</option>
              </select>
            </Field>
            <Field label="Status">
              <select className="h-8 w-full rounded-lg border bg-transparent px-2 text-sm" {...form.register("status")}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="waitlist">Waitlist</option>
              </select>
            </Field>
          </div>
          {isMinor ? null : (
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" {...form.register("consentEmail")} /> Email
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" {...form.register("consentSms")} /> SMS
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" {...form.register("consentWhatsapp")} /> WhatsApp
              </label>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save member</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function valuesFrom(member: CommunityMember | null | undefined, householdId: string): MemberFormValues {
  return {
    firstName: member?.firstName ?? "",
    lastName: member?.lastName ?? "",
    email: member?.email ?? "",
    phone: member?.phone ?? "",
    householdId: member?.householdId ?? householdId,
    city: member?.city ?? "Dallas",
    preferredChannel: member?.preferredChannel ?? "email",
    status: member?.status ?? "active",
    isMinor: member?.isMinor ?? false,
    guardianMemberId: member?.guardianMemberId ?? "",
    consentEmail: member?.consentEmail ?? true,
    consentSms: member?.consentSms ?? false,
    consentWhatsapp: member?.consentWhatsapp ?? false,
  };
}
