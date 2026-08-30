"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Truck,
  PackageCheck,
  Plus,
  Trash2,
  RotateCcw,
  Search,
  CheckCircle2,
  Camera,
  Loader2,
  Building2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FormSelect, type FormSelectOption } from "@/components/ui/form-select";
import { Checkbox } from "@/components/ui/checkbox";
import SimpleDataTable from "@/components/DataTable/SimpleDataTable";
import BarcodeScannerModal from "@/components/scanner/BarcodeScannerModal";
import { printTruckLoadReport } from "@/components/load-parcel/TruckLoadReport";
import { showToast } from "@/lib/toast";
import { getStoredUser } from "@/lib/api/auth";
import { useUnloadableTrucks, useOnlyBranchList, useUnloadParcelsMutation } from "@/lib/hooks";
import type {
  UnloadableTruckItem,
  UnloadablePieceDetail,
} from "@/lib/api/unloadParcel";
import type { ColumnDef } from "@/lib/types/common";

export default function UnloadParcelPage() {
  // ─── Current User & Own Branch ──────────────────────────────────────────────
  const currentUser = useMemo(() => getStoredUser(), []);
  const ownBranchId = useMemo(() => {
    return String(currentUser?._id || currentUser?.id || "");
  }, [currentUser]);

  const currentUserName = useMemo(() => {
    if (!currentUser) return "Admin";
    return String(currentUser.name || (currentUser as any).username || "Admin");
  }, [currentUser]);

  const currentBranchName = useMemo(() => {
    if (!currentUser) return "";
    const bInfo = (currentUser as any).branchInfo || (currentUser as any).branch;
    if (typeof bInfo === "string") return bInfo;
    if (bInfo && typeof bInfo === "object" && "name" in bInfo) return String((bInfo as any).name);
    return String((currentUser as any).branchName || "");
  }, [currentUser]);

  // Mutation for confirming unload via POST /booking/unloadParcel
  const unloadParcelsMutation = useUnloadParcelsMutation();

  // ─── Selected Truck & Filter States ─────────────────────────────────────────
  const [selectedTruck, setSelectedTruck] = useState<string>("");
  const [selectedUnloadBranch, setSelectedUnloadBranch] = useState<string>("");
  const [selectedFromBranch, setSelectedFromBranch] = useState<string>("");
  const [selectedToBranch, setSelectedToBranch] = useState<string>("");
  const [tableSearch, setTableSearch] = useState<string>("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ─── Camera Scanner States ──────────────────────────────────────────────────
  const [hasCamera, setHasCamera] = useState<boolean>(true);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);

  // Check if camera device is available on client
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (navigator?.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          if (Array.isArray(devices) && devices.length > 0) {
            const hasVideo = devices.some((d) => d.kind === "videoinput");
            const hasAudio = devices.some((d) => d.kind === "audioinput");
            if (!hasVideo && hasAudio) {
              setHasCamera(false);
            } else {
              setHasCamera(true);
            }
          } else {
            setHasCamera(true);
          }
        })
        .catch(() => {
          setHasCamera(true);
        });
    } else {
      const hasAnyMediaSupport = Boolean(
        navigator?.mediaDevices ||
        (navigator as unknown as { getUserMedia?: unknown }).getUserMedia ||
        (navigator as unknown as { webkitGetUserMedia?: unknown }).webkitGetUserMedia
      );
      setHasCamera(hasAnyMediaSupport);
    }
  }, []);

  // Map of unloaded piece barcodes by booking key: { [bookingKey]: string[] }
  const [unloadedPiecesMap, setUnloadedPiecesMap] = useState<Record<string, string[]>>({});

  // Checkbox selection in available table (stores booking keys)
  const [selectedAvailableKeys, setSelectedAvailableKeys] = useState<Set<string>>(new Set());

  // ─── 1. Fetch Unloadable Trucks via GET /user/unloadableTruck ───────────────
  const {
    data: unloadableRes,
    isLoading: isUnloadableLoading,
    isFetching: isUnloadableFetching,
    refetch: refetchUnloadable,
  } = useUnloadableTrucks();

  const trucksList: UnloadableTruckItem[] = useMemo(() => {
    const raw = unloadableRes?.data?.trucks;
    if (Array.isArray(raw)) return raw;
    return [];
  }, [unloadableRes]);

  const truckOptions: FormSelectOption[] = useMemo(() => {
    return trucksList.map((t) => {
      const driver = t.driverName ? ` (${t.driverName})` : "";
      return {
        value: t.truckNumber,
        label: `${t.truckNumber}${driver}`,
      };
    });
  }, [trucksList]);

  // Selected Truck Object
  const selectedTruckObj = useMemo(() => {
    return trucksList.find((t) => t.truckNumber === selectedTruck);
  }, [trucksList, selectedTruck]);

  // ─── 2. Fetch Branches for Unload Branch dropdown via GET /user/onlyBranch ──
  const { data: onlyBranchRes, isLoading: isBranchLoading } = useOnlyBranchList();

  const branchDropdownList = useMemo(() => {
    const rawData = onlyBranchRes?.data;
    if (Array.isArray(rawData)) return rawData;
    if (rawData && typeof rawData === "object") {
      if (Array.isArray((rawData as any).branches)) return (rawData as any).branches;
      if (Array.isArray((rawData as any).users)) return (rawData as any).users;
      if (Array.isArray((rawData as any).data)) return (rawData as any).data;
    }
    return [];
  }, [onlyBranchRes]);

  const unloadBranchOptions: FormSelectOption[] = useMemo(() => {
    return branchDropdownList.map((b: any) => {
      const id = String(b._id || b.id || b.name || "");
      const name = b.name || b.branchName || "";
      const code = b.code || b.branchCode || b.branchInfo?.branchCode || "";
      const label = code && code !== name ? `${name} (${code})` : name;
      return {
        value: id,
        label,
      };
    });
  }, [branchDropdownList]);

  // Helper to resolve user's branch ID from branch list
  const getDefaultBranchId = (): string => {
    if (branchDropdownList.length === 0) return "";
    const matchedById = branchDropdownList.find(
      (b: any) => String(b._id || b.id || "") === ownBranchId
    );
    if (matchedById) return String(matchedById._id || matchedById.id || "");

    const userBranchName =
      (currentUser as any)?.branchName ||
      (currentUser as any)?.branchInfo?.branchName ||
      currentUser?.name ||
      "";
    if (userBranchName) {
      const matchedByName = branchDropdownList.find(
        (b: any) =>
          (b.name || b.branchName || "").toLowerCase() === userBranchName.toLowerCase() ||
          (b.code || b.branchCode || "").toLowerCase() === userBranchName.toLowerCase()
      );
      if (matchedByName) return String(matchedByName._id || matchedByName.id || "");
    }
    return "";
  };

  // Auto set default unload branch to logged-in user's branch
  useEffect(() => {
    if (!selectedUnloadBranch && branchDropdownList.length > 0) {
      const defId = getDefaultBranchId();
      if (defId) {
        setSelectedUnloadBranch(defId);
      }
    }
  }, [branchDropdownList, ownBranchId, currentUser, selectedUnloadBranch]);

  // Sender Branch Group Options (from selected truck's senderBranches)
  const senderBranchGroupOptions: FormSelectOption[] = useMemo(() => {
    const branches = selectedTruckObj?.senderBranches;
    if (!Array.isArray(branches) || branches.length === 0) return [];
    return branches.map((g) => {
      const isAll = g.branchName === "ALL" || g.branchCode === "ALL";
      const label = isAll
        ? "ALL"
        : g.branchCode && g.branchCode !== g.branchName
          ? `${g.branchName} (${g.branchCode})`
          : g.branchName;
      return {
        value: g.branchName,
        label,
      };
    });
  }, [selectedTruckObj]);

  // Receiver Branch Group Options (from selected truck's receiverBranches)
  const receiverBranchGroupOptions: FormSelectOption[] = useMemo(() => {
    const branches = selectedTruckObj?.receiverBranches;
    if (!Array.isArray(branches) || branches.length === 0) return [];
    return branches.map((g) => {
      const isAll = g.branchName === "ALL" || g.branchCode === "ALL";
      const label = isAll
        ? "ALL"
        : g.branchCode && g.branchCode !== g.branchName
          ? `${g.branchName} (${g.branchCode})`
          : g.branchName;
      return {
        value: g.branchName,
        label,
      };
    });
  }, [selectedTruckObj]);

  // Reset selection & unloaded map when truck changes
  const handleTruckChange = (val: string) => {
    setSelectedTruck(val);
    setSelectedFromBranch("");
    setSelectedToBranch("");
    setTableSearch("");
    setSelectedAvailableKeys(new Set());
    setUnloadedPiecesMap({});
  };

  // Helper to generate unique key for a pieceDetail row
  const getBookingRowKey = (item: UnloadablePieceDetail, index: number): string => {
    return `${item.docketNo2 || item.docketNo1 || "item"}_${item.fromBranchCode || ""}_${item.toBranchCode || ""}_${index}`;
  };

  // Raw server items for currently selected truck
  const currentTruckItems = useMemo(() => {
    if (!selectedTruckObj || !Array.isArray(selectedTruckObj.pieceDetails)) return [];
    return selectedTruckObj.pieceDetails;
  }, [selectedTruckObj]);

  // Helper to get all piece numbers of a booking item
  const getItemAllPieces = (item: UnloadablePieceDetail): string[] => {
    if (Array.isArray(item.pieceNumbers) && item.pieceNumbers.length > 0) {
      return item.pieceNumbers;
    }
    const prefix = item.docketNo2 || item.docketNo1 || "PCS";
    return [`${prefix}__01`];
  };

  // ─── Computed Available List in Truck ───────────────────────────────────────
  const availableParcels = useMemo(() => {
    const list: (UnloadablePieceDetail & { rowKey: string; remainingPieces: string[]; parcelCount: number })[] = [];

    currentTruckItems.forEach((item, idx) => {
      const rowKey = getBookingRowKey(item, idx);
      const allPieces = getItemAllPieces(item);
      const unloadedPieces = unloadedPiecesMap[rowKey] || [];
      const remainingPieces = allPieces.filter((p) => !unloadedPieces.includes(p));

      // If all pieces are unloaded, it's completely moved out of available table
      if (remainingPieces.length === 0) return;

      // Filter by From Branch
      if (
        selectedFromBranch &&
        selectedFromBranch !== "ALL" &&
        item.fromBranchName !== selectedFromBranch &&
        item.fromBranchCode !== selectedFromBranch
      ) {
        return;
      }

      // Filter by To Branch
      if (
        selectedToBranch &&
        selectedToBranch !== "ALL" &&
        item.toBranchName !== selectedToBranch &&
        item.toBranchCode !== selectedToBranch
      ) {
        return;
      }

      // Filter by Search Query
      if (tableSearch.trim()) {
        const q = tableSearch.trim().toLowerCase();
        const d1 = (item.docketNo1 || "").toLowerCase();
        const d2 = (item.docketNo2 || "").toLowerCase();
        const fb = (item.fromBranchName || "").toLowerCase();
        const tb = (item.toBranchName || "").toLowerCase();
        const matchesPiece = remainingPieces.some((p) => p.toLowerCase().includes(q));

        if (!d1.includes(q) && !d2.includes(q) && !fb.includes(q) && !tb.includes(q) && !matchesPiece) {
          return;
        }
      }

      list.push({
        ...item,
        rowKey,
        remainingPieces,
        parcelCount: remainingPieces.length,
      });
    });

    return list;
  }, [currentTruckItems, unloadedPiecesMap, selectedFromBranch, selectedToBranch, tableSearch]);

  // ─── Computed Unloaded List (Received at Branch) ───────────────────────────
  const unloadedParcels = useMemo(() => {
    const list: (UnloadablePieceDetail & { rowKey: string; unloadedPieces: string[]; parcelCount: number })[] = [];

    currentTruckItems.forEach((item, idx) => {
      const rowKey = getBookingRowKey(item, idx);
      const unloadedPieces = unloadedPiecesMap[rowKey] || [];
      if (unloadedPieces.length === 0) return;

      list.push({
        ...item,
        rowKey,
        unloadedPieces,
        parcelCount: unloadedPieces.length,
      });
    });

    return list;
  }, [currentTruckItems, unloadedPiecesMap]);

  // ─── Process Barcode / Code Logic (Used by Scanner & Keyboard Enter) ───────
  const processBarcodeScan = (scannedText: string): boolean => {
    if (!scannedText.trim()) return false;
    const q = scannedText.trim().toLowerCase();

    // Parse piece index if scanned text contains "__" (e.g. "SRTN20260032__01")
    let scannedDocketPart = "";
    let scannedIndexPart = "";
    if (q.includes("__")) {
      const parts = q.split("__");
      scannedDocketPart = parts[0] || "";
      scannedIndexPart = parts[1] || "";
    }

    // 1. Check if specific piece barcode matches across any available item
    for (let idx = 0; idx < currentTruckItems.length; idx++) {
      const item = currentTruckItems[idx];
      const rowKey = getBookingRowKey(item, idx);
      const allPieces = getItemAllPieces(item);
      const unloadedPieces = unloadedPiecesMap[rowKey] || [];
      const remainingPieces = allPieces.filter((p) => !unloadedPieces.includes(p));

      const d1 = (item.docketNo1 || "").toLowerCase();
      const d2 = (item.docketNo2 || "").toLowerCase();

      // Case A: Direct piece string match
      let matchingPiece = remainingPieces.find((p) => p.toLowerCase() === q);
      let alreadyUnloadedPiece = unloadedPieces.find((p) => p.toLowerCase() === q);

      // Case B: If scanned with tracking/docket prefix and index
      if (!matchingPiece && !alreadyUnloadedPiece && scannedDocketPart && scannedIndexPart) {
        if (scannedDocketPart === d2 || scannedDocketPart === d1) {
          const idxNum = parseInt(scannedIndexPart, 10);
          if (!isNaN(idxNum) && idxNum >= 1 && idxNum <= allPieces.length) {
            const targetPiece = allPieces[idxNum - 1];
            if (unloadedPieces.includes(targetPiece)) {
              alreadyUnloadedPiece = targetPiece;
            } else if (remainingPieces.includes(targetPiece)) {
              matchingPiece = targetPiece;
            }
          }
        }
      }

      // If already unloaded
      if (alreadyUnloadedPiece) {
        showToast("warning", `Piece "${alreadyUnloadedPiece}" (${item.docketNo2 || item.docketNo1}) is already unloaded.`);
        return false;
      }

      // If found in remaining pieces
      if (matchingPiece) {
        setUnloadedPiecesMap((prev) => ({
          ...prev,
          [rowKey]: [...(prev[rowKey] || []), matchingPiece],
        }));
        showToast("success", `Piece "${matchingPiece}" (${item.docketNo2 || item.docketNo1}) unloaded successfully!`);
        return true;
      }
    }

    // 2. Check if whole docket matches (by docketNo2 Tracking No or docketNo1 Docket No)
    for (let idx = 0; idx < currentTruckItems.length; idx++) {
      const item = currentTruckItems[idx];
      const rowKey = getBookingRowKey(item, idx);
      const allPieces = getItemAllPieces(item);
      const unloadedPieces = unloadedPiecesMap[rowKey] || [];
      const remainingPieces = allPieces.filter((p) => !unloadedPieces.includes(p));

      if (remainingPieces.length === 0) continue;

      const d1 = (item.docketNo1 || "").toLowerCase();
      const d2 = (item.docketNo2 || "").toLowerCase();

      if (d2 === q || d1 === q || d2.includes(q) || d1.includes(q)) {
        setUnloadedPiecesMap((prev) => ({
          ...prev,
          [rowKey]: Array.from(new Set([...(prev[rowKey] || []), ...allPieces])),
        }));
        setSelectedAvailableKeys((prev) => {
          const next = new Set(prev);
          next.delete(rowKey);
          return next;
        });
        showToast("success", `Tracking No "${item.docketNo2 || item.docketNo1}" unloaded successfully!`);
        return true;
      }
    }

    showToast("error", `No matching parcel found in truck for barcode "${scannedText}".`);
    return false;
  };

  // Search input on Enter
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    if (!tableSearch.trim()) return;

    const handled = processBarcodeScan(tableSearch);
    if (handled) {
      setTableSearch("");
    }
  };

  // ─── Checkbox Selection Handlers ───────────────────────────────────────────
  const isAllAvailableSelected =
    availableParcels.length > 0 &&
    availableParcels.every((b) => selectedAvailableKeys.has(b.rowKey));

  const toggleSelectAllAvailable = () => {
    if (isAllAvailableSelected) {
      setSelectedAvailableKeys(new Set());
    } else {
      const newSet = new Set(selectedAvailableKeys);
      availableParcels.forEach((b) => newSet.add(b.rowKey));
      setSelectedAvailableKeys(newSet);
    }
  };

  const toggleSelectRow = (key: string) => {
    const newSet = new Set(selectedAvailableKeys);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setSelectedAvailableKeys(newSet);
  };

  // ─── Move Selected from Available to Unloaded ─────────────────────────────
  const handleAddToUnload = () => {
    if (selectedAvailableKeys.size === 0) {
      showToast("warning", "Please select at least one parcel to unload.");
      return;
    }

    setUnloadedPiecesMap((prev) => {
      const next = { ...prev };
      currentTruckItems.forEach((item, idx) => {
        const rowKey = getBookingRowKey(item, idx);
        if (selectedAvailableKeys.has(rowKey)) {
          const allPieces = getItemAllPieces(item);
          const existing = prev[rowKey] || [];
          next[rowKey] = Array.from(new Set([...existing, ...allPieces]));
        }
      });
      return next;
    });

    setSelectedAvailableKeys(new Set());
    showToast("success", `${selectedAvailableKeys.size} parcel booking(s) added to Unloaded list.`);
  };

  // Quick single row add
  const handleQuickAddSingle = (item: UnloadablePieceDetail, rowKey: string) => {
    const allPieces = getItemAllPieces(item);
    setUnloadedPiecesMap((prev) => {
      const existing = prev[rowKey] || [];
      return {
        ...prev,
        [rowKey]: Array.from(new Set([...existing, ...allPieces])),
      };
    });
    setSelectedAvailableKeys((prev) => {
      const next = new Set(prev);
      next.delete(rowKey);
      return next;
    });
    showToast("success", `Tracking No "${item.docketNo2 || item.docketNo1}" added to unload.`);
  };

  // ─── Remove from Unloaded (Move Back to Available) ────────────────────────
  const handleRemoveUnloaded = (rowKey: string) => {
    setUnloadedPiecesMap((prev) => {
      const next = { ...prev };
      delete next[rowKey];
      return next;
    });
    showToast("info", "Parcel returned to truck available list.");
  };

  const handleClearAllUnloaded = () => {
    if (unloadedParcels.length === 0) return;
    setUnloadedPiecesMap({});
    showToast("info", "All unloaded parcels returned to available list.");
  };

  // ─── Confirm Unload Handler (POST /booking/unloadParcel) ────────────────────
  const handleConfirmUnload = async () => {
    if (!selectedTruck) {
      showToast("warning", "Please select a truck first.");
      return;
    }
    if (!selectedUnloadBranch) {
      showToast("warning", "Please select an Unload Branch.");
      return;
    }

    const allUnloadedPieceNumbers: string[] = [];
    Object.values(unloadedPiecesMap).forEach((pieces) => {
      if (Array.isArray(pieces)) {
        allUnloadedPieceNumbers.push(...pieces);
      }
    });

    if (allUnloadedPieceNumbers.length === 0) {
      showToast("warning", "No parcels selected for unloading. Please add parcels first.");
      return;
    }

    try {
      const res = await unloadParcelsMutation.mutateAsync({
        pieceNumbers: allUnloadedPieceNumbers,
        truckNumber: selectedTruck,
        unloadBranchId: selectedUnloadBranch,
      });

      if (res && res.success !== false) {
        showToast(
          "success",
          res.message || `${allUnloadedPieceNumbers.length} parcel(s) successfully unloaded from truck ${selectedTruck}!`
        );

        // Open print view with "UNLOAD PARCEL REPORT"
        if (res.data) {
          const unloadBranchObj = unloadBranchOptions.find(
            (o) => o.value === selectedUnloadBranch
          );
          const unloadBranchName = unloadBranchObj?.label || selectedUnloadBranch;

          printTruckLoadReport({
            data: res.data,
            userName: currentUserName,
            branchName: currentBranchName,
            unloadBranchName: unloadBranchName,
            message: res.message,
            reportTitle: "UNLOAD PARCEL REPORT",
          });
        }

        // Reset form & table states
        setSelectedTruck("");
        setSelectedUnloadBranch(getDefaultBranchId());
        setSelectedFromBranch("");
        setSelectedToBranch("");
        setTableSearch("");
        setUnloadedPiecesMap({});
        setSelectedAvailableKeys(new Set());
      } else {
        showToast("error", res?.message || "Failed to confirm unload.");
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        errorObj?.response?.data?.message || errorObj?.message || "Failed to confirm unload. Please try again.";
      showToast("error", msg);
    }
  };

  // ─── Summary Calculations ──────────────────────────────────────────────────
  const totalUnloadedParcelCount = useMemo(() => {
    return unloadedParcels.reduce((sum, item) => sum + (Number(item.parcelCount) || 0), 0);
  }, [unloadedParcels]);

  const totalAvailableParcelCount = useMemo(() => {
    return availableParcels.reduce((sum, item) => sum + (Number(item.parcelCount) || 0), 0);
  }, [availableParcels]);

  // ─── Columns for Available Parcels Table ───────────────────────────────────
  const availableColumns: ColumnDef<UnloadablePieceDetail & { rowKey: string; remainingPieces: string[]; parcelCount: number }>[] =
    useMemo(
      () => [
        {
          key: "select",
          label: (
            <div className="flex items-center justify-center">
              <Checkbox
                checked={isAllAvailableSelected}
                onCheckedChange={toggleSelectAllAvailable}
                disabled={availableParcels.length === 0}
              />
            </div>
          ) as any,
          width: "w-10 text-center",
          render: (_val: unknown, row) => (
            <div className="flex items-center justify-center">
              <Checkbox
                checked={selectedAvailableKeys.has(row.rowKey)}
                onCheckedChange={() => toggleSelectRow(row.rowKey)}
              />
            </div>
          ),
        },
        {
          key: "docketNo1",
          label: "Docket No",
          width: "w-28",
          render: (_val: unknown, row) => (
            <span className="font-mono text-xs font-semibold text-black">
              {row.docketNo1 || "—"}
            </span>
          ),
        },
        {
          key: "docketNo2",
          label: "Tracking No",
          width: "w-32",
          render: (_val: unknown, row) => (
            <span className="font-mono text-xs font-semibold text-black">
              {row.docketNo2 || "—"}
            </span>
          ),
        },
        {
          key: "fromBranch",
          label: "From Branch",
          width: "w-28",
          render: (_val: unknown, row) => (
            <span className="text-xs text-black">
              {row.fromBranchName || row.fromBranch || "—"}
              {row.fromBranchCode && (
                <span className="text-black ml-1 text-xs">
                  ({row.fromBranchCode})
                </span>
              )}
            </span>
          ),
        },
        {
          key: "toBranch",
          label: "To Branch",
          width: "w-28",
          render: (_val: unknown, row) => (
            <span className="text-xs text-black">
              {row.toBranchName || row.toBranch || "—"}
              {row.toBranchCode && (
                <span className="text-black ml-1 text-xs">
                  ({row.toBranchCode})
                </span>
              )}
            </span>
          ),
        },
        {
          key: "parcelCount",
          label: "Parcels",
          width: "w-20 text-center",
          render: (_val: unknown, row) => (
            <span className="text-xs font-semibold text-black">
              {row.parcelCount}
            </span>
          ),
        },
        {
          key: "pieceDetails",
          label: "Piece Barcodes",
          width: "w-52",
          render: (_val: unknown, row) => (
            <span className="text-xs font-mono text-black break-words">
              {row.remainingPieces.join(", ")}
            </span>
          ),
        },
        {
          key: "action",
          label: "Action",
          width: "w-16 text-center",
          render: (_val: unknown, row) => (
            <Button
              type="button"
              size="sm"
              onClick={() => handleQuickAddSingle(row, row.rowKey)}
              className="h-6 px-2.5 text-xs font-semibold bg-[#2980b9] hover:bg-[#2471a3] text-white cursor-pointer"
            >
              Add
            </Button>
          ),
        },
      ],
      [isAllAvailableSelected, availableParcels.length, selectedAvailableKeys]
    );

  // ─── Columns for Unloaded Parcels Table ───────────────────────────────────
  const unloadedColumns: ColumnDef<UnloadablePieceDetail & { rowKey: string; unloadedPieces: string[]; parcelCount: number }>[] =
    useMemo(
      () => [
        {
          key: "docketNo1",
          label: "Docket No",
          width: "w-28",
          render: (_val: unknown, row) => (
            <span className="font-mono text-xs font-semibold text-black">
              {row.docketNo1 || "—"}
            </span>
          ),
        },
        {
          key: "docketNo2",
          label: "Tracking No",
          width: "w-32",
          render: (_val: unknown, row) => (
            <span className="font-mono text-xs font-semibold text-black">
              {row.docketNo2 || "—"}
            </span>
          ),
        },
        {
          key: "fromBranch",
          label: "From Branch",
          width: "w-28",
          render: (_val: unknown, row) => (
            <span className="text-xs text-black">
              {row.fromBranchName || row.fromBranch || "—"}
              {row.fromBranchCode && (
                <span className="text-black ml-1 text-xs">
                  ({row.fromBranchCode})
                </span>
              )}
            </span>
          ),
        },
        {
          key: "toBranch",
          label: "To Branch",
          width: "w-28",
          render: (_val: unknown, row) => (
            <span className="text-xs text-black">
              {row.toBranchName || row.toBranch || "—"}
              {row.toBranchCode && (
                <span className="text-black ml-1 text-xs">
                  ({row.toBranchCode})
                </span>
              )}
            </span>
          ),
        },
        {
          key: "parcelCount",
          label: "Parcels",
          width: "w-20 text-center",
          render: (_val: unknown, row) => (
            <span className="text-xs font-semibold text-black">
              {row.parcelCount}
            </span>
          ),
        },
        {
          key: "pieceDetails",
          label: "Piece Barcodes",
          width: "w-52",
          render: (_val: unknown, row) => (
            <span className="text-xs font-mono text-black break-words">
              {row.unloadedPieces.join(", ")}
            </span>
          ),
        },
        {
          key: "action",
          label: "Action",
          width: "w-16 text-center",
          render: (_val: unknown, row) => (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleRemoveUnloaded(row.rowKey)}
              className="h-6 px-2 text-xs text-black border-slate-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 font-medium cursor-pointer"
            >
              Remove
            </Button>
          ),
        },
      ],
      []
    );

  return (
    <div className="w-full space-y-3 pb-8">
      {/* ─── Top Header Card ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#2980b9]/10 text-[#2980b9] flex items-center justify-center font-bold">
            <PackageCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Unload Parcel
              {selectedTruck && (
                <Badge variant="outline" className="bg-blue-50 text-[#2980b9] border-blue-200 font-mono text-xs">
                  {selectedTruck}
                </Badge>
              )}
              {selectedTruckObj?.driverName && (
                <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-300 text-xs">
                  {selectedTruckObj.driverName}
                </Badge>
              )}
            </h1>
            <p className="text-xs text-slate-500">
              Select an arriving truck, select unload destination branch, and receive parcels at destination.
            </p>
          </div>
        </div>
      </div>

      {/* ─── Truck, Unload Branch & Route Selection Bar ──────────────────────── */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
          {/* 1. Truck Select Field */}
          <div>
            <FormSelect
              label="Select Truck"
              required
              searchable
              options={truckOptions}
              value={selectedTruck}
              onChange={handleTruckChange}
              placeholder={isUnloadableLoading ? "Loading trucks..." : "Choose Truck..."}
              searchPlaceholder="Search truck or driver..."
              disabled={isUnloadableLoading}
            />
          </div>

          {/* 2. Unload Branch Field (Always visible when truck is selected) */}
          {selectedTruck ? (
            <div>
              <FormSelect
                label="Unload Branch"
                required
                searchable
                options={unloadBranchOptions}
                value={selectedUnloadBranch}
                onChange={(val) => setSelectedUnloadBranch(val)}
                placeholder={isBranchLoading ? "Loading branches..." : "Choose Unload Branch..."}
                searchPlaceholder="Search branch..."
                disabled={isBranchLoading}
              />
            </div>
          ) : null}

          {/* 3. From Branch Field */}
          {selectedTruck ? (
            <div>
              <FormSelect
                label="From Branch"
                searchable
                options={senderBranchGroupOptions}
                value={selectedFromBranch}
                onChange={(val) => setSelectedFromBranch(val)}
                placeholder="Select From Branch..."
                searchPlaceholder="Search from branch..."
                disabled={isUnloadableLoading}
              />
            </div>
          ) : (
            <div className="hidden md:block text-xs text-slate-400 italic self-center col-span-3">
              Select an arriving truck to view unload destination and route filters...
            </div>
          )}

          {/* 4. To Branch Field */}
          {selectedTruck ? (
            <div>
              <FormSelect
                label="To Branch"
                searchable
                options={receiverBranchGroupOptions}
                value={selectedToBranch}
                onChange={(val) => setSelectedToBranch(val)}
                placeholder="Select To Branch..."
                searchPlaceholder="Search to branch..."
                disabled={isUnloadableLoading}
              />
            </div>
          ) : null}
        </div>
      </div>

      {/* ─── When No Truck Selected State ────────────────────────────────────── */}
      {!selectedTruck ? (
        <div className="bg-white rounded-lg border border-dashed border-slate-300 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Truck className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-sm font-bold text-slate-800">Please Select an Arriving Truck</h3>
            <p className="text-xs text-slate-500">
              Select a truck from the dropdown above to view loaded parcels for unloading.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* ─── TABLE 1: Available Parcels in Truck ─────────────────────────── */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-3.5 space-y-3">
            {/* Header Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[#2980b9]" />
                  Available Parcels in Truck
                </span>
                <Badge variant="outline" className="bg-white border-slate-300 text-slate-700 text-[11px] font-semibold">
                  {availableParcels.length} Bookings ({totalAvailableParcelCount} Parcels)
                </Badge>
                {selectedAvailableKeys.size > 0 && (
                  <Badge className="bg-[#2980b9] text-white text-[11px] font-semibold">
                    {selectedAvailableKeys.size} Selected
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Search Bar using shadcn Input component */}
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <Input
                    ref={searchInputRef}
                    type="text"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Search / Scan Barcode (Press Enter)..."
                    className="h-7 pl-8 pr-7 text-xs bg-white border border-slate-300 rounded shadow-2xs focus-visible:border-[#2980b9] focus-visible:ring-1 focus-visible:ring-[#2980b9]/30 w-52 sm:w-60"
                    title="Type piece barcode or tracking number and press Enter to unload"
                  />
                  {tableSearch && (
                    <button
                      type="button"
                      onClick={() => setTableSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Camera Scanner Button */}
                {hasCamera && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsScannerOpen(true)}
                    className="h-7 px-2.5 text-xs text-black border-slate-300 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                    title="Open Camera Barcode Scanner"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#2980b9]" />
                    <span className="hidden sm:inline">Camera</span>
                  </Button>
                )}

                {/* Add to Unload Button */}
                <Button
                  type="button"
                  onClick={handleAddToUnload}
                  disabled={selectedAvailableKeys.size === 0}
                  className="bg-[#2980b9] hover:bg-[#2471a3] text-white h-7 px-3 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Unload ({selectedAvailableKeys.size})</span>
                </Button>
              </div>
            </div>

            {/* Reusable SimpleDataTable */}
            <SimpleDataTable
              columns={availableColumns}
              data={availableParcels}
              isLoading={isUnloadableLoading}
              emptyMessage="No available parcels found in truck."
              showPagination={false}
              maxHeight="max-h-[380px]"
            />
          </div>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* ─── TABLE 2: Unloaded Parcels (Moved from Table 1) ──────────────── */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-3.5 space-y-3">
            {/* Header Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Unloaded Parcels (Received at Branch)
                </span>
                <Badge className="bg-emerald-600 text-white text-[11px] font-semibold">
                  {unloadedParcels.length} Bookings Unloaded
                </Badge>
                <Badge variant="outline" className="bg-white border-emerald-300 text-emerald-800 text-[11px] font-semibold">
                  {totalUnloadedParcelCount} Total Parcels
                </Badge>
              </div>

              {unloadedParcels.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearAllUnloaded}
                  className="h-7 px-2.5 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 font-semibold cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Remove All
                </Button>
              )}
            </div>

            {/* Reusable SimpleDataTable */}
            <SimpleDataTable
              columns={unloadedColumns}
              data={unloadedParcels}
              showSrNo={true}
              srNoLabel="#"
              isLoading={false}
              emptyMessage="No parcels unloaded yet. Select rows in the table above and click 'Add to Unload', or scan barcode."
              showPagination={false}
              maxHeight="max-h-[350px]"
            />

            {/* Bottom Summary & Actions Bar */}
            {unloadedParcels.length > 0 && (
              <div className="bg-slate-50 px-4 py-3 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4 text-xs">
                  <span>
                    <strong className="text-slate-700">Total Bookings Unloaded:</strong>{" "}
                    <span className="font-bold text-slate-900">{unloadedParcels.length}</span>
                  </span>
                  <span>
                    <strong className="text-slate-700">Total Parcels:</strong>{" "}
                    <span className="font-bold text-[#2980b9]">{totalUnloadedParcelCount}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={handleConfirmUnload}
                    disabled={unloadParcelsMutation.isPending}
                    className="bg-[#2980b9] hover:bg-[#2471a3] text-white h-8 px-4 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {unloadParcelsMutation.isPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Unloading...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Save / Confirm Unload</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Camera Barcode Scanner Modal ────────────────────────────────────── */}
      {hasCamera && isScannerOpen && (
        <BarcodeScannerModal
          open={isScannerOpen}
          onOpenChange={setIsScannerOpen}
          onScan={(scannedCode) => {
            processBarcodeScan(scannedCode);
          }}
          title="Scan Parcel Barcode to Unload"
        />
      )}
    </div>
  );
}