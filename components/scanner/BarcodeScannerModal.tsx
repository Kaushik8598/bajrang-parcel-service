"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Camera, SwitchCamera, AlertCircle, CheckCircle2, Volume2, VolumeX, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppModal from "@/components/ui/AppModal";

export interface BarcodeScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (barcode: string) => boolean | void;
  title?: string;
}

export default function BarcodeScannerModal({
  open,
  onOpenChange,
  onScan,
  title = "Scan Parcel Barcode",
}: BarcodeScannerModalProps) {
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [lastScannedCode, setLastScannedCode] = useState<string>("");
  const [soundEnabled, setSoundEnabled] = useState(true);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isStoppingRef = useRef<boolean>(false);
  const lastScanTimeRef = useRef<number>(0);
  const containerId = "barcode-camera-scanner-viewport";

  // Play a crisp, loud POS scanner beep sound using Web Audio API + vibration
  const playBeep = useCallback(() => {
    if (!soundEnabled) return;

    // Optional haptic vibration on mobile devices
    if (typeof navigator !== "undefined" && navigator?.vibrate) {
      try {
        navigator.vibrate(80);
      } catch {
        // Ignore vibration errors
      }
    }

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Crisp 1400Hz scanner tone
      osc.type = "sine";
      osc.frequency.setValueAtTime(1400, ctx.currentTime);

      // Loud & clear POS scanner volume (0.7) with fast release
      gain.gain.setValueAtTime(0.7, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // AudioContext policy
    }
  }, [soundEnabled]);

  // Stop current active scanner instance
  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning && !isStoppingRef.current) {
      isStoppingRef.current = true;
      try {
        await html5QrCodeRef.current.stop();
      } catch {
        // Ignore stop errors if already stopped
      } finally {
        isStoppingRef.current = false;
        setIsScanning(false);
      }
    }
  }, []);

  // Start scanner using camera constraint or specific camera ID
  const startCamera = useCallback(
    async (cameraConfig: string | MediaTrackConstraints) => {
      await stopScanner();
      setErrorMsg("");

      try {
        let scanner = html5QrCodeRef.current;
        if (!scanner) {
          scanner = new Html5Qrcode(containerId, {
            formatsToSupport: [
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.CODE_39,
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
              Html5QrcodeSupportedFormats.QR_CODE,
              Html5QrcodeSupportedFormats.DATA_MATRIX,
            ],
            verbose: false,
          });
          html5QrCodeRef.current = scanner;
        }

        const config = {
          fps: 15,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            return {
              width: Math.floor(viewfinderWidth * 0.85),
              height: Math.floor(minEdge * 0.55),
            };
          },
          aspectRatio: 1.333333,
        };

        await scanner.start(
          cameraConfig,
          config,
          (decodedText) => {
            const now = Date.now();
            if (decodedText === lastScannedCode && now - lastScanTimeRef.current < 1200) {
              return;
            }
            lastScanTimeRef.current = now;
            setLastScannedCode(decodedText);
            playBeep();
            onScan(decodedText.trim());
          },
          () => {
            // Frame scan miss
          }
        );

        setIsScanning(true);

        // Fetch cameras list now that permission is granted
        Html5Qrcode.getCameras()
          .then((devices) => {
            if (Array.isArray(devices) && devices.length > 0) {
              const list = devices.map((d) => ({
                id: d.id,
                label: d.label || `Camera ${d.id.slice(0, 4)}`,
              }));
              setCameras(list);
            }
          })
          .catch(() => {
            // Ignore
          });
      } catch (err: unknown) {
        console.error("Camera start failed:", err);
        // If environment facing mode failed (e.g. laptop with only front cam), try default user camera
        if (typeof cameraConfig === "object" && cameraConfig.facingMode === "environment") {
          try {
            await startCamera({ facingMode: "user" });
            return;
          } catch {
            // Fall through to error
          }
        }

        const msg =
          err && typeof err === "object" && "message" in err
            ? String(err.message)
            : "Camera permission denied or camera not accessible.";
        setErrorMsg(msg);
        setIsScanning(false);
      }
    },
    [stopScanner, lastScannedCode, onScan, playBeep]
  );

  // Initialize camera when modal opens
  useEffect(() => {
    if (!open) {
      stopScanner();
      return;
    }

    setErrorMsg("");
    setLastScannedCode("");

    // Start with environment camera (or default)
    const timeout = setTimeout(() => {
      if (selectedCameraId) {
        startCamera(selectedCameraId);
      } else {
        startCamera({ facingMode: "environment" });
      }
    }, 150);

    return () => {
      clearTimeout(timeout);
      stopScanner();
    };
  }, [open, selectedCameraId, startCamera, stopScanner]);

  // Handle switching camera
  const handleSwitchCamera = (newCamId: string) => {
    setSelectedCameraId(newCamId);
    startCamera(newCamId);
  };

  return (
    <AppModal
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          stopScanner();
        }
        onOpenChange(isOpen);
      }}
      maxWidth="sm:max-w-md"
      title={
        <div className="flex items-center gap-2 text-slate-900 text-sm font-bold">
          <Camera className="w-4 h-4 text-[#2980b9]" />
          <span>{title}</span>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Sound ON
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Sound OFF
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-7 px-3 text-xs text-black border-slate-300 hover:bg-slate-50 cursor-pointer"
          >
            Close Scanner
          </Button>
        </div>
      }
    >
      <div className="space-y-3 p-1">
        {/* Camera Selector Bar if multiple cameras */}
        {cameras.length > 1 && (
          <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-100 text-xs">
            <span className="text-slate-600 font-medium flex items-center gap-1">
              <SwitchCamera className="w-3.5 h-3.5 text-slate-500" />
              Camera:
            </span>
            <select
              value={selectedCameraId}
              onChange={(e) => handleSwitchCamera(e.target.value)}
              className="h-7 px-2 text-xs bg-white border border-slate-300 rounded shadow-2xs focus:outline-none focus:border-[#2980b9]"
            >
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Scanner Viewport Container */}
        <div className="relative w-full rounded-lg overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex flex-col items-center justify-center min-h-[260px]">
          <div id={containerId} className="w-full h-full min-h-[260px]" />

          {/* Active Scanning Laser Line Overlay */}
          {isScanning && !errorMsg && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="w-[80%] h-[55%] border-2 border-emerald-400/80 rounded-md relative shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                <div className="absolute left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse top-1/2 -translate-y-1/2" />
              </div>
              <span className="mt-3 text-[11px] font-semibold text-white/90 bg-black/60 px-2 py-0.5 rounded shadow">
                Align parcel barcode within frame
              </span>
            </div>
          )}

          {/* Error message / Permission prompt */}
          {errorMsg && (
            <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-4 text-center space-y-2.5">
              <AlertCircle className="w-8 h-8 text-rose-500" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-rose-200">{errorMsg}</p>
                <p className="text-[11px] text-slate-400 max-w-xs">
                  Please allow camera access in your browser settings (or ensure you are on HTTPS / localhost).
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => startCamera({ facingMode: "environment" })}
                className="h-7 px-3 text-xs text-white border-slate-600 hover:bg-slate-800 mt-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Retry Camera
              </Button>
            </div>
          )}
        </div>

        {/* Last scanned feedback badge */}
        {lastScannedCode && (
          <div className="bg-emerald-50 border border-emerald-200 rounded p-2 flex items-center justify-between text-xs text-emerald-800">
            <div className="flex items-center gap-1.5 truncate">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">
                Scanned: <strong className="font-mono text-emerald-950">{lastScannedCode}</strong>
              </span>
            </div>
            <span className="text-[10px] text-emerald-600 shrink-0 ml-2 font-medium">Auto Loaded</span>
          </div>
        )}
      </div>
    </AppModal>
  );
}
