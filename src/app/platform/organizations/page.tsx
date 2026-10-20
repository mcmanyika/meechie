"use client";

import Link from "next/link";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/feedback";
import { StatusBadge } from "@/components/shared/status-badge";
import { useSession } from "@/hooks/use-org";
import { hasPermission } from "@/lib/permissions";
import { useDemoStore } from "@/stores/demo-store";

export default function OrganizationsPage() {
  const { db, user } = useSession();
  const setStatus = useDemoStore((state) => state.setOrganizationStatus);
  if (!user || !hasPermission(user.role, "platform.manage")) return <p className="text-sm">Switch to the platform super admin demo to manage organizations.</p>;
  return (
    <div className="grid gap-5">
      <PageHeader title="Organizations" description="Each tenant keeps its own records. Creating a workspace starts at registration." actions={<Link href="/register/organization" className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">New organization</Link>} />
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-xs text-muted-foreground"><tr>{["Organization", "Location", "People", "Events", "Status", ""].map((heading) => <th key={heading} className="px-3 py-2">{heading}</th>)}</tr></thead>
          <tbody>
            {db.organizations.map((org) => (
              <tr key={org.id} className="border-b last:border-0">
                <td className="px-3 py-3 font-medium">{org.name}</td>
                <td className="px-3 py-3">{org.city}, {org.state}</td>
                <td className="px-3 py-3">{db.members.filter((member) => member.organizationId === org.id).length}</td>
                <td className="px-3 py-3">{db.events.filter((event) => event.organizationId === org.id).length}</td>
                <td className="px-3 py-3"><StatusBadge value={org.status} /></td>
                <td className="px-3 py-3">
                  {org.status === "suspended" ? (
                    <button type="button" className="text-sm underline" onClick={() => { const result = setStatus(org.id, "active"); if (!result.ok) toast.error(result.error); else toast.success("Organization activated."); }}>Activate</button>
                  ) : (
                    <button type="button" className="text-sm underline" onClick={() => { const result = setStatus(org.id, "suspended"); if (!result.ok) toast.error(result.error); else toast.success("Organization suspended."); }}>Suspend</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
