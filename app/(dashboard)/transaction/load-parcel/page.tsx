"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  Truck,
  Package,
  Plus,
  Trash2,
  RotateCcw,
  Search,
  CheckCircle2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FormSelect, type FormSelectOption } from "@/components/ui/form-select";
import { Checkbox } from "@/components/ui/checkbox";
import SimpleDataTable from "@/components/DataTable/SimpleDataTable";
import { showToast } from "@/lib/toast";
import { useOnlyTruckList, useLoadableParcels } from "@/lib/hooks";
import type { LoadableBookingItem } from "@/lib/api/booking";
import type { OnlyTruckItem } from "@/lib/api/truck";
import type { ColumnDef } from "@/lib/types/common";

export default function LoadParcelPage() {
  // ─── Selected Truck & Filter States ─────────────────────────────────────────
  const [selectedTruck, setSelectedTruck] = useState<string>("");
  const [selectedFromBranch, setSelectedFromBranch] = useState<string>("");
  const [selectedToBranch, setSelectedToBranch] = useState<string>("");
  const [tableSearch, setTableSearch] = useState<string>("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Map of loaded piece barcodes by original booking ID: { [bookingId]: string[] }
  const [loadedPiecesMap, setLoadedPiecesMap] = useState<Record<string, string[]>>({});

  // Checkbox selection in available table (stores booking IDs)
  const [selectedAvailableIds, setSelectedAvailableIds] = useState<Set<string>>(new Set());

  // ─── 1. Fetch Truck List via GET /user/onlytruck ────────────────────────────
  const { data: onlyTruckRes, isLoading: isTruckLoading } = useOnlyTruckList();

  const truckList: OnlyTruckItem[] = useMemo(() => {
    const rawData = onlyTruckRes?.data;
    if (Array.isArray(rawData)) return rawData;
    return [];
  }, [onlyTruckRes]);

  const truckOptions: FormSelectOption[] = useMemo(() => {
    return truckList.map((t) => {
      const driver = t.driverName ? ` (${t.driverName})` : "";
      return {
        value: t.truckNumber,
        label: `${t.truckNumber}${driver}`,
      };
    });
  }, [truckList]);

  // Selected Truck Object
  const selectedTruckObj = useMemo(() => {
    return truckList.find((t) => t.truckNumber === selectedTruck);
  }, [truckList, selectedTruck]);

  // ─── 2. Fetch Loadable Parcels via GET /booking/loadablParcel (No Query Params)
  const {
    data: loadableRes,
    isLoading: isParcelsLoading,
    isFetching: isParcelsFetching,
    refetch: refetchParcels,
  } = useLoadableParcels(Boolean(selectedTruck));

  // Raw server bookings
  const serverBookings: LoadableBookingItem[] = useMemo(() => {
    const rawData = loadableRes?.data?.bookings;
    if (Array.isArray(rawData)) return rawData;
    return [];
  }, [loadableRes]);

  // Sender Branch Group Options
  const senderBranchGroupOptions: FormSelectOption[] = useMemo(() => {
    const groups = loadableRes?.data?.senderBranchGroup;
    if (!Array.isArray(groups)) return [];
    return groups.map((g) => {
      const parcelInfo = g.parcels !== undefined ? ` / ${g.parcels} Pcs` : "";
      return {
        value: g.branchName,
        label: `${g.branchName} (${g.count} Bookings${parcelInfo})`,
      };
    });
  }, [loadableRes]);

  // Receiver Branch Group Options
  const receiverBranchGroupOptions: FormSelectOption[] = useMemo(() => {
    const groups = loadableRes?.data?.receiverBranchGroup;
    if (!Array.isArray(groups)) return [];
    return groups.map((g) => {
      const parcelInfo = g.parcels !== undefined ? ` / ${g.parcels} Pcs` : "";
      return {
        value: g.branchName,
        label: `${g.branchName} (${g.count} Bookings${parcelInfo})`,
      };
    });
  }, [loadableRes]);

  // Reset selection & loaded map when truck changes
  const handleTruckChange = (val: string) => {
    setSelectedTruck(val);
    setSelectedFromBranch("");
    setSelectedToBranch("");
    setTableSearch("");
    setSelectedAvailableIds(new Set());
    setLoadedPiecesMap({});
  };

  // Helper to get all original pieces for a booking from serverBookings
  const getBookingOriginalPieces = (bookingId: string): string[] => {
    const b = serverBookings.find((item) => item._id === bookingId);
    if (!b) return [];
    if (Array.isArray(b.pieceDetails) && b.pieceDetails.length > 0) {
      return b.pieceDetails;
    }
    const count = Number(b.parcelCount) || 1;
    const prefix = b.docketNo1 || b._id;
    return Array.from({ length: count }, (_, i) => `${prefix}__${String(i + 1).padStart(2, "0")}`);
  };

  // ─── Computed Available List ───────────────────────────────────────────────
  const availableParcels = useMemo(() => {
    const list: LoadableBookingItem[] = [];

    serverBookings.forEach((b) => {
      const allPieces = getBookingOriginalPieces(b._id);
      const loadedPieces = loadedPiecesMap[b._id] || [];
      const remainingPieces = allPieces.filter((p) => !loadedPieces.includes(p));

      // If all pieces are loaded, it's completely moved out of available table
      if (remainingPieces.length === 0) return;

      // Filter by From Branch
      if (
        selectedFromBranch &&
        selectedFromBranch !== "ALL" &&
        b.fromBranch !== selectedFromBranch &&
        b.fromBranchCode !== selectedFromBranch
      ) {
        return;
      }

      // Filter by To Branch
      if (
        selectedToBranch &&
        selectedToBranch !== "ALL" &&
        b.toBranch !== selectedToBranch &&
        b.toBranchCode !== selectedToBranch
      ) {
        return;
      }

      // Filter by Search Query
      if (tableSearch.trim()) {
        const q = tableSearch.trim().toLowerCase();
        const d1 = (b.docketNo1 || "").toLowerCase();
        const d2 = (b.docketNo2 || "").toLowerCase();
        const fb = (b.fromBranch || "").toLowerCase();
        const tb = (b.toBranch || "").toLowerCase();
        const matchesPiece = remainingPieces.some((p) => p.toLowerCase().includes(q));

        if (!d1.includes(q) && !d2.includes(q) && !fb.includes(q) && !tb.includes(q) && !matchesPiece) {
          return;
        }
      }

      list.push({
        ...b,
        parcelCount: remainingPieces.length,
        pieceDetails: remainingPieces,
      });
    });

    return list;
  }, [serverBookings, loadedPiecesMap, selectedFromBranch, selectedToBranch, tableSearch]);

  // ─── Computed Loaded List ──────────────────────────────────────────────────
  const loadedParcels = useMemo(() => {
    const list: LoadableBookingItem[] = [];

    serverBookings.forEach((b) => {
      const loadedPieces = loadedPiecesMap[b._id] || [];
      if (loadedPieces.length === 0) return;

      list.push({
        ...b,
        parcelCount: loadedPieces.length,
        pieceDetails: loadedPieces,
      });
    });

    return list;
  }, [serverBookings, loadedPiecesMap]);

  // ─── Search Bar onKeyDown (Enter = Move matching piece/parcel to Load) ─────
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    if (!tableSearch.trim()) return;

    const q = tableSearch.trim().toLowerCase();

    // 1. Check if an exact or specific piece barcode matches across any booking
    for (const b of serverBookings) {
      const allPieces = getBookingOriginalPieces(b._id);
      const loadedPieces = loadedPiecesMap[b._id] || [];
      const remainingPieces = allPieces.filter((p) => !loadedPieces.includes(p));

      // Check if already loaded
      const alreadyLoaded = loadedPieces.find((p) => p.toLowerCase() === q);
      if (alreadyLoaded) {
        showToast("warning", `Piece "${alreadyLoaded}" is already in loaded list.`);
        setTableSearch("");
        return;
      }

      // Check if matching piece is available
      const matchingPiece = remainingPieces.find((p) => p.toLowerCase() === q);
      if (matchingPiece) {
        // Load ONLY that specific piece!
        setLoadedPiecesMap((prev) => ({
          ...prev,
          [b._id]: [...(prev[b._id] || []), matchingPiece],
        }));
        setTableSearch("");
        showToast("success", `Piece "${matchingPiece}" added to loaded list.`);
        return;
      }
    }

    // 2. If not a specific piece, check if docket matches
    for (const b of serverBookings) {
      const allPieces = getBookingOriginalPieces(b._id);
      const loadedPieces = loadedPiecesMap[b._id] || [];
      const remainingPieces = allPieces.filter((p) => !loadedPieces.includes(p));

      if (remainingPieces.length === 0) continue;

      const d1 = (b.docketNo1 || "").toLowerCase();
      const d2 = (b.docketNo2 || "").toLowerCase();

      if (d1 === q || d2 === q || d1.includes(q) || d2.includes(q)) {
        // Load all remaining pieces for this docket
        setLoadedPiecesMap((prev) => ({
          ...prev,
          [b._id]: Array.from(new Set([...(prev[b._id] || []), ...allPieces])),
        }));
        setSelectedAvailableIds((prev) => {
          const next = new Set(prev);
          next.delete(b._id);
          return next;
        });
        setTableSearch("");
        showToast("success", `Docket "${b.docketNo1 || b.docketNo2}" added to load.`);
        return;
      }
    }

    showToast("warning", `No matching available parcel or piece found for "${tableSearch}".`);
  };

  // ─── Checkbox Selection Handlers ───────────────────────────────────────────
  const isAllAvailableSelected =
    availableParcels.length > 0 &&
    availableParcels.every((b) => selectedAvailableIds.has(b._id));

  const toggleSelectAllAvailable = () => {
    if (isAllAvailableSelected) {
      setSelectedAvailableIds(new Set());
    } else {
      const newSet = new Set(selectedAvailableIds);
      availableParcels.forEach((b) => newSet.add(b._id));
      setSelectedAvailableIds(newSet);
    }
  };

  const toggleSelectRow = (id: string) => {
    const newSet = new Set(selectedAvailableIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedAvailableIds(newSet);
  };

  // ─── Move Selected from Available to Loaded ────────────────────────────────
  const handleAddToLoad = () => {
    if (selectedAvailableIds.size === 0) {
      showToast("warning", "Please select at least one parcel to load.");
      return;
    }

    setLoadedPiecesMap((prev) => {
      const next = { ...prev };
      serverBookings.forEach((b) => {
        if (selectedAvailableIds.has(b._id)) {
          const allPieces = getBookingOriginalPieces(b._id);
          const existing = prev[b._id] || [];
          next[b._id] = Array.from(new Set([...existing, ...allPieces]));
        }
      });
      return next;
    });

    setSelectedAvailableIds(new Set());
    showToast("success", `${selectedAvailableIds.size} parcel booking(s) added to Loaded list.`);
  };

  // Quick single row add (merges all remaining pieces into loadedPiecesMap)
  const handleQuickAddSingle = (item: LoadableBookingItem) => {
    const allPieces = getBookingOriginalPieces(item._id);
    setLoadedPiecesMap((prev) => {
      const existing = prev[item._id] || [];
      return {
        ...prev,
        [item._id]: Array.from(new Set([...existing, ...allPieces])),
      };
    });
    setSelectedAvailableIds((prev) => {
      const next = new Set(prev);
      next.delete(item._id);
      return next;
    });
    showToast("success", `Docket "${item.docketNo1 || item.docketNo2}" added to load.`);
  };

  // ─── Remove from Loaded (Move Back to Available) ───────────────────────────
  const handleRemoveLoaded = (id: string) => {
    setLoadedPiecesMap((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    showToast("info", "Parcel returned to available list.");
  };

  const handleClearAllLoaded = () => {
    if (loadedParcels.length === 0) return;
    setLoadedPiecesMap({});
    showToast("info", "All loaded parcels returned to available list.");
  };

  // ─── Summary Calculations ──────────────────────────────────────────────────
  const totalLoadedParcelCount = useMemo(() => {
    return loadedParcels.reduce((sum, item) => sum + (Number(item.parcelCount) || 0), 0);
  }, [loadedParcels]);

  const totalAvailableParcelCount = useMemo(() => {
    return availableParcels.reduce((sum, item) => sum + (Number(item.parcelCount) || 0), 0);
  }, [availableParcels]);

  // ─── Columns for Available Parcels Table ───────────────────────────────────
  const availableColumns: ColumnDef<LoadableBookingItem>[] = useMemo(
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
        render: (_val: unknown, row: LoadableBookingItem) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={selectedAvailableIds.has(row._id)}
              onCheckedChange={() => toggleSelectRow(row._id)}
            />
          </div>
        ),
      },
      {
        key: "docketNo1",
        label: "Docket No",
        width: "w-28",
        render: (_val: unknown, row: LoadableBookingItem) => (
          <span className="font-mono text-xs font-semibold text-black">
            {row.docketNo1 || "—"}
          </span>
        ),
      },
      {
        key: "docketNo2",
        label: "Tracking No",
        width: "w-32",
        render: (_val: unknown, row: LoadableBookingItem) => (
          <span className="font-mono text-xs font-semibold text-black">
            {row.docketNo2 || "—"}
          </span>
        ),
      },
      {
        key: "fromBranch",
        label: "From Branch",
        width: "w-28",
        render: (_val: unknown, row: LoadableBookingItem) => (
          <span className="text-xs text-black">
            {row.fromBranch || "—"}
            {row.fromBranchCode && row.fromBranchCode !== row.fromBranch && (
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
        render: (_val: unknown, row: LoadableBookingItem) => (
          <span className="text-xs text-black">
            {row.toBranch || "—"}
            {row.toBranchCode && row.toBranchCode !== row.toBranch && (
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
        render: (_val: unknown, row: LoadableBookingItem) => (
          <span className="text-xs font-semibold text-black">
            {row.parcelCount ?? 1}
          </span>
        ),
      },
      {
        key: "pieceDetails",
        label: "Piece Barcodes",
        width: "w-52",
        render: (_val: unknown, row: LoadableBookingItem) => {
          if (!Array.isArray(row.pieceDetails) || row.pieceDetails.length === 0) {
            return <span className="text-black text-xs">—</span>;
          }
          return (
            <span className="text-xs font-mono text-black break-words">
              {row.pieceDetails.join(", ")}
            </span>
          );
        },
      },
      {
        key: "paymentMethod",
        label: "Payment",
        width: "w-20 text-center",
        render: (_val: unknown, row: LoadableBookingItem) => (
          <span className="text-xs text-black">
            {row.paymentMethod || "To Pay"}
          </span>
        ),
      },
      {
        key: "action",
        label: "Action",
        width: "w-16 text-center",
        render: (_val: unknown, row: LoadableBookingItem) => (
          <Button
            type="button"
            size="sm"
            onClick={() => handleQuickAddSingle(row)}
            className="h-6 px-2.5 text-xs font-semibold bg-[#2980b9] hover:bg-[#2471a3] text-white cursor-pointer"
          >
            Add
          </Button>
        ),
      },
    ],
    [
      isAllAvailableSelected,
      availableParcels.length,
      selectedAvailableIds,
    ]
  );

  // ─── Columns for Loaded Parcels Table ─────────────────────────────────────
  const loadedColumns: ColumnDef<LoadableBookingItem>[] = useMemo(
    () => [
      {
        key: "docketNo1",
        label: "Docket No",
        width: "w-28",
        render: (_val: unknown, row: LoadableBookingItem) => (
          <span className="font-mono text-xs font-semibold text-black">
            {row.docketNo1 || "—"}
          </span>
        ),
      },
      {
        key: "docketNo2",
        label: "Tracking No",
        width: "w-32",
        render: (_val: unknown, row: LoadableBookingItem) => (
          <span className="font-mono text-xs font-semibold text-black">
            {row.docketNo2 || "—"}
          </span>
        ),
      },
      {
        key: "fromBranch",
        label: "From Branch",
        width: "w-28",
        render: (_val: unknown, row: LoadableBookingItem) => (
          <span className="text-xs text-black">
            {row.fromBranch || "—"}
            {row.fromBranchCode && row.fromBranchCode !== row.fromBranch && (
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
        render: (_val: unknown, row: LoadableBookingItem) => (
          <span className="text-xs text-black">
            {row.toBranch || "—"}
            {row.toBranchCode && row.toBranchCode !== row.toBranch && (
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
        render: (_val: unknown, row: LoadableBookingItem) => (
          <span className="text-xs font-semibold text-black">
            {row.parcelCount ?? 1}
          </span>
        ),
      },
      {
        key: "pieceDetails",
        label: "Piece Barcodes",
        width: "w-52",
        render: (_val: unknown, row: LoadableBookingItem) => {
          if (!Array.isArray(row.pieceDetails) || row.pieceDetails.length === 0) {
            return <span className="text-black text-xs">—</span>;
          }
          return (
            <span className="text-xs font-mono text-black break-words">
              {row.pieceDetails.join(", ")}
            </span>
          );
        },
      },
      {
        key: "paymentMethod",
        label: "Payment",
        width: "w-20 text-center",
        render: (_val: unknown, row: LoadableBookingItem) => (
          <span className="text-xs text-black">
            {row.paymentMethod || "To Pay"}
          </span>
        ),
      },
      {
        key: "action",
        label: "Action",
        width: "w-16 text-center",
        render: (_val: unknown, row: LoadableBookingItem) => (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => handleRemoveLoaded(row._id)}
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
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Load Parcel
              {selectedTruck && (
                <Badge variant="outline" className="bg-blue-50 text-[#2980b9] border-blue-200 font-mono text-xs">
                  {selectedTruck}
                </Badge>
              )}
            </h1>
            <p className="text-xs text-slate-500">
              Select a truck, choose from/to routes, and load parcels for dispatch.
            </p>
          </div>
        </div>

        {selectedTruck && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetchParcels()}
              disabled={isParcelsFetching}
              className="h-8 px-3 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <RotateCcw className={`w-3.5 h-3.5 mr-1 ${isParcelsFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        )}
      </div>

      {/* ─── Truck & Route Selection Bar ─────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 items-end">
          {/* 1. Truck Select Field */}
          <div>
            <FormSelect
              label="Select Truck"
              required
              searchable
              options={truckOptions}
              value={selectedTruck}
              onChange={handleTruckChange}
              placeholder={isTruckLoading ? "Loading trucks..." : "Choose Truck..."}
              searchPlaceholder="Search truck or driver..."
              disabled={isTruckLoading}
            />
          </div>

          {/* 2. From Branch Field */}
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
                disabled={isParcelsLoading}
              />
            </div>
          ) : (
            <div className="hidden md:block text-xs text-slate-400 italic self-center">
              Select a truck to view route branches...
            </div>
          )}

          {/* 3. To Branch Field */}
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
                disabled={isParcelsLoading}
              />
            </div>
          ) : null}
        </div>

        {/* Selected Driver Info strip */}
        {selectedTruckObj && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-4 flex-wrap">
              <span>
                <strong className="text-slate-700">Truck:</strong>{" "}
                <span className="font-mono font-bold text-slate-900">{selectedTruckObj.truckNumber}</span>
              </span>
              {selectedTruckObj.driverName && (
                <span>
                  <strong className="text-slate-700">Assigned Driver:</strong>{" "}
                  <span className="font-semibold text-slate-800">{selectedTruckObj.driverName}</span>
                </span>
              )}
            </div>

            {(selectedFromBranch || selectedToBranch) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedFromBranch("");
                  setSelectedToBranch("");
                }}
                className="h-6 px-2 text-[11px] text-slate-500 hover:text-red-600 cursor-pointer"
              >
                <X className="w-3 h-3 mr-1" />
                Clear Route Filter
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ─── When No Truck Selected State ────────────────────────────────────── */}
      {!selectedTruck ? (
        <div className="bg-white rounded-lg border border-dashed border-slate-300 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Truck className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-sm font-bold text-slate-800">Please Select a Truck</h3>
            <p className="text-xs text-slate-500">
              Select a truck from the dropdown above to fetch loadable parcels and route groups.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* ─── TABLE 1: Available Parcels for Loading ──────────────────────── */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-3.5 space-y-3">
            {/* Header Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-[#2980b9]" />
                  Available Parcels
                </span>
                <Badge variant="outline" className="bg-white border-slate-300 text-slate-700 text-[11px] font-semibold">
                  {availableParcels.length} Bookings ({totalAvailableParcelCount} Parcels)
                </Badge>
                {selectedAvailableIds.size > 0 && (
                  <Badge className="bg-[#2980b9] text-white text-[11px] font-semibold">
                    {selectedAvailableIds.size} Selected
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
                    className="h-7 pl-8 pr-7 text-xs bg-white border border-slate-300 rounded shadow-2xs focus-visible:border-[#2980b9] focus-visible:ring-1 focus-visible:ring-[#2980b9]/30 w-56 sm:w-64"
                    title="Type piece barcode or docket and press Enter to load"
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

                {/* Add to Load Button */}
                <Button
                  type="button"
                  onClick={handleAddToLoad}
                  disabled={selectedAvailableIds.size === 0}
                  className="bg-[#2980b9] hover:bg-[#2471a3] text-white h-7 px-3 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Load ({selectedAvailableIds.size})</span>
                </Button>
              </div>
            </div>

            {/* Reusable SimpleDataTable */}
            <SimpleDataTable
              columns={availableColumns}
              data={availableParcels}
              isLoading={isParcelsLoading}
              emptyMessage="No available parcels found for loading."
              showPagination={false}
              maxHeight="max-h-[380px]"
            />
          </div>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* ─── TABLE 2: Loaded Parcels (Moved from Table 1) ────────────────── */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-3.5 space-y-3">
            {/* Header Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Loaded Parcels (In Truck)
                </span>
                <Badge className="bg-emerald-600 text-white text-[11px] font-semibold">
                  {loadedParcels.length} Bookings Loaded
                </Badge>
                <Badge variant="outline" className="bg-white border-emerald-300 text-emerald-800 text-[11px] font-semibold">
                  {totalLoadedParcelCount} Total Parcels
                </Badge>
              </div>

              {loadedParcels.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearAllLoaded}
                  className="h-7 px-2.5 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 font-semibold cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Remove All
                </Button>
              )}
            </div>

            {/* Reusable SimpleDataTable */}
            <SimpleDataTable
              columns={loadedColumns}
              data={loadedParcels}
              showSrNo={true}
              srNoLabel="#"
              isLoading={false}
              emptyMessage="No parcels loaded in truck yet. Select rows in the table above and click 'Add to Load', or scan barcode and press Enter."
              showPagination={false}
              maxHeight="max-h-[350px]"
            />

            {/* Bottom Summary & Actions Bar */}
            {loadedParcels.length > 0 && (
              <div className="bg-slate-50 px-4 py-3 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4 text-xs">
                  <span>
                    <strong className="text-slate-700">Total Bookings Loaded:</strong>{" "}
                    <span className="font-bold text-slate-900">{loadedParcels.length}</span>
                  </span>
                  <span>
                    <strong className="text-slate-700">Total Parcels:</strong>{" "}
                    <span className="font-bold text-[#2980b9]">{totalLoadedParcelCount}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      showToast("success", `${loadedParcels.length} parcel booking(s) loaded successfully into truck ${selectedTruck}!`);
                    }}
                    className="bg-[#2980b9] hover:bg-[#2471a3] text-white h-8 px-4 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Save / Confirm Load</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}