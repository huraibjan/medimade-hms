"use client";

import { useState, useTransition } from "react";
import { MedicineForm } from "@/components/forms/medicine-form";
import { deactivateMedicineAction } from "@/lib/actions/inventory-actions";
import type { MedicineRecord } from "@/lib/services/pharmacy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function MedicineTable({ data, hospitalId }: { data: MedicineRecord[]; hospitalId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function deactivate(id: string) {
    startTransition(async () => {
      const result = await deactivateMedicineAction(id, hospitalId);
      setMessage(result.message);
    });
  }

  if (!data.length) {
    return <p className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">No medicines have been added yet.</p>;
  }

  return (
    <div className="space-y-3">
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Generic</TableHead>
            <TableHead>Form</TableHead>
            <TableHead>Strength</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((medicine) => (
            <TableRow key={medicine.id}>
              <TableCell className="font-medium">{medicine.name}</TableCell>
              <TableCell>{medicine.generic_name ?? "-"}</TableCell>
              <TableCell>{medicine.dosage_form}</TableCell>
              <TableCell>{medicine.strength ?? "-"}</TableCell>
              <TableCell><Badge variant={medicine.is_active ? "success" : "secondary"}>{medicine.is_active ? "active" : "inactive"}</Badge></TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">Edit</Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Edit medicine</DialogTitle>
                        <DialogDescription>Update catalog details, dosage form, manufacturer, and active status.</DialogDescription>
                      </DialogHeader>
                      <MedicineForm hospitalId={hospitalId} medicine={medicine} />
                    </DialogContent>
                  </Dialog>
                  <Button size="sm" variant="outline" disabled={isPending || !medicine.is_active} onClick={() => deactivate(medicine.id)}>
                    Deactivate
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
