import { toast as sonnerToast, ExternalToast } from "sonner";

export type ToastType = "success" | "error" | "info" | "warning" | "loading";

export interface ToastOptions extends ExternalToast {
  description?: string;
  duration?: number;
}

/**
 * Common Toast Function to display toast messages directly with type and message
 * 
 * @example
 * showToast("success", "Login successful");
 * showToast("error", "Invalid credentials", "Please verify your username and password.");
 * showToast("warning", "Please fill required fields");
 * showToast("info", "New update available");
 */
export function showToast(
  type: ToastType,
  message: string,
  descriptionOrOptions?: string | ToastOptions
): string | number {
  const options: ToastOptions =
    typeof descriptionOrOptions === "string"
      ? { description: descriptionOrOptions }
      : descriptionOrOptions || {};

  switch (type) {
    case "success":
      return sonnerToast.success(message, options);
    case "error":
      return sonnerToast.error(message, options);
    case "warning":
      return sonnerToast.warning(message, options);
    case "info":
      return sonnerToast.info(message, options);
    case "loading":
      return sonnerToast.loading(message, options);
    default:
      return sonnerToast(message, options);
  }
}

/**
 * Direct toast helper object with type methods:
 * toast.success(message, options)
 * toast.error(message, options)
 * toast.warning(message, options)
 * toast.info(message, options)
 * toast.dismiss(id)
 */
export const toast = Object.assign(
  (typeOrMessage: ToastType | string, messageOrOptions?: string | ToastOptions) => {
    if (
      typeof typeOrMessage === "string" &&
      ["success", "error", "warning", "info", "loading"].includes(typeOrMessage) &&
      typeof messageOrOptions === "string"
    ) {
      return showToast(typeOrMessage as ToastType, messageOrOptions);
    }
    if (typeof typeOrMessage === "string") {
      return sonnerToast(typeOrMessage, typeof messageOrOptions === "object" ? messageOrOptions : undefined);
    }
    return sonnerToast(typeOrMessage);
  },
  {
    success: (message: string, options?: ToastOptions) => sonnerToast.success(message, options),
    error: (message: string, options?: ToastOptions) => sonnerToast.error(message, options),
    warning: (message: string, options?: ToastOptions) => sonnerToast.warning(message, options),
    info: (message: string, options?: ToastOptions) => sonnerToast.info(message, options),
    loading: (message: string, options?: ToastOptions) => sonnerToast.loading(message, options),
    dismiss: (id?: string | number) => sonnerToast.dismiss(id),
    promise: sonnerToast.promise,
  }
);

export default showToast;
