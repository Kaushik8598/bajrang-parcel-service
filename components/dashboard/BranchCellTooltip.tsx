"use client";

import React from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import type { BranchSummaryCell, BranchSummaryHeader } from "@/lib/types/common";

export interface BranchCellTooltipProps {
  fromBranch: BranchSummaryHeader;
  toBranch: BranchSummaryHeader;
  cell?: BranchSummaryCell;
  cellVal: number;
  children?: React.ReactNode;
}

/**
 * Dedicated tooltip component for displaying branch wise payment breakdown
 * Renders via Radix / Base-UI Portal so it is never clipped by table overflow
 */
export function BranchCellTooltip({
  fromBranch,
  toBranch,
  cell,
  cellVal,
  children,
}: BranchCellTooltipProps) {
  if (!cell || cellVal <= 0) {
    return (
      <div className="py-2.5 px-3 flex items-center justify-center">
        <span className="text-xs font-light text-slate-300 select-none">
          —
        </span>
      </div>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger className="w-full h-full py-2.5 px-3 flex items-center justify-center cursor-default outline-none select-none">
        {children || (
          <span className="text-xs font-extrabold text-black">
            {cellVal}
          </span>
        )}
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={8}
        className="bg-black text-white p-3 rounded-lg shadow-2xl border border-slate-800 z-50 flex flex-col !items-stretch min-w-[230px] max-w-sm w-auto"
      >
        {/* Tooltip Header (Full branch names without truncation) */}
        <div className="text-xs font-bold text-white border-b border-slate-700 pb-1.5 mb-2 flex items-center justify-between gap-4 w-full">
          <span className="whitespace-nowrap font-bold text-white">
            {fromBranch.name} → {toBranch.name}
          </span>
          <span className="font-extrabold text-white whitespace-nowrap">
            Total: {cell.total ?? 0}
          </span>
        </div>

        {/* Vertical List of payment metrics with space-between */}
        <div className="flex flex-col space-y-1.5 text-xs w-full">
          <div className="flex items-center justify-between text-white w-full">
            <span className="text-slate-300">Paid:</span>
            <span className="font-bold font-mono text-white">{cell.paid ?? 0}</span>
          </div>
          <div className="flex items-center justify-between text-white w-full">
            <span className="text-slate-300">To-Pay:</span>
            <span className="font-bold font-mono text-white">{cell.toPay ?? 0}</span>
          </div>
          <div className="flex items-center justify-between text-white w-full">
            <span className="text-slate-300">Credit:</span>
            <span className="font-bold font-mono text-white">{cell.credit ?? 0}</span>
          </div>
          <div className="flex items-center justify-between text-white w-full">
            <span className="text-slate-300">GPay:</span>
            <span className="font-bold font-mono text-white">{cell.gpay ?? 0}</span>
          </div>
          <div className="flex items-center justify-between text-white w-full pt-1.5 border-t border-slate-800">
            <span className="text-slate-300">Not-Pay:</span>
            <span className="font-bold font-mono text-white">{cell.notPay ?? 0}</span>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
