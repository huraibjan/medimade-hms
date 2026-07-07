"use client";

export type ToastType = "success" | "error" | "info";

export type ToastPayload = {
  title: string;
  description?: string;
  type?: ToastType;
};

export const toast = {
  success(title: string, description?: string) {
    emitToast({ title, description, type: "success" });
  },
  error(title: string, description?: string) {
    emitToast({ title, description, type: "error" });
  },
  info(title: string, description?: string) {
    emitToast({ title, description, type: "info" });
  }
};

function emitToast(payload: ToastPayload) {
  window.dispatchEvent(new CustomEvent<ToastPayload>("medimade:toast", { detail: payload }));
}
