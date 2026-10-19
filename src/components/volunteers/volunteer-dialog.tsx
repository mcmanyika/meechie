"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useSession } from "@/hooks/use-org";
import { createId } from "@/lib/ids";
import { volunteerSchema, type VolunteerFormValues } from "@/lib/validations/schemas";
import { useDemoStore } from "@/stores/demo-store";
import type { Volunteer } from "@/types/models";

export function VolunteerDialog({ open, onOpenChange, volunteer }: { open: boolean; onOpenChange: (open: boolean) => void; volunteer?: Volunteer | null }) {
  const { orgId } = useSession();
  const saveVolunteer = useDemoStore((state) => state.saveVolunteer);
  const form = useForm<VolunteerFormValues>({
    resolver: zodResolver(volunteerSchema),
    values: {
      firstName: volunteer?.firstName ?? "",
      lastName: volunteer?.lastName ?? "",
      email: volunteer?.email ?? "",
      phone: volunteer?.phone ?? "",
      skills: volunteer?.skills.join(", ") ?? "",
      interests: volunteer?.interests.join(", ") ?? "",
      availability: volunteer?.availability.join(", ") ?? "",
      status: volunteer?.status ?? "applicant",
      safeguardingStatus: volunteer?.safeguardingStatus ?? "not_started",
    },
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{volunteer ? "Edit volunteer" : "Register volunteer"}</DialogTitle></DialogHeader>
        <form className="grid gap-3" onSubmit={form.handleSubmit((values) => {
          if (!orgId) return;
          const now = new Date().toISOString();
          const result = saveVolunteer({
            id: volunteer?.id ?? createId("vol"),
            organizationId: orgId,
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            phone: values.phone,
            skills: values.skills.split(",").map((item) => item.trim()).filter(Boolean),
            interests: values.interests.split(",").map((item) => item.trim()).filter(Boolean),
            availability: values.availability.split(",").map((item) => item.trim()).filter(Boolean),
            status: values.status,
            safeguardingStatus: values.safeguardingStatus,
            safeguardingNote: "Staff note in this demo. It does not confirm a background check.",
            joinedAt: volunteer?.joinedAt ?? now,
            createdAt: volunteer?.createdAt ?? now,
            updatedAt: now,
          }, volunteer ? "update" : "create");
          if (!result.ok) { toast.error(result.error); return; }
          toast.success("Volunteer saved.");
          onOpenChange(false);
        })}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="First name" aria-label="First name" {...form.register("firstName")} />
            <Input placeholder="Last name" aria-label="Last name" {...form.register("lastName")} />
            <Input placeholder="Email" aria-label="Email" {...form.register("email")} />
            <Input placeholder="Phone" aria-label="Phone" {...form.register("phone")} />
          </div>
          <Input placeholder="Skills, comma separated" aria-label="Skills" {...form.register("skills")} />
          <Input placeholder="Interests" aria-label="Interests" {...form.register("interests")} />
          <Input placeholder="Availability" aria-label="Availability" {...form.register("availability")} />
          <div className="grid gap-3 sm:grid-cols-2">
            <select aria-label="Status" className="h-8 rounded-lg border bg-transparent px-2 text-sm" {...form.register("status")}>
              <option value="applicant">Applicant</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select aria-label="Safeguarding note" className="h-8 rounded-lg border bg-transparent px-2 text-sm" {...form.register("safeguardingStatus")}>
              <option value="not_started">Safeguarding not started</option>
              <option value="in_progress">Safeguarding in progress</option>
              <option value="verified">Staff marked verified</option>
              <option value="not_required">Not required</option>
            </select>
          </div>
          <DialogFooter><Button type="submit">Save</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
