"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, onChange, disabled, ...props }, ref) => {
    return (
      <label
        className={cn(
          "relative inline-flex items-center justify-center cursor-pointer select-none",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          disabled={disabled}
          onChange={(e) => {
            onChange?.(e);
            onCheckedChange?.(e.target.checked);
          }}
          className="sr-only"
          {...props}
        />
        <div
          className={cn(
            "w-4 h-4 rounded border flex items-center justify-center transition-colors shadow-2xs",
            checked
              ? "bg-[#2980b9] border-[#2980b9] text-white"
              : "bg-white border-slate-300 hover:border-slate-400 text-transparent",
            className
          )}
        >
          <Check className={cn("w-3 h-3 stroke-[3] transition-opacity", checked ? "opacity-100" : "opacity-0")} />
        </div>
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";
