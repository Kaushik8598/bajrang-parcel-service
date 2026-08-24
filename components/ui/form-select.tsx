"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import SearchableSelect, { SearchableSelectOption } from "@/components/ui/searchable-select";

export interface FormSelectProps {
  label?: string;
  required?: boolean;
  error?: string | boolean;
  helperText?: string;
  options: (SearchableSelectOption | string | number)[];
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
  id?: string;
}

export function FormSelect({
  label,
  required = false,
  error,
  helperText,
  options,
  value,
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  disabled = false,
  className,
  containerClassName,
}: FormSelectProps) {
  const hasError = Boolean(error);
  const errorMessage = typeof error === "string" ? error : undefined;

  // Normalize options to SearchableSelectOption[]
  const normalizedOptions: SearchableSelectOption[] = options.map((opt) => {
    if (typeof opt === "object" && opt !== null && "value" in opt) {
      return opt as SearchableSelectOption;
    }
    return {
      value: String(opt),
      label: String(opt),
    };
  });

  return (
    <div className={cn("space-y-1.5 w-full", containerClassName)}>
      {label && (
        <Label className="text-xs font-semibold text-slate-700 flex items-center gap-0.5">
          {label}
          {required && <span className="text-red-500 font-bold">*</span>}
        </Label>
      )}

      <SearchableSelect
        options={normalizedOptions}
        value={String(value)}
        onChange={onChange}
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder}
        disabled={disabled}
        error={hasError}
        className={className}
      />

      {hasError && errorMessage && (
        <p className="text-[11px] text-red-500 font-medium leading-tight">
          {errorMessage}
        </p>
      )}

      {!hasError && helperText && (
        <p className="text-[11px] text-slate-400 leading-tight">
          {helperText}
        </p>
      )}
    </div>
  );
}

export default FormSelect;
