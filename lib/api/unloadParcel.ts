import { request } from "./client";

export interface UnloadablePieceDetail {
  pieceNumbers: string[];
  docketNo1?: string;
  docketNo2?: string;
  fromBranchId?: string;
  fromBranchName?: string;
  fromBranchCode?: string;
  toBranchId?: string;
  toBranchName?: string;
  toBranchCode?: string;
  [key: string]: any;
}

export interface UnloadableBranchItem {
  branchName: string;
  branchCode: string;
  branchId?: string;
}

export interface UnloadableTruckItem {
  truckNumber: string;
  driverName?: string;
  pieceDetails: UnloadablePieceDetail[];
  senderBranches?: UnloadableBranchItem[];
  receiverBranches?: UnloadableBranchItem[];
}

export interface UnloadableTrucksData {
  trucks: UnloadableTruckItem[];
  total?: number;
}

export interface UnloadableTrucksResponse {
  success: boolean;
  message?: string;
  data: UnloadableTrucksData;
}

/**
 * Fetch unloadable trucks, pieceDetails, sender and receiver branches
 * GET /user/unloadableTruck
 */
export async function getUnloadableTrucks(): Promise<UnloadableTrucksResponse> {
  return await request<UnloadableTrucksResponse>("/user/unloadableTruck", {
    method: "GET",
  });
}

export interface UnloadParcelPayload {
  pieceNumbers: string[];
  truckNumber: string;
  unloadBranchId: string;
}

export interface UnloadParcelResponse {
  success: boolean;
  message?: string;
  data?: any;
}

/**
 * POST /booking/unloadParcel
 * Unload parcels from truck at branch
 */
export async function unloadParcels(payload: UnloadParcelPayload): Promise<UnloadParcelResponse> {
  return await request<UnloadParcelResponse>("/booking/unloadParcel", {
    method: "POST",
    data: payload,
  });
}
