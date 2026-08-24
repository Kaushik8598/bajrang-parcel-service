"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-black group-[.toaster]:border group-[.toaster]:border-black group-[.toaster]:shadow-lg group-[.toaster]:rounded font-sans text-xs font-semibold",
          description: "group-[.toast]:text-slate-600 font-normal text-[11px]",
          actionButton:
            "group-[.toast]:bg-black group-[.toast]:text-white font-semibold text-xs rounded",
          cancelButton:
            "group-[.toast]:bg-slate-100 group-[.toast]:text-slate-700 font-semibold text-xs rounded",
          closeButton:
            "group-[.toast]:bg-white group-[.toast]:border-black group-[.toast]:text-black",
          success:
            "group-[.toaster]:bg-green-50 group-[.toaster]:text-green-900 group-[.toaster]:border-green-600",
          error:
            "group-[.toaster]:bg-red-50 group-[.toaster]:text-red-900 group-[.toaster]:border-red-600",
          warning:
            "group-[.toaster]:bg-amber-50 group-[.toaster]:text-amber-900 group-[.toaster]:border-amber-600",
          info:
            "group-[.toaster]:bg-blue-50 group-[.toaster]:text-blue-900 group-[.toaster]:border-blue-600",
        },
      }}
      {...props}
    />
  );
}
