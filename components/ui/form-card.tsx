"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FormCardProps {
  title?: React.ReactNode;
  icon?: React.ElementType | React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
}

/**
 * Universal Form Section Card
 * Standardized border, radius, padding, header style & shadow across all modules.
 * Supports optional collapsible accordion behavior and right-side action buttons.
 */
export function FormCard({
  title,
  icon: Icon,
  children,
  action,
  collapsible = false,
  defaultOpen = true,
  className,
  headerClassName,
  bodyClassName,
}: FormCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const renderIcon = () => {
    if (!Icon) return null;
    if (React.isValidElement(Icon)) return Icon;
    const IconComponent = Icon as React.ElementType;
    return <IconComponent className="w-3.5 h-3.5 text-[#2980b9]" />;
  };

  return (
    <div
      className={cn(
        "bg-white rounded border border-slate-200/80 shadow-2xs",
        className
      )}
    >
      {title && (
        <div
          onClick={collapsible ? () => setIsOpen((prev) => !prev) : undefined}
          className={cn(
            "flex items-center justify-between p-2 sm:p-2.5 pb-1.5 border-b border-slate-100 rounded-t",
            collapsible && "cursor-pointer select-none hover:bg-slate-50/70 transition-colors",
            headerClassName
          )}
        >
          <div className="flex items-center gap-1.5">
            {renderIcon()}
            <h3 className="text-xs font-bold text-black uppercase tracking-wider">
              {title}
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            {action}
            {collapsible && (
              <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                <span className="text-[11px]">{isOpen ? "Collapse" : "Expand"}</span>
                <ChevronDown
                  className={cn(
                    "w-3.5 h-3.5 text-slate-500 transition-transform duration-200",
                    isOpen && "rotate-180"
                  )}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {(!collapsible || isOpen) && (
        <div className={cn("p-2 sm:p-2.5 space-y-1.5", title && "pt-2", bodyClassName)}>
          {children}
        </div>
      )}
    </div>
  );
}

export default FormCard;
