"use client";

import { cn } from "@/lib/utils";

export interface StatusBadgeProps {
  status: boolean | string | number;
  activeText?: string;
  inactiveText?: string;
  onToggle?: () => void;
  canToggle?: boolean;
  className?: string;
}

export default function StatusBadge({
  status,
  activeText = "Active",
  inactiveText = "Block",
  onToggle,
  canToggle = true,
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

  const isClickable = Boolean(canToggle && onToggle);

  return (
    <button
      type="button"
      onClick={isClickable ? onToggle : undefined}
      disabled={!isClickable}
      className={cn(
        "inline-flex items-center justify-center min-w-[62px] px-3 py-1 rounded text-xs font-semibold text-white transition-all shadow-xs select-none",
        isActive
          ? "bg-[#27ae60] hover:bg-[#219a52]"
          : "bg-[#e74c3c] hover:bg-[#c0392b]",
        !isClickable && "opacity-90 cursor-default",
        className
      )}
      aria-label={`Status: ${isActive ? activeText : inactiveText}`}
    >
      {isActive ? activeText : inactiveText}
    </button>
  );
}
