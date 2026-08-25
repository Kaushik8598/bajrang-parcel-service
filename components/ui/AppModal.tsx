"use client";

import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export interface AppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  className?: string;
  bodyClassName?: string;
  footerClassName?: string;
  showCloseButton?: boolean;
  /** Whether clicking outside closes the modal. Defaults to false. */
  closeOnOutsideClick?: boolean;
}

/**
 * Universal Reusable Modal Component
 * Prevents accidental close when clicking outside by default.
 * Provides clean fixed header/footer with smooth scrollable body.
 */
export default function AppModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  maxWidth = "sm:max-w-[640px]",
  className,
  bodyClassName,
  footerClassName,
  showCloseButton = true,
  closeOnOutsideClick = false,
}: AppModalProps) {
  const handleOpenChange = (nextOpen: boolean, eventDetails?: { reason?: string }) => {
    // If attempting to close via outside click and closeOnOutsideClick is false, prevent closing
    if (!nextOpen && !closeOnOutsideClick && eventDetails?.reason === "outside-press") {
      return;
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      disablePointerDismissal={!closeOnOutsideClick}
    >
      <DialogContent
        showCloseButton={false}
        className={cn(
          "w-full bg-white rounded-xl shadow-2xl p-0 border border-slate-200 gap-2 overflow-hidden flex flex-col max-h-[90vh]",
          maxWidth,
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-300 bg-white rounded-t-xl shrink-0">
          <DialogHeader className="p-0 space-y-0.5">
            <DialogTitle className="text-xl font-bold text-black tracking-tight">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="text-xs text-slate-500">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>

          {showCloseButton && (
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="p-1 rounded-md text-slate-400 hover:text-black hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
              <span className="sr-only">Close</span>
            </button>
          )}
        </div>

        {/* Content Body with smooth scroll */}
        <div
          className={cn(
            "px-4 py-3 overflow-y-auto flex-1 overscroll-contain space-y-3",
            bodyClassName
          )}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className={cn(
              "flex items-center justify-end gap-2.5 px-4 py-2 border-t border-slate-300 bg-slate-50/90 rounded-b-xl shrink-0",
              footerClassName
            )}
          >
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
