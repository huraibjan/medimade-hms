"use client";

import { Plus, Trash2 } from "lucide-react";
import { invoiceItemTypes, type InvoiceItemInput } from "@/lib/validations/billing";
import { currency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function InvoiceItemsEditor({
  items,
  onChange
}: {
  items: InvoiceItemInput[];
  onChange: (items: InvoiceItemInput[]) => void;
}) {
  function update(index: number, patch: Partial<InvoiceItemInput>) {
    onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  function addItem() {
    onChange([...items, { item_type: "service", description: "", quantity: 1, unit_price: 0 }]);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  }

  const subtotal = items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Invoice items</Label>
        <Button type="button" size="sm" variant="outline" onClick={addItem}><Plus className="h-4 w-4" />Add item</Button>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="grid gap-3 rounded-md border p-3 lg:grid-cols-[1fr_2fr_100px_120px_110px_auto]">
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select value={item.item_type} onValueChange={(value) => update(index, { item_type: value as InvoiceItemInput["item_type"] })}>
                <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  {invoiceItemTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Input value={item.description} onChange={(event) => update(index, { description: event.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Qty</Label>
              <Input type="number" min={0.01} step="0.01" value={item.quantity} onChange={(event) => update(index, { quantity: Number(event.target.value) })} />
            </div>
            <div className="grid gap-2">
              <Label>Unit price</Label>
              <Input type="number" min={0} step="0.01" value={item.unit_price} onChange={(event) => update(index, { unit_price: Number(event.target.value) })} />
            </div>
            <div className="grid gap-2">
              <Label>Total</Label>
              <div className="flex h-10 items-center rounded-md border px-3 text-sm">{currency(Number(item.quantity || 0) * Number(item.unit_price || 0))}</div>
            </div>
            <div className="flex items-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeItem(index)} disabled={items.length === 1}>
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Remove item</span>
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="text-right text-sm font-medium">Subtotal {currency(subtotal)}</div>
    </div>
  );
}
