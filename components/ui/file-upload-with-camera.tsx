"use client";

import React, { useState } from "react";
import { Upload, Camera, FileText, X, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import CameraCaptureModal from "@/components/modals/CameraCaptureModal";
import { cn } from "@/lib/utils";

export interface FileUploadWithCameraProps {
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
  required?: boolean;
}

export function FileUploadWithCamera({
  label = "Document",
  fileName,
  fileUrl,
  isUploading = false,
  onFileSelect,
  onRemove,
  accept = ".pdf,image/*",
  disabled = false,
  className,
  showViewLink = true,
  required = false,
}: FileUploadWithCameraProps) {
  const [cameraModalOpen, setCameraModalOpen] = useState(false);

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
        /* Preview View */
        <div
          className={cn(
            "relative flex items-center gap-2 p-1.5 rounded border transition-colors",
            disabled ? "border-slate-300 bg-slate-100" : "border-slate-200 bg-white shadow-2xs"
          )}
        >
          {/* Thumbnail / Icon */}
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

          {/* Details */}
          <div className="flex-1 min-w-0 pr-6">
            <p
              className="text-[11px] font-medium text-slate-800 truncate"
              title={fileName || fileUrl}
            >
              {fileName || "Uploaded Document"}
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
              className="absolute top-1.5 right-1.5 p-0.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Remove file"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : disabled ? (
        <div className="flex items-center justify-start h-8 px-2.5 rounded border border-slate-300 bg-slate-100 text-xs text-slate-500 font-normal">
          No file uploaded
        </div>
      ) : (
        /* Action Buttons: Upload + Camera */
        <div className="flex items-center gap-1.5">
          {/* 1. File Upload button */}
          <label
            className={cn(
              "flex-1 cursor-pointer flex items-center justify-center gap-1 h-8 px-2 rounded border border-dashed border-slate-400 bg-white text-[11px] font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:border-slate-700",
              isUploading && "pointer-events-none opacity-70"
            )}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3 h-3 text-[#2980b9] animate-spin" />
                <span className="text-slate-500">Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-3 h-3 text-slate-500 shrink-0" />
                <span className="truncate">Upload {label}</span>
              </>
            )}
            <input
              type="file"
              accept={accept}
              className="hidden"
              disabled={isUploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onFileSelect(file);
                  e.target.value = "";
                }
              }}
            />
          </label>

          {/* 2. Live Camera Capture Button */}
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isUploading}
            onClick={() => setCameraModalOpen(true)}
            className="h-8 px-2.5 text-[11px] font-semibold text-slate-700 border-slate-300 hover:bg-blue-50 hover:text-[#2980b9] hover:border-blue-300 shadow-none shrink-0"
            title={`Capture ${label} using camera`}
          >
            <Camera className="w-3.5 h-3.5 mr-1 text-[#2980b9]" />
            <span>Camera</span>
          </Button>
        </div>
      )}

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        open={cameraModalOpen}
        onOpenChange={setCameraModalOpen}
        onCapture={(file) => {
          onFileSelect(file);
        }}
        title={`Capture ${label} Photo`}
      />
    </div>
  );
}

export default FileUploadWithCamera;
