export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minQuantity: number;
  unitPrice: number;
  location: string | null;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StockLog {
  id: string;
  inventoryItemId: string;
  type: "IN" | "OUT";
  quantity: number;
  reason: string | null;
  createdAt: string;
}

export interface CreateInventoryInput {
  name: string;
  category: string;
  quantity?: number;
  minQuantity?: number;
  unitPrice?: number;
  location?: string;
  memo?: string;
}

export interface StockLogInput {
  type: "IN" | "OUT";
  quantity: number;
  reason?: string;
}

export const CATEGORIES = [
  "엔진오일",
  "브레이크",
  "타이어",
  "필터",
  "배터리",
  "냉각수",
  "미션오일",
  "점화플러그",
  "벨트",
  "기타",
] as const;
