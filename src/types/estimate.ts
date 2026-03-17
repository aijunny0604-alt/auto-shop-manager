export interface EstimateItem {
  id?: string;
  type: "LABOR" | "PART";
  name: string;
  inventoryItemId?: string | null;
  quantity: number;
  unitPrice: number;
  amount: number;
  memo?: string | null;
  sortOrder: number;
}

export interface Estimate {
  id: string;
  estimateNo: string;
  customerId: string;
  vehicleId: string | null;
  status: string;
  validUntil: string | null;
  totalAmount: number;
  discount: number;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: { name: string; phone: string | null };
  vehicle?: { carModel: string; plateNumber: string | null; year: number | null };
  items?: EstimateItem[];
}

export const ESTIMATE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "작성중",
  SENT: "발송됨",
  ACCEPTED: "승인",
  REJECTED: "거절",
};
