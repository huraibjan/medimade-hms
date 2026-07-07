"use client";

import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { ToastPayload } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ToastRecord = ToastPayload & { id: number };

const iconMap = {
  success: CheckCircle2,
  error: XCircle,
  info: Info
};

export function Toaster() {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  useEffect(() => {
    function onToast(event: Event) {
      const detail = (event as CustomEvent<ToastPayload>).detail;
      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { id, type: "info", ...detail }]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, 4200);
    }

    window.addEventListener("medimade:toast", onToast);
    return () => window.removeEventListener("medimade:toast", onToast);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2">
      {toasts.map((item) => {
        const Icon = iconMap[item.type ?? "info"];
        return (
          <div
            key={item.id}
            className={cn(
              "flex items-start gap-3 rounded-lg border bg-white p-4 shadow-soft",
              item.type === "success" && "border-emerald-200",
              item.type === "error" && "border-red-200",
              item.type === "info" && "border-cyan-200"
            )}
          >
            <Icon
              className={cn(
                "mt-0.5 h-5 w-5 shrink-0",
                item.type === "success" && "text-emerald-600",
                item.type === "error" && "text-red-600",
                item.type === "info" && "text-primary"
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-950">{item.title}</p>
              {item.description ? <p className="mt-1 text-sm text-muted-foreground">{item.description}</p> : null}
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setToasts((current) => current.filter((toast) => toast.id !== item.id))}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
