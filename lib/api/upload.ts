import { apiClient } from "./client";

export interface UploadResponse {
  success?: boolean;
  message?: string;
  data?:
    | {
        url?: string;
        [key: string]: unknown;
      }
    | string;
  url?: string;
  [key: string]: unknown;
}

export interface UploadResult {
  url: string;
  fileName: string;
  isImage: boolean;
  previewUrl?: string;
}

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Validate that file size is within 5MB limit
 */
export function validateFileSize(file: File, maxBytes = MAX_FILE_SIZE_BYTES): boolean {
  return file.size <= maxBytes;
}

/**
 * Upload binary file data via FormData (multipart/form-data)
 * Only "file" key is appended to FormData.
 * Response: Extracts url from response ({ data: { url } } or { data: string } or { url: string }).
 */
export async function uploadBinaryFile(file: File): Promise<UploadResult> {
  if (!validateFileSize(file)) {
    throw new Error(`File "${file.name}" exceeds 5MB limit. Please upload a smaller file.`);
  }

  const isImage =
    file.type.startsWith("image/") ||
    /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.name);

  // Build binary FormData payload with ONLY "file" key
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<UploadResponse>("/upload/base64", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  const res = response.data;

  // Extract URL from { data: { url } }, { data: "url" }, or { url: "url" }
  let uploadedUrl = "";
  if (typeof res === "string") {
    uploadedUrl = res;
  } else if (typeof res?.data === "string") {
    uploadedUrl = res.data;
  } else if (res?.data && typeof res.data === "object" && res.data.url) {
    uploadedUrl = res.data.url;
  } else if (res?.url) {
    uploadedUrl = res.url;
  }

  if (!uploadedUrl) {
    throw new Error("Failed to get file URL from upload response.");
  }

  return {
    url: uploadedUrl,
    fileName: file.name,
    isImage,
    previewUrl: uploadedUrl,
  };
}

// Alias for backward compatibility
export const uploadBase64 = uploadBinaryFile;
