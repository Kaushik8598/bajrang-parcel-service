"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Camera, SwitchCamera, RefreshCw, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppModal from "@/components/ui/AppModal";

export interface CameraCaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (file: File) => void;
  title?: string;
}

export default function CameraCaptureModal({
  open,
  onOpenChange,
  onCapture,
  title = "Capture Photo with Camera",
}: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState<number>(0);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Stop camera stream cleanly
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Start camera stream with specified deviceId or facingMode
  const startCameraStream = useCallback(
    async (targetDeviceId?: string, targetFacingMode?: "environment" | "user") => {
      setErrorMsg("");
      setCapturedPhotoUrl(null);
      setCapturedBlob(null);
      setIsLoading(true);

      stopStream();

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera API is not supported in this browser.");
        }

        let constraints: MediaStreamConstraints;

        if (targetDeviceId) {
          constraints = {
            video: {
              deviceId: { exact: targetDeviceId },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          };
        } else {
          const mode = targetFacingMode || facingMode;
          constraints = {
            video: {
              facingMode: { ideal: mode },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          };
        }

        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (e) {
          // Fallback to simple video constraints
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Enumerate devices once permission is granted
        if (navigator.mediaDevices?.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter((d) => d.kind === "videoinput");
          setCameras(videoDevices);
        }
      } catch (err: unknown) {
        console.error("Camera access error:", err);
        const msg =
          err instanceof Error
            ? err.message
            : "Could not access camera. Please allow camera permissions.";
        setErrorMsg(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [facingMode, stopStream]
  );

  // Initialize camera on modal open
  useEffect(() => {
    if (open) {
      startCameraStream();
    } else {
      stopStream();
      setCapturedPhotoUrl(null);
      setCapturedBlob(null);
      setErrorMsg("");
    }

    return () => {
      stopStream();
    };
  }, [open, startCameraStream, stopStream]);

  // Flip camera (switches between rear/front or next device in list)
  const handleFlipCamera = async () => {
    if (cameras.length > 1) {
      const nextIndex = (currentCameraIndex + 1) % cameras.length;
      setCurrentCameraIndex(nextIndex);
      const nextCam = cameras[nextIndex];
      await startCameraStream(nextCam.deviceId);
    } else {
      const nextFacing = facingMode === "environment" ? "user" : "environment";
      setFacingMode(nextFacing);
      await startCameraStream(undefined, nextFacing);
    }
  };

  // Take photo from video frame
  const handleSnap = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement("canvas");
    canvasRef.current = canvas;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setCapturedBlob(blob);
        const url = URL.createObjectURL(blob);
        setCapturedPhotoUrl(url);
        stopStream();
      },
      "image/jpeg",
      0.9
    );
  };

  // Retake photo
  const handleRetake = () => {
    if (capturedPhotoUrl) {
      URL.revokeObjectURL(capturedPhotoUrl);
    }
    setCapturedPhotoUrl(null);
    setCapturedBlob(null);
    startCameraStream();
  };

  // Confirm photo capture
  const handleConfirm = () => {
    if (!capturedBlob) return;
    const filename = `camera-photo-${Date.now()}.jpg`;
    const file = new File([capturedBlob], filename, { type: "image/jpeg" });
    onCapture(file);
    if (capturedPhotoUrl) {
      URL.revokeObjectURL(capturedPhotoUrl);
    }
    onOpenChange(false);
  };

  return (
    <AppModal
      open={open}
      onOpenChange={(v) => {
        if (!v) stopStream();
        onOpenChange(v);
      }}
      title={title}
      maxWidth="sm:max-w-[560px]"
    >
      <div className="space-y-3">
        {/* Error message */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Camera Access Required</p>
              <p className="mt-0.5 text-red-600">{errorMsg}</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => startCameraStream()}
                className="mt-2 h-7 text-xs bg-white hover:bg-red-100 border-red-300"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry Camera
              </Button>
            </div>
          </div>
        )}

        {/* Viewport: Live Camera Feed or Captured Photo */}
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center border border-slate-300 shadow-inner">
          {capturedPhotoUrl ? (
            <img
              src={capturedPhotoUrl}
              alt="Captured"
              className="w-full h-full object-contain"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                  Starting camera...
                </div>
              )}
            </>
          )}

          {/* Hidden Canvas */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {capturedPhotoUrl ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleRetake}
                className="h-8 px-4 text-xs font-semibold text-slate-700 border-slate-300 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retake
              </Button>

              <Button
                type="button"
                onClick={handleConfirm}
                className="h-8 px-5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Use Photo
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isLoading}
                onClick={handleFlipCamera}
                className="h-8 px-3 text-xs text-slate-700 border-slate-300 hover:bg-slate-100 cursor-pointer"
                title="Flip / Switch Camera"
              >
                <SwitchCamera className="w-3.5 h-3.5 mr-1 text-[#2980b9]" />
                Flip Camera
              </Button>

              <Button
                type="button"
                onClick={handleSnap}
                disabled={isLoading || Boolean(errorMsg)}
                className="h-9 px-6 text-xs font-bold bg-[#2980b9] hover:bg-[#2471a3] text-white shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                Capture Photo
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-8 px-3 text-xs text-slate-600 border-slate-300 cursor-pointer"
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>
    </AppModal>
  );
}
