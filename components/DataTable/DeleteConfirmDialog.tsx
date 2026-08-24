"use client";

import { AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export default function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Delete Confirmation",
  description,
  itemName,
  confirmText = "Delete",
  cancelText = "Cancel",
  isLoading = false,
}: DeleteConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  const defaultDescription = itemName
    ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
    : "Are you sure you want to delete this item? This action cannot be undone.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 bg-white rounded-xl shadow-xl">
        <div className="flex items-start gap-4">
          {/* Warning Icon Badge */}
          <div className="w-11 h-11 rounded-full bg-red-100/80 border border-red-200 flex items-center justify-center flex-shrink-0 text-[#e74c3c]">
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            <DialogHeader className="p-0">
              <DialogTitle className="text-base font-bold text-black leading-tight">
                {title}
              </DialogTitle>
            </DialogHeader>
            <DialogDescription className="text-xs text-black leading-relaxed">
              {description || defaultDescription}
            </DialogDescription>
          </div>
        </div>

        <DialogFooter className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 bg-transparent p-0 pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="h-8 px-3.5 text-xs text-black border-slate-200 hover:bg-slate-50 font-medium"
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleConfirm}
            disabled={isLoading}
            className="h-8 px-4 text-xs font-semibold bg-[#e74c3c] hover:bg-[#c0392b] text-white shadow-xs transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                {confirmText}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
