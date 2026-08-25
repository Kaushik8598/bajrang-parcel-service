"use client";

import React from "react";
import { Upload, FileText, X, ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FileUploadPreviewProps {
  label?: string;
  fileName?: string;
  fileUrl?: string;
  isUploading?: boolean;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  accept?: string;
  disabled?: boolean;
  className?: string;
  showViewLink?: boolean;
}

/**
 * Universal File Upload and Preview Component
 * Supports live image thumbnail preview, PDF / document link,
 * upload loader state, and quick removal.
 */
export function FileUploadPreview({
  label = "File",
  fileName,
  fileUrl,
  isUploading = false,
  onFileSelect,
  onRemove,
  accept = ".pdf,image/*",
  disabled = false,
  className,
  showViewLink = true,
}: FileUploadPreviewProps) {
  // Determine if file is an image
  const isPdf =
    Boolean(fileName?.toLowerCase().endsWith(".pdf")) ||
    Boolean(fileUrl?.toLowerCase().endsWith(".pdf"));

  const isImage =
    !isPdf &&
    (Boolean(fileUrl?.match(/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i)) ||
      Boolean(fileUrl?.startsWith("data:image/")) ||
      Boolean(fileName?.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i)) ||
      Boolean(fileUrl?.includes("/image/upload/")));

  return (
    <div className={cn("space-y-1", className)}>
      {fileUrl || fileName ? (
        <div className="relative flex items-center gap-2 p-1.5 rounded border border-slate-200 bg-white">
          {/* Thumbnail / Document Icon */}
          {isImage && fileUrl ? (
            <div className="w-9 h-9 rounded overflow-hidden border border-slate-200 shrink-0 bg-slate-100 flex items-center justify-center">
              <img
                src={fileUrl}
                alt={fileName || label}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-8 h-8 rounded bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-[#2980b9]">
              <FileText className="w-4 h-4" />
            </div>
          )}

          {/* File Name & View Link */}
          <div className="flex-1 min-w-0 pr-5">
            <p
              className="text-[11px] font-medium text-slate-800 truncate"
              title={fileName || fileUrl}
            >
              {fileName || "Uploaded File"}
            </p>
            {showViewLink && fileUrl && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-[#2980b9] hover:underline flex items-center gap-0.5 truncate"
              >
                <ExternalLink className="w-2.5 h-2.5" />
                <span>View File</span>
              </a>
            )}
          </div>

          {/* Remove Button */}
          {!disabled && (
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-1 right-1 p-0.5 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Remove file"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        /* Upload Trigger Button */
        <label
          className={cn(
            "cursor-pointer flex items-center justify-center gap-1.5 h-7 px-2 rounded border border-dashed border-slate-300 hover:border-black bg-white text-[11px] font-medium text-slate-700 transition-colors",
            (isUploading || disabled) && "pointer-events-none opacity-70"
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-3 h-3 text-[#2980b9] animate-spin" />
              <span className="text-slate-500">Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="w-3 h-3 text-slate-500" />
              <span className="truncate">Upload {label}</span>
            </>
          )}
          <input
            type="file"
            accept={accept}
            className="hidden"
            disabled={isUploading || disabled}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onFileSelect(file);
                e.target.value = "";
              }
            }}
          />
        </label>
      )}
    </div>
  );
}

export default FileUploadPreview;
