"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface FormInputProps extends React.ComponentProps<typeof Input> {
  label?: string;
  required?: boolean;
  error?: string | boolean;
  helperText?: string;
  containerClassName?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  uppercase?: boolean;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      label,
      required = false,
      error,
      helperText,
      containerClassName,
      startIcon,
      endIcon,
      uppercase = false,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);
    const hasError = Boolean(error);
    const errorMessage = typeof error === "string" ? error : undefined;

    return (
      <div className={cn("space-y-1 w-full", containerClassName)}>
        {label && (
          <Label
            htmlFor={inputId}
            className="text-[11px] font-bold text-black flex items-center gap-0.5 leading-none"
          >
            {label}
            {required && <span className="text-red-500 font-bold">*</span>}
          </Label>
        )}

        <div className="relative flex items-center">
          {startIcon && (
            <div className="absolute left-2 z-10 text-slate-500 pointer-events-none flex items-center justify-center">
              {startIcon}
            </div>
          )}

          <Input
            id={inputId}
            ref={ref}
            aria-invalid={hasError}
            className={cn(
              "h-8 bg-white text-xs text-black px-2.5 border border-black focus-visible:border-black focus-visible:ring-black/20",
              startIcon && "pl-7",
              endIcon && "pr-7",
              uppercase && "uppercase",
              hasError && "border-red-400 focus-visible:border-red-500 focus-visible:ring-red-400/20",
              className
            )}
            {...props}
          />

          {endIcon && (
            <div className="absolute right-2 z-10 text-slate-500 pointer-events-none flex items-center justify-center">
              {endIcon}
            </div>
          )}
        </div>

        {hasError && errorMessage && (
          <p className="text-[10px] text-red-500 font-medium leading-tight">
            {errorMessage}
          </p>
        )}

        {!hasError && helperText && (
          <p className="text-[10px] text-slate-500 leading-tight">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";

export interface FormTextareaProps extends React.ComponentProps<typeof Textarea> {
  label?: string;
  required?: boolean;
  error?: string | boolean;
  helperText?: string;
  containerClassName?: string;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  (
    {
      label,
      required = false,
      error,
      helperText,
      containerClassName,
      className,
      id,
      rows = 2,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);
    const hasError = Boolean(error);
    const errorMessage = typeof error === "string" ? error : undefined;

    return (
      <div className={cn("space-y-1 w-full", containerClassName)}>
        {label && (
          <Label
            htmlFor={inputId}
            className="text-[11px] font-bold text-black flex items-center gap-0.5 leading-none"
          >
            {label}
            {required && <span className="text-red-500 font-bold">*</span>}
          </Label>
        )}

        <Textarea
          id={inputId}
          ref={ref}
          rows={rows}
          aria-invalid={hasError}
          className={cn(
            "bg-white text-xs text-black p-2 min-h-[52px] border border-black focus-visible:border-black focus-visible:ring-black/20 resize-none",
            hasError && "border-red-400 focus-visible:border-red-500 focus-visible:ring-red-400/20",
            className
          )}
          {...props}
        />

        {hasError && errorMessage && (
          <p className="text-[10px] text-red-500 font-medium leading-tight">
            {errorMessage}
          </p>
        )}

        {!hasError && helperText && (
          <p className="text-[10px] text-slate-400 leading-tight">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormTextarea.displayName = "FormTextarea";

export default FormInput;
