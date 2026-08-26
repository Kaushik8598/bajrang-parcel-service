"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatusBadgeProps {
  status: boolean | string | number;
  activeText?: string;
  inactiveText?: string;
  onToggle?: () => void;
  canToggle?: boolean;
  isLoading?: boolean;
  className?: string;
}

export default function StatusBadge({
  status,
  activeText = "Active",
  inactiveText = "Inactive",
  onToggle,
  canToggle = true,
  isLoading = false,
  className,
}: StatusBadgeProps) {

  // Interpret truthy status (true, 1, "1", "active", "true")
  const isActive =
    typeof status === "boolean"
      ? status
      : typeof status === "number"
      ? status === 1
      : typeof status === "string"
      ? ["active", "1", "true", "yes"].includes(status.toLowerCase().trim())
      : Boolean(status);

  const isClickable = Boolean(canToggle && onToggle && !isLoading);

  return (
    <button
      type="button"
      onClick={isClickable ? onToggle : undefined}
      disabled={!isClickable || isLoading}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 min-w-[68px] px-2.5 py-1 rounded text-xs font-semibold text-white transition-all shadow-xs select-none",
        isActive
          ? "bg-[#27ae60] hover:bg-[#219a52]"
          : "bg-[#e74c3c] hover:bg-[#c0392b]",
        isLoading && "opacity-80 cursor-wait",
        !isClickable && !isLoading && "opacity-90 cursor-default",
        className
      )}
      aria-label={`Status: ${isActive ? activeText : inactiveText}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-3 h-3 animate-spin" />
          <span className="text-[11px]">Updating...</span>
        </>
      ) : (
        isActive ? activeText : inactiveText
      )}
    </button>
  );
}
