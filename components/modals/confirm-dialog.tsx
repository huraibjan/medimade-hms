"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function ConfirmDialog({
  trigger,
  triggerLabel = "Confirm",
  title = "Confirm action",
  description = "This action will be audited and may affect hospital records.",
  confirmLabel = "Confirm",
  destructive = false,
  disabled = false,
  onConfirm
}: {
  trigger?: ReactNode;
  triggerLabel?: string;
  title?: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
  disabled?: boolean;
  onConfirm?: () => void;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="outline">{triggerLabel}</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant={destructive ? "destructive" : "default"} disabled={disabled} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
