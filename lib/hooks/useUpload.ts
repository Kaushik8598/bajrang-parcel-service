import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { uploadBase64, UploadResult, validateFileSize } from "@/lib/api/upload";
import { showToast } from "@/lib/toast";

export function useUpload() {
  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({});

  const mutation = useMutation({
    mutationFn: ({ file }: { file: File; fieldKey?: string }) => uploadBase64(file),
  });

  const uploadFile = async (
    file: File,
    fieldKey?: string
  ): Promise<UploadResult | null> => {
    if (!validateFileSize(file)) {
      showToast("error", "File too large", `File "${file.name}" exceeds 5MB limit.`);
      return null;
    }

    if (fieldKey) {
      setUploadingFields((prev) => ({ ...prev, [fieldKey]: true }));
    }

    try {
      const result = await uploadBase64(file);
      showToast("success", "File uploaded", `File "${file.name}" uploaded successfully.`);
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to upload file.";
      showToast("error", "Upload Failed", message);
      return null;
    } finally {
      if (fieldKey) {
        setUploadingFields((prev) => ({ ...prev, [fieldKey]: false }));
      }
    }
  };

  return {
    uploadFile,
    isUploading: mutation.isPending,
    uploadingFields,
  };
}
