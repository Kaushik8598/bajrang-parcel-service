"use client";

import React from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface AppTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
  align?: "start" | "center" | "end";
  className?: string;
  delay?: number;
  disabled?: boolean;
}

/**
 * Universal App Tooltip Component
 * Safe for tables and scroll containers (Portaled rendering)
 */
export function AppTooltip({
  content,
  children,
  side = "top",
  sideOffset = 6,
  align = "center",
  className,
  delay = 50,
  disabled = false,
}: AppTooltipProps) {
  if (disabled || !content) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider delay={delay}>
      <Tooltip>
        <TooltipTrigger className="inline-flex cursor-default outline-none">
          {children}
        </TooltipTrigger>
        <TooltipContent
          side={side}
          sideOffset={sideOffset}
          align={align}
          className={cn(
            "bg-black text-white p-2.5 rounded-lg shadow-2xl border border-slate-800 z-50 flex flex-col !items-stretch w-auto min-w-[160px]",
            className
          )}
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
