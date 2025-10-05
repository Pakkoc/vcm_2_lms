import type { ToastActionElement } from "@/components/ui/toast";
import { toast } from "@/hooks/use-toast";

export type NotificationVariant = "success" | "error" | "info";

export type NotificationOptions = {
  title?: string;
  description?: string;
  action?: ToastActionElement;
  durationMs?: number;
};

const variantToToastVariant = (variant: NotificationVariant) => {
  if (variant === "error") {
    return "destructive" as const;
  }
  return "default" as const;
};

export const notify = (variant: NotificationVariant, options: NotificationOptions) => {
  const { title, description, action, durationMs } = options;

  toast({
    variant: variantToToastVariant(variant),
    title,
    description,
    action,
    duration: durationMs,
  });
};

export const notifySuccess = (options: NotificationOptions) => notify("success", options);
export const notifyError = (options: NotificationOptions) => notify("error", options);
export const notifyInfo = (options: NotificationOptions) => notify("info", options);
