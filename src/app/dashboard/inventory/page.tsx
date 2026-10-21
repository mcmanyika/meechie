"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/feedback";
import { RequireAccess } from "@/components/shared/require-access";
import { useOrgRows, useSession } from "@/hooks/use-org";
import { stockOnHand } from "@/lib/domain/metrics";
import { formatDateTime, titleCase } from "@/lib/format";
import { createId } from "@/lib/ids";
import { inventorySchema, movementSchema, type InventoryFormValues, type MovementFormValues } from "@/lib/validations/schemas";
import { useDemoStore } from "@/stores/demo-store";
import type { InventoryItem } from "@/types/models";

export default function InventoryPage() {
  const items = useOrgRows("inventoryItems");
  const movements = useOrgRows("inventoryMovements");
  const events = useOrgRows("events");
  const programs = useOrgRows("programs");
  const { db, allowed } = useSession();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [moving, setMoving] = useState<InventoryItem | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const focus = items.find((item) => item.id === selected) ?? items[0];
  return (
    <RequireAccess permission="inventory.view" entitlement="inventory" feature="Inventory">
      <div className="grid gap-5">
        <PageHeader title="Inventory" actions={allowed("inventory.manage") ? <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus /> Add item</Button> : null} />
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs text-muted-foreground">
              <tr>{["Item", "Category", "Available", "Distributed", "Reorder", "Location", "Program", ""].map((heading) => <th key={heading} className="px-3 py-2 font-medium">{heading}</th>)}</tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const available = stockOnHand(db, item.id);
                const distributed = movements.filter((movement) => movement.itemId === item.id && movement.type === "distributed").reduce((sum, movement) => sum + movement.quantity, 0);
                const low = available <= item.reorderThreshold;
                return (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="px-3 py-2"><button type="button" className="font-medium hover:underline" onClick={() => setSelected(item.id)}>{item.name}</button><p className="text-xs text-muted-foreground">{item.id}</p></td>
                    <td className="px-3 py-2">{item.category}</td>
                    <td className={`px-3 py-2 ${low ? "text-rose-700" : ""}`}>{available}{low ? " · low" : ""}</td>
                    <td className="px-3 py-2">{distributed}</td>
                    <td className="px-3 py-2">{item.reorderThreshold}</td>
                    <td className="px-3 py-2">{item.location}</td>
                    <td className="px-3 py-2">{programs.find((program) => program.id === item.programId)?.name ?? "—"}</td>
                    <td className="px-3 py-2">
                      {allowed("inventory.manage") ? (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => { setEditing(item); setOpen(true); }}>Edit</Button>
                          <Button variant="ghost" size="sm" onClick={() => setMoving(item)}>Move</Button>
                        </>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {focus ? (
          <section className="rounded-xl border bg-card p-4">
            <h2 className="text-sm font-medium">Movements · {focus.name}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {movements.filter((movement) => movement.itemId === focus.id).map((movement) => (
                <li key={movement.id} className="flex justify-between gap-3">
                  <span>{titleCase(movement.type)} · {movement.quantity} · {movement.note}</span>
                  <span className="text-muted-foreground">{events.find((event) => event.id === movement.eventId)?.name ?? formatDateTime(movement.createdAt)}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <ItemDialog open={open} onOpenChange={setOpen} item={editing} />
        <MovementDialog item={moving} onOpenChange={() => setMoving(null)} />
      </div>
    </RequireAccess>
  );
}

function ItemDialog({ open, onOpenChange, item }: { open: boolean; onOpenChange: (open: boolean) => void; item?: InventoryItem | null }) {
  const programs = useOrgRows("programs");
  const { orgId } = useSession();
  const saveItem = useDemoStore((state) => state.saveItem);
  const moveStock = useDemoStore((state) => state.moveStock);
  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventorySchema),
    values: { name: item?.name ?? "", category: item?.category ?? "School supplies", reorderThreshold: item?.reorderThreshold ?? 10, location: item?.location ?? "Main storeroom", programId: item?.programId ?? "" },
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{item ? "Edit item" : "Add item"}</DialogTitle></DialogHeader>
        <form className="grid gap-3" onSubmit={form.handleSubmit((values) => {
          if (!orgId) return;
          const now = new Date().toISOString();
          const id = item?.id ?? createId("itm");
          const result = saveItem({ id, organizationId: orgId, name: values.name, category: values.category, reorderThreshold: values.reorderThreshold, location: values.location, programId: values.programId || null, createdAt: item?.createdAt ?? now, updatedAt: now }, item ? "update" : "create");
          if (!result.ok) { toast.error(result.error); return; }
          if (!item) moveStock({ itemId: id, type: "received", quantity: values.reorderThreshold > 0 ? values.reorderThreshold * 2 : 10, eventId: null, note: "Opening stock" });
          toast.success("Item saved.");
          onOpenChange(false);
        })}>
          <Input aria-label="Name" {...form.register("name")} />
          <Input aria-label="Category" {...form.register("category")} />
          <Input type="number" aria-label="Reorder threshold" {...form.register("reorderThreshold", { valueAsNumber: true })} />
          <Input aria-label="Location" {...form.register("location")} />
          <select aria-label="Program" className="h-8 rounded-lg border bg-transparent px-2 text-sm" {...form.register("programId")}>
            <option value="">No program</option>
            {programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}
          </select>
          <DialogFooter><Button type="submit">Save item</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MovementDialog({ item, onOpenChange }: { item: InventoryItem | null; onOpenChange: () => void }) {
  const events = useOrgRows("events");
  const moveStock = useDemoStore((state) => state.moveStock);
  const form = useForm<MovementFormValues>({
    resolver: zodResolver(movementSchema),
    defaultValues: { itemId: "", type: "received", quantity: 1, eventId: "", note: "" },
  });
  const itemId = item?.id ?? "";
  useEffect(() => {
    if (!itemId) return;
    form.reset({ itemId, type: "received", quantity: 1, eventId: "", note: "" });
  }, [itemId, form]);
  return (
    <Dialog open={Boolean(item)} onOpenChange={(open) => !open && onOpenChange()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Record movement</DialogTitle></DialogHeader>
        <form className="grid gap-3" onSubmit={form.handleSubmit((values) => {
          const result = moveStock({ itemId: item?.id ?? values.itemId, type: values.type, quantity: values.quantity, eventId: values.eventId || null, note: values.note || titleCase(values.type) });
          if (!result.ok) { toast.error(result.error); return; }
          toast.success("Movement recorded.");
          onOpenChange();
        })}>
          <select aria-label="Movement type" className="h-8 rounded-lg border bg-transparent px-2 text-sm" {...form.register("type")}>
            <option value="received">Stock received</option>
            <option value="distributed">Stock distributed</option>
            <option value="adjustment_in">Adjustment in</option>
            <option value="adjustment_out">Adjustment out</option>
          </select>
          <Input type="number" aria-label="Quantity" {...form.register("quantity", { valueAsNumber: true })} />
          <select aria-label="Event" className="h-8 rounded-lg border bg-transparent px-2 text-sm" {...form.register("eventId")}>
            <option value="">No event</option>
            {events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
          </select>
          <Input aria-label="Note" placeholder="Note" {...form.register("note")} />
          <DialogFooter><Button type="submit">Save movement</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
